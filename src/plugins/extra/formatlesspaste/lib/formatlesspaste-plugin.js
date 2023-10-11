/* formatlesspaste-plugin.js is part of Aloha Editor project http://aloha-editor.org
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
	'aloha/core',
	'aloha/plugin',
	'jquery',
	'ui/ui',
	'ui/toggleButton',
	'formatlesspaste/formatlesshandler',
	'aloha/contenthandlermanager',
	'i18n!formatlesspaste/nls/i18n',
	'util/html'
], function (
	Aloha,
	Plugin,
	$,
	Ui,
	ToggleButton,
	FormatlessPasteHandler,
	ContentHandlerManager,
	i18n,
    Html
) {
	'use strict';

	/**
	 * Normalizes the given string value to either boolean true or false.
	 *
	 * @param {*} value The value which is to be normalized.
	 * @return {boolean} True if the value if truthy and not the string "false"
	 *                   or "0".
	 */
	function normalizeToBoolean(value) {
		if (!value) {
			return false;
		}
		if (typeof value === 'string') {
			return '0' !== value && 'false' !== value.toLowerCase();
		}
		return true;
	}

	function parseConfiguration(config) {
		var parsed = {};
		if (typeof config.formatlessPasteOption !== 'undefined') {
			parsed.formatlessPasteOption =
					normalizeToBoolean(config.formatlessPasteOption);
		}
		if (typeof config.strippedElements !== 'undefined') {
			parsed.strippedElements = config.strippedElements;
		}
		if (typeof config.button !== 'undefined') {
			parsed.button = normalizeToBoolean(config.button);
		}
		return parsed;
	}

	function applyConfiguration(obj, config) {
		$.extend(obj, config);
	}

	function registerFormatlessPasteHandler(plugin, config) {
		ContentHandlerManager.register('formatless', FormatlessPasteHandler);
		FormatlessPasteHandler.strippedElements = config.strippedElements || Html.TEXT_LEVEL_SEMANTIC_ELEMENTS;

		plugin._toggleFormatlessPasteButton =
			Ui.adopt('toggleFormatlessPaste', ToggleButton, {
				tooltip : i18n.t('button.formatlessPaste.tooltip'),
				icon    : 'aloha-icon aloha-icon-formatless-paste',
				scope   : 'Aloha.continuoustext',
				click   : function () {
					// Toggle the value of allowFormatless
					FormatlessPasteHandler.enabled =
						!FormatlessPasteHandler.enabled;
				}
			});

		plugin._toggleFormatlessPasteButton.show(plugin.button);

		if (true === plugin.formatlessPasteOption) {
			plugin._toggleFormatlessPasteButton.setState(true);
			FormatlessPasteHandler.enabled = true;
		} else if (false === plugin.formatlessPasteOption) {
			plugin._toggleFormatlessPasteButton.setState(false);
			FormatlessPasteHandler.enabled = false;
		}
	}

	var configLookup = {};

	function getEditableConfig(plugin, editable) {
		var id = editable.getId();
		if (!id) {
			return null;
		}
		if (configLookup[id]) {
			return configLookup[id];
		}
		var config = plugin.getEditableConfig(editable.obj);
		if (!config) {
			return null;
		}
		configLookup[id] = parseConfiguration(config);
		return configLookup[id];
	}

	function clearEditableConfig(editable) {
		var id = editable.getId();
		if (id && configLookup[id]) {
			delete configLookup[id];
		}
	}

	Aloha.bind('aloha-editable-destroyed', function ($event, data) {
		clearEditableConfig(data);
	});

	return Plugin.create('formatlesspaste', {

		/**
		 * Whether or not formatless pasting is enabled.
		 *
		 * Configurable.
		 *
		 * @type {boolean}
		 */
		formatlessPasteOption: false,

		/**
		 * Whether or not to show the formatless paste button.
		 *
		 * Configurable.
		 *
		 * @type {boolean}
		 */
		button: true,

		/**
		 * Initializes formatless copying and pasting.
		 * Parses configuration.
		 */
		init: function () {
			var plugin = this;
			var config = plugin.settings.config || plugin.settings;
			var parsedConfig = parseConfiguration(config);

			applyConfiguration(plugin, parsedConfig);
			registerFormatlessPasteHandler(plugin, parsedConfig);

			Aloha.bind('aloha-editable-activated', function ($event, data) {
				var config = getEditableConfig(plugin, data.editable);
				if (!config) {
					return;
				}

				var pasteButton = plugin._toggleFormatlessPasteButton;

				if (true === config.formatlessPasteOption) {
					pasteButton.setState(true);
					FormatlessPasteHandler.enabled = true;
				} else if (false === config.formatlessPasteOption) {
					pasteButton.setState(false);
					FormatlessPasteHandler.enabled = false;
				}

				FormatlessPasteHandler.strippedElements = config.strippedElements || Html.TEXT_LEVEL_SEMANTIC_ELEMENTS;

				pasteButton.show(false !== config.button);
			});
		}
	});
});
