/*!
* This file is part of Aloha Editor Project http://aloha-editor.org
* Copyright � 2010-2011 Gentics Software GmbH, aloha@gentics.com
* Contributors http://aloha-editor.org/contribution.php 
* Licensed unter the terms of http://www.aloha-editor.org/license.html
*//*
* Aloha Editor is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.*
*
* Aloha Editor is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

define(

[
	'aloha/jquery',
	'aloha/pluginmanager',
	'aloha/floatingmenu'
],

function (jQuery, PluginManager, FloatingMenu, undefined) {
	"use strict";

	var
		$ = jQuery,
		GENTICS = window.GENTICS,
		Aloha = window.Aloha,
		console = window.console||false,
		Ext = window.Ext,
		HTMLElement = window.HTMLElement;
	
	//----------------------------------------
	// Private variables
	//----------------------------------------
	
	/**
	 * Hash table that will be populated through the loadPlugins method.
	 * Maps the names of plugins with their urls for easy assess in the getPluginsUrl method
	 */
	var pluginPaths = {};
	
	/**
	 * Base Aloha Object
	 * @namespace Aloha
	 * @class Aloha The Aloha base object, which contains all the core functionality
	 * @singleton
	 */
	jQuery.extend(true, Aloha, {

		/**
		 * The Aloha Editor Version we are using
		 * It should be set by us and updated for the particular branch
		 * @property
		 */
		version: '0.10.0',

		/**
		 * Array of editables that are managed by Aloha
		 * @property
		 * @type Array
		 */
		editables: [],

		/**
		 * The currently active editable is referenced here
		 * @property
		 * @type Aloha.Editable
		 */
		activeEditable: null,

		/**
		 * Flag to mark whether Aloha is ready for use. Will be set at the end of the init() Function.
		 * @property
		 * @type boolean
		 */
		ready: false,

		/**
		 * The aloha dictionaries
		 * @hide
		 */
		dictionaries: {},

		/**
		 * settings object, which will contain all Aloha settings
		 * @cfg {Object} object Aloha's settings
		 */
		settings: {},

		/**
		 * This represents the name of the users OS. Could be:
		 * 'Mac', 'Linux', 'Win', 'Unix', 'Unknown'
		 * @property
		 * @type string
		 */
		OSName: 'Unknown',

		/**
		 * Which stage is the aloha init process at?
		 * @property
		 * @type string
		 */
		stage: 'loadingCore',

		/**
		 * A list of loaded plugin names. Available after the
		 * "loadPlugins" stage.
		 *
		 * @property
		 * @type array
		 * @internal
		 */
		loadedPlugins: [],

		/**
		 * Initialize the initialization process
		 */
		init: function () {

			$(function(){
				// Create Promises
				Aloha.createPromiseEvent('aloha');

				// Ready?
				Aloha.bind('alohacoreloaded',function(){
					// initialize rangy. This is probably necessary here,
					// because due to the current loading mechanism, rangy
					// doesn't initialize itself in all browsers
					if (window.rangy) {
						window.rangy.init();
					}
					// Mousemove Hooks
					setInterval(function(){
						GENTICS.Utils.Position.update();
					},500);
					$('html').mousemove(function (e) {
						GENTICS.Utils.Position.Mouse.x = e.pageX;
						GENTICS.Utils.Position.Mouse.y = e.pageY;
					});
					// Load & Initialise
					Aloha.stage = 'loadPlugins';
					Aloha.loadPlugins(function(){
						Aloha.stage = 'initAloha';
						Aloha.initAloha(function(){
							Aloha.stage = 'initPlugins';
							Aloha.initPlugins(function(){
								Aloha.stage = 'initGui';
								Aloha.initGui(function(){
									Aloha.stage = 'aloha';
									Aloha.trigger('aloha');
								});
							});
						});
					});
				});

				// Check
				if ( $('body').hasClass('alohacoreloaded') ) {
					Aloha.trigger('alohacoreloaded');
				}
			});
		},

		/**
		 * Load Plugins
		 */
		loadPlugins: function (next) {
			// contains an array like [common/format, common/block]
			var configuredPluginsWithBundle = this.getPluginsToBeLoaded();

			if (configuredPluginsWithBundle.length) {
				var paths = {},
				    pluginNames = [],
				    requiredInitializers = [],
				    pathsToPlugins = {};

				// Background: We do not use CommonJS packages for our Plugins
				// as this breaks the loading order when these modules have
				// other dependencies.
				// We "emulate" the commonjs modules with the path mapping.
				/* require(
				 *  { paths: {
				 *      'format': 'plugins/common/format/lib',
				 *      'format/nls': 'plugins/common/format/nls',
				 *      ... for every plugin ...
				 *    }
				 *  },
				 *  ['format/format-plugin', ... for every plugin ...],
				 *  next <-- when everything is loaded, we continue
				 */
				$.each(configuredPluginsWithBundle, function (i, configuredPluginWithBundle) {
					var tmp, bundleName, pluginName, bundlePath = '';

					tmp = configuredPluginWithBundle.split('/');
					bundleName = tmp[0];
					pluginName = tmp[1];

					// TODO assertion if pluginName or bundleName NULL _-> ERROR!!

					if (Aloha.settings.basePath) {
						bundlePath = Aloha.settings.basePath;
					}

					if (Aloha.settings.bundles && Aloha.settings.bundles[bundleName]) {
						bundlePath += Aloha.settings.bundles[bundleName];
					} else {
						bundlePath += '../plugins/' + bundleName;
					}

					pluginNames.push(pluginName);
					paths[pluginName] = bundlePath + '/' + pluginName + '/lib';

					pathsToPlugins[pluginName] = bundlePath + '/' + pluginName;

					// As the "nls" path lies NOT inside /lib/, but is a sibling to /lib/, we need
					// to register it explicitely. The same goes for the "css" folder.
					$.each(['nls', 'css', 'vendor', 'res'], function() {
						paths[pluginName + '/' + this] = bundlePath + '/' + pluginName + '/' + this;
					});

					requiredInitializers.push(pluginName + '/' + pluginName + '-plugin');
				});

				this.loadedPlugins = pluginNames;

				// Main Require.js loading call, which fetches all the plugins.
				require(
					{
						paths: paths
					},
					requiredInitializers,
					next
				);

				pluginPaths = pathsToPlugins;
			} else {
				next();
			}
		},

		/**
		 * Fetches plugins the user wants to have loaded. Returns all plugins the user
		 * has specified with the data-plugins property as array, with the bundle
		 * name in front.
		 *
		 * @return array
		 * @internal
		 */
		getPluginsToBeLoaded: function(){
			// Prepare
			var
				$alohaScriptInclude = $('#aloha-script-include'),
				plugins = $.trim($alohaScriptInclude.data('plugins'));

			// Determine Plugins
			if ( typeof plugins === 'string' && plugins !== "") {
				return plugins.replace(/\s+/g, '').split(',');
			}

			// Return
			return [];
		},

		/**
		 * Returns list of loaded plugins (without Bundle name)
		 *
		 * @return array
		 */
		getLoadedPlugins: function() {
			return this.loadedPlugins;
		},

		/**
		 * Returns true if a certain plugin is loaded, false otherwise.
		 */
		isPluginLoaded: function(pluginName) {
			var found = false;
			$.each(this.loadedPlugins, function() {
				if (pluginName.toString() === this.toString()) {
					found = true;
				}
			});
			return found;
		},

		/**
		 * Initialise Aloha
		 */
		initAloha: function(next){
			// check browser version on init
			// this has to be revamped, as
			if (jQuery.browser.webkit && parseFloat(jQuery.browser.version) < 532.5 || // Chrome/Safari 4
				jQuery.browser.mozilla && parseFloat(jQuery.browser.version) < 1.9 || // FF 3.5
				jQuery.browser.msie && jQuery.browser.version < 7 || // IE 7
				jQuery.browser.opera && jQuery.browser.version < 11 ) { // right now, Opera needs some work
				if (console && console.log) {
					console.log('The browser you are using is not supported.');
				}
				return;
			}

			// register the body click event to blur editables
			jQuery('html').mousedown(function(e) {
				// if an Ext JS modal is visible, we don't want to loose the focus on
				// the editable as we assume that the user must have clicked somewhere
				// in the modal... where else could he click?
				// loosing the editable focus in this case hinders correct table
				// column/row deletion, as the table module will clean it's selection
				// as soon as the editable is deactivated. Fusubscriberthermore you'd have to
				// refocus the editable again, which is just strange UX
				if (Aloha.activeEditable && !Aloha.isMessageVisible() && !Aloha.eventHandled) {
					Aloha.activeEditable.blur();
					FloatingMenu.setScope('Aloha.empty');
					Aloha.activeEditable = null;
				}
			}).mouseup(function(e) {
				Aloha.eventHandled = false;
			});
			// Initialise the base path to the aloha files
			Aloha.settings.base =
				Aloha.settings.base || window.Aloha_base || Aloha.getAlohaUrl();

			// initialize the Log
			Aloha.Log.init();

			// initialize the error handler for general javascript errors
			if ( Aloha.settings.errorhandling ) {
				window.onerror = function (msg, url, linenumber) {
					Aloha.Log.error(Aloha, 'Error message: ' + msg + '\nURL: ' + url + '\nLine Number: ' + linenumber);
					// TODO eventually add a message to the message line?
					return true;
				};
			}

			// OS detection
			if (navigator.appVersion.indexOf('Win') != -1) {
				Aloha.OSName = 'Win';
			}
			if (navigator.appVersion.indexOf('Mac') != -1) {
				Aloha.OSName = 'Mac';
			}
			if (navigator.appVersion.indexOf('X11') != -1) {
				Aloha.OSName = 'Unix';
			}
			if (navigator.appVersion.indexOf('Linux') != -1) {
				Aloha.OSName = 'Linux';
			}

			// Forward
			next();
		},

		/**
		 * Loads plugins Aloha
		 * @return void
		 */
		initPlugins: function (next) {
			PluginManager.init(function(){
				next();
			});
		},

		/**
		 * Loads GUI components
		 * @return void
		 */
		initGui: function (next) {
			
			Aloha.RepositoryManager.init();
			FloatingMenu.init();

			// activate registered editables
			for (var i = 0, editablesLength = Aloha.editables.length; i < editablesLength; i++) {
				if ( !Aloha.editables[i].ready ) {
					Aloha.editables[i].init();
				}
			}

			// Forward
			next();
		},

		createPromiseEvent: function(eventName) {
			$('body').createPromiseEvent(eventName);
		},
		unbind: function(eventName,eventHandler) {
			eventName = Aloha.correctEventName(eventName);
			$('body').unbind(eventName);
		},
		bind: function(eventName,eventHandler) {
			eventName = Aloha.correctEventName(eventName);
			Aloha.log('debug', this, 'Binding ['+eventName+'], has ['+(($('body').data('events')||{})[eventName]||[]).length+'] events');
			$('body').bind(eventName,eventHandler);
		},
		trigger: function(eventName,data) {
			eventName = Aloha.correctEventName(eventName);
			Aloha.log('debug', this, 'Trigger ['+eventName+'], has ['+(($('body').data('events')||{})[eventName]||[]).length+'] events');
			$('body').trigger(eventName,data);
		},
		correctEventName: function(eventName) {
			var result = eventName.replace(/\-([a-z])/g,function(a,b){
				return b.toUpperCase();
			});
			return result;
		},

		/**
		 * Activates editable and deactivates all other Editables
		 * @param {Editable} editable the Editable to be activated
		 * @return void
		 */
		activateEditable: function (editable) {

			// blur all editables, which are currently active
			for (var i = 0, editablesLength = Aloha.editables.length; i < editablesLength; i++) {
				if (Aloha.editables[i] != editable && Aloha.editables[i].isActive) {
					Aloha.editables[i].blur();
				}
			}

			Aloha.activeEditable = editable;
		},

		/**
		 * Returns the current Editable
		 * @return {Editable} returns the active Editable
		 */
		getActiveEditable: function() {
			return Aloha.activeEditable;
		},

		/**
		 * deactivated the current Editable
		 * @return void
		 */
		deactivateEditable: function () {

			if ( typeof Aloha.activeEditable === 'undefined' || Aloha.activeEditable === null ) {
				return;
			}

			// blur the editable
			Aloha.activeEditable.blur();

			// set scope for floating menu
			FloatingMenu.setScope('Aloha.empty');

			Aloha.activeEditable = null;
		},

		/**
		 * Gets an editable by an ID or null if no Editable with that ID registered.
		 * @param {string} id the element id to look for.
		 * @return {Aloha.Editable} editable
		 */
		getEditableById: function (id) {

			// if the element is a textarea than route to the editable div
			if (jQuery('#'+id).get(0).nodeName.toLowerCase() === 'textarea' ) {
				id = id + '-aloha';
			}

			// serach all editables for id
			for (var i = 0, editablesLength = Aloha.editables.length; i < editablesLength; i++) {
				if (Aloha.editables[i].getId() == id) {
					return Aloha.editables[i];
				}
			}

			return null;
		},

		/**
		 * Checks wheater an object is a registered Aloha Editable.
		 * @param {jQuery} obj the jQuery object to be checked.
		 * @return {boolean}
		 */
		isEditable: function (obj) {
			for (var i=0, editablesLength = Aloha.editables.length; i < editablesLength; i++) {
				if ( Aloha.editables[i].originalObj.get(0) === obj ) {
					return true;
				}
			}
			return false;
		},

		/**
		 * Logs a message to the console
		 * @param level Level of the log ("error", "warn" or "info", "debug")
		 * @param component Component that calls the log
		 * @param message log message
		 * @return void
		 * @hide
		 */
		log: function(level, component, message) {
			if (typeof Aloha.Log !== "undefined")
				Aloha.Log.log(level, component, message);
		},

		/**
		 * build a string representation of a jQuery or DOM object
		 * @param object to be identified
		 * @return string representation of the object
		 * @hide
		 */
		identStr: function (object) {
			if (object instanceof jQuery) {
				object = object[0];
			}
			if (!(object instanceof HTMLElement)) {
				Aloha.Log.warn(this, '{' + object.toString() + '} provided is not an HTML element');
				return object.toString();
			}

			var out = object.tagName.toLowerCase();

			// an id should be unique, so we're okay with that
			if (object.id) {
				return out + '#' + object.id;
			}

			// as there was no id, we fall back to the objects class
			if (object.className) {
				return out + '.' + object.className;
			}

			// could not identify object by id or class name - so just return the tag name
			return out;
		},


		/**
		 * Check is language is among available languages
		 * @method
		 * @param {String} language language to be set
		 * @param {Array} availableLanguages list of available languages
		 * @return the actual language as a string
		 */
		getLanguage: function(language, availableLanguages) {

			if (!availableLanguages instanceof Array) {
				Aloha.Log.error(this, 'Available languages must be an Array');
				return null;
			}

			if (typeof language === 'undefined' || !language) {
				return availableLanguages[0];
			}

			for (var i = 0, languagesLength = availableLanguages.length; i < languagesLength; ++i) {
				if (language == availableLanguages[i]) {
					return language;
				}
			}

			return availableLanguages[0];
		},

		/**
		 * Register the given editable
		 * @param editable editable to register
		 * @return void
		 * @hide
		 */
		registerEditable: function (editable) {
			Aloha.editables.push(editable);
		},

		/**
		 * Unregister the given editable. It will be deactivated and removed from editables.
		 * @param editable editable to unregister
		 * @return void
		 * @hide
		 */
		unregisterEditable: function (editable) {

			// Find the index
			var id = Aloha.editables.indexOf( editable );
			// Remove it if really found!
			if (id != -1) {
				Aloha.editables.splice(id, 1);
			}
		},

		/**
		 * Displays a message according to it's type
		 * @method
		 * @param {Aloha.Message} message the Aloha.Message object to be displayed
		 */
		showMessage: function (message) {

			if (FloatingMenu.obj) {
				FloatingMenu.obj.css('z-index', 8900);
			}

			switch (message.type) {
				case Aloha.Message.Type.ALERT:
					Ext.MessageBox.alert(message.title, message.text, message.callback);
					break;
				case Aloha.Message.Type.CONFIRM:
					Ext.MessageBox.confirm(message.title, message.text, message.callback);
					break;
				case Aloha.Message.Type.WAIT:
					Ext.MessageBox.wait(message.text, message.title);
					break;
				default:
					Aloha.log('warn', this, 'Unknown message type for message {' + message.toString() + '}');
					break;
			}
		},

		/**
		 * Hides the currently active modal, which was displayed by showMessage()
		 * @method
		 */
		hideMessage: function () {
			Ext.MessageBox.hide();
		},

		/**
		 * checks if a modal dialog is visible right now
		 * @method
		 * @return true if a modal is currently displayed
		 */
		isMessageVisible: function () {
			return Ext.MessageBox.isVisible();
		},

		/**
		 * String representation
		 * @hide
		 */
		toString: function () {
			return 'Aloha';
		},
		getName: function () {
			return 'Aloha';
		},

		/**
		 * Check whether at least one editable was modified
		 * @method
		 * @return {boolean} true when at least one editable was modified, false if not
		 */
		isModified: function () {
			// check if something needs top be saved
			for (var i in Aloha.editables) {
				if (Aloha.editables[i].isModified && Aloha.editables[i].isModified()) {
					return true;
				}
			}

			return false;
		},

		/**
		 * Determines the Aloha Url
		 * @method
		 * @return {String} alohaUrl
		 */
		getAlohaUrl: function(suffix){
			window.Aloha_base = window.Aloha_base || document.getElementById('aloha-script-include').src.replace(/require.js$/,'').replace(/\/+$/,'');
			return window.Aloha_base;
		},

		/**
		 * Gets the Plugin Url
		 * @method
		 * @param {String} name
		 * @return {String} url
		 */
		getPluginUrl: function (name) {
			var url;

			if (name) {
				url = Aloha.getAlohaUrl() + '/' + pluginPaths[name];
			}

			return url;
		},

		i18n: function(component, key, replacements) {
			window.console && window.console.log && console.log("Called deprecated i18n function!!", component, key);
			return key;
		}
	});

	// Initialise Aloha Editor
	Aloha.init();
});
