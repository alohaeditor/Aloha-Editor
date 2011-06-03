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
		console = window.console||false,
		Class = window.Class;

/**
 * This is the aloha Log
 * @namespace Aloha
 * @class Log
 * @singleton
 */
Aloha.Log = Class.extend({
	/**
	 * Initialize the logging
	 * @hide
	 */
	init: function() {
		// initialize the logging settings (if not present)
		if (typeof Aloha.settings.logLevels === 'undefined' || !Aloha.settings.logLevels) {
			Aloha.settings.logLevels = {'error' : true, 'warn' : true};
		}

		// initialize the logHistory settings (if not present)
		if (typeof Aloha.settings.logHistory === 'undefined' || !Aloha.settings.logHistory) {
			Aloha.settings.logHistory = {};
		}
		// set the default values for the loghistory
		if (!Aloha.settings.logHistory.maxEntries) {
			Aloha.settings.logHistory.maxEntries = 100;
		}
		if (!Aloha.settings.logHistory.highWaterMark) {
			Aloha.settings.logHistory.highWaterMark = 90;
		}
		if (!Aloha.settings.logHistory.levels) {
			Aloha.settings.logHistory.levels = {'error' : true, 'warn' : true};
		}
		this.flushLogHistory();
		Aloha.trigger('aloha-logger-ready');
	},

	/**
	 * Log History as array of Message Objects. Every object has the properties
	 * 'level', 'component' and 'message'
	 * @property
	 * @type Array
	 * @hide
	 */
	logHistory: null,

	/**
	 * Flag, which is set as soon as the highWaterMark for the log history is reached.
	 * This flag is reset on every call of flushLogHistory()
	 * @hide
	 */
	highWaterMarkReached: false,

	/**
	 * Logs a message to the console
	 * @method
	 * @param {String} level Level of the log ('error', 'warn' or 'info', 'debug')
	 * @param {String} component Component that calls the log
	 * @param {String} message log message
	 */
	log: function(level, component, message) {
		if (typeof level === 'undefined' || !level) {
			level = 'error';
		}
		level = level.toLowerCase();
		
		if (typeof Aloha.settings.logLevels === "undefined") {
			return;
		}
		// now check whether the log level is activated
		if (!Aloha.settings.logLevels[level]) {
			return;
		}

		this.addToLogHistory({'level' : level, 'component' : component.toString(), 'message' : message, 'date' : new Date()});
		switch (level) {
		case 'error':
			if (window.console && console.error) {
				console.error(component.toString() + ': ' + message);
			}
			break;
		case 'warn':
			if (window.console && console.warn) {
				console.warn(component.toString() + ': ' + message);
			}
			break;
		case 'info':
			if (window.console && console.info) {
				console.info(component.toString() + ': ' + message);
			}
			break;
		case 'debug':
			if (window.console && console.log) {
				console.log(component.toString() + ' [' + level + ']: ' + message);
			}
			break;
		default:
			if (window.console && console.log) {
				console.log(component.toString() + ' [' + level + ']: ' + message);
			}
			break;
		}
	},

	/**
	 * Log a message of log level 'error'
	 * @method
	 * @param {String} component Component that calls the log
	 * @param {String} message log message
	 */
	error: function(component, message) {
		this.log('error', component, message);
	},

	/**
	 * Log a message of log level 'warn'
	 * @method
	 * @param {String} component Component that calls the log
	 * @param {String} message log message
	 */
	warn: function(component, message) {
		this.log('warn', component, message);
	},

	/**
	 * Log a message of log level 'info'
	 * @method
	 * @param {String} component Component that calls the log
	 * @param {String} message log message
	 */
	info: function(component, message) {
		this.log('info', component, message);
	},

	/**
	 * Log a message of log level 'debug'
	 * @param {String} component Component that calls the log
	 * @param {String} message log message
	 */
	debug: function(component, message) {
		this.log('debug', component, message);
	},

	/**
	 * Check whether the given log level is currently enabled
	 * @param {String} level
	 * @return true when log level is enabled, false if not
	 */
	isLogLevelEnabled: function(level) {
		return Aloha.settings && Aloha.settings.logLevels && Aloha.settings.logLevels[level];
	},

	/**
	 * Check whether error logging is enabled
	 * @return true if error logging is enabled, false if not
	 */
	isErrorEnabled: function() {
		return this.isLogLevelEnabled('error');
	},

	/**
	 * Check whether warn logging is enabled
	 * @return true if warn logging is enabled, false if not
	 */
	isWarnEnabled: function() {
		return this.isLogLevelEnabled('warn');
	},

	/**
	 * Check whether info logging is enabled
	 * @return true if info logging is enabled, false if not
	 */
	isInfoEnabled: function() {
		return this.isLogLevelEnabled('info');
	},

	/**
	 * Check whether debug logging is enabled
	 * @return true if debug logging is enabled, false if not
	 */
	isDebugEnabled: function() {
		return this.isLogLevelEnabled('debug');
	},

	/**
	 * Add the given entry to the log history. Check whether the highWaterMark has been reached, and fire an event if yes.
	 * @param {Object} entry entry to be added to the log history
	 * @hide
	 */
	addToLogHistory: function(entry) {
		if ( !Aloha.settings.logHistory ) {
			this.init();
		}

		if (
			// when maxEntries is set to something illegal, we do nothing (log history is disabled)
			Aloha.settings.logHistory.maxEntries <= 0
			// check whether the level is one we like to have logged
			|| !Aloha.settings.logHistory.levels[entry.level]
		) {
			return;
		}

		// first add the entry as last element to the history array
		this.logHistory.push(entry);

		// check whether the highWaterMark was reached, if so, fire an event
		if (!this.highWaterMarkReached) {
			if (this.logHistory.length >= Aloha.settings.logHistory.maxEntries * Aloha.settings.logHistory.highWaterMark / 100) {
				// fire the event
				Aloha.trigger('aloha-log-full');
				// set the flag (so we will not fire the event again until the logHistory is flushed)
				this.highWaterMarkReached = true;
			}
		}

		// check whether the log is full and eventually remove the oldest entries
		while (this.logHistory.length > Aloha.settings.logHistory.maxEntries) {
			this.logHistory.shift();
		}
	},

	/**
	 * Get the log history
	 * @return log history as array of objects
	 * @hide
	 */
	getLogHistory: function() {
		return this.logHistory;
	},

	/**
	 * Flush the log history. Remove all log entries and reset the flag for the highWaterMark
	 * @return void
	 * @hide
	 */
	flushLogHistory: function() {
		this.logHistory = [];
		this.highWaterMarkReached = false;
	}
});

/**
 * Create the Log object
 * @hide
 */
Aloha.Log = new Aloha.Log();

})(window);
