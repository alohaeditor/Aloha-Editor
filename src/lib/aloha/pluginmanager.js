/* pluginmanager.js is part of Aloha Editor project http://aloha-editor.org
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
// Do not add dependencies that require depend on aloha/core
define(['jquery', 'util/class'], function (jQuery, Class) {
	"use strict";

	var Aloha = window.Aloha;

	/**
	 * The Plugin Manager controls the lifecycle of all Aloha Plugins.
	 *
	 * @namespace Aloha
	 * @class PluginManager
	 * @singleton
	 */
	return new (Class.extend({
		plugins: {},

		/**
		 * Initialize all registered plugins
		 * @return void
		 * @hide
		 */
		init: function (next, userPlugins) {
			var me = this,
				globalSettings = (Aloha && Aloha.settings) ? Aloha.settings.plugins || {} : {},
				i,
				plugin,
				pluginName;

			// Global to local settings
			for (pluginName in globalSettings) {

				if (globalSettings.hasOwnProperty(pluginName)) {

					plugin = this.plugins[pluginName] || false;

					if (plugin) {
						plugin.settings = globalSettings[pluginName] || {};
					}
				}
			}

			// Default: All loaded plugins are enabled
			if (!userPlugins.length) {

				for (pluginName in this.plugins) {

					if (this.plugins.hasOwnProperty(pluginName)) {
						userPlugins.push(pluginName);
					}
				}
			}

			// Enable Plugins specified by User
			for (i = 0; i < userPlugins.length; ++i) {

				pluginName = userPlugins[i];
				plugin = this.plugins[pluginName] || false;

				if (plugin) {

					plugin.settings = plugin.settings || {};

					if (typeof plugin.settings.enabled === 'undefined') {
						plugin.settings.enabled = true;
					}

					if (plugin.settings.enabled) {
						if (plugin.checkDependencies()) {
							plugin.init();
						}
					}
				}
			}

			next();
		},

		/**
		 * Register a plugin
		 * @param {Plugin} plugin plugin to register
		 */
		register: function (plugin) {

			if (!plugin.name) {
				throw new Error('Plugin does not have an name.');
			}

			if (this.plugins[plugin.name]) {
				throw new Error('Already registered the plugin "' + plugin.name + '"!');
			}

			this.plugins[plugin.name] = plugin;
		},

		/**
		 * Pass the given jQuery object, which represents an editable to all plugins, so that they can make the content clean (prepare for saving)
		 * @param obj jQuery object representing an editable
		 * @return void
		 * @hide
		 */
		makeClean: function (obj) {
			var i, plugin;
			// iterate through all registered plugins
			for (plugin in this.plugins) {
				if (this.plugins.hasOwnProperty(plugin)) {
					if (Aloha.Log.isDebugEnabled()) {
						Aloha.Log.debug(this, 'Passing contents of HTML Element with id { ' + obj.attr('id') + ' } for cleaning to plugin { ' + plugin + ' }');
					}
					this.plugins[plugin].makeClean(obj);
				}
			}
		},

		/**
		 * Expose a nice name for the Plugin Manager
		 * @hide
		 */
		toString: function () {
			return 'pluginmanager';
		}

	}))();
});
