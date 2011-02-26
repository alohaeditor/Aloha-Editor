/*!
*
*   This file is part of Aloha Editor
*   Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
*   Licensed unter the terms of http://www.aloha-editor.com/license.html
*//*
*	Aloha Editor is free software: you can redistribute it and/or modify
*   it under the terms of the GNU Affero General Public License as published by
*   the Free Software Foundation, either version 3 of the License, or
*   (at your option) any later version.*
*
*   Aloha Editor is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   GNU Affero General Public License for more details.
*
*   You should have received a copy of the GNU Affero General Public License
*   along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

(function(window, undefined) {
	var
		$ = jQuery = window.alohaQuery,
		GENTICS = window.GENTICS,
		Aloha = GENTICS.Aloha;

/**
 * @namespace GENTICS.Aloha
 * @class Event represents an Aloha Event
 * @constructor
 * @param {String} eventName the name of the event
 * @param {Object} eventSource the source of the event, which might be any Aloha-specific object. Use the Gentics.Aloha object for global events
 * @param {Object} properties Container object which might contain additional event properties
 */
GENTICS.Aloha.Event = function (eventName, eventSource, properties) {
  this.name = eventName;
  if (eventSource) {
    this.source = eventSource;
  } else {
    this.source = GENTICS.Aloha;
  }
  this.properties = properties;
};

/**
 * @namespace GENTICS.Aloha
 * @class EventRegistry is accountable for managing event subscriptions and triggering events
 * @constructor
 * @singleton
 */
GENTICS.Aloha.EventRegistry = function () {};

GENTICS.Aloha.EventRegistry.prototype = {
	/**
	 * Subscribe on the given Event from the event source
	 * @method
	 * @param {object} eventSource event source object
	 * @param {string} eventName event name
	 * @param {function} handleMethod event handler method
	 */
	subscribe: function (eventSource, eventName, handleMethod) {
		jQuery(eventSource).bind(eventName, handleMethod);
	},

	/**
	 * Unsubscribe the given Event from the event source
	 * @method
	 * @param {object} eventSource event source object
	 * @param {string} eventName event name
	 * @param {function} handleMethod event handler method
	 */
	unsubscribe: function (eventSource, eventName, handleMethod) {
		jQuery(eventSource).unbind(eventName, handleMethod);
	},

	/**
	 * Trigger the given event
	 * @method
	 * @param {object} event Aloha event object
	 */
	trigger: function (event) {
		jQuery(event.source).trigger(event.name, event.properties);
	}
};

GENTICS.Aloha.EventRegistry = new GENTICS.Aloha.EventRegistry();

})(window);
