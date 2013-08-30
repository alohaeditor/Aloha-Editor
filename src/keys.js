/* keys.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define(['events', 'pubsub'], function Keys(events, pubsub) {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('keys');
	}

	var IDENTIFIERS = {
		9  : 'tab',
		13 : 'enter',
		16 : 'shift',
		17 : 'control',
		32 : 'space'
	};

	function onKeyDownOnDocument(event) {
		pubsub.publish('aloha.key.down', {
			event: event
		});
	}

	events.add(document, 'keydown', onKeyDownOnDocument);

	/**
	 * Functions for working with key events.
	 */
	var exports = {
	};

	return exports;
});
