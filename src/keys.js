/* keys.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'events',
	'pubsub',
	'ranges'
], function Keys(
	events,
	pubsub,
	ranges
) {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('keys');
	}

	var IDENTIFIERS = {
		'tab'   : 9,
		'enter' : 13,
		'shift' : 16,
		'contr' : 17,
		'space' : 32
	};

	function onKeyDownOnDocument(event) {
		var message = {
			event: event,
			code: event.keyCode,
			range: ranges.get()
		};
		pubsub.publish('aloha.key.down', message);
		pubsub.publish('aloha.key.' + event.keyCode, message);
	}

	function onKeyUpOnDocument(event) {
		pubsub.publish('aloha.key.up', {
			event: event,
			code: event.keyCode,
			range: ranges.get()
		});
	}

	events.add(document, 'keydown', onKeyDownOnDocument);
	events.add(document, 'keyup', onKeyUpOnDocument);

	function keydown(callback) {
		pubsub.subscribe('aloha.key.down', callback);
	}

	function keyup(callback) {
		pubsub.subscribe('aloha.key.up', callback);
	}

	function on(code, callback) {
		pubsub.subscribe('aloha.key.' + (IDENTIFIERS[code] || code), callback);
	}

	/**
	 * Functions for working with key events.
	 */
	var exports = {
		on      : on,
		keyup   : keyup,
		keydown : keydown,
	};

	exports['on']      = exports.on;
	exports['keyup']   = exports.keyup;
	exports['keydown'] = exports.keydown;

	return exports;
});
