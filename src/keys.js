/* keys.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'events',
	'pubsub',
	'ranges',
	'misc'
], function Keys(
	events,
	pubsub,
	ranges,
	misc
) {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('keys');
	}

	/**
	 * A map of key names to their keycode.
	 *
	 * @type {object<string, number>}
	 */
	var CODES = {
		'control' : 17,
		'delete'  : 46,
		'enter'   : 13,
		'escape'  : 27,
		'f1'      : 112,
		'f12'     : 123,
		'shift'   : 16,
		'space'   : 32,
		'tab'     : 9
	};

	/**
	 * Arrow keys
	 *
	 * @type {Object}
	 */
	var ARROWS = {
		37 : 'left',
		38 : 'up',
		39 : 'right',
		40 : 'down'
	};

	/**
	 * Publishes messages on the keydown event.
	 *
	 * @param {Event} event
	 */
	function onKeyDownOnDocument(event) {
		var message = {
			event: event,
			code: event.keyCode,
			range: ranges.get()
		};
		var called = {};
		pubsub.publish('aloha.key.down', message, called);
		pubsub.publish('aloha.key.down.' + event.keyCode, message, called);
	}

	/**
	 * Publishes messages on the keyup event.
	 *
	 * @param {Event} event
	 */
	function onKeyUpOnDocument(event) {
		var message = {
			event: event,
			code: event.keyCode,
			range: ranges.get()
		};
		pubsub.publish('aloha.key.up', message);
		pubsub.publish('aloha.key.up.' + event.keyCode, message);
	}

	/**
	 * Publishes messages on the keypress event.
	 *
	 * @param {Event} event
	 */
	function onKeyPressOnDocument(event) {
		var message = {
			event: event,
			code: event.keyCode,
			range: ranges.get()
		};
		pubsub.publish('aloha.key.press', message);
		pubsub.publish('aloha.key.up.' + event.keyCode, message);
	}

	events.add(document, 'keypress', onKeyPressOnDocument);
	events.add(document, 'keydown', onKeyDownOnDocument);
	events.add(document, 'keyup', onKeyUpOnDocument);

	/**
	 * Publishes messages on the keyup event.
	 *
	 * @param {Function(object)} callback
	 */
	function down(code, callback) {
		if (typeof code === 'function') {
			pubsub.subscribe('aloha.key.down', code);
		} else {
			pubsub.subscribe('aloha.key.down.' + (CODES[code] || code), callback);
		}
	}

	/**
	 * Publishes messages on the keydown event.
	 *
	 * @param {Function(object)} callback
	 */
	function up(code, callback) {
		if (typeof code === 'function') {
			pubsub.subscribe('aloha.key.up', code);
		} else {
			pubsub.subscribe('aloha.key.up.' + (CODES[code] || code), callback);
		}
	}

	/**
	 * Publishes messages on the keypress event.
	 *
	 * @param {Function(object)} callback
	 */
	function press(code, callback) {
		if (typeof code === 'function') {
			pubsub.subscribe('aloha.key.press', code);
		} else {
			pubsub.subscribe('aloha.key.press.' + (CODES[code] || code), callback);
		}
	}

	function code(event) {
		return event.keyCode || event.which;
	}

	/**
	 * Functions for working with key events.
	 */
	var exports = {
		up     : up,
		down   : down,
		press  : press,
		code   : code,
		ARROWS : ARROWS
	};

	exports['up']     = exports.up;
	exports['down']   = exports.down;
	exports['press']  = exports.press;
	exports['code']   = exports.code;
	exports['ARROWS'] = exports.ARROWS;

	return exports;
});
