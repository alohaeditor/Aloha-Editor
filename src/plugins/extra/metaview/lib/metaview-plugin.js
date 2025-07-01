/** @typedef {import('../../../common/ui/lib/toggleButton').ToggleButton} ToggleButton */
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
	'aloha/ephemera',
	'ui/ui',
	'ui/icons',
	'ui/toggleButton',
	'i18n!metaview/nls/i18n',
	'i18n!aloha/nls/i18n'
], function (
	$,
	Aloha,
	Plugin,
	Ephemera,
	Ui,
	Icons,
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

	var CLASS_META_VIEW = 'aloha-metaview';

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
	 */
	function enable($editable) {
		$editable.addClass(CLASS_META_VIEW);
		plugin._toggleButton.activate();
		states[$editable[0].id] = true;
	}

	/**
	 * Disables metaview for the given editable, and update UI appropriately.
	 *
	 * @param {jQuery<HTMLElement>} $editable
	 */
	function disable($editable) {
		$editable.removeClass(CLASS_META_VIEW);
		plugin._toggleButton.deactivate();
		states[$editable[0].id] = false;
	}

	/**
	 * Toggles metaview on the given editable.
	 *
	 * @param {jQuery<HTMLElement>} $editable
	 */
	function toggle($editable) {
		if (!$editable) {
			return;
		}

		if (enabled($editable)) {
			disable($editable);
		} else {
			enable($editable);
		}
	}

	/**
	 * Checks whether or not meta-view is automatically enable on an editable.
	 *
	 * @param {object} The plugin/editable configuration.
	 * @return {boolean} True if activated.
	 */
	function isAutomaticallyEnabled(config) {
		return Array.isArray(config) && config.includes('enabled');
	}

	/**
	 * Checks whether or not meta-view is activated for an editable.
	 *
	 * @param {object} The plugin/editable configuration.
	 * @return {boolean} True if activated.
	 */
	function isPluginActivated(config) {
		return Array.isArray(config) && config.includes('metaview');
	}

	var plugin = {
		config: ['metaview'],

		/**
		 * The button which toggles between the states
		 *
		 * @type {ToggleButton}
		 */
		_toggleButton: null,

		init: function () {
			Ephemera.classes(CLASS_META_VIEW);

			plugin._toggleButton = Ui.adopt('toggleMetaView', ToggleButton, {
				tooltip : i18n.t('button.switch-metaview.tooltip'),
				icon: Icons.META_VIEW,
				pure: true,
				click: function () {
					if (Aloha.activeEditable != null && Aloha.activeEditable.obj != null) {
						toggle(Aloha.activeEditable.obj);
					}
				}
			});

			Aloha.bind('aloha-editable-activated', function () {
				var config = plugin.getEditableConfig(Aloha.activeEditable.obj);

				if (isAutomaticallyEnabled(config)) {
					plugin._toggleButton.show();
					enable(Aloha.activeEditable.obj);
				} else if (isPluginActivated(config)) {
					plugin._toggleButton.show();
					if (enabled(Aloha.activeEditable.obj)) {
						enable(Aloha.activeEditable.obj);
					} else {
						disable(Aloha.activeEditable.obj);
					}
				} else {
					plugin._toggleButton.hide();
				}
			});

			Aloha.bind('aloha-editable-deactivated', function () {
				// disable(Aloha.activeEditable.obj);
				plugin._toggleButton.hide();
			});

			if (!Aloha.activeEditable) {
				plugin._toggleButton.hide();
			}
		}
	};

	plugin = Plugin.create('metaview', plugin);

	return plugin;
});
