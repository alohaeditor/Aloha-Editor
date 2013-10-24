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
	'boundaries',
	'functions',
	'strings',
	'editables',
	'undo'
], function Typing(
	Dom,
	Keys,
	Html,
	Ranges,
	Editing,
	Traversing,
	Boundaries,
	Fn,
	Strings,
	Editables,
	Undo
) {
	'use strict';

	function undoable(type, range, editor, fn) {
		var boundary = Boundaries.start(range);
		var editable = Editables.fromBoundary(editor, boundary);
		if (!editable) {
			return;
		}
		var undoContext = editable.undoContext;
		Undo.capture(undoContext, {
			meta: {type: type},
			oldRange: range
		}, function () {
			range = fn();
			return {newRange: range};
		});
		Undo.advanceHistory(undoContext);
		return range;
	}

	function delete_(range, direction, editor) {
		return undoable('delete', range, editor, function () {
			var collapsed = range.collapsed;
			if (collapsed) {
				range = (
					direction
						? Ranges.expandForwardToVisiblePosition
						: Ranges.expandBackwardToVisiblePosition
				)(range);
			}
			Editing.delete(Ranges.expandToVisibleCharacter(range), editor);
			return range;
		});
	}

	var actions = {};

	actions[Keys.CODES.backspace] = function deleteBackwards(range, editor) {
		delete_(range, false, editor);
	};

	actions[Keys.CODES.delete] = function deleteForward(range, editor) {
		delete_(range, true, editor);
	};

	actions[Keys.CODES.enter] = function breakBlock(range, editor) {
		return undoable('enter', range, editor, function () {
			Editing.break(
				range.collapsed ? range : delete_(range, true, editor),
				editor,
				false
			);
			return range;
		});
	};

	actions['shift+' + Keys.CODES.enter] = function breakLine(range, editor) {
		return undoable('enter', range, editor, function () {
			Editing.break(
				range.collapsed ? range : delete_(range, true, editor),
				editor,
				true
			);
			return range;
		});
	};

	actions['ctrl+90'] = function undo(range, editor) {
		var editable = Editables.fromBoundary(editor, Boundaries.start(range));
		if (!editable) {
			return range;
		}
		var undoContext = editable.undoContext;
		Undo.undo(undoContext, range, [range]);
		return range;
	};

	actions['ctrl+shift+90'] = function redo(range, editor) {
		var editable = Editables.fromBoundary(editor, Boundaries.start(range));
		if (!editable) {
			return range;
		}
		var undoContext = editable.undoContext;
		Undo.redo(undoContext, range, [range]);
		return range;
	};

	actions['ctrl+66'] = function bold(range, editor) {
		return undoable('bold', range, editor, function () {
			Editing.format(range, 'bold', true);
			return range;
		});
	};

	actions['ctrl+73'] = function italic(range, editor) {
		return undoable('italic', range, editor, function () {
			Editing.format(range, 'italic', true);
			return range;
		});
	};

	actions.insertText = function insertText(range, text, editor) {
		if (!range.collapsed) {
			range = delete_(range, true, editor);
		}
		var boundary = Boundaries.start(range);
		var editable = Editables.fromBoundary(editor, boundary);
		if (!editable) {
			return;
		}
		var undoContext = editable.undoContext;
		Undo.capture(undoContext, {
			meta: {type: 'typing'},
			oldRange: range,
			noObserve: true
		}, function () {
			if (' ' === text) {
				var elem = Traversing.upWhile(Boundaries.container(boundary), Dom.isTextNode);
				var whiteSpaceStyle = Dom.getComputedStyle(elem, 'white-space');
				if (!Html.isWhiteSpacePreserveStyle(whiteSpaceStyle)) {
					text = '\xa0';
				}
			}
			var insertPath = Undo.pathFromBoundary(editable.elem, boundary);
			var insertContent = [editable.elem.ownerDocument.createTextNode(text)];
			var change = Undo.makeInsertChange(insertPath, insertContent);
			Dom.insertTextAtBoundary(text, boundary, true, [range]);
			return {newRange: range, changes: [change]};
		});
		Undo.advanceHistory(undoContext);
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

	function actionFromEvent(event) {
		var which = 'keypress' === event.type ? String.fromCharCode(event.which) : event.which;
		var meta = '';
		if (event.altKey && (Keys.CODES.alt !== which)) {
			meta += 'alt+';
		}
		if (event.ctrlKey && (Keys.CODES.control !== which)) {
			meta += 'ctrl+';
		}
		if (event.shiftKey && (Keys.CODES.shift !== which)) {
			meta += 'shift+';
		}
		return actions[meta + which];
		
	}

	/**
	 * Most browsers store the keyCode/charCode in event.which, except
	 * IE <= 8 which stores it in event.keyCode.
	 *
	 * Only the keypress event reliably provides the character
	 * information.
	 *
	 * http://stackoverflow.com/questions/4285627/javascript-keycode-vs-charcode-utter-confusion
	 * http://unixpapa.com/js/key.html
	 */
	function charCode(event) {
		var which = event.which;
		return null != which ? which : event.keyCode;
	}

	function applyAction(action, range, event, editor) {
		// Because an action may cause an exception we prevent the
		// browser's default action first.
		event.preventDefault();
		range = action(range, editor);
		Html.prop(range.commonAncestorContainer);
		Ranges.select(range);
	}

	function down(msg, editor) {
		var range = msg.range;
		var event = msg.event;
		if (!msg.range) {
			return;
		}
		var action = actionFromEvent(event);
		if (action) {
			applyAction(action, range, event, editor);
		}
	}

	/**
	 * Handles key presses that result in a character to be inserted.
	 *
	 * Needs a keypress event, rather than a keydown or keyup event,
	 * since only the keypress event will have a keyCode (which) that is
	 * convertible to the correct unicode character.
	 */
	function press(msg, editor) {
		var range = msg.range;
		var event = msg.event;
		if (!range) {
			return;
		}
		var action = actionFromEvent(event, range, editor);
		if (action) {
			applyAction(action, range, event, editor);
			return;
		}
		if (isTextInsertEvent(event)) {
			var text = String.fromCharCode(event.which);
			range = actions.insertText(range, text, editor);
			Ranges.select(range);
			event.preventDefault();
			return;
		}
	}

	var exports = {
		down: down,
		press: press
	};

	exports['down'] = down;

	return exports;
});
