/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */
(function(window, undefined) {
	var
		jQuery = window.alohaQuery, $ = jQuery,
		GENTICS = window.GENTICS,
		Aloha = window.Aloha;
	/**
	 * Plugin Registry
	 * @namespace Aloha
	 * @class PluginRegistry
	 * @singleton
	 */
	Aloha.PluginRegistry = Class.extend({
		/**
		 * Initialize all registered plugins
		 * @return void
		 * @hide
		 */
		init: function() {
			//debugger;
			var
				me = this,
				loaded = 0,
				length = 0,
				plugins,
				toload,
				pluginsStack = [],
				i18nEvent = function () {
					++loaded;
					if ( loaded === length ) {
						Aloha.trigger('aloha-i18n-plugins-loaded');
					}
				},
				$alohaScriptInclude = $('#aloha-script-include'),
				allload = false;
				
				plugins = $alohaScriptInclude.data('plugins');
				// Determine Plugins
				if ( typeof plugins === 'string' ) {
					plugins = plugins.split(',');
				} else {
					plugins = [];
				}
				
				Aloha.bind('aloha-js-plugins-loaded', function() {
					length = me.plugins.length;
					// iterate through all registered plugins
					for ( var i = 0; i < length; i++) {
						var plugin = me.plugins[i];
						
						// get the plugin settings
						if (typeof Aloha.settings.plugins === 'undefined') {
							Aloha.settings.plugins = {};
						}
						
						plugin.settings = Aloha.settings.plugins[plugin.prefix];
						
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
						var actualLanguage = plugin.languages ? Aloha.getLanguage(Aloha.settings.i18n.current, plugin.languages) : null;
						
						if (!actualLanguage) {
							// The plugin that have no dict file matching
							Aloha.Log.warn(me, 'Could not determine actual language, no languages available for plugin ' + plugin);
							
							++loaded;
							if ( loaded === length ) {
								Aloha.trigger('aloha-i18n-plugins-loaded');
							}
						} else {
							// load the dictionary file for the actual language
							var fileUrl = Aloha.settings.base + '/' + Aloha.settings.pluginDir + '/' + plugin.basePath + '/i18n/' + actualLanguage + '.json';
							
							// Initializes the plugin when
							Aloha.loadI18nFile(fileUrl, plugin, i18nEvent);
						}
					}
					// if no plugins are loaded, we immediately trigger the event 'aloha-i18n-plugins-loaded' (otherwise the floatingmenue would not be initialized, which produces errors afterwards
					if (length == 0) {
						Aloha.trigger('aloha-i18n-plugins-loaded');
					}
				});
			//* Load Plugins
			if ( $alohaScriptInclude ) {
				// Load in Plugins
				$.each(plugins||[],function(i,pluginName){
					// Load Plugin
					try {
//						Aloha.bind("aloha-js-loaded-" + pluginName, function(){
//						});
						Aloha.loadPlugin(pluginName);
					} catch(e) {
						Aloha.Log.error(Aloha, "Error while loading " + pluginName);
						delete plugins[plugins.indexOf(pluginName)];
					}
				});
				window.setInterval(function() { 
					if (allload === false && plugins.length === me.plugins.length) {
						allload = true;
						Aloha.trigger("aloha-js-plugins-loaded");
					}
				}, 1000);
			} else {
				Aloha.trigger("aloha-js-plugins-loaded");
			}
			// Initialize the plugins in the right order when they are loaded
			Aloha.bind('aloha-i18n-plugins-loaded',function(){
				var failures = [];
				//debugger;
				for ( var i = 0; i < length; i++) {
					if (pluginsStack[i].settings.enabled) {
						try {
							pluginsStack[i].init();
						} catch(e) {
							Aloha.Log.error(me, "Init of plugin "+ pluginsStack[i].prefix + " failed : " + e);
							Aloha.Log.error(me,e);
							failures.push(i);
						}
					}
				}
				for ( var i = 0, faillength = failures.length; i < faillength; i++) {
					// removes the load failed plugins from stack to avoid side effect
//					delete pluginsStack[failures[i]];
				}
				//debugger;
				Aloha.trigger('aloha-i18n-plugins-ready');
			});
		},

		plugins: [],

		/**
		 * Register a plugin
		 * @param {Plugin} plugin plugin to register
		 */
		register: function(plugin) {
			if (plugin instanceof Aloha.Plugin) {
				
				// TODO check for duplicate plugin prefixes
				this.plugins.push(plugin);
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
		_constructor: function(pluginPrefix, basePath) {
			/**
			 * Settings of the plugin
			 */
			if (typeof pluginPrefix !== "string") {
				Aloha.Log.warn(this, 'Cannot initialise unnamed plugin, skipping');
			} else {
				this.prefix = pluginPrefix;
				this.basePath = basePath ? basePath : pluginPrefix;
				Aloha.PluginRegistry.register(this);
			}
//			Aloha.trigger("aloha-js-loaded-" + pluginPrefix);
		},

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
				configSpecified = false;

			if ( this.settings.editables ) {
				var that = this;
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
