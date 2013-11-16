/* events.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * @reference
 * http://www.w3.org/TR/DOM-Level-3-Events/#idl-interface-MouseEvent-initializers
 */
define(['misc', 'assert'], function Events(Misc, Assert) {
	'use strict';

	/**
	 * Registers an event listener to fire the given callback when a specified
	 * event is triggered on the given object.
	 *
	 * @param {Element|Document|Window} obj
	 *        Object which supports events.  This includes DOM elements, the
	 *        Document itself, and the Window object for example.
	 * @param {string} event
	 *        Name of the event for which to register the given callback.
	 * @param {function} handler
	 *        Function to be invoked when event is triggered on the given
	 *        object.
	 * @param {boolean=} opt_useCapture
	 *        Optional.  Whether to add the handler in the capturing phase.
	 */
	function add(obj, event, handler, opt_useCapture) {
		var useCapture = !!opt_useCapture;
		if (obj.addEventListener) {
			obj.addEventListener(event, handler, useCapture);
		} else if (obj.attachEvent) {
			obj.attachEvent('on' + event, handler);
		} else {
			Assert.assertError();
		}
	}

	/**
	 * Detaches the specified event callback from the given event.
	 *
	 * @param {Element|Document|Window} obj
	 *        Object which supports events.  This includes DOM elements, the
	 *        Document itself, and the Window object for example.
	 * @param {string} event
	 *        Name of the event to detach.
	 * @param {function} handler
	 *        Function to be de-registered.
	 * @param {boolean=} opt_useCapture
	 *        Optional.  Must be true if the handler was registered with a true
	 *        useCapture argument.
	 */
	function remove(obj, event, handler, opt_useCapture) {
		var useCapture = !!opt_useCapture;
		if (obj.removeEventListener) {
			obj.removeEventListener(event, handler, useCapture);
		} else if (obj.detachEvent) {
			obj.detachEvent('on' + event, handler);
		} else {
			Assert.assertError();
		}
	}

	function dispatch(doc, obj, event){
		if (obj.dispatchEvent) {
			// NB This method is to create events is deprecated:
			// https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Events/Creating_and_triggering_events
			// But the new way doesn't work on IE9.
			// var eventObj = new window['Event'](event);
			var eventObj = doc.createEvent('Event');
			eventObj.initEvent(event, true, true);
			obj.dispatchEvent(eventObj);
		} else if (obj.fireEvent) {
			var eventObj = doc.createEventObject();
			eventObj['type'] = event;
			obj.fireEvent('on' + event, eventObj) ;
		} else {
			Assert.assertError();
		}
	}

	/**
	 * Recursively calls the list of arguments in order, passing the product of
	 * each call as the argument for the next function.
	 *
	 * @param  {Object}
	 *         The seed value which will be passed as the only argument to the
	 *         first function in the argument list.
	 * @param  {function(Object):Object=...}
	 * @return {Object}
	 */
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
	 * Runs the given function after the current event handler returns
	 * to the browser.
	 *
	 * Currently implemented just with setTimeout() which is specced to
	 * have a minimum timeout value of 4 milliseconds. Alternate
	 * implementations are possible that are faster, for example:
	 * https://github.com/NobleJS/setImmediate
	 *
	 * @param fn {function} a function to call
	 */
	function nextTick(fn) {
		setTimeout(fn, 4);
	}

	/**
	 * Sets up all editing browser events to call `editor` on the given
	 * document.
	 *
	 * @reference
	 * https://en.wikipedia.org/wiki/DOM_Events
	 * http://www.w3.org/TR/DOM-Level-3-Events
	 *
	 * @param {function(Object)} editor
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

		add(doc, 'selection-changed',   editor);
	}

	var exports = {
		add         : add,
		remove      : remove,
		compose     : compose,
		setup       : setup,
		isWithCtrl  : isWithCtrl,
		isWithShift : isWithShift,
		dispatch: dispatch,
		nextTick: nextTick
	};

	exports['add']       = exports.add;
	exports['remove']    = exports.remove;
	exports['compose']   = exports.compose;
	exports['setup']     = exports.setup;
	exports['isWithCtrl']  = exports.isWithCtrl;
	exports['isWithShift'] = exports.isWithShift;
	exports['dispatch'] = exports.dispatch;
	exports['nextTick'] = exports.nextTick;

	return exports;
});
