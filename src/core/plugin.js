/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */
(function(window, undefined) {
	"use strict";

	var
		jQuery = window.alohaQuery, $ = jQuery,
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
	Aloha.PluginRegistry = Class.extend({
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
				userPluginIds = Aloha.getUserPlugins(),
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
				}
			}
			
			// Load locales for plugins
			this.loadI18n(function(){
				// Initialise plugins
				me.eachEnabledPluginSync(
					// Each
					function(plugin){
						if ( console && console.log ) { console.log('init plugin '+plugin.id); }
						plugin.init();
					},
					// All
					function(){
						// Forward
						next();
					}
				);
			});
		},

		/**
		 * Cycle through all the enabled plugins
		 */
		eachEnabledPluginSync: function(callback,next){
			this.eachPluginSync(
				// Each
				function(plugin){
					if ( plugin.settings.enabled ) {
						callback(plugin);
					}
				},
				// All
				function(){
					// Forward
					next();
				}
			);
		},

		/**
		 * Cycle through all the loaded plugins
		 */
		eachPluginSync: function(callback,next){
			var id, plugin;
			for ( id in this.plugins ) {
				if ( this.plugins.hasOwnProperty(id) ) {
					plugin = this.plugins[id];
					callback(plugin);
				}
			}
			next();
		},

		/**
		 * Load the i18n files for all plugins
		 */
		loadI18n: function(next) {
			// Prepare
			var
				// Async
				completed = 0,
				total = 0,
				exited = false,
				complete = function(){
					if ( exited ) {
						throw new Error('Something went wrong');
					}
					else {
						completed++;
						if ( completed === total ) {
							exited = true;
							next();
						}
					}
				};
			
			// Cycle
			this.eachEnabledPluginSync(
				// Each
				function(plugin){
					// Ammend total
					++total;
					
					// Determine plugin language
					plugin.language = plugin.languages ? Aloha.getLanguage(Aloha.settings.i18n.current, plugin.languages) : null;
					if ( !plugin.language ) {
						// Error
						Aloha.Log.warn(this, 'Could not determine actual language, no languages available for plugin ' + plugin);
						complete();
					}
					else {
						// Success
						plugin.languageUrl = Aloha.settings.base + '/' + Aloha.settings.pluginDir + '/' + plugin.basePath + '/i18n/' + plugin.language + '.json';
						Aloha.loadI18nFile(plugin.languageUrl,plugin,complete);
					}
				},
				// All
				function(){
					// Forward if we have nothing async to do
					if (total === 0) {
						next();
					}
				}
			);
		},

		/**
		 * Register a plugin
		 * @param {Plugin} plugin plugin to register
		 */
		register: function(plugin) {
			if (plugin instanceof Aloha.Plugin) {
				if ( (plugin.id||false) === false ) {
					throw new Error('Plugin does not have an id');
				}
				if ( typeof this.plugins[plugin.id] !== 'undefined' ) {
					throw new Error('Already registered this plugin!');
				}
				this.plugins[plugin.id] = plugin;
			}
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
			for ( i = 0; i < this.plugins.length; i++) {
				plugin = this.plugins[i];
				if (Aloha.Log.isDebugEnabled()) {
					Aloha.Log.debug(this, 'Passing contents of HTML Element with id { ' + obj.attr('id') + ' } for cleaning to plugin { ' + plugin.prefix + ' }');
				}
				plugin.makeClean(obj);
			}
		},

		/**
		 * Expose a nice name for the PluginRegistry
		 * @hide
		 */
		toString: function() {
			return 'pluginregistry';
		}
	});

	/**
	 * Create the PluginRegistry object
	 * @hide
	 */
	Aloha.PluginRegistry = new Aloha.PluginRegistry();


	/**
	 * Abstract Plugin Object
	 * @namespace Aloha
	 * @class Plugin
	 * @constructor
	 * @param {String} pluginPrefix unique plugin prefix
	 * @param {String} basePath (optional) basepath of the plugin (relative to 'plugins' folder). If not given, the basePath pluginPrefix is taken
	 */
	Aloha.Plugin = Class.extend({
		id: null,
		prefix: null,
		basePath: null,

		/**
		 * contains the plugin's settings object
		 * @cfg {Object} settings the plugins settings stored in an object
		 */
		settings: null,

		_constructor: function(pluginPrefix, basePath) {
			/**
			 * Settings of the plugin
			 */
			if (typeof pluginPrefix !== "string") {
				Aloha.Log.warn(this, 'Cannot initialise unnamed plugin, skipping');
			} else {
				this.id = this.prefix = pluginPrefix;
				this.basePath = basePath ? basePath : pluginPrefix;
				Aloha.PluginRegistry.register(this);
			}
		},

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
		 *		editables : {
		 *			'#title'	: [ ],
		 *			'div'		: [ 'b', 'i' ],
		 *			'.article'	: [ 'h1' ]
		 *		}
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
		 *	"image": {
		 *		config : { 'img': { 'max_width': '50px',
		 *		'max_height': '50px' }},
		 *		editables : {
		 *			'#title': {},
		 *			'div': {'img': {}},
		 *			'.article': {'img': { 'max_width': '150px',
		 *			'max_height': '150px' }}
		 *		}
		 *	}
		 * </pre>
		 *  The '#title' object would return an empty configuration.<br/>
		 *  The 'div' object would return the default configuration.<br/>
		 *  the '.article' would return :
		 *  <pre>
		 *		{'img': { 'max_width': '150px',
		 *		'max_height': '150px' }}
		 *  </pre>
		 * </li>
		 *
		 * @param {jQuery} obj jQuery object of an Editable Object
		 * @return {Array} config A Array with configuration entries
		 */
		getEditableConfig: function (obj) {
			var configObj = null,
				configSpecified = false,
				that = this;

			if ( this.settings.editables ) {
				// check if the editable's selector matches and if so add its configuration to object configuration
				jQuery.each( this.settings.editables, function (selector, selectorConfig) {
					if ( obj.is(selector) ) {
						configSpecified = true;
						if (selectorConfig instanceof Array) {
							configObj = [];
							configObj = jQuery.merge(configObj, selectorConfig);
						} else {
							configObj = {};
							for (var k in selectorConfig) {
								if ( selectorConfig.hasOwnProperty(k) ) {
									configObj[k] = {};
									configObj[k] = jQuery.extend(true, configObj[k], that.config[k], selectorConfig[k]);
								}
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
			return Aloha.i18n(this, key, replacements);
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
			Aloha.Log.log(level, this, message);
		}
	});
})(window);
