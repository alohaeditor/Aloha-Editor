/* observable.js is part of Aloha Editor project http://aloha-editor.org
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
	'jquery'
], function (
	jQuery
) {
	"use strict";

	var $ = jQuery;

	return {
		_eventHandlers: null,

		/**
		 * Attach a handler to an event
		 *
		 * @param {String} eventType A string containing the event name to bind to
		 * @param {Function} handler A function to execute each time the event is triggered
		 * @param {Object} scope Optional. Set the scope in which handler is executed
		 */
		bind: function (eventType, handler, scope) {
			this._eventHandlers = this._eventHandlers || {};
			if (!this._eventHandlers[eventType]) {
				this._eventHandlers[eventType] = [];
			}
			this._eventHandlers[eventType].push({
				handler: handler,
				scope: (scope || window)
			});
		},

		/**
		 * Remove a previously-attached event handler
		 *
		 * @param {String} eventType A string containing the event name to unbind
		 * @param {Function} handler The function that is to be no longer executed. Optional. If not given, unregisters all functions for the given event.
		 */
		unbind: function (eventType, handler) {
			this._eventHandlers = this._eventHandlers || {};
			if (!this._eventHandlers[eventType]) {
				return;
			}
			if (!handler) {
				// No handler function given, unbind all event handlers for the eventType
				this._eventHandlers[eventType] = [];
			} else {
				this._eventHandlers[eventType] = $.grep(this._eventHandlers[eventType], function (element) {
					if (element.handler === handler) {
						return false;
					}
					return true;
				});
			}
		},

		/**
		 * Execute all handlers attached to the given event type.
		 * All arguments except the eventType are directly passed to the callback function.
		 *
		 * @param (String} eventType A string containing the event name for which the event handlers should be invoked.
		 */
		trigger: function (eventType) {
			this._eventHandlers = this._eventHandlers || {};
			if (!this._eventHandlers[eventType]) {
				return;
			}

			// preparedArguments contains all arguments except the first one.
			var preparedArguments = [];
			$.each(arguments, function (i, argument) {
				if (i > 0) {
					preparedArguments.push(argument);
				}
			});

			$.each(this._eventHandlers[eventType], function (index, element) {
				element.handler.apply(element.scope, preparedArguments);
			});
		},

		/**
		 * Clears all event handlers. Call this method when cleaning up.
		 */
		unbindAll: function () {
			this._eventHandlers = null;
		}
	};
});
