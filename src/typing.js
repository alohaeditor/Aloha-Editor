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

	function delete_(range, event, direction) {
		var collapsed = range.collapsed;
		range = ranges.expandToVisibleCharacter(range);
		if (collapsed) {
			range = (
				direction
					? ranges.expandForwardToVisiblePosition
					: ranges.expandBackwardToVisiblePosition
			)(range);
		}
		ranges.select(editing.delete(range));
		event.preventDefault();
	}

	function deleteBackward(msg) {
		if (msg.range) {
			delete_(msg.range, msg.event, false);
		}
	}

	function deleteForward(msg) {
		if (msg.range) {
			delete_(msg.range, msg.event, true);
		}
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
