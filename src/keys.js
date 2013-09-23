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
	var IDENTIFIERS = {
		'tab'     : 9,
		'enter'   : 13,
		'shift'   : 16,
		'control' : 17,
		'space'   : 32,
		'delete'  : 46
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
		pubsub.publish('aloha.key.down', message);
		pubsub.publish('aloha.key.down.' + event.keyCode, message);
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
			pubsub.subscribe('aloha.key.down.' + (IDENTIFIERS[code] || code), callback);
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
			pubsub.subscribe('aloha.key.up.' + (IDENTIFIERS[code] || code), callback);
		}
	}

	function keycode(event) {
		return (
			misc.defined(event.key)
				? event.key
				: misc.defined(event.keyCode)
					? event.keyCode
					: event.which
		);
	}

	/**
	 * Functions for working with key events.
	 */
	var exports = {
		up      : up,
		down    : down,
		keycode : keycode
	};

	exports['up']      = exports.up;
	exports['down']    = exports.down;
	exports['keycode'] = exports.keycode;

	return exports;
});
