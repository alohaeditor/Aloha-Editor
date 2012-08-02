/* core.js is part of Aloha Editor project http://aloha-editor.org
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
define(

[
	'jquery',
	'aloha/pluginmanager'
],

function ( jQuery, PluginManager ) {
	"use strict";

	//----------------------------------------
	// Private variables
	//----------------------------------------

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
		version: '${version}',

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
		 * settings object, which will contain all Aloha settings
		 * @cfg {Object} object Aloha's settings
		 */
		settings: {},
		
		/**
		 * defaults object, which will contain all Aloha defaults
		 * @cfg {Object} object Aloha's settings
		 */
		defaults: {},
		
		/**
		 * Namespace for ui components
		 */
		ui: {},
		
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
        stage: 'loadingAloha',

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
		 * Maps names of plugins (link) to the base URL (../plugins/common/link).
		 */
		_pluginBaseUrlByName: {},

		/**
		 * Initialize the initialization process
		 */
		init: function () {
			// Load & Initialise
			Aloha.stage = 'initAloha';
			Aloha.initAloha(function(){
				Aloha.stage = 'initPlugins';
				Aloha.initPlugins(function(){
					Aloha.stage = 'initGui';
					Aloha.initGui(function(){
						Aloha.stage = 'alohaReady';
						Aloha.trigger('aloha-ready');
					});
				});
			});
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
			jQuery.each(this.loadedPlugins, function() {
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
			var $html = jQuery('html');
			
			// check browser version on init
			// this has to be revamped, as
			if (jQuery.browser.webkit && parseFloat(jQuery.browser.version) < 532.5 || // Chrome/Safari 4
				jQuery.browser.mozilla && parseFloat(jQuery.browser.version) < 1.9 || // FF 3.5
				jQuery.browser.msie && jQuery.browser.version < 7 || // IE 7
				jQuery.browser.opera && jQuery.browser.version < 11 ) { // right now, Opera needs some work
				if (window.console && window.console.log) {
					window.console.log( 'Your browser is not supported.' );
				}
			}

			// register the body click event to blur editables
			jQuery('html').mousedown(function(e) {
				// This is a hack to prevent a click into a modal dialog from blurring the editable.
				if (Aloha.activeEditable && !jQuery(".aloha-dialog").is(':visible') && !Aloha.eventHandled) {
					Aloha.activeEditable.blur();
					Aloha.activeEditable = null;
				}
			}).mouseup(function(e) {
				Aloha.eventHandled = false;
			});
			
			
			// add class to body to denote browser
			if (jQuery.browser.webkit) {
			    $html.addClass('aloha-webkit');
			} else if (jQuery.browser.opera) {
			    $html.addClass('aloha-opera');
			} else if (jQuery.browser.msie) {
			    $html.addClass('aloha-ie' + parseInt(jQuery.browser.version, 10));
			} else if (jQuery.browser.mozilla) {
			    $html.addClass('aloha-mozilla');
			}
			
			// Initialise the base path to the aloha files
			Aloha.settings.base = Aloha.getAlohaUrl();

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

			try {
				// this will disable browsers image resizing facilities
				// disable resize handles
				var supported;
				try {
					supported = document.queryCommandSupported( 'enableObjectResizing' );
				} catch ( e ) {
					supported = false;
					Aloha.Log.log( 'enableObjectResizing is not supported.' );
				}
				
				if ( supported ) {
					document.execCommand( 'enableObjectResizing', false, false);
					Aloha.Log.log( 'enableObjectResizing disabled.' );
				}
			} catch (e) {
				Aloha.Log.error( e, 'Could not disable enableObjectResizing' );
				// this is just for others, who will not support disabling enableObjectResizing
			}
			// Forward
			next();
		},

		/**
		 * Loads plugins Aloha
		 * @return void
		 */
		initPlugins: function (next) {
			PluginManager.init(next, this.getLoadedPlugins());
		},

		/**
		 * Loads GUI components
		 * @return void
		 */
		initGui: function (next) {
			
			Aloha.RepositoryManager.init();

			// activate registered editables
			for (var i = 0, editablesLength = Aloha.editables.length; i < editablesLength; i++) {
				if ( !Aloha.editables[i].ready ) {
					Aloha.editables[i].init();
				}
			}

			// Forward
			next();
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
			var id = jQuery.inArray(editable, Aloha.editables);
			if (id != -1) {
				Aloha.editables.splice(id, 1);
			}
		},

		/**
		 * String representation
		 * @hide
		 */
		toString: function () {
			return 'Aloha';
		},

		/**
		 * Check whether at least one editable was modified
		 * @method
		 * @return {boolean} true when at least one editable was modified, false if not
		 */
		isModified: function () {
			// check if something needs top be saved
			for (var i = 0; i < Aloha.editables.length; i++) {
				if (Aloha.editables[i].isModified && Aloha.editables[i].isModified()) {
					return true;
				}
			}

			return false;
		},

		/**
		 * Determines the Aloha Url
		 * Uses Aloha.settings.baseUrl if set.
		 * @method
		 * @return {String} alohaUrl
		 */
		getAlohaUrl: function( suffix ) {
			return Aloha.settings.baseUrl;
		},

		/**
		 * Gets the plugin's url.
		 *
		 * @method
		 * @param {string} name The name with which the plugin was registered
		 *                      with.
		 * @return {string} The fully qualified url of this plugin.
		 */
		getPluginUrl: function (name) {
			var url;

			if (name) {
				url = Aloha.settings._pluginBaseUrlByName[name];
				if(url) {
					//Check if url is absolute and attach base url if it is not
					if(!url.match("^(\/|http[s]?:).*")) {
						url = Aloha.getAlohaUrl() + '/' + url;
					}
				}
			}
			return url;
		}

	});

	return Aloha;
});
