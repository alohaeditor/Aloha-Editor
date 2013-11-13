/* events.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * @reference
 * http://www.w3.org/TR/DOM-Level-3-Events/#idl-interface-MouseEvent-initializers
 */
define(['misc'], function Events(Misc) {
	'use strict';

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

	function compose() {
		var value = arguments[0];
		var i;
		var len = arguments.length;
		for (i = 1; i < len; i++) {
			value = Misc.copy(arguments[i](value)) || value;
		}
		return value;
	}

	/**
	 * Given an event object, checks whether the ctrl key is depressed.
	 *
	 * @param  {Object}  event
	 * @return {boolean}
	 */
	function isWithCtrl(event) {
		return event.meta.indexOf('ctrl') > -1;
	}

	/**
	 * Given an event object, checks whether the shift key is depressed.
	 *
	 * @param  {Object}  event
	 * @return {boolean}
	 */
	function isWithShift(event) {
		return event.meta.indexOf('shift') > -1;
	}

	/**
	 * Sets up all editing browser events to call `editor` on the given
	 * document.
	 *
	 * @reference
	 * https://en.wikipedia.org/wiki/DOM_Events
	 * http://www.w3.org/TR/DOM-Level-3-Events
	 *
	 * @param {Function(Object)} editor
	 * @param {Element}          document
	 */
	function setup(editor, doc) {
		add(doc, 'keyup',     editor);
		add(doc, 'keydown',   editor);
		add(doc, 'keypress',  editor);

		add(doc, 'click',     editor);
		add(doc, 'mouseup',   editor);
		add(doc, 'mousedown', editor);
		add(doc, 'mousemove', editor);
		add(doc, 'dblclick',  editor);

		add(doc, 'dragstart', editor);
		add(doc, 'drag',      editor);
		add(doc, 'dragenter', editor);
		add(doc, 'dragexit',  editor);
		add(doc, 'dragleave', editor);
		add(doc, 'dragover',  editor);
		add(doc, 'drop',      editor);
		add(doc, 'dragend',   editor);
	}

	var exports = {
		add         : add,
		remove      : remove,
		compose     : compose,
		setup       : setup,
		isWithCtrl  : isWithCtrl,
		isWithShift : isWithShift
	};

	exports['add']       = exports.add;
	exports['remove']    = exports.remove;
	exports['compose']   = exports.compose;
	exports['setup']     = exports.setup;
	exports['isWithCtrl']  = exports.isWithCtrl;
	exports['isWithShift'] = exports.isWithShift;

	return exports;
});
