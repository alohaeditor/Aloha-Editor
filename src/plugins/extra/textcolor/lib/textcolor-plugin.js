/**
 * @typedef {object} ColorConfiguration
 * @prop {boolean=} enabled If the setting should be enabled.
 * @prop {Array.<string>=} palette A list of css-compatible color strings the user can choose from.
 * Empty if it should be disabled.
 * @prop {boolean=} allowOutsidePalette If the user may select a color outside of the palette.
 * @prop {boolean=} allowCustomInput If the user may select a color from a provided color-picker.
 * @prop {boolean=} allowTransparency If the user may change the transparency of a selected (palette or custom input) color.
 * @prop {boolean=} allowClear If the user should be able to remove the currently selected color (aka reset it to unset).
 */
/**
 * @typedef {object} TextColorPluginConfiguration
 * @prop {ColorConfiguration} color Configuration for the foreground color
 * @prop {ColorConfiguration} background-color Configuration for the background color
 */
/**
 * @typedef {object} TextColorPluginSettings
 * @prop {TextColorPluginConfiguration} config General configuration for the textcolor plugin
 * @prop {object.<string, TextColorPluginConfiguration>=} editables Configuration for individual editables
 */
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
	'util/html',
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
	Html,
	Ui,
	ContextButton,
	Icons,
	Palette,
	i18n
) {
	'use strict';

	/** @type {ColorConfiguration} */
	var DEFAULT_COLOR_CONFIG = {
		enabled: true,
		palette: Palette,
		allowClear: true,
		allowCustomInput: true,
		allowOutsidePalette: true,
		allowTransparency: false,
	};
	/** @type {ColorConfiguration} */
	var DEFAULT_BACKGROUND_COLOR_CONFIG = {
		enabled: true,
		palette: Palette,
		allowClear: true,
		allowCustomInput: true,
		allowOutsidePalette: true,
		allowTransparency: true,
	};
	/** @type {TextColorPluginConfiguration} */
	var DEFAULT_CONFIG = {
		color: { ...DEFAULT_COLOR_CONFIG },
		'background-color': { ...DEFAULT_BACKGROUND_COLOR_CONFIG },
	};

	/**
	 * Removes color at the given range.
	 *
	 * @param {String} cssProperty
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
	 * @param {String} cssProperty
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

	function coerceToBoolean(value, defaultValue) {
		if (value == null) {
			return defaultValue;
		} else if (typeof value === 'string') {
			return value.toLowerCase() === 'true';
		} else if (typeof value !== 'boolean') {
			return !!value;
		}

		return value;
	}

	/**
	 * Normalizes the config from potentially misconfigured options.
	 * Does so on the config object directly.
	 * @param {ColorConfiguration} configObj The config to normalize
	 * @param {ColorConfiguration} defaultConf The default/fallback config from which it should take values from if needed
	 */
	function normalizeConfiguration(configObj, defaultConf) {
		if (configObj == null || typeof configObj !== 'object') {
			return;
		}

		configObj.enabled = coerceToBoolean(configObj.enabled, defaultConf.enabled);
		configObj.allowClear = coerceToBoolean(configObj.allowClear, defaultConf.allowClear);
		configObj.allowCustomInput = coerceToBoolean(configObj.allowCustomInput, defaultConf.allowCustomInput);
		configObj.allowOutsidePalette = coerceToBoolean(configObj.allowOutsidePalette, defaultConf.allowOutsidePalette);
		configObj.allowTransparency = coerceToBoolean(configObj.allowTransparency, defaultConf.allowTransparency);

		// Reset it to an empty palette if anything is wrong, just in case
		if (configObj.palette != null && !Array.isArray(configObj.palette)) {
			configObj.palette = [];
		}
	}

	/**
	 * Sets the text color at the given range.
	 *
	 * @param {String} cssProperty
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

		if (
			config.color === false
			|| config.color == null
			|| config.color.enabled === false
		) {
			plugin._textColorButton.hide();
		} else {
			plugin._textColorButton.show();
		}

		if (
			config['background-color'] === false
			|| config['background-color'] == null
			|| config['background-color'].enabled === false
		) {
			plugin._backgroundColorButton.hide();
		} else {
			plugin._backgroundColorButton.show();
		}
	}

	var plugin = {

		/**
		 * @type {TextColorPluginSettings}
		 */
		settings: {},
		/**
		 * @type {TextColorPluginConfiguration}
		 */
		config: {},

		defaults: {
			config: {
				...DEFAULT_CONFIG,
			},
		},

		_textColorButton: null,
		_backgroundColorButton: null,

		init: function () {
			normalizeConfiguration(plugin.settings.config.color, DEFAULT_COLOR_CONFIG);
			normalizeConfiguration(plugin.settings.config["background-color"], DEFAULT_BACKGROUND_COLOR_CONFIG);
			plugin.config = plugin.settings.config;

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

						var conf = plugin.getEditableConfig(Aloha.activeEditable.obj);
						var propertyConfig = Object.assign({}, DEFAULT_CONFIG[cssProperty], conf[cssProperty] || {});

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
		},

		getEditableConfig: function(obj) {
			var config = this._super(obj);

			// Normalize the config we receive
			if (config['color'] != null) {
				normalizeConfiguration(config['color'], plugin.config.color);
			} else {
				config['color'] = plugin.config.color;
			}
			if (config['background-color'] != null) {
				normalizeConfiguration(config['background-color'], plugin.config["background-color"]);
			} else {
				config['background-color'] = plugin.config['background-color'];
			}

			return config;
		},

		/*
		 * Override the config merge handler, because the configuration of this plugin
		 * is in a bit different format compared to other plugins.
		 */
		_mergeConfigurations: function(target, left, right) {
			var properties = new Set(Object.keys(left || {}));
			Object.keys(right || {}).forEach(function(key) {
				properties.add(key);
			});

			properties.forEach(function(key) {
				if (Array.isArray(right[key])) {
					target[key] = right[key];
				} else if (typeof right[key] === 'object') {
					target[key] = jQuery.extend({}, left[key], right[key]);
				} else if (right[key] == null) {
					target[key] = left[key];
				} else {
					target[key] = right[key];
				}
			});
		},
	};

	plugin = Plugin.create('textcolor', plugin);

	return plugin;
});
