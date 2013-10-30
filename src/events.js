/* events.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */

/**
 * @doc module
 * @name events
 * @description
 *
 * ## Event Utilities
 *
 * This module houses utilities that are
 * used for event handling.
 *
 */

define([], function Events() {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('events');
	}

	/**
	 * @doc function
	 * @name aloha.events:add
	 * @description
	 *
	 * Registers an event listener to fire the given callback when a specified
	 * event is triggered on the given object.
	 *
	 * @param {DOMObject|Document|Window} obj
	 *        Object which supports events.  This includes DOM
	 *        elements, the Document itself, and the Window object for
	 *        example.
	 * @param {String} event
	 *        Name of the event for which to register the given callback
	 * @param {Function} callback
	 *        Function to be invoked when event is triggered on the given
	 *        object.
	 */
	var add = (function () {
		var elem = document.createElement('div');
		if (elem.addEventListener) {
			return function add(obj, event, callback) {
				obj.addEventListener(event, callback);
			};
		}
		if (elem.attachEvent) {
			return function add(obj, event, callback) {
				obj.attachEvent('on' + event, callback);
			};
		}
		return function add(obj, event, callback) {
			obj['on' + event] = callback;
		};
	}());

	/**
	 * @doc function
	 * @name aloha.events:remove
	 * @description
	 *
	 * Detaches the specified event callback from the given event.
	 *
	 * @todo: Implement
	 *
	 * @param {DOMObject|Document|Window} obj
	 *        Object which supports events.  This includes DOM
	 *        elements, the Document itself, and the Window object for
	 *        example.
	 * @param {String} event
	 *        Name of the event to detach.
	 * @param {Function} callback
	 *        Function to be de-registered.
	 */
	var remove = (function remove() {
		return function remove(elem, event, callback) {
			throw 'Not implemented';
		};
	}());

	/**
	 * Functions for working with DOM events.
	 */
	var exports = {
		add: add,
		remove: remove
	};

	exports['add'] = exports.add;
	exports['remove'] = exports.remove;

	return exports;
});
