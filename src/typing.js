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
	'traversing',
	'functions'
], function Typing(
	dom,
	keys,
	html,
	ranges,
	editing,
	traversing,
	fn
) {
	'use strict';

	function delete_(range, direction, context) {
		var collapsed = range.collapsed;
		if (collapsed) {
			range = (
				direction
					? ranges.expandForwardToVisiblePosition
					: ranges.expandBackwardToVisiblePosition
			)(range);
		}
		editing.delete(ranges.expandToVisibleCharacter(range), context);
		return range;
	}

	var actions = {};

	actions[keys.CODES.backspace] = function deleteBackwards(range, context) {
		delete_(range, false, context);
		return range;
	};

	actions[keys.CODES.delete] = function deleteForward(range, context) {
		delete_(range, true, context);
		return range;
	};

	actions[keys.CODES.enter] = function breakBlock(range, context) {
		return editing.breakBlock(
			range.collapsed ? range : delete_(range, true, context),
			context
		);
	};

	actions['shift+' + keys.CODES.enter] = function breakLine(range, context) {
		return breakLine(
			range.collapsed ? range : delete_(range, true, context),
			context
		);
	};

	actions.insertText = function insertText(range, context) {
		return range.collapsed ? range : delete_(range, true, context);
	};

	actions[keys.CODES.f1] =
	actions[keys.CODES.f11] =
	actions[keys.CODES.tab] =
	actions[keys.CODES.alt] =
	actions[keys.CODES.shift] =
	actions[keys.CODES.escape] =
	actions[keys.CODES.capslock] =
	actions[keys.CODES.control] = fn.identity;

	function down(msg, context) {
		if (!msg.range) {
			return;
		}
		var action = actions[msg.code];
		var range;
		if (action) {
			range = action(msg.range, context);
			html.prop(range.commonAncestorContainer);
			ranges.select(range);
			msg.event.preventDefault();
		} else if (!keys.ARROWS[msg.code]) {
			ranges.select(actions.insertText(msg.range, context));
		}
	}

	var exports = {
		down: down
	};

	exports['down'] = down;

	return exports;
});
