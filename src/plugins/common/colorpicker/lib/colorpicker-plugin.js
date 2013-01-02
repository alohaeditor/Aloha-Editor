/* characterpicker-plugin.js is part of Aloha Editor project http://aloha-editor.org
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
	'i18n!characterpicker/nls/i18n',
	'i18n!aloha/nls/i18n'
], function(Aloha,
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
		var self = this;
		self.$node = jQuery('<table class="aloha-color-picker-overlay" unselectable="on" role="dialog"><tbody></tbody></table>');
		// don't let the mousedown bubble up. otherwise there won't be an activeEditable
		self.$node.mousedown(function (e) {
			return false;
		});
		self.onSelectCallback = onSelectCallback;
		self.$tbody = self.$node.find('tbody');
		self.$node.appendTo(jQuery('body'));
		self._initHideOnDocumentClick();
		self._initHideOnEsc();
		self._initCursorFocus(onSelectCallback);
		self._initEvents();
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
			var self = this;

			// position the overlay relative to the insert-button
			self.$node.css(calculateOffset(self, $formatButton));
			self.$node.css('position', Floating.POSITION_STYLE);

			self.$node.show();

			// focus on the selected swatch
			self.$node.find('.focused').removeClass('focused');

			var selectedColor = $formatButton.find(".aloha-icon-colorpicker").css("background-color");
			self.$node.find('td').each(function() {
				if (jQuery(this).css('background-color') === selectedColor) {
					jQuery(this).addClass('focused');
					return false;
				}
			});


			self._overlayActive = true;
		},

		hide: function() {
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
			var self = this;
			// if the user clicks somewhere outside of the layer, the layer should be closed
			// stop bubbling the click on the create-dialog up to the body event
			self.$node.click(function (e) {
				e.stopPropagation();
			});

			var buttonSelector = '.aloha-icon-colorpicker';
			// hide the layer if user clicks anywhere in the body
			jQuery('body').click(function (e) {
				if (!self._overlayActive) {
					return;
				}
				if (// don't consider clicks to the overlay itself
				       e.target !== self.$node[0]
				    // and don't consider clicks to the 'show' button.
					&& !jQuery(e.target).is(buttonSelector)
					&& !jQuery(e.target).find(buttonSelector).length) {
					self.hide();
				}
			});
		},
		_initHideOnEsc: function () {
			var self = this;
			// escape closes the overlay
			jQuery(document).keyup(function (e) {
				var overlayVisibleAndEscapeKeyPressed = (self.$node.css('display') === 'table') && (e.keyCode === 27);
				if (overlayVisibleAndEscapeKeyPressed) {
					self.hide();
				}
			});
		},
		_initCursorFocus: function (onSelectCallback) {
			var self = this;
			// you can navigate through the character table with the arrow keys
			// and select one with the enter key
			var $current, $next, $prev, $nextRow, $prevRow;
			var movements = {
				13: function select() {
					$current = self.$node.find('.focused');
					self.hide();
					onSelectCallback($current.css('background-color'));
				},
				37: function left() {
					$current = self.$node.find('.focused');
					$prev = $current.prev().addClass('focused');
					if ($prev.length > 0) {
						$current.removeClass('focused');
					}
				},
				38: function up() {
					$current = self.$node.find('.focused');
					$prevRow = $current.parent().prev();
					if ($prevRow.length > 0) {
						$prev = jQuery($prevRow.children()[$current.index()]).addClass('focused');
						if ($prev.length > 0) {
							$current.removeClass('focused');
						}
					}
				},
				39: function right() {
					$current = self.$node.find('.focused');
					$next = $current.next().addClass('focused');
					if ($next.length > 0) {
						$current.removeClass('focused');
					}
				},
				40: function down() {
					$current = self.$node.find('.focused');
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
				var isOverlayVisible = self.$node.css('display') === 'table';
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
			var self = this;
			// when the editable is deactivated, hide the layer
			Aloha.bind('aloha-editable-deactivated', function (event, rangeObject) {
				self.hide();
			});
		},
		_createSwatchButtons: function (colors) {
			var self = this;
			// TODO: shouldn't we do jQuery('<div>' + characters + '</div>').text() here?
			var swatchTable = ['<tr>'];
			var i = 0;
			var swatch;
			while ((swatch = colors[i])) {
				// make a new row every 15 characters
				if (0 !== i && ((i % 15) === 0)) {
					swatchTable.push('</tr><tr>');
				}
				var isColorValue = function(swatch) {
					return ( swatch.indexOf("#") === 0 || swatch.indexOf("rgb") === 0 );
				};

				if ( isColorValue(swatch) ) {
					swatchTable.push('<td unselectable="on" style="background-color: ' + swatch + '"></td>');
				} else {
					swatchTable.push('<td unselectable="on" class="' + swatch + '"></td>');
				}

				i++;
			}

			// add remove color option
			swatchTable.push('<td unselectable="on" class="removecolor">X</td>');

			swatchTable.push('</tr>');
			self.$tbody
				.empty()
				.append(swatchTable.join(''));
			self.$node.delegate('td', 'mouseover', function () {
				jQuery(this).addClass('mouseover');
			}).delegate('td', 'mouseout', function () {
				jQuery(this).removeClass('mouseover');
			}).delegate('td', 'click', function (e) {
				self.$node.hide();

				if (jQuery(this).hasClass('removecolor')) {
					var color = "removecolor";
				} else {
					var color = jQuery(this).css('background-color');
				}

				self.onSelectCallback(color);
			});
		}
	};

	return Plugin.create('colorpicker', {
		_constructor: function () {
			this._super('colorpicker');
		},

		/**
		 * Default configuration
		 */
		config: [ '#FFEE00', 'rgb(255,0,0)', '#FFFF00', '#FFFFFF', 'greenborder' ],

		init: function () {
			var self = this;

			if ( typeof Aloha.settings.plugins != 'undefined'
				&& typeof Aloha.settings.plugins.colorpicker != 'undefined' ) {
				self.settings = Aloha.settings.plugins.colorpicker;
			}

			this._colorPickerButton = Ui.adopt("colorPicker", Button, {
				tooltip: i18n.t('button.colorpicker.tooltip'),
				icon: "aloha-icon-colorpicker",
				scope: 'Aloha.continuoustext',
				click: function() {
					if (false !== self.swatchOverlay) {
						_savedRange = Aloha.Selection.rangeObject;
						self.swatchOverlay.show(this.element);
					}
				}
			});

			// Populate the cache lazily
			setTimeout(function(){ initCache(0); }, 100);
			function initCache(i) {
				if (i < Aloha.editables.length) {
					self.getOverlayForEditable(Aloha.editables[i]);
					setTimeout(function(){ initCache(i + 1); }, 100);
				}
			}

			Aloha.bind('aloha-editable-activated', function (event, data) {
				self.swatchOverlay = self.getOverlayForEditable(data.editable);
				if (self.swatchOverlay) {
					self._colorPickerButton.show();
				} else {
					self._colorPickerButton.hide();
				}
			});

			PubSub.sub('aloha.floating.changed', function(message) {
				self.swatchOverlay.offset = message.position.offset;
				self.swatchOverlay.$node.css(calculateOffset(self.swatchOverlay, self._colorPickerButton.element));
			});

			// add the event handler for context selection change
			PubSub.sub('aloha.selection.context-change', function(message) {
				onSelectionChanged(self, message.range);
			});
		},

		getOverlayForEditable: function(editable) {
			var that = this;
			// Each editable may have its own configuration and as
			// such may have its own overlay.
			var config = this.getEditableConfig(editable.obj),
			    overlay;
			if ( ! config ) {
				return false;
			}
			// We cache the overlay by configuration. If all editables
			// have the same configuration, only a single overlay will
			// be created that will be used by all editables.
			overlay = overlayByConfig[config];
			if ( ! overlay ) {
				overlay = new SwatchOverlay(onColorSelect);
				overlay.setColors(config);
				overlayByConfig[config] = overlay;
			}
			return overlay;
		}

	});


	/**
	 * apply color after selecting it from the list
	 */
	function onColorSelect (color) {
		if (Aloha.activeEditable) {
			//Select the range that was selected before the overlay was opened
			_savedRange.select();

			//Change the button color
			jQuery('.aloha-icon-colorpicker').css('background-color', color);

			if (color === "removecolor") {
				var effectiveMarkup;
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
		var effectiveMarkup;
		var selectedColor;

		for (i = 0; i < rangeObject.markupEffectiveAtStart.length; i++) {
			effectiveMarkup = rangeObject.markupEffectiveAtStart[i];

			if (effectiveMarkup.nodeName === "SPAN") {
				selectedColor = jQuery(effectiveMarkup).css('color');
				break;
			}
			selectedColor = jQuery(effectiveMarkup).css('color');
		}

		jQuery('.aloha-icon-colorpicker').css('background-color', selectedColor);
	}

});
