/* plugin.js is part of Aloha Editor project http://aloha-editor.org
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
	'jquery',
	'util/class',
	'aloha/pluginmanager',
	'aloha/console'
], function (
	Aloha,
	/** @type {JQueryStatic} */
	jQuery,
	Class,
	PluginManager,
	console
) {
	"use strict";

	/**
	 * Gets the original object from the editable. If the editable is an input or textarea,
	 * aloha creates a editable div, but sometimes we need the original object and not the div
	 * created by aloha.
	 * @param {jQuery} editableElement
	 * @returns {jQuery}
	 */
	function getEditableOriginalObj(editableElement) {
		var editable = Aloha.getEditableById(editableElement.attr('id'));

		return editable ? editable.originalObj : editableElement;
	}

	/**
	 * Abstract Plugin Object
	 * @namespace Aloha
	 * @class Plugin
	 * @constructor
	 * @param {String} pluginPrefix unique plugin prefix
	 */
	var Plugin = Class.extend({

		name: null,

		/**
		 * contains the plugin's default settings object
		 * @cfg {Object} default settings for the plugin
		 */
		defaults: {},

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

		_constructor: function (name) {
			/**
			 * Settings of the plugin
			 */
			if (typeof name !== "string") {
				console.error('Cannot initialise unnamed plugin, skipping');
			} else {
				this.name = name;
			}
		},

		/**
		 * @return true if dependencies satisfied, false otherwise
		 */
		checkDependencies: function () {
			var plugin = this;
			var satisfied = true;
			jQuery.each(plugin.dependencies, function (i, dependency) {
				if (!Aloha.isPluginLoaded(dependency.toString())) {
					satisfied = false;
					console.error('plugin.' + plugin.name,
							'Required plugin "' + dependency + '" not found.');
					return false;
				}
			});
			return satisfied;
		},

		/**
		 * Init method of the plugin. Called from Aloha Core to initialize this plugin
		 * @return void
		 * @hide
		 */
		init: function () {},

		/**
		 * A map of custom contenthandler mapping a selector to a 
		 * set of handler functions. For an working example see the list plugin.
		 * 
		 * @return {Object.<string, Array.<function>>} the content handler
		 */
		getPluginContentHandler: function () {},

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
		 * @param {JQuery} obj jQuery object of an Editable Object
		 * @return {Array} config A Array with configuration entries
		 */
		getEditableConfig: function (obj) {
			var configObj = null,
				configSpecified = false,
				that = this;

			var pluginSettings = getPluginSettings(this);

			if (pluginSettings.editables && obj != null && typeof obj.attr === 'function') {
				// When editable is an input or textarea we need the original object.
				obj = getEditableOriginalObj(obj);

				// when obj does not exist in the DOM anymore, fetch from DOM again 
				// so that nested selectors with parent elements will match against obj as well
				if (
					!document.body.contains(obj[0])
					&& obj[0] != null
					&& obj[0].id != null
					&& obj[0].id
				) {
					obj = jQuery('#' + obj[0].id);
				}

				// check if the editable's selector matches and if so add its configuration to object configuration
				jQuery.each(pluginSettings.editables, function (selector, selectorConfig) {
					if (!obj.is(selector)) {
						return;
					}
					configSpecified = true;

					if (Array.isArray(selectorConfig)) {
						configObj = selectorConfig.slice(0);
						return;
					} else if (typeof selectorConfig !== "object") {
						configObj = selectorConfig;
						return;
					}

					configObj = {};
					// Not used anywhere in the project - Why does this exist?
					configObj['aloha-editable-selector'] = selector;

					Object.entries(selectorConfig || {}).forEach(function(entry) {
						if (Array.isArray(entry[1])) {
							configObj[entry[0]] = entry[1];
						} else if (typeof entry[1] === "object") {
							configObj[entry[0]] = jQuery.extend(true, {}, that.config[entry[0]], entry[1]);
						} else {
							configObj[entry[0]] = entry[1];
						}
					});
				});
			}

			// fall back to default configuration
			if (!configSpecified) {
				if (typeof pluginSettings.config === 'undefined' || !pluginSettings.config) {
					configObj = this.config;
				} else {
					configObj = pluginSettings.config;
				}
			}

			return configObj;
		},

		/**
		 * Make the given jQuery object (representing an editable) clean for saving
		 * @param obj jQuery object to make clean
		 * @return void
		 */
		makeClean: function (obj) {},

		/**
		 * Make a system-wide unique id out of a plugin-wide unique id by prefixing it with the plugin prefix
		 * @param id plugin-wide unique id
		 * @return system-wide unique id
		 * @hide
		 * @deprecated
		 */
		getUID: function (id) {
			console.deprecated('plugin', 'getUID() is deprecated. Use plugin.name instead.');
			return this.name;
		},

		/**
		 * Return string representation of the plugin, which is the prefix
		 * @return name
		 * @hide
		 * @deprecated
		 */
		toString: function () {
			return this.name;
		},

		/**
		 * Log a plugin message to the logger
		 * @param level log level
		 * @param message log message
		 * @return void
		 * @hide
		 * @deprecated
		 */
		log: function (level, message) {
			console.deprecated('plugin', 'log() is deprecated. Use Aloha.console instead.');
			console.log(level, this, message);
		}
	});

	function getPluginSettings(instance) {
		var globalSettings = {};
		if (Aloha.settings != null && Aloha.settings.plugins != null) {
			globalSettings = Aloha.settings.plugins[instance.name] || {};
		}
		var merged = jQuery.extendObjects(true, {}, instance.defaults, globalSettings);
		return merged;
	}

	/**
	 * Static method used as factory to create plugins.
	 * 
	 * @param {String} pluginName name of the plugin
	 * @param {Object} definition definition of the plugin, should have at least an "init" and "destroy" method.
	 */
	Plugin.create = function (pluginName, definition) {

		var pluginInstance = new (Plugin.extend(definition))(pluginName);
		pluginInstance.settings = getPluginSettings(pluginInstance);
		PluginManager.register(pluginInstance);

		return pluginInstance;
	};

	return Plugin;
});
