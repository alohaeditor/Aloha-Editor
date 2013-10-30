/* events.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'keys',
	'ranges',
	'strings',
	'editables',
	'boundaries'
], function Events(
	Keys,
	Ranges,
	Strings,
	Editables,
	Boundaries
) {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('events');
	}

	/**
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
	 * Whether or not the given event represents a text input.
	 *
	 * @reference
	 * https://lists.webkit.org/pipermail/webkit-dev/2007-December/002992.html
	 *
	 * @param {Event} event Native event object
	 * @return {Boolean}
	 */
	function isTextInput(event) {
		return 'keypress' === event.type && !event.altKey && !event.ctrlKey
		    && !Strings.isControlCharacter(String.fromCharCode(event.which));
	}

	function metaKeys(event) {
		var meta = [];
		if (event.ctrlKey && (Keys.CODES.ctrl  !== event.which)) {
			meta.push('ctrl');
		}
		if (event.altKey && (Keys.CODES.alt   !== event.which)) {
			meta.push('alt');	
		}
		if (event.shiftKey && (Keys.CODES.shift !== event.which)) {
			meta.push('shift');
		}
		return meta.join('+')
	}

	function create(event, editor) {
		var range = (event instanceof KeyboardEvent) ? Ranges.get() : null;
		var editable = event.editable;
		if (!editable && range) {
			editable = Editables.fromBoundary(editor, Boundaries.start(range));
		}
		return {
			'name'        : event.type,
			'code'        : event.which,
			'meta'        : metaKeys(event),
			'isTextInput' : isTextInput(event),
			'chr'         : String.fromCharCode(event.which),
			'event'       : event,
			'range'       : range,
			'editor'      : editor,
			'editable'    : editable,
			'target'      : event.target
		};
	}

	var exports = {
		add    : add,
		remove : remove,
		create : create
	};

	exports['add']    = exports.add;
	exports['remove'] = exports.remove;
	exports['create'] = exports.create;

	return exports;
});
