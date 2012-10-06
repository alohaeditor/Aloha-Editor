/* registry.js is part of Aloha Editor project http://aloha-editor.org
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
/*global define:true */
/**
 * Registry base class.
 * TODO: document that it also contains Observable.
 *
 */
define([
	'jquery',
	'aloha/observable',
	'util/class'
], function (
	jQuery,
	Observable,
	Class
) {
	"use strict";

	return Class.extend(Observable, {

		/**
		 * Object containing the registered entries by key.
		 */
		_entries: null,

		/**
		 * Array containing the registered ids in order
		 * of registry
		 */
		_ids: null,

		_constructor: function () {
			this._entries = {};
			this._ids = [];
		},

		/**
		 * Register an entry with an id
		 * 
		 * @event register
		 * @param id id of the registered entry
		 * @param entry registered entry
		 */
		register: function (id, entry) {
			// TODO check whether an entry with the id is already registered
			this._entries[id] = entry;
			this._ids.push(id);
			this.trigger('register', entry, id);
		},

		/**
		 * Unregister the entry with given id
		 * 
		 * @event unregister
		 * @param id id of the registered entry
		 */
		unregister: function (id) {
			// TODO check whether an entry was registered
			var i, oldEntry = this._entries[id];
			delete this._entries[id];
			for (i in this._ids) {
				if (this._ids.hasOwnProperty(i) && this._ids[i] === id) {
					this._ids.splice(i, 1);
					break;
				}
			}
			this.trigger('unregister', oldEntry, id);
		},

		/**
		 * Get the entry registered with the given id
		 * 
		 * @param id id of the registered entry
		 * @return registered entry
		 */
		get: function (id) {
			return this._entries[id];
		},

		/**
		 * Check whether an entry was registered with given id
		 * 
		 * @param id id to check
		 * @return true if an entry was registered, false if not
		 */
		has: function (id) {
			return (this._entries[id] ? true : false);
		},

		/**
		 * Get an object mapping the ids (properties) to the registered entries
		 * Note, that iterating over the properties of the returned object
		 * will return the entries in an unspecified order
		 * 
		 * @return object containing the registered entries
		 */
		getEntries: function () {
			// clone the entries so the user does not accidentally modify our _entries object.
			return jQuery.extend({}, this._entries);
		},

		/**
		 * Get the ids of the registered objects as array.
		 * The array will contain the ids in order of registry
		 * 
		 * @return array if registered ids
		 */
		getIds: function () {
			return jQuery.extend([], this._ids);
		}
	});
});
