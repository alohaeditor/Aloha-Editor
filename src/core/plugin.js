/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */
define(
['core/pluginregistry'],
function(PluginRegistry) {
	"use strict";

	var
		jQuery = window.alohaQuery || window.jQuery, $ = jQuery,
		GENTICS = window.GENTICS,
		Aloha = window.Aloha,
		Class = window.Class,
		console = window.console||false;

	/**
	 * Abstract Plugin Object
	 * @namespace Aloha
	 * @class Plugin
	 * @constructor
	 * @param {String} pluginPrefix unique plugin prefix
	 */
	var Plugin = Class.extend({
		id: null,
		prefix: null,

		/**
		 * contains the plugin's settings object
		 * @cfg {Object} settings the plugins settings stored in an object
		 */
		settings: {},
		
		/**
		 * Names of other plugins which must be loaded in order for this plugin to
		 * function.
		 * @cfg {Array}
		 */
		dependencies: [],

		_constructor: function(pluginPrefix) {
			/**
			 * Settings of the plugin
			 */
			if (typeof pluginPrefix !== "string") {
				if ( console && console.error ) {
					console.error('Cannot initialise unnamed plugin, skipping');
				}
			} else {
				this.id = this.prefix = pluginPrefix;
			}
		},

		/**
		 * @return true if dependencies satisfied, false otherwise
		 */
		checkDependencies: function() {
			var dependenciesSatisfied = true, that = this;
			$.each(this.dependencies, function() {
				if (!Aloha.isPluginLoaded(this)) {
					dependenciesSatisfied = false;
					Aloha.Log.error('plugin.' + that.id, 'Required plugin "' + this + '" not found.');
				}
			});
			return dependenciesSatisfied;
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
		getName: function() {
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
	
	/**
	 * Static method used as factory to create plugins.
	 * 
	 * @param {String} pluginName name of the plugin
	 * @param {Object} definition definition of the plugin, should have at least an "init" and "destroy" method.
	 */
	Plugin.create = function(pluginName, definition) {
		var pluginInstance = new (Plugin.extend(definition))(pluginName);
		PluginRegistry.register(pluginInstance);

		return pluginInstance;
	};

	return Plugin;
});
