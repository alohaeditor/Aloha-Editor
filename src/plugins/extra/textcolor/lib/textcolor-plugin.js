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
	'util/color',
	'PubSub',
	'util/range-context',
	'ui/ui',
	'ui/contextButton',
	'ui/icons',
	'./palette',
	'i18n!textcolor/nls/i18n',
], function (
	Aloha,
	$,
	Plugin,
	Dom,
	Utils,
	PubSub,
	RangeContext,
	Ui,
	ContextButton,
	Icons,
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

	function checkVisibility(editable) {
		// If we have no editable, then we don't want to show the button
		if (editable == null || editable.obj == null) {
			plugin._textColorButton.hide();
			plugin._backgroundColorButton.hide();
			return;
		}
		
		var config = plugin.getEditableConfig(editable.obj);

		// Just to be sure
		if (config == null) {
			return;
		}

		if (config.color === false || !config.color.enabled) {
			plugin._textColorButton.hide();
		} else {
			plugin._textColorButton.show();
		}

		if (config['background-color'] === false || !config['background-color'].enabled) {
			plugin._backgroundColorButton.hide();
		} else {
			plugin._backgroundColorButton.show();
		}
	}

	var plugin = {

		config: {
			"color": {
				palette: Palette,
				enabled: true,
			},
			"background-color": {
				palette: Palette,
				allowTransparency: true,
				enabled: true,
			},
		},

		_textColorButton: null,
		_backgroundColorButton: null,

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
				var mergedProperties = Object.assign({}, buttonProperties || {}, {
					contextType: 'dropdown',
					context: function () {
						// Can't style the color without an editable
						if (Aloha.activeEditable == null || Aloha.activeEditable.obj == null) {
							return null;
						}

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
					},
				});

				var btn = Ui.adopt(name, ContextButton, mergedProperties);

				return btn;
			}

			plugin._textColorButton = createButton('textColor', 'color', {
				icon: Icons.TEXT_COLOR,
				tooltip: i18n.t('change-textcolor-color'),
			});
			plugin._backgroundColorButton = createButton('textBackground', 'background-color', {
				icon: Icons.BACKGROUND_COLOR,
				tooltip: i18n.t('change-textcolor-background-color'),
			});

			// Set the button visible if it's enabled via the config
			PubSub.sub('aloha.editable.activated', function (message) {
				var editable = message.editable;
				checkVisibility(editable);
			});

			// Reset and hide the button when leaving an editable
			PubSub.sub('aloha.editable.deactivated', function () {
				plugin._textColorButton.hide();
				plugin._backgroundColorButton.hide();
			});

			checkVisibility(Aloha.activeEditable);
		}
	};

	plugin = Plugin.create('textcolor', plugin);

	return plugin;
});
