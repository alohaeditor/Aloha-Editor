/* typing.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'keys',
	'html',
	'ranges',
	'editing',
	'traversing'
], function Typing(
	dom,
	keys,
	html,
	ranges,
	editing,
	traversing
) {
	'use strict';

	function enter(msg) {
		ranges.insertTextBehind(msg.range, '¶');
	}

	function space(msg) {
		ranges.insertTextBehind(msg.range, '·');
		msg.event.preventDefault();
	}

	function deleteBackward(msg) {
		var range = msg.range;
		if (!range) {
			return;
		}
		if (range.collapsed) {
			ranges.expandBackward(range);
		}
		ranges.select(editing.delete(range));
		msg.event.preventDefault();
	}

	function deleteForward(msg) {
		var range = msg.range;
		if (!range) {
			return;
		}
		if (range.collapsed) {
			ranges.expandForward(range);
		}
		ranges.select(editing.delete(range));
		msg.event.preventDefault();
	}

	var exports = {
		enter: enter,
		space: space,
		deleteForward: deleteForward,
		deleteBackward: deleteBackward
	};

	exports['enter'] = enter;
	exports['space'] = space;
	exports['deleteForward'] = exports.deleteForward;
	exports['deleteBackward'] = exports.deleteBackward;

	return exports;
});
