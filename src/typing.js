/* input.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define(['ranges'], function Typing(ranges) {
	'use strict';

	function enter(message) {
		ranges.insertTextBehind(message.range, '¶');
	}

	function space(message) {
		ranges.insertTextBehind(message.range, '·');
		message.event.preventDefault();
	}

	var exports = {
		enter: enter,
		space: space
	};

	exports['enter'] = enter;
	exports['space'] = space;

	return exports;
});
