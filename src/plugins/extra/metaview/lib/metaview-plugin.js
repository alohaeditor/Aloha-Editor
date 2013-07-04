/* metaview-plugin.js is part of Aloha Editor project http://aloha-editor.org
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
	'jquery',
	'aloha/core',
	'aloha/plugin',
	'ui/ui',
	'ui/toggleButton',
	'i18n!metaview/nls/i18n',
	'i18n!aloha/nls/i18n'
], function (
	$,
	Aloha,
	Plugin,
	Ui,
	ToggleButton,
	i18n
) {
	'use strict';

	/**
	 * Map of editable ids against their metaview states.
	 *
	 * @type {object<string, boolean>}
	 */
	var states = {};

	/**
	 * Checks whether the given editable is has metaview enabled.
	 *
	 * @param {jQuery<HTMLElement>} $editable
	 * @return {boolean} True if editable is in metaview-enabled state.
	 */
	function enabled($editable) {
		return states[$editable[0].id];
	}

	/**
	 * Enables metaview for the given editable, and update UI appropriately.
	 *
	 * @param {jQuery<HTMLElement>} $editable
	 * @param {ToggleButton} button
	 */
	function enable($editable, button) {
		$editable.addClass('aloha-metaview');
		button.setState(true);
		states[$editable[0].id] = true;
	}

	/**
	 * Disables metaview for the given editable, and update UI appropriately.
	 *
	 * @param {jQuery<HTMLElement>} $editable
	 * @param {ToggleButton} button
	 */
	function disable($editable, button) {
		$editable.removeClass('aloha-metaview');
		button.setState(false);
		states[$editable[0].id] = false;
	}

	/**
	 * Toggles metaview on the given editable.
	 *
	 * @param {jQuery<HTMLElement>} $editable
	 * @param {ToggleButton} button
	 */
	function toggle($editable, button) {
		if (enabled($editable)) {
			disable($editable, button);
		} else {
			enable($editable, button);
		}
	}

	/**
	 * Singleton meta view toggle button to be used across all meta view plugin
	 * instances.
	 *
	 * @type {ToggleButton}
	 */
	var METAVIEW_TOGGLE_BUTTON = Ui.adopt('toggleMetaView', ToggleButton, {
		tooltip : i18n.t('button.switch-metaview.tooltip'),
		icon: 'aloha-icon aloha-icon-metaview',
		scope: 'Aloha.continuoustext',
		click: function () {
			toggle(Aloha.activeEditable.obj, this);
		}
	});

	/**
	 * Gets the configuration for the given editable/plugin combination.
	 *
	 * TODO: Memoize
	 *
	 * @param {Plugin} plugin Instance of metaview plugin
	 * @param {Editable} editable
	 */
	function getConfiguration(plugin, editable) {
		return plugin.getEditableConfig(editable);
	}

	/**
	 * Checks whether or not meta-view is automatically enable on an editable.
	 *
	 * @param {object} The plugin/editable configuration.
	 * @return {boolean} True if activated.
	 */
	function isAutomaticallyEnabled(config) {
		return (
			$.type(config) === 'array' && $.inArray('enabled', config) !== -1
		);
	}

	/**
	 * Checks whether or not meta-view is activated for an editable.
	 *
	 * @param {object} The plugin/editable configuration.
	 * @return {boolean} True if activated.
	 */
	function isPluginActivated(config) {
		return (
			$.type(config) === 'array' && $.inArray('metaview', config) !== -1
		);
	}

    return Plugin.create('metaview', {
		config: ['metaview'],
		init: function () {
			var plugin = this;

			Aloha.bind('aloha-editable-activated', function () {
				var config = getConfiguration(plugin, Aloha.activeEditable.obj);

				if (isAutomaticallyEnabled(config)) {
					METAVIEW_TOGGLE_BUTTON.show(true);
					enable(Aloha.activeEditable.obj, METAVIEW_TOGGLE_BUTTON);
				} else if (isPluginActivated(config)) {
					METAVIEW_TOGGLE_BUTTON.show(true);
					if (enabled(Aloha.activeEditable.obj)) {
						enable(
							Aloha.activeEditable.obj,
							METAVIEW_TOGGLE_BUTTON
						);
					} else {
						disable(
							Aloha.activeEditable.obj,
							METAVIEW_TOGGLE_BUTTON
						);
					}
				} else {
					METAVIEW_TOGGLE_BUTTON.show(false);
				}
			});

			Aloha.bind('aloha-editable-deactivated', function () {
				Aloha.activeEditable.obj.removeClass('aloha-metaview');
			});
		}
	});
});
