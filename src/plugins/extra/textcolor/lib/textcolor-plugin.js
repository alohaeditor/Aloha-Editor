/* textcolor-plugin.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2012 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 *
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
 */

define([
	'aloha',
	'jquery',
	'aloha/plugin',
	'ui/ui',
	'ui/button',
	'ui/floating',
	'PubSub',
	'i18n!textcolor/nls/i18n',
	'i18n!aloha/nls/i18n'
], function (Aloha,
			jQuery,
			Plugin,
			Ui,
			Button,
			Floating,
			PubSub,
			i18n,
			i18nCore) {
	'use strict';

	var GENTICS = window.GENTICS;
	var overlayByConfig = {};
	var _savedRange;

	function SwatchOverlay(onSelectCallback) {
		var that = this;
		that.$node = jQuery('<table class="aloha-color-picker-overlay" unselectable="on" role="dialog"><tbody></tbody></table>');
		// don't let the mousedown bubble up. otherwise there won't be an activeEditable
		that.$node.mousedown(function (e) {
			return false;
		});
		that.onSelectCallback = onSelectCallback;
		that.$tbody = that.$node.find('tbody');
		that.$node.appendTo(jQuery('body'));
		that._initHideOnDocumentClick();
		that._initHideOnEsc();
		that._initCursorFocus(onSelectCallback);
		that._initEvents();
	}

	function calculateOffset(widget, $element) {
		var offset = $element.offset();
		var calculatedOffset = { top: 0, left: 0 };

		if ('fixed' === Floating.POSITION_STYLE) {
			offset.top -= jQuery(window).scrollTop();
			offset.left -= jQuery(window).scrollLeft();
		}

		calculatedOffset.top = widget.offset.top + (offset.top - widget.offset.top);
		calculatedOffset.left = widget.offset.left + (offset.left - widget.offset.left);

		return calculatedOffset;
	}

	SwatchOverlay.prototype = {

		offset: {top: 0, left: 0},

		/**
		 * Show the swatch overlay at the format button's position
		 * @param insertButton insert button
		 */
		show: function ($formatButton) {
			var that = this;

			// position the overlay relative to the insert-button
			that.$node.css(calculateOffset(that, $formatButton));
			that.$node.css('position', Floating.POSITION_STYLE);

			that.$node.show();

			// focus on the selected swatch
			that.$node.find('.focused').removeClass('focused');

			// select the swatch matching the selected color
			var selectedColor = $formatButton.find(".aloha-icon-textcolor").css("background-color");
			that.$node.find('td').each(function () {
				if (jQuery(jQuery(this).find('div')).css('background-color') === selectedColor) {
					jQuery(this).addClass('focused');
					return false;
				}
			});

			// select the first swatch if no matching swatch found
			if (that.$node.find('.focused').length < 1) {
				jQuery(that.$node.find('td')[0]).addClass('focused');
			}

			that._overlayActive = true;
		},

		hide: function () {
			this.$node.hide();
			this._overlayActive = false;
		},

		/**
		 * Set the color swatches, that shall be selectable
		 * @param {string} colors colors in a string, separated by spaces
		 */
		setColors: function (colors) {
			this._createSwatchButtons(colors);
		},

		_initHideOnDocumentClick: function () {
			var that = this;
			// if the user clicks somewhere outside of the layer, the layer should be closed
			// stop bubbling the click on the create-dialog up to the body event
			that.$node.click(function (e) {
				e.stopPropagation();
			});

			var buttonSelector = '.aloha-icon-textcolor';
			// hide the layer if user clicks anywhere in the body
			jQuery('body').click(function (e) {
				if (!that._overlayActive) {
					return;
				}
				// don't consider clicks to the overlay itself
				if (e.target !== that.$node[0]
				    // and don't consider clicks to the 'show' button.
						&& !jQuery(e.target).is(buttonSelector)
						&& !jQuery(e.target).find(buttonSelector).length) {
					that.hide();
				}
			});
		},
		_initHideOnEsc: function () {
			var that = this;
			// escape closes the overlay
			jQuery(document).keyup(function (e) {
				var overlayVisibleAndEscapeKeyPressed = (that.$node.css('display') === 'table') && (e.keyCode === 27);
				if (overlayVisibleAndEscapeKeyPressed) {
					that.hide();
				}
			});
		},
		_initCursorFocus: function (onSelectCallback) {
			var that = this;
			// you can navigate through the character table with the arrow keys
			// and select one with the enter key
			var $current, $next, $prev, $nextRow, $prevRow;
			var movements = {
				13: function select() {
					that.hide();

					$current = that.$node.find('.focused');
					var swatch = $current.find('div');
					that._selectColor(swatch);
				},
				37: function left() {
					$current = that.$node.find('.focused');
					$prev = $current.prev().addClass('focused');
					if ($prev.length > 0) {
						$current.removeClass('focused');
					}
				},
				38: function up() {
					$current = that.$node.find('.focused');
					$prevRow = $current.parent().prev();
					if ($prevRow.length > 0) {
						$prev = jQuery($prevRow.children()[$current.index()]).addClass('focused');
						if ($prev.length > 0) {
							$current.removeClass('focused');
						}
					}
				},
				39: function right() {
					$current = that.$node.find('.focused');
					$next = $current.next().addClass('focused');
					if ($next.length > 0) {
						$current.removeClass('focused');
					}
				},
				40: function down() {
					$current = that.$node.find('.focused');
					$nextRow = $current.parent().next();
					if ($nextRow.length > 0) {
						$next = jQuery($nextRow.children()[$current.index()]).addClass('focused');
						if ($next.length > 0) {
							$current.removeClass('focused');
						}
					}
				}
			};
			jQuery(document).keydown(function (e) {
				e.stopPropagation();
				var isOverlayVisible = that.$node.css('display') === 'table';
				if (isOverlayVisible) {
					// check if there is a move-command for the pressed key
					var moveCommand = movements[e.keyCode];
					if (moveCommand) {
						moveCommand();
						return false;
					}
				}
			});
		},
		_initEvents: function () {
			var that = this;
			// when the editable is deactivated, hide the layer
			Aloha.bind('aloha-editable-deactivated', function (event, rangeObject) {
				that.hide();
			});
		},
		_selectColor: function (swatch) {
			var that = this, color;

			if (swatch.hasClass('removecolor')) {
				color = "removecolor";
			} else {
				color = swatch.css('background-color');
			}

			that.onSelectCallback(color);
		},
		_createSwatchButtons: function (colors) {
			var that = this;
			// TODO: shouldn't we do jQuery('<div>' + characters + '</div>').text() here?
			var swatchTable = ['<tr>'];
			var i = 0;
			var swatch;
			var isColorValue = function (swatch) {
				return (swatch.indexOf("#") === 0 || swatch.indexOf("rgb") === 0);
			};

			while ((swatch = colors[i])) {
				// make a new row every 15 colors
				if (0 !== i && ((i % 15) === 0)) {
					swatchTable.push('</tr><tr>');
				}

				if (isColorValue(swatch)) {
					swatchTable.push('<td unselectable="on"><div style="background-color: ' + swatch + '"></div></td>');
				} else {
					swatchTable.push('<td unselectable="on"><div class="' + swatch + '"></div></td>');
				}

				i++;
			}

			// add remove color option
			swatchTable.push('<td unselectable="on"><div class="removecolor">&#10006</div></td>');

			swatchTable.push('</tr>');
			that.$tbody
				.empty()
				.append(swatchTable.join(''));
			that.$node.delegate('td', 'mouseover', function () {
				jQuery(this).addClass('mouseover');
			}).delegate('td', 'mouseout', function () {
				jQuery(this).removeClass('mouseover');
			}).delegate('td', 'click', function (e) {
				that.hide();

				var swatch = jQuery(this).find('div');
				that._selectColor(swatch);
			});
		}
	};

	/**
	 * apply color after selecting it from the list
	 */
	function onColorSelect(color) {
		if (Aloha.activeEditable) {

			//Select the range that was selected before the overlay was opened
			_savedRange.select();

			//Change the button color
			jQuery('.aloha-icon-textcolor').css('background-color', color);

			if (color === "removecolor") {
				var effectiveMarkup, i;
				for (i = 0; i < _savedRange.markupEffectiveAtStart.length; i++) {
					effectiveMarkup = _savedRange.markupEffectiveAtStart[i];

					if (effectiveMarkup.nodeName === "SPAN") {
						jQuery(effectiveMarkup).replaceWith(jQuery(effectiveMarkup).html());
						break;
					}
				}
			} else {
				Aloha.execCommand('forecolor', false, color);
			}
		}
	}

	// extracted selection changed function
	function onSelectionChanged(colorPickerPlugin, rangeObject) {

		// The `execCommand` runs asynchronously.
		// So it fires the selection change event, before actually applying the forecolor.
		setTimeout(function () {
			var selectedColor = jQuery(rangeObject.endContainer).parent().css('color');

			jQuery('.aloha-icon-textcolor').css('background-color', selectedColor);
		}, 20);

	}

	return Plugin.create('textcolor', {
		_constructor: function () {
			this._super('textcolor');
		},

		/**
		 * Default configuration
		 */
		config: ['#FFEE00', 'rgb(255,0,0)', '#FFFF00', '#FFFFFF', 'greenborder',  '#000000', '#993300',
					'#333300', '#000080', '#333399', '#333333', '#800000', '#FF6600', '#FFFF99', '#CCFFFF',
					'#99CCFF', '#FFFFFF', '#808000', '#008000', '#008080', '#0000FF', '#666699', '#808080',
					'#FF0000', '#FF9900', '#99CC00', '#339966', '#33CCCC', '#3366FF', '#800080', '#999999',
					'#FF00FF', '#FFCC00', '#FFFF00', '#00FF00', '#00FFFF', '#00CCFF', '#993366', '#C0C0C0',
					'#FF99CC', '#FFCC99' ],

		init: function () {
			var that = this;

			if (typeof Aloha.settings.plugins != 'undefined'
					&& typeof Aloha.settings.plugins.textcolor != 'undefined') {
				that.settings = Aloha.settings.plugins.textcolor;
			}

			this._colorPickerButton = Ui.adopt("colorPicker", Button, {
				tooltip: i18n.t('button.textcolor.tooltip'),
				icon: "aloha-icon-textcolor",
				scope: 'Aloha.continuoustext',
				click: function () {
					if (false !== that.swatchOverlay) {
						_savedRange = Aloha.Selection.rangeObject;
						that.swatchOverlay.show(this.element);
					}
				}
			});

			// Populate the cache lazily
			function initCache(i) {
				if (i < Aloha.editables.length) {
					that.getOverlayForEditable(Aloha.editables[i]);
					setTimeout(function () { initCache(i + 1); }, 100);
				}
			}
			setTimeout(function () { initCache(0); }, 100);

			Aloha.bind('aloha-editable-activated', function (event, data) {
				that.swatchOverlay = that.getOverlayForEditable(data.editable);
				if (that.swatchOverlay) {
					that._colorPickerButton.show();
				} else {
					that._colorPickerButton.hide();
				}
			});

			PubSub.sub('aloha.floating.changed', function (message) {
				if (that.swatchOverlay) {
					that.swatchOverlay.offset = message.position.offset;
					that.swatchOverlay.$node.css(calculateOffset(that.swatchOverlay, that._colorPickerButton.element));
				}
			});

			// add the event handler for context selection change
			PubSub.sub('aloha.selection.context-change', function (message) {
				onSelectionChanged(that, message.range);
			});
		},

		getOverlayForEditable: function (editable) {
			var that = this;
			// Each editable may have its own configuration and as
			// such may have its own overlay.
			var config = this.getEditableConfig(editable.obj),
			    overlay;
			if (!config || config.length < 1) {
				return false;
			}
			// We cache the overlay by configuration. If all editables
			// have the same configuration, only a single overlay will
			// be created that will be used by all editables.
			overlay = overlayByConfig[config];
			if (!overlay) {
				overlay = new SwatchOverlay(onColorSelect);
				overlay.setColors(config);
				overlayByConfig[config] = overlay;
			}
			return overlay;
		}

	});
});
