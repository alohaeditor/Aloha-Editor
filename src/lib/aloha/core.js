/*core.js is part of Aloha Editor project http://aloha-editor.org
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
	'jquery',
	'aloha/pluginmanager'
], function (
	$,
	PluginManager
) {
	'use strict';

	var Aloha = window.Aloha;

	/**
	 * Checks whether the current user agent is supported.
	 *
	 * @return {boolean} True if Aloha supports the current browser.
	 */
	function isBrowserSupported() {
		var browser = Aloha.browser;
		var version = browser.version;
		return !(
			// Chrome 21
			(browser.chrome && parseFloat(version) < 21) ||
			// Safari 4
			(browser.webkit && !browser.chrome && parseFloat(version) < 532.5) ||
			// FF 3.5
			(browser.mozilla && parseFloat(version) < 1.9) ||
			// IE 7
			(browser.msie && version < 7) ||
			// Right now Opera needs some work
			(browser.opera && version < 11)
		);
	}

	/**
	 * Checks whether the given jQuery event originates from an Aloha dialog
	 * element.
	 *
	 * This is used to facilitate a hackish way of preventing blurring
	 * editables when interacting with Aloha UI modals.
	 *
	 * @param {jQuery<Event>} $event
	 * @return {boolean} True if $event is initiated from within an Aloha
	 *                   dialog element.
	 */
	function originatesFromDialog($event) {
		return $($event.target).closest('.aloha-dialog').length > 0;
	}

	/**
	 * Checks whether the given jQuery event originates from a jQuery UI
	 * element.
	 *
	 * Just like originatesFromDialog() this is used to prevent deactivating
	 * editables when interacting with UI elements in a hackish way.
	 *
	 * @param {jQuery<Event>} $event The processed event.
	 * @returns {boolean} true if $event is initieated from a jQuery UI
	 *		element, and false otherwise.
	 */
	function originatesFromUiWidget($event) {
		return $($event.target).closest('.ui-widget').length > 0;
	}

	/**
	 * Registers events on the documents to cause editables to be blurred when
	 * clicking outside of editables.
	 *
	 * Hack: Except when the click originates from a modal dialog.
	 */
	function registerEvents() {
		$('html').mousedown(function ($event) {
			if (Aloha.activeEditable && !Aloha.eventHandled
					&& !originatesFromDialog($event)
					&& !originatesFromUiWidget($event)) {
				Aloha.deactivateEditable();
			}
		}).mouseup(function () {
			Aloha.eventHandled = false;
		});
	}

	/**
	 * Initialize Aloha.
	 *
	 * @param {function} event Event to trigger after completing tasks.
	 * @param {function} next Function to call after completing tasks.
	 */
	function initAloha(event, next) {
		if (!isBrowserSupported()) {
			var console = window.console;
			if (console) {
				var fn = console.error ? 'error' : console.log ? 'log' : null;
				if (fn) {
					console[fn]('This browser is not supported');
				}
			}
			return;
		}

		// Because different css is to be applied based on what the user-agent
		// supports.  For example: outlines do not render in IE7.
		if (Aloha.browser.webkit) {
			$('html').addClass('aloha-webkit');
		} else if (Aloha.browser.opera) {
			$('html').addClass('aloha-opera');
		} else if (Aloha.browser.msie) {
			$('html').addClass('aloha-ie' + parseInt(Aloha.browser.version, 10));
		} else if (Aloha.browser.mozilla) {
			$('html').addClass('aloha-mozilla');
		}

		if (navigator.appVersion.indexOf('Win') !== -1) {
			Aloha.OSName = 'Win';
		} else if (navigator.appVersion.indexOf('Mac') !== -1) {
			Aloha.OSName = 'Mac';
		} else if (navigator.appVersion.indexOf('X11') !== -1) {
			Aloha.OSName = 'Unix';
		} else if (navigator.appVersion.indexOf('Linux') !== -1) {
			Aloha.OSName = 'Linux';
		}

		// Fix inconsistent browser behavior in Internet Explorer:
		// per default the Internet Explorer's own feature AutoUrlDetect is turned on.
		// When this feature is active the "editor will automatically create a hyperlink
		// for any text that is formatted as a URL."
		// https://msdn.microsoft.com/en-us/library/aa769893(v=vs.85).aspx
		// http://blogs.msdn.com/b/ieinternals/archive/2010/09/15/ie9-beta-minor-change-list.aspx
		//
		// Since this behavior is different to all other browsers we will
		// turn this feature off in Internet Explorer >= 9 (turning it off is supported
		// starting from IE9)
		if (Aloha.browser.msie && parseFloat(Aloha.browser.version) >= 9.0 && typeof document.execCommand === 'function') {
			document.execCommand('AutoUrlDetect', false, false);
		}

		registerEvents();
		Aloha.settings.base = Aloha.getAlohaUrl();
		Aloha.Log.init();

		// Initialize error handler for general javascript errors.
		if (Aloha.settings.errorhandling) {
			window.onerror = function (msg, url, line) {
				Aloha.Log.error(Aloha, 'Error message: ' + msg + '\nURL: ' +
				                       url + '\nLine Number: ' + line);
				return true;
			};
		}

		event();
		next();
	}

	/**
	 * Initialize managers
	 *
	 * @param {function} event Event to trigger after completing tasks.
	 * @param {function} next Function to call after completing tasks.
	 */
	function initRepositoryManager(event, next) {
		Aloha.RepositoryManager.init();
		event();
		next();
	}

	/**
	 * Initialize Aloha plugins.
	 *
	 *
	 * @param {function} event Event to trigger after completing tasks.
	 * @param {function} next Callback that will be invoked after all plugins
	 *                        have been initialized.  Whereas plugins are loaded
	 *                        synchronously, plugins may initialize
	 *                        asynchronously.
	 */
	function initPluginManager(event, next) {
		// Because if there are no loadedPlugins specified, then the default is
		// to initialized all available plugins.
		if (0 === Aloha.loadedPlugins.length) {
			var plugins = PluginManager.plugins;
			var plugin;
			for (plugin in plugins) {
				if (plugins.hasOwnProperty(plugin)) {
					Aloha.loadedPlugins.push(plugin);
				}
			}
		}

		var fired = false;

		PluginManager.init(function () {
			if (!fired) {
				event();
				fired = true;
			}
			next();
		}, Aloha.loadedPlugins);

		if (!fired) {
			event();
			fired = true;
		}
	}

	/**
	 * Begin initialize editables.
	 *
	 * @param {function} event Event to trigger after completing tasks.
	 * @param {function} next Function to call after completing tasks.
	 */
	function initEditables(event, next) {
		var i;
		for (i = 0; i < Aloha.editables.length; i++) {
			if (!Aloha.editables[i].ready) {
				Aloha.editables[i].init();
			}
		}
		event();
		next();
	}

	/**
	 * Initialization phases.
	 *
	 * These stages denote the initialization states which Aloha will go
	 * through from loading to ready.
	 *
	 * Each phase object contains the following properties:
	 *        fn : The process that is to be invoked during this phase.
	 *             Will take two functions: event() and next().
	 *     event : The event name, which if provided, will be fired after the
	 *             phase has been started (optional).
	 *  deferred : A $.Deferred() object to hold event handlers until that
	 *             initialization phase has been done (optional).
	 *
	 * @type {Array.<phase>}
	 */
	var phases = [
		// Phase 0: Waiting for initialization to begin.  This is the state at
		//          load-time.
		{
			fn: null,
			event: null,
			deferred: null
		},

		// Phase 1: DOM is ready; performing compatibility checks, registering
		//          basic events, and initializing logging.
		{
			fn: initAloha,
			event: null,
			deferred: null
		},

		// Phase 2: Initial checks have passed; Initializing repository manger.
		{
			fn: initRepositoryManager,
			event: null,
			deferred: null
		},

		// Phase 3: Repository manager is ready for use; commence
		//          initialization of configured or default plugins.
		{
			fn: initPluginManager,
			event: 'aloha-plugins-loaded',
			deferred: null
		},

		// Phase 4: Plugins have all begun their initialization process, but it
		//          is not necessary that they have completed.  Start
		//          initializing editable, along with their scaffolding UI.
		//          Editables will not be fully initialized however, until
		//          plugins have finished initialization.
		{
			fn: initEditables,
			event: null,
			deferred: null
		},

		// Phase 5: The "ready" state.  Notify the system that Aloha is fully
		//          loaded, and ready for use.
		{
			fn: null,
			event: 'aloha-ready',
			deferred: null
		}
	];


	/**
	 * Base Aloha Object
	 * @namespace Aloha
	 * @class Aloha The Aloha base object, which contains all the core functionality
	 * @singleton
	 */
	$.extend(true, Aloha, {

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
		 * A list of loaded plugin names, available after the STAGES.PLUGINS
		 * initialization phase.
		 *
		 * @type {Array.<string>}
		 * @internal
		 */
		loadedPlugins: [],

		/**
		 * Maps names of plugins (link) to the base URL (../plugins/common/link).
		 */
		_pluginBaseUrlByName: {},

		/**
		 * Start the initialization process.
		 */
		init: function () {
			Aloha.initialize(phases);
		},

		/**
		 * Returns list of loaded plugins (without Bundle name)
		 *
		 * @return array
		 */
		getLoadedPlugins: function () {
			return this.loadedPlugins;
		},

		/**
		 * Returns true if a certain plugin is loaded, false otherwise.
		 *
		 * @param {string} plugin Name of plugin
		 * @return {boolean} True if plugin with given name is load.
		 */
		isPluginLoaded: function (name) {
			var loaded = false;
			$.each(this.loadedPlugins, function (i, plugin) {
				if (name === plugin.toString()) {
					loaded = true;
					return false;
				}
			});
			return loaded;
		},

		/**
		 * Activates editable and deactivates all other Editables.
		 *
		 * @param {Editable} editable the Editable to be activated
		 */
		activateEditable: function (editable) {
			// Because editables may be removed on blur, Aloha.editables.length
			// is not cached.
			var editables = Aloha.editables;
			var i;
			for (i = 0; i < editables.length; i++) {
				if (editables[i] !== editable && editables[i].isActive) {
					editables[i].blur(editable);
				}
			}
			Aloha.activeEditable = editable;
		},

		/**
		 * Returns the current Editable
		 * @return {Editable} returns the active Editable
		 */
		getActiveEditable: function () {
			return Aloha.activeEditable;
		},

		/**
		 * Deactivates the active Editable.
		 *
		 * TODO: Would be better named "deactivateActiveEditable".
		 */
		deactivateEditable: function () {
			if (Aloha.activeEditable) {
				Aloha.activeEditable.blur();
				Aloha.activeEditable = null;
			}
		},

		/**
		 * Gets an editable by an ID or null if no Editable with that ID
		 * registered.
		 *
		 * @param {string} id The element id to look for.
		 * @return {Aloha.Editable|null} An editable, or null if none if found
		 *                               for the given id.
		 */
		getEditableById: function (id) {
			// Because if the element is a textarea, then it's necessary to
			// route to the editable div.
			var $editable = $('#' + id);
			if ($editable.length
					&& 'textarea' === $editable[0].nodeName.toLowerCase()) {
				id = id + '-aloha';
			}
			var i;
			for (i = 0; i < Aloha.editables.length; i++) {
				if (Aloha.editables[i].getId() === id) {
					return Aloha.editables[i];
				}
			}
			return null;
		},

		/**
		 * Checks whether an object is a registered Aloha Editable.
		 * @param {jQuery} obj the jQuery object to be checked.
		 * @return {boolean}
		 */
		isEditable: function (obj) {
			var i, editablesLength;

			for (i = 0, editablesLength = Aloha.editables.length; i < editablesLength; i++) {
				if (Aloha.editables[i].originalObj.get(0) === obj) {
					return true;
				}
			}
			return false;
		},

		/**
		 * Gets the nearest editable parent of the DOM element contained in the
		 * given jQuery object.
		 *
		 * @param {jQuery} $element jQuery unit set containing DOM element.
		 * @return {Aloha.Editable} Editable, or null if none found.
		 */
		getEditableHost: (function () {
			var getEditableOf = function (editable) {
				var i;
				for (i = 0; i < Aloha.editables.length; i++) {
					if (Aloha.editables[i].originalObj[0] === editable) {
						return Aloha.editables[i];
					}
				}
				return null;
			};

			return function ($element) {
				if (!$element || 0 === $element.length) {
					return null;
				}
				var editable = getEditableOf($element[0]);
				if (!editable) {
					$element.parents().each(function (__unused__, node) {
						editable = getEditableOf(node);
						if (editable) {
							return false;
						}
					});
				}
				return editable;
			};
		}()),

		/**
		 * Logs a message to the console.
		 *
		 * @param {string} level Level of the log
		 *                       ("error", "warn" or "info", "debug").
		 * @param {object} component Component that calls the log.
		 * @param {string} message Log message.
		 * @hide
		 */
		log: function (level, component, message) {
			if (typeof Aloha.Log !== 'undefined') {
				Aloha.Log.log(level, component, message);
			}
		},

		/**
		 * Register the given editable.
		 *
		 * @param {Editable} editable to register.
		 * @hide
		 */
		registerEditable: function (editable) {
			Aloha.editables.push(editable);
		},

		/**
		 * Unregister the given editable. It will be deactivated and removed
		 * from editables.
		 *
		 * @param {Editable} editable The editable to unregister.
		 * @hide
		 */
		unregisterEditable: function (editable) {
			var index = $.inArray(editable, Aloha.editables);
			if (index !== -1) {
				Aloha.editables.splice(index, 1);
			}
		},

		/**
		 * Check whether at least one editable was modified.
		 *
		 * @return {boolean} True when at least one editable was modified,
		 *                   false otherwise.
		 */
		isModified: function () {
			var i;
			for (i = 0; i < Aloha.editables.length; i++) {
				if (Aloha.editables[i].isModified
						&& Aloha.editables[i].isModified()) {
					return true;
				}
			}
			return false;
		},

		/**
		 * Determines the Aloha Url.
		 *
		 * @return {String} Aloha's baseUrl setting or "" if not set.
		 */
		getAlohaUrl: function (suffix) {
			return Aloha.settings.baseUrl || '';
		},

		/**
		 * Gets the plugin's url.
		 *
		 * @param {string} name The name with which the plugin was registered
		 *                      with.
		 * @return {string} The fully qualified url of this plugin.
		 */
		getPluginUrl: function (name) {
			if (!name) {
				return null;
			}
			var url = Aloha.settings._pluginBaseUrlByName[name];
			if (url) {
				// Check if url is absolute and attach base url if it is not.
				if (!url.match("^(\/|http[s]?:).*")) {
					url = Aloha.getAlohaUrl() + '/' + url;
				}
			}
			return url;
		},

		/**
		 * Disable object resizing by executing command 'enableObjectResizing',
		 * if the browser supports this.
		 */
		disableObjectResizing: function () {
			try {
				// This will disable browsers image resizing facilities in
				// order disable resize handles.
				var supported;
				try {
					supported = document.queryCommandSupported('enableObjectResizing');
				} catch (e) {
					supported = false;
					Aloha.Log.log('enableObjectResizing is not supported.');
				}
				if (supported) {
					document.execCommand('enableObjectResizing', false, false);
					Aloha.Log.log('enableObjectResizing disabled.');
				}
			} catch (e2) {
				Aloha.Log.error(e2, 'Could not disable enableObjectResizing');
				// this is just for others, who will not support disabling enableObjectResizing
			}
		},

		/**
		 * Disable native table editing
		 */
		disableInlineTableEditing: function () { // enableInlineTableEditing
			try {
				// This will disable browsers native table editing facilities in
				// order to disable resize handles.
				var supported;
				try {
					supported = document.queryCommandSupported('enableInlineTableEditing');
				} catch (e) {
					supported = false;
					Aloha.Log.log('enableInlineTableEditing is not supported.');
				}
				if (supported) {
					document.execCommand('enableInlineTableEditing', false, false);
					Aloha.Log.log('enableInlineTableEditing disabled.');
				}
			} catch (e2) {
				Aloha.Log.error(e2, 'Could not disable enableInlineTableEditing');
				// this is just for others, who will not support disabling enableInlineTableEditing
			}
		},

		/**
		 * Human-readable string representation of this.
		 *
		 * @hide
		 */
		toString: function () {
			return 'Aloha';
		},

		/**
		 * Shim to replace $.browser
		 *
		 * @hide
		 */
		browser: (function () {
			function uaMatch(ua) {
				ua = ua.toLowerCase();

				var match = /(chrome)[ \/]([\w.]+)/.exec(ua) ||
					/(webkit)[ \/]([\w.]+)/.exec(ua) ||
					/(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
					/(msie) ([\w.]+)/.exec(ua) ||
					// IE11 will only identify itself via its Trident rendering engine
					/(trident)(?:.*? rv:([\w.]+))/.exec(ua) ||
					(ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua)) || [];

				return {
					browser: match[1] || "",
					version: match[2] || "0"
				};
			}

			var matched = uaMatch(navigator.userAgent);
			var browser = {};

			if (matched.browser) {
				browser[matched.browser] = true;
				browser.version = matched.version;
			}

			// Chrome is Webkit, but Webkit is also Safari.
			if (browser.chrome) {
				browser.webkit = true;
			} else if (browser.webkit) {
				browser.safari = true;
			}
			// Browsers using the Trident rendering engine are also Internet Explorer
			if (browser.trident) {
				browser.msie = true;
			}

			return browser;
		}())
	});

	return Aloha;
});
