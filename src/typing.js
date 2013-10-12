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
		if (msg.range) {
			ranges.insertTextBehind(msg.range, '¶');
		}
	}

	function space(msg) {
		if (msg.range) {
			ranges.insertTextBehind(msg.range, '·');
			msg.event.preventDefault();
		}
	}

	function delete_(range, direction) {
		var collapsed = range.collapsed;
		if (collapsed) {
			range = (
				direction
					? ranges.expandForwardToVisiblePosition
					: ranges.expandBackwardToVisiblePosition
			)(range);
		}
		range = editing.delete(ranges.expandToVisibleCharacter(range));
		return range;
	}

	function down(msg) {
		if (!msg.range) {
			return;
		}
		var range;
		if (keys.CODES.backspace === msg.code) {
			range = delete_(msg.range, false);
		} else if (keys.CODES.delete === msg.code || !msg.range.collapsed) {
			range = delete_(msg.range, true);
		}
		if (range) {
			ranges.select(range);
			msg.event.preventDefault();
		}
	}

	var exports = {
		enter: enter,
		space: space,
		down: down
	};

	exports['enter'] = enter;
	exports['space'] = space;
	exports['down'] = down;

	return exports;
});
