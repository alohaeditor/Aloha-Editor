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

	function delete_(range, direction, overrides) {
		var collapsed = range.collapsed;
		if (collapsed) {
			range = (
				direction
					? ranges.expandForwardToVisiblePosition
					: ranges.expandBackwardToVisiblePosition
			)(range);
		}
		range = editing.delete(
			ranges.expandToVisibleCharacter(range),
			overrides
		);
		return range;
	}

	function enter(range, opts, overrides) {
		ranges.insertTextBehind(range, '¶');
		return range;
	}

	function breakBlock(range, opts, overrides) {
		return range;
	}

	function breakLine(range, opts, overrides) {
		return range;
	}

	var actions = {};

	actions[keys.CODES.backspace] =
		function deleteBackwards(range, opts, overrides) {
			return delete_(range, false, overrides);
		};

	actions[keys.CODES.delete] =
		function deleteForward(range, opts, overrides) {
			return delete_(range, true, overrides);
		};

	/*
	actions[keys.CODES.enter] =
		function breakBlock(range, opts, overrides) {
			return enter(
				range.collapsed ? range : delete_(range, true, overrides),
				opts,
				overrides
			);
		};
	*/

	actions['shift+' + keys.CODES.enter] =
		function breakLine(range, opts, overrides) {
			return breakLine(
				range.collapsed ? range : delete_(range, true, overrides),
				opts,
				overrides
			);
		};

	actions.insertText =
		function insertText(range, opt, overrides) {
			return range.collapsed ? range : delete_(range, true, overrides);
		};

	actions[keys.CODES.f1] =
	actions[keys.CODES.f11] =
	actions[keys.CODES.tab] =
	actions[keys.CODES.alt] =
	actions[keys.CODES.shift] =
	actions[keys.CODES.escape] =
	actions[keys.CODES.capslock] =
	actions[keys.CODES.control] = fn.identity;

	function down(msg, opts, overrides) {
		if (!msg.range) {
			return;
		}
		var action = actions[msg.code];
		var range;
		if (action) {
			range = action(msg.range, opts, overrides);
			html.prop(range.commonAncestorContainer);
			ranges.select(range);
			msg.event.preventDefault();
		} else if (!keys.ARROWS[msg.code]) {
			ranges.select(actions.insertText(msg.range, opts, overrides));
		}
	}

	var exports = {
		down: down
	};

	exports['down'] = down;

	return exports;
});
