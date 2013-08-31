/* input.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define(['ranges'], function Input(ranges) {
	'use strict';

	function insertBehind(range, text) {
		ranges.insertText(range, text);
		ranges.collapseAtEnd(range);
		ranges.select(range);
	}

	function enter(message) {
		insertBehind(message.range, '¶');
	}

	function spaces(message) {
		insertBehind(range, '·');
		message.event.preventDefault();
	}

	var exports = {
		enter: enter,
		space: space
	};

	exports['enter'] = enter;
	exports['space'] = space;
});
