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
		var browser = $.browser;
		var version = browser.version;
		return !(
			// Chrome/Safari 4
			(browser.webkit && parseFloat(version) < 532.5) ||
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
		var $target = $($event.target);
		return $target.is('.aloha-dialog') ||
		       0 < $target.closest('.aloha-dialog').length;
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
					&& !originatesFromDialog($event)) {
				Aloha.deactivateEditable();
			}
		}).mouseup(function () {
			Aloha.eventHandled = false;
		});
	}

	/**
	 * Initialize Aloha.
	 *
	 * @param {function} next Function to call after initialization.
	 */
	function initAloha(next) {
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
		if ($.browser.webkit) {
			$('html').addClass('aloha-webkit');
		} else if ($.browser.opera) {
			$('html').addClass('aloha-opera');
		} else if ($.browser.msie) {
			$('html').addClass('aloha-ie' + parseInt($.browser.version, 10));
		} else if ($.browser.mozilla) {
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

		next();
	}

	/**
	 * Initialize Aloha plugins.
	 *
	 * @param {function} onPluginsInitialized Callback that will be invoked
	 *                                        after all plugins have been
	 *                                        initialized.  Whereas plugins are
	 *                                        loaded synchronously, plugins may
	 *                                        initialize asynchronously.
	 */
	function initPlugins(onPluginsInitialized) {
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
		PluginManager.init(onPluginsInitialized, Aloha.loadedPlugins);
	}

	/**
	 * Loads GUI components.
	 */
	function initGui(next) {
		Aloha.RepositoryManager.init();
		var i;
		for (i = 0; i < Aloha.editables.length; i++) {
			if (!Aloha.editables[i].ready) {
				Aloha.editables[i].init();
			}
		}
		next();
	}

	/**
	 * Initialization stages.
	 *
	 * These stages denote the 5 initialization states which Aloha will goes
	 * through from "LOADING" to "READY."
	 *
	 * LOADING (1) : Waiting for initialization to begin.
	 *   ALOHA (2) : DOM is ready; performing compatibility checks, and
	 *               setting up basic properties.
	 * PLUGINS (4) : Initial checks have passed; commencing initialization of
	 *               all configured (other wise all default) plugins.  At this
	 *               point, editables can be aloha()fied.
	 *     GUI (8) : Plugins have all begun their initialization process, but
	 *               it is not necessary that their have completed. Preparing
	 *               user interface (and repositories?).
	 *  READY (16) : Gui is in place; all plugins have completed their
	 *               initialization--whether asynchronous or otherwise.
	 *
	 * @type {Enum<number>}
	 */
	var STAGES = {
		LOADING : 1 << 0,
		ALOHA   : 1 << 1,
		PLUGINS : 1 << 2,
		GUI     : 1 << 3,
		READY   : 1 << 4
	};

	/**
	 * The order in which initialization phases should sequenced.
	 *
	 * See initialization.phases to see what happens in each of these phases.
	 *
	 * @type {Array.<number>}
	 * @const
	 */
	var ORDER = [
		STAGES.LOADING,
		STAGES.ALOHA,
		STAGES.PLUGINS,
		STAGES.GUI,
		STAGES.READY
	];

	/**
	 * Initialization facilities.
	 */
	var initialization = {

		/**
		 * Phases of initialization.
		 *
		 *        fn : The process that to be invoked during this phase.
		 *     event : The event name, which if provided, will be fired after
		 *             the phase has been started.
		 *  deferred : A $.Deferred() object to hold event binding until that
		 *             initialization phase has been done.
		 *
		 * @type {Array.<object>}
		 */
		phases: (function () {
			var phases = {};
			var noop = function (next) {
				next();
			};
			phases[STAGES.LOADING] = {
				fn: noop
			};
			phases[STAGES.ALOHA] = {
				fn: initAloha
			};
			phases[STAGES.PLUGINS] = {
				fn: initPlugins,
				event: 'aloha-plugins-loaded',
				deferred: null
			};
			phases[STAGES.GUI] = {
				fn: initGui
			};
			phases[STAGES.READY] = {
				fn: noop,
				event: 'aloha-ready',
				deferred: null
			};
			return phases;
		}()),

		/**
		 * Starts the initialization phases.
		 *
		 * @param {function}
		 */
		start: function (callback) {
			initialization.proceed(0, ORDER, callback);
		},

		/**
		 * Proceeds to next initialization phases.
		 *
		 * @param {number} index The current initialization phase, as an index
		 *                       into `order'.
		 * @param {Array.<number>} order The order to the initialization phases.
		 * @param {function=} callback Callback function to invoke at the end
		 *                             of the initialization order.
		 */
		proceed: function (index, order, callback) {
			if (index < order.length) {
				Aloha.stage = order[index];
				var phase = initialization.phases[Aloha.stage];
				// ASSERT(phase)
				phase.fn(function () {
					initialization.proceed(++index, order, callback);
				});
				if (phase.event) {
					Aloha.trigger(phase.event);
				}
			} else if (callback) {
				callback();
			}
		},

		/**
		 * Given and the name of an event, returns a corresponding
		 * initialization phase.
		 *
		 * @param {string} eventName
		 * @param {object|null} An initialization phase that corresponds to the
		 *                      specified event name; null otherwise.
		 */
		getStageForEvent: function (eventName) {
			var stage;
			for (stage in initialization.phases) {
				if (initialization.phases.hasOwnProperty(stage) &&
						eventName === initialization.phases[stage].event) {
					return stage;
				}
			}
			return null;
		}
	};

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
		 * Which stage is the aloha init process at?
		 * @property
		 * @type string
		 */
		stage: null,

		/**
		 * Initialization facilities.
		 *
		 * @type {object}
		 */
		initialization: initialization,

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
		 * Start the initialization process.
		 */
		init: function () {
			initialization.start();
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
					editables[i].blur();
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
		 * Get the nearest editable parent of the DOM element contained in the
		 * given jQuery object.
		 *
		 * @param {jQuery} $obj jQuery unit set containing DOM element.
		 * @return {Aloha.Editable} Editable, or null if none found.
		 */
		getEditableHost: function ($obj) {
			if (!$obj) {
				return null;
			}
			var $editable;
			$obj.parents().andSelf().each(function () {
				var i;
				for (i = 0; i < Aloha.editables.length; i++) {
					if (Aloha.editables[i].originalObj.get(0) === this) {
						$editable = Aloha.editables[i];
						return false;
					}
				}
			});
			return $editable;
		},

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
			if (name) {
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
		 * Human-readable string representation of this.
		 *
		 * @hide
		 */
		toString: function () {
			return 'Aloha';
		}
	});

	return Aloha;
});
