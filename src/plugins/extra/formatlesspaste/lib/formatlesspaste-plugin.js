/** @typedef {import('../../../common/ui/lib/toggleButton').ToggleButton} ToggleButton */
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
	'ui/icons',
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
	Icons,
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
		if (config.formatlessPasteOption != null) {
			parsed.formatlessPasteOption =
				normalizeToBoolean(config.formatlessPasteOption);
		}
		if (config.strippedElements != null) {
			parsed.strippedElements = config.strippedElements;
		}
		if (config.button != null) {
			parsed.button = normalizeToBoolean(config.button);
		}
		return parsed;
	}

	function applyConfiguration(obj, config) {
		$.extend(obj, config);
	}

	function registerFormatlessPasteHandler(config) {
		ContentHandlerManager.register('formatless', FormatlessPasteHandler);
		FormatlessPasteHandler.strippedElements = config.strippedElements || Html.TEXT_LEVEL_SEMANTIC_ELEMENTS;

		plugin._toggleFormatlessPasteButton = Ui.adopt('toggleFormatlessPaste', ToggleButton, {
			tooltip: i18n.t('button.formatlessPaste.tooltip'),
			icon: Icons.FORMATLESS_PASTE,
			pure: true,
			active: FormatlessPasteHandler.enabled,
			click: function () {
				// Toggle the value of allowFormatless
				FormatlessPasteHandler.enabled = !FormatlessPasteHandler.enabled;
				plugin._toggleFormatlessPasteButton.setActive(FormatlessPasteHandler.enabled);
			}
		});

		if (plugin.button) {
			plugin._toggleFormatlessPasteButton.show();
		} else {
			plugin._toggleFormatlessPasteButton.hide();
		}

		if (true === plugin.formatlessPasteOption) {
			plugin._toggleFormatlessPasteButton.setActive(true);
			FormatlessPasteHandler.enabled = true;
		} else if (false === plugin.formatlessPasteOption) {
			plugin._toggleFormatlessPasteButton.setActive(false);
			FormatlessPasteHandler.enabled = false;
		}
	}

	function getEditableConfig(plugin, editable) {
		var config = plugin.getEditableConfig(editable.obj);
		if (!config) {
			return null;
		}
		return parseConfiguration(config);
	}

	var plugin = {

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

		/** @type {ToggleButton} */
		_toggleFormatlessPasteButton: null,

		/**
		 * Initializes formatless copying and pasting.
		 * Parses configuration.
		 */
		init: function () {
			var config = plugin.settings.config || plugin.settings;
			var parsedConfig = parseConfiguration(config);

			applyConfiguration(plugin, parsedConfig);
			registerFormatlessPasteHandler(parsedConfig);

			Aloha.bind('aloha-editable-activated', function ($event, data) {
				var config = getEditableConfig(plugin, data.editable);
				if (!config) {
					return;
				}

				var pasteButton = plugin._toggleFormatlessPasteButton;
				var active = !!config.formatlessPasteOption;

				pasteButton.setActive(active);
				FormatlessPasteHandler.enabled = active;

				FormatlessPasteHandler.strippedElements = config.strippedElements || Html.TEXT_LEVEL_SEMANTIC_ELEMENTS;

				if (config.button === false) {
					pasteButton.hide();
				} else {
					pasteButton.show();
				}
			});
		}
	};

	plugin = Plugin.create('formatlesspaste', plugin);

	return plugin;
});
