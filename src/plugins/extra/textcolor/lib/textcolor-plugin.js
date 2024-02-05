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
	'util/dom2',
	'PubSub',
	'util/range-context',
	'ui/ui',
	'ui/contextButton',
	'ui/icons',
	'ui/utils',
	'./palette',
	'i18n!textcolor/nls/i18n',
], function (
	Aloha,
	$,
	Plugin,
	Dom,
	PubSub,
	RangeContext,
	Ui,
	ContextButton,
	Icons,
	Utils,
	Palette,
	i18n
) {
	'use strict';

	/**
	 * Removes color at the given range.
	 *
	 * @param {Range} range
	 */
	function unsetColor(cssProperty, range) {
		RangeContext.formatStyle(range, cssProperty, null, null, function(a, b) {
			return false;
		});
	}

	/**
	 * Gets the text color at the given range.
	 *
	 * @param {Range} range
	 * @return {String} Style color string
	 */
	function getColor(cssProperty, range) {
		var node = Dom.nodeAtOffset(range.startContainer, range.startOffset);
		return Dom.getComputedStyle(
			3 === node.nodeType ? node.parentNode : node,
			cssProperty
		);
	}

	/**
	 * Sets the text color at the given range.
	 *
	 * @param {Range} range
	 * @param {String} color
	 */
	function setColor(cssProperty, range, color) {
		RangeContext.formatStyle(range, cssProperty, color, null, function(a, b) {
			return Utils.colorIsSame(Utils.colorToRGBA(a), Utils.colorToRGBA(b));
		});
	}

	return Plugin.create('textcolor', {

		config: {
			"color": {
				palette: Palette,
			},
			"background-color": {
				palette: Palette,
				allowTransparency: true,
			},
		},

		_constructor: function () {
			this._super('textcolor');
		},

		init: function () {
			var plugin = this;

			function applyColorToSelection(cssProperty, color) {
				var selection = Aloha.getSelection();
				if (color == null) {
					unsetColor(cssProperty, selection.getRangeAt(0));
				} else {
					setColor(cssProperty, selection.getRangeAt(0), Utils.colorToHex(color));
				}
			}

			function createButton(name, cssProperty, buttonProperties) {

				var btn;

				function applyColorToButton(color) {
					$(btn.buttonElement).find('.ui-button-icon-primary').css(
						'border-bottom-color',
						color
					);
				}

				buttonProperties = Object.assign({}, buttonProperties || {}, {
					contextType: 'dropdown',
					context: function () {
						var activeColor = null;

						try {
							var selection = Aloha.getSelection();
							activeColor = getColor(cssProperty, selection.getRangeAt(0));
						} catch (err) {
							// This is an error thrown when the selection could not be retrieved properly.
							// Can be safely ignored.
							if (err == null || typeof err !== 'object' || err.codeName !== 'INDEX_SIZE_ERR') {
								throw err;
							}
						}

						var propertyConfig = Object.assign({}, {
							// Default settings
							palette: Palette,
							allowOutsidePalette: true,
							allowCustomInput: true,
							allowTransparency: false,
							allowClear: true,
						}, plugin.config[cssProperty] || {});

						return {
							type: 'color-picker',
							initialValue: activeColor,
							options: {
								value: activeColor,
								palette: propertyConfig.palette,
								allowOutsidePalette: propertyConfig.allowOutsidePalette,
								allowCustomInput: propertyConfig.allowCustomInput,
								allowTransparency: propertyConfig.allowTransparency,
								allowClear: propertyConfig.allowClear,
							},
						};
					},
					contextResolve: function (color) {
						applyColorToSelection(cssProperty, color);
						applyColorToButton(color || 'transparent');
					},
				});

				btn = Ui.adopt(name, ContextButton, buttonProperties);

				btn._$buttonElement.addClass('textcolor-button');

				// Updates the color of the button when changing focus/text elements
				PubSub.sub('aloha.selection.context-change', function (message) {
					// The `execCommand` runs asynchronously, so it fires the selection
					// change event, before actually applying the forecolor.
					setTimeout(function () {
						applyColorToButton($(message.range.endContainer).parent().css(cssProperty));
					}, 20);
				});

				return btn;
			}

			createButton('textColor', 'color', {
				icon: Icons.MAPPING.TEXT_COLOR,
				tooltip: i18n.t('change-textcolor-color'),
			});
			createButton('textBackground', 'background-color', {
				icon: Icons.MAPPING.BACKGROUND_COLOR,
				tooltip: i18n.t('change-textcolor-background-color'),
			});
		}
	});
});
