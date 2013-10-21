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
	'functions',
	'strings'
], function Typing(
	Dom,
	Keys,
	Html,
	Ranges,
	Editing,
	Traversing,
	Fn,
	Strings
) {
	'use strict';

	function delete_(range, direction, context) {
		var collapsed = range.collapsed;
		if (collapsed) {
			range = (
				direction
					? Ranges.expandForwardToVisiblePosition
					: Ranges.expandBackwardToVisiblePosition
			)(range);
		}
		Editing.delete(Ranges.expandToVisibleCharacter(range), context);
		return range;
	}

	var actions = {};

	actions[Keys.CODES.backspace] = function deleteBackwards(range, context) {
		delete_(range, false, context);
		return range;
	};

	actions[Keys.CODES.delete] = function deleteForward(range, context) {
		delete_(range, true, context);
		return range;
	};

	actions[Keys.CODES.enter] = function breakBlock(range, context) {
		Editing.break(
			range.collapsed ? range : delete_(range, true, context),
			context,
			false
		);
		return range;
	};

	actions['shift+' + Keys.CODES.enter] = function breakLine(range, context) {
		Editing.break(
			range.collapsed ? range : delete_(range, true, context),
			context,
			true
		);
		return range;
	};

	actions.insertText = function insertText(range, text, context) {
		if (!range.collapsed) {
			range = delete_(range, true, context);
		}
		if (' ' === text) {
			var elem = Dom.nodeAtOffset(range.startContainer, range.startOffset);
			elem = elem.parentNode;
			var whiteSpaceStyle = Dom.getComputedStyle(elem, 'white-space');
			if (!Html.isWhiteSpacePreserveStyle(whiteSpaceStyle)) {
				text = '\xa0';
			}
		}
		Dom.insertTextAtBoundary(text, Dom.startBoundary(range), true, [range]);
		return range;
	};

	actions[Keys.CODES.f1] =
	actions[Keys.CODES.f11] =
	actions[Keys.CODES.tab] =
	actions[Keys.CODES.alt] =
	actions[Keys.CODES.shift] =
	actions[Keys.CODES.escape] =
	actions[Keys.CODES.control] =
	actions[Keys.CODES.capslock] = Fn.identity;

	function isTextInsertEvent(event) {
		if (event.altKey
		    || event.ctrlKey
		    || event.metaKey
		    || !event.which) {
			return false;
		}
		var chr = String.fromCharCode(event.which);
		return !Strings.isControlCharacter(chr);
	}

	function down(msg, context) {
		var range = msg.range;
		var event = msg.event;
		var code = msg.code;
		if (!msg.range) {
			return;
		}
		var meta = event.shiftKey && (Keys.CODES.shift !== code)
		         ? 'shift+' : '';
		var action = actions[meta + code];
		var range;
		if (action) {
			range = action(range, context);
			Html.prop(range.commonAncestorContainer);
			Ranges.select(range);
			event.preventDefault();
		}
	}

	/**
	 * Handles key presses that result in a character to be inserted.
	 *
	 * Needs a keypress event, rather than a keydown or keyup event,
	 * since only the keypress event will have a keyCode (which) that is
	 * convertible to the correct unicode character.
	 */
	function press(msg, context) {
		var range = msg.range;
		var event = msg.event;
		if (isTextInsertEvent(event)) {
			var text = String.fromCharCode(event.which);
			Ranges.select(actions.insertText(range, text, context));
			event.preventDefault();
		}
	}

	var exports = {
		down: down,
		press: press
	};

	exports['down'] = down;

	return exports;
});
