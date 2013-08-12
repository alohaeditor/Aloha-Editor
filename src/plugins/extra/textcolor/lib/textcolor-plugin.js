/* textcolor-plugin.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
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
	'aloha/jquery',
	'aloha/plugin',
	'util/arrays',
	'util/dom2',
	'ui/ui',
	'ui/button',
	'ui/floating',
	'PubSub',
	'./textcolor',
	'./overlay',
	'./palette',
	'i18n!textcolor/nls/i18n',
], function (
	Aloha,
	$,
	Plugin,
	Arrays,
	Dom,
	Ui,
	Button,
	Floating,
	PubSub,
	TextColor,
	Overlay,
	Palette,
	i18n
) {
	'use strict';

	function isColor(color) {
		return color.substr(0, 1) === '#' || color.substr(0, 3) === 'rgb';
	}

	function generateSwatches(colors, getSwatchClass) {
		var list = Arrays.map(colors, function (color) {
			return (
				isColor(color)
					? '<div class="' + getSwatchClass(color) + '" '
						+ 'style="background-color: ' + color + '" '
						+ 'title="' + color + '"></div>'
					: '<div class="' + getSwatchClass(color) + ' '
						+ color + '"></div>'
			);
		});
		list.push(
			'<div class="removecolor" title="'
			+ i18n.t('removecolor')
			+ '">&#10006</div></td>'
		);
		return list;
	}

	function selectSwatch(overlay, $swatch) {
		overlay.select(
			$swatch.hasClass('removecolor')
				? ''
				: $swatch.css('background-color')
		);
	}

	function onSelect(plugin, item, range) {
		if (range.collapsed) {
			Dom.extendToWord(range);
		}
		var $swatch = $('>div', item);
		if ($swatch.hasClass('removecolor')) {
			TextColor.unsetColor(range);
		} else {
			TextColor.setColor(
				range,
				Dom.getComputedStyle($swatch[0], 'background-color')
			);
		}
		var selection = Aloha.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	}

	var overlays = {};

	var rangeAtOpen;

	function getOverlay(editable, plugin, button, getSwatchClass) {
		// Because each editable may have its own configuration and therefore
		// each may have its own overlay.
		var config = plugin.getEditableConfig(editable.obj);
		if (!config || config.length < 1) {
			return null;
		}
		var id = editable.getId();
		var overlay = overlays[id];
		if (!overlay) {
			overlay = new Overlay(
				generateSwatches(config, getSwatchClass),
				function (swatch) { onSelect(plugin, swatch, rangeAtOpen); },
				button.element[0]
			);
			overlay.$element
			       .addClass('aloha-ui-textcolor-picker-overlay')
			       .css('position', Floating.POSITION_STYLE);
			overlays[id] = overlay;
		}
		return overlay;
	}

	function ui(plugin, button, getSwatchClass) {
		PubSub.sub('aloha.editable.activated', function (message) {
			plugin.overlay = getOverlay(
				message.data.editable,
				plugin,
				button,
				getSwatchClass
			);
			if (plugin.overlay) {
				button.show();
			} else {
				button.hide();
			}
		});

		PubSub.sub('aloha.floating.changed', function (message) {
			if (plugin.overlay) {
				plugin.overlay.offset = message.position.offset;

				var offset = Overlay.calculateOffset(
					button.element, 
					Floating.POSITION_STYLE
				);
				offset.top += button.element.height();

				plugin.overlay.$element.css(offset);
			}
		});

		PubSub.sub('aloha.selection.context-change', function (message) {
			// The `execCommand` runs asynchronously, so it fires the selection
			// change event, before actually applying the forecolor.
			setTimeout(function () {
				$('.aloha-icon-textcolor').css(
					'background-color',
					$(message.range.endContainer).parent().css('color')
				);
			}, 20);
		});
	}

	return Plugin.create('textcolor', {

		config: Palette,

		_constructor: function () {
			this._super('textcolor');
		},

		init: function () {
			var plugin = this;

			if (Aloha.settings.plugins && Aloha.settings.plugins.textcolor) {
				plugin.config = Aloha.settings.plugins.textcolor;
			}

			var getSwatchClass = (function (colors) {
				var index = {};
				Arrays.forEach(colors, function (color, i) {
					index[color.toLowerCase()] = 'swatch' + i;
				});
				return function getSwatchClass(color) {
					return (
						index[color]
							|| index[color.toLowerCase()]
								|| index[TextColor.hex(color)]
					);
				};
			}(Palette));

			var button = Ui.adopt('colorPicker', Button, {
				tooltip: i18n.t('button.textcolor.tooltip'),
				icon: 'aloha-icon-textcolor',
				scope: 'Aloha.continuoustext',
				click: function () {
					if (plugin.overlay) {
						var $button = this.element;

						var swatchClass = getSwatchClass(
							$button.find('.ui-icon').css('background-color')
						);


						plugin.overlay.$element.find('.selected')
						              .removeClass('selected');

						plugin.overlay.$element.find('.focused')
						              .removeClass('focused');

						plugin.overlay.$element.find('.' + swatchClass)
						              .closest('td')
						              .addClass('focused')
						              .addClass('selected');

						var selection = Aloha.getSelection();
						if (selection.getRangeCount()) {
							rangeAtOpen = selection.getRangeAt(0);
						}

						var offset = Overlay.calculateOffset(
							$button,
							Floating.POSITION_STYLE
						);
						offset.top += $button.height();

						plugin.overlay.show(plugin.overlay.$element, offset);
					}
				}
			});

			ui(plugin, button, getSwatchClass);

			Aloha.ready(function () {
				(function prepare(pos) {
					if (pos) {
						var index = pos - 1;
						getOverlay(
							Aloha.editables[index],
							plugin,
							button,
							getSwatchClass
						);
						setTimeout(function () {
							prepare(index);
						}, 100);
					}
				}(Aloha.editables.length));
			});
		}
	});
});
