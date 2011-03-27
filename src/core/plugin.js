/*!
*   This file is part of Aloha Editor
*   Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
*   Licensed unter the terms of http://www.aloha-editor.com/license.html
*//*
*	Aloha Editor is free software: you can redistribute it and/or modify
*   it under the terms of the GNU Affero General Public License as published by
*   the Free Software Foundation, either version 3 of the License, or
*   (at your option) any later version.*
*
*   Aloha Editor is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   GNU Affero General Public License for more details.
*
*   You should have received a copy of the GNU Affero General Public License
*   along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
(function(window, undefined) {
	var
		$ = jQuery = window.alohaQuery,
		GENTICS = window.GENTICS,
		Aloha = GENTICS.Aloha;

/**
 * Plugin Registry
 * @namespace GENTICS.Aloha
 * @class PluginRegistry
 * @singleton
 */
GENTICS.Aloha.PluginRegistry = function() {
	this.plugins = [];
};

GENTICS.Aloha.PluginRegistry.prototype = {
	/**
	 * Register a plugin
	 * @param {Plugin} plugin plugin to register
	 */
	register: function(plugin) {
		if (plugin instanceof GENTICS.Aloha.Plugin) {
			// TODO check for duplicate plugin prefixes
			this.plugins.push(plugin);
		}
	},

	/**
	 * Initialize all registered plugins
	 * @return void
	 * @hide
	 */
	init: function() {
		var loaded = 0,
			length = this.plugins.length
			pluginsStack = [];

		// Initialize the plugins in the right order when they are loaded
		GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'i18nPluginsLoaded', function () {
			for ( var i = 0; i < length; i++) {
				if (pluginsStack[i].settings.enabled == true) {
					pluginsStack[i].init();
				}
			}

			GENTICS.Aloha.EventRegistry.trigger(
				new GENTICS.Aloha.Event('i18nPluginsReady', GENTICS.Aloha, null)
			);
		});

		// iterate through all registered plugins
		for ( var i = 0; i < length; i++) {
			var plugin = this.plugins[i];

			// get the plugin settings
			if (typeof GENTICS.Aloha.settings.plugins === 'undefined') {
				GENTICS.Aloha.settings.plugins = {};
			}

			plugin.settings = GENTICS.Aloha.settings.plugins[plugin.prefix];

			if (typeof plugin.settings === 'undefined') {
				plugin.settings = {};
			}

			if (typeof plugin.settings.enabled === 'undefined') {
				plugin.settings.enabled = true;
			}

			// Push the plugin in the right order into the plugins stack
			pluginsStack.push(plugin);

			// initialize i18n for the plugin
			// determine the actual language
			var actualLanguage = plugin.languages ? GENTICS.Aloha.getLanguage(GENTICS.Aloha.settings.i18n.current, plugin.languages) : null;

			if (!actualLanguage) {
				// The plugin that have no dict file matching
				GENTICS.Aloha.Log.warn(this, 'Could not determine actual language, no languages available for plugin ' + plugin);

				if(++loaded === length) {
					GENTICS.Aloha.EventRegistry.trigger(
						new GENTICS.Aloha.Event('i18nPluginsLoaded', GENTICS.Aloha, null)
					);
				}
			} else {
				// load the dictionary file for the actual language
				var fileUrl = GENTICS.Aloha.settings.base + '/' + GENTICS.Aloha.settings.pluginDir + '/' + plugin.basePath + '/i18n/' + actualLanguage + '.json';

				// Initializes the plugin when
				GENTICS.Aloha.loadI18nFile(fileUrl, plugin, function () {
					if(++loaded === length) {
						GENTICS.Aloha.EventRegistry.trigger(
							new GENTICS.Aloha.Event('i18nPluginsLoaded', GENTICS.Aloha, null)
						);
					}
				});
			}
		}
	},

	/**
	 * Pass the given jQuery object, which represents an editable to all plugins, so that they can make the content clean (prepare for saving)
	 * @param obj jQuery object representing an editable
	 * @return void
	 * @hide
	 */
	makeClean: function(obj) {
		// iterate through all registered plugins
		for ( var i = 0; i < this.plugins.length; i++) {
			var plugin = this.plugins[i];
			if (GENTICS.Aloha.Log.isDebugEnabled()) {
				GENTICS.Aloha.Log.debug(this, 'Passing contents of HTML Element with id { ' + obj.attr('id') + ' } for cleaning to plugin { ' + plugin.prefix + ' }');
			}
			plugin.makeClean(obj);
		}
	}
}

/**
 * Create the PluginRegistry object
 * @hide
 */
GENTICS.Aloha.PluginRegistry = new GENTICS.Aloha.PluginRegistry();

/**
 * Expose a nice name for the PluginRegistry
 * @hide
 */
GENTICS.Aloha.PluginRegistry.toString = function() {
	return 'pluginregistry';
};

/**
 * Abstract Plugin Object
 * @namespace GENTICS.Aloha
 * @class Plugin
 * @constructor
 * @param {String} pluginPrefix unique plugin prefix
 * @param {String} basePath (optional) basepath of the plugin (relative to 'plugins' folder). If not given, the basePath pluginPrefix is taken
 */
GENTICS.Aloha.Plugin = function(pluginPrefix, basePath) {
	/**
	 * Settings of the plugin
	 */
	this.prefix = pluginPrefix;
	this.basePath = basePath ? basePath : pluginPrefix;
	GENTICS.Aloha.PluginRegistry.register(this);
};

GENTICS.Aloha.Plugin.prototype = {
	/**
	 * contains the plugin's settings object
	 * @cfg {Object} settings the plugins settings stored in an object
	 */
	settings: null,

	/**
	 * Init method of the plugin. Called from Aloha Core to initialize this plugin
	 * @return void
	 * @hide
	 */
	init: function() {},

	/**
	 * Get the configuration settings for an editable obj.
	 * Handles both conf arrays or conf objects
	 * <ul>
	 * <li>Array configuration parameters are:
	 * <pre>
	 * "list": {
	 *		config : [ 'b', 'h1' ],
	 * 		editables : {
	 *			'#title'	: [ ],
	 *			'div'		: [ 'b', 'i' ],
	 *			'.article'	: [ 'h1' ]
	 *	  	}
	 *	}
	 * </pre>
	 *
	 * The hash keys of the editables are css selectors. For a
	 *
	 * <pre>
	 *  <div class="article">content</div>
	 * </pre>
	 *
	 *  the selectors 'div' and '.article' match and the returned configuration is
	 *
	 * <pre>
	 *  [ 'b', 'i', 'h1']
	 * </pre>
	 *
	 * The '#title' object would return an empty configuration.
	 *
	 * <pre>
	 *  [ ]
	 * </pre>
	 *
	 *  All other objects would get the 'config' configuration. If config is not set
	 * the plugin default configuration is returned.
	 *
	 * <pre>
	 *  [ 'b', 'h1']
	 * </pre></li>
	 * <li>Object configuration parameters are :
	 * <pre>
	 * "image": {
	 * 	    config : { 'img': { 'max_width': '50px',
	 * 					'max_height': '50px' }},
	 * 		editables : {
	 * 		    '#title'	: {},
	 *          'div'		: {'img': {}},
	 *          '.article'	: {'img': { 'max_width': '150px',
	 *          				'max_height': '150px' }}
	 *          }
	 *      }
	 * </pre>
	 *  The '#title' object would return an empty configuration.<br/>
	 *  The 'div' object would return the default configuration.<br/>
	 *  the '.article' would return :
	 *  <pre>
	 *           {'img': { 'max_width': '150px',
	 *          		'max_height': '150px' }}
	 *  </pre>
	 * </li>
	 *
	 * @param {jQuery} obj jQuery object of an Editable Object
	 * @return {Array} config A Array with configuration entries
	 */
	getEditableConfig: function (obj) {
		var configObj = null,
			configSpecified = false;

		if ( this.settings.editables ) {
			var that = this;
			// check if the editable's selector matches and if so add its configuration to object configuration
			jQuery.each( this.settings.editables, function (selector, selectorConfig) {
				if ( obj.is(selector) ) {
					configSpecified = true;
					if (selectorConfig.constructor == (new Array).constructor) {
						configObj = [];
						configObj = jQuery.merge(configObj, selectorConfig);
					} else {
						configObj = {};
						for (var k in selectorConfig) {
							configObj[k] = {};
							configObj[k] = jQuery.extend(true, configObj[k], that.config[k], selectorConfig[k]);
						}

					}
				}
			});
		}

		// fall back to default configuration
		if ( !configSpecified ) {
			if ( typeof this.settings.config === 'undefined' || !this.settings.config ) {
				configObj = this.config;
			} else {
				configObj = this.settings.config;
			}
		}

		return configObj;
	},

	/**
	 * Make the given jQuery object (representing an editable) clean for saving
	 * @param obj jQuery object to make clean
	 * @return void
	 * @hide
	 */
	makeClean: function (obj) {},

	/**
	 * Make a system-wide unique id out of a plugin-wide unique id by prefixing it with the plugin prefix
	 * @param id plugin-wide unique id
	 * @return system-wide unique id
	 * @hide
	 */
	getUID: function(id) {
		return this.prefix + '.' + id;
	},

	/**
	 * Localize the given key for the plugin.
	 * @param key key to be localized
	 * @param replacements array of replacement strings
	 * @return localized string
	 * @hide
	 */
	i18n: function(key, replacements) {
		return GENTICS.Aloha.i18n(this, key, replacements);
	},

	/**
	 * Return string representation of the plugin, which is the prefix
	 * @return prefix
	 * @hide
	 */
	toString: function() {
		return this.prefix;
	},

	/**
	 * Log a plugin message to the logger
	 * @param level log level
	 * @param message log message
	 * @return void
	 * @hide
	 */
	log: function (level, message) {
		GENTICS.Aloha.Log.log(level, this, message);
	}
};

})(window);
