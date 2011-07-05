/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

/**
 * Registry base class.
 * TODO: docuiment that it also contains Observable.
 *
 */
define(
['core/observable'],
function(Observable) {
	"use strict";

	// Prepare
	var
		jQuery = window.alohaQuery || window.jQuery,
		$ = jQuery;

	return Class.extend(Observable, {
		
		_entries: null,

		_constructor: function() {
			this._entries = {};
		},
		
		/**
		 * @event register
		 * @param entry
		 * @param id
		 */
		
		/**
		 * @event unregister
		 * @param entry
		 * @param id
		 */
		
		register: function(id, entry) {
			this._entries[id] = entry;
			this.trigger('register', entry, id);
		},
		unregister: function(id) {
			var oldEntry = this._entries[id];
			delete this._entries[id];
			this.trigger('unregister', entry, id);
		},
		get: function(id) {
			return this._entries[id];
		},
		has: function(id) {
			return (this._entries[id] ? true : false);
		},
		getEntries: function() {
			// clone the entries so the user does not accidentally 
			return $.extend({}, this._entries);
		}
	});
});