/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

define(
[],
function() {
	"use strict";
	var
		jQuery = window.alohaQuery || window.jQuery, $ = jQuery,
		GENTICS = window.GENTICS,
		Aloha = window.Aloha,
		Class = window.Class,
		console = window.console||false;


	/**
	 * Plugin Registry
	 * @namespace Aloha
	 * @class PluginRegistry
	 * @singleton
	 */
	return new (Class.extend({
		plugins: {},

		/**
		 * Initialize all registered plugins
		 * @return void
		 * @hide
		 */
		init: function(next) {
			// Prepare
			var
				me = this,
				globalSettings = Aloha.settings.plugins||{},
				userPluginIds = Aloha.getLoadedPlugins(),
				i,plugin,pluginId;

			// Global to local settings
			for ( pluginId in globalSettings ) {
				if ( globalSettings.hasOwnProperty(pluginId) ) {
					plugin = this.plugins[pluginId]||false;
					if ( plugin ) {
						plugin.settings = globalSettings[pluginId]||{};
					}
				}
			}

			// Default: All loaded plugins are enabled
			if ( !userPluginIds.length ) {
				for ( pluginId in this.plugins ) {
					if ( this.plugins.hasOwnProperty(pluginId) ) {
						userPluginIds.push(pluginId);
					}
				}
			}
			// Enable Plugins specified by User
			for ( i=0; i < userPluginIds.length; ++i ) {
				pluginId = userPluginIds[i];
				plugin = this.plugins[pluginId]||false;
				if ( plugin ) {
					plugin.settings = plugin.settings || {};
					if ( typeof plugin.settings.enabled === 'undefined' ) {
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
		register: function(plugin) {
			if (!plugin.id) {
				throw new Error('Plugin does not have an id');
			}
			console.log(plugin.id);
			if (this.plugins[plugin.id]) {
				throw new Error('Already registered the plugin "' + plugin.id  + '"!');
			}
			this.plugins[plugin.id] = plugin;
		},

		/**
		 * Pass the given jQuery object, which represents an editable to all plugins, so that they can make the content clean (prepare for saving)
		 * @param obj jQuery object representing an editable
		 * @return void
		 * @hide
		 */
		makeClean: function(obj) {
			var i, plugin;
			// iterate through all registered plugins
			for ( plugin in this.plugins ) {
				if (Aloha.Log.isDebugEnabled()) {
					Aloha.Log.debug(this, 'Passing contents of HTML Element with id { ' + obj.attr('id') +
						' } for cleaning to plugin { ' + plugin + ' }');
				}
				this.plugins[plugin].makeClean(obj);
			}
		},

		/**
		 * Expose a nice name for the PluginRegistry
		 * @hide
		 */
		toString: function() {
			return 'pluginregistry';
		}
	}))();
});