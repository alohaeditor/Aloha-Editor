/* input.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'keys',
	'ranges'
], function Input(
	keys,
	ranges
) {
	'use strict';

	function enter() {
		keys.down('enter', function (message) {
			var range = message.range;
			ranges.insertText(range, '¶');
			ranges.collapseAtEnd(range);
			ranges.select(range);
		});
	}

	function spaces() {
		keys.down('space', function (message) {
			var range = message.range;
			ranges.insertText(range, '·');
			ranges.collapseAtEnd(range);
			ranges.select(range);
			message.event.preventDefault();
		});
	}

	spaces();
	enter();
});
