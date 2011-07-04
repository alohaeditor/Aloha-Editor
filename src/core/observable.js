/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

/**
 * Observable Mixin.
 *
 * @mixin
 */
define(
[],
function() {
	"use strict";

	// Prepare
	var
		jQuery = window.alohaQuery || window.jQuery,
		$ = jQuery;

	return {
		_eventHandlers: {},
		
		/**
		 * Attach a handler to an event
		 * 
		 * @param {String} eventType A string containing the event name to bind to
		 * @param {Function} handler A function to execute each time the event is triggered
		 * @param {Object} scope Optional. Set the scope in which handler is executed
		 */
		bind: function(eventType, handler, scope) {
			if (!this._eventHandlers[eventType]) {
				this._eventHandlers[eventType] = [];
			}
			this._eventHandlers[eventType].push({
				handler: handler,
				scope: (scope ? scope : window)
			});
		},

		/**
		 * Remove a previously-attached event handler
		 * 
		 * @param {String} eventType A string containing the event name to unbind
		 * @param {Function} handler The function that is to be no longer executed. Optional. If not given, unregisters all functions for the given event.
		 */
		unbind: function(eventType, handler) {
			if (!this._eventHandlers[eventType]) {
				return;
			}
			if (!handler) {
				// No handler function given, unbind all event handlers for the eventType
				this._eventHandlers[eventType] = [];
			} else {
				this._eventHandlers[eventType] = $.grep(this._eventHandlers[eventType], function(element) {
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
		trigger: function(eventType) {
			if (!this._eventHandlers[eventType]) {
				return;
			}

			// preparedArguments contains all arguments except the first one.
			var preparedArguments = [];
			$.each(arguments, function(i, argument) {
				if (i>0) {
					preparedArguments.push(argument);
				}
			});

			$.each(this._eventHandlers[eventType], function(index, element) {
				element.handler.apply(element.scope, preparedArguments);
			});
		}
	};
});