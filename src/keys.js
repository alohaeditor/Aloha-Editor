/* keys.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'events'
], function KeysUtilities(
	Events
) {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('Keys');
	}

	function onKeyDownOnDocument(event) {
		console.warn(event);
	}

	Events.add(document, 'keydown', onKeyDownOnDocument);

	/**
	 * Functions for working with key events.
	 */
	var exports = {
	};

	return exports;
});
