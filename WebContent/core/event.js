/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
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

/**
 * Subscribe on the given Event from the event source
 * @method
 * @param {object} eventSource event source object
 * @param {string} eventName event name
 * @param {function} handleMethod event handler method
 */
GENTICS.Aloha.EventRegistry.prototype.subscribe = function (eventSource, eventName, handleMethod) {
	jQuery(eventSource).bind(eventName, handleMethod);
};

/**
 * Trigger the given event
 * @method
 * @param {object} event Aloha event object
 */
GENTICS.Aloha.EventRegistry.prototype.trigger = function (event) {
	jQuery(event.source).trigger(event.name, event.properties);
};

GENTICS.Aloha.EventRegistry = new GENTICS.Aloha.EventRegistry();


