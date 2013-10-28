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
	'undo',
	'overrides'
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
	Undo,
	Overrides
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
			range = fn(editable);
			return {newRange: range};
		});
		return range;
	}

	function delete_(range, direction, editable) {
		if (range.collapsed) {
			range = (
				direction
					? Ranges.expandForwardToVisiblePosition
					: Ranges.expandBackwardToVisiblePosition
			)(range);
		}
		Editing.delete(Ranges.expandToVisibleCharacter(range), editable);
		Html.prop(range.commonAncestorContainer);
		return range;
	}

	var actions = {};

	actions[Keys.CODES.backspace] = function deleteBackwards(range, editor) {
		return undoable('delete', range, editor, function (editable) {
			editable.overrides = [];
			return delete_(range, false, editable);
		});
	};

	actions[Keys.CODES.delete] = function deleteForward(range, editor) {
		return undoable('delete', range, editor, function (editable) {
			editor.override = [];
			return delete_(range, true, editable);
		});
	};

	actions[Keys.CODES.enter] = function breakBlock(range, editor) {
		return undoable('enter', range, editor, function (editable) {
			Editing.break(
				range.collapsed ? range : delete_(range, true, editable),
				editable,
				false
			);
			Html.prop(range.commonAncestorContainer);
			return range;
		});
	};

	actions['shift+' + Keys.CODES.enter] = function breakLine(range, editor) {
		return undoable('enter', range, editor, function (editable) {
			Editing.break(
				range.collapsed ? range : delete_(range, true, editable),
				editable,
				true
			);
			Html.prop(range.commonAncestorContainer);
			return range;
		});
	};

	actions['ctrl+' + Keys.CODES.undo] = function undo(range, editor) {
		var editable = Editables.fromBoundary(editor, Boundaries.start(range));
		if (!editable) {
			return range;
		}
		var undoContext = editable.undoContext;
		Undo.undo(undoContext, range, [range]);
		return range;
	};

	actions['ctrl+shift+' + Keys.CODES.undo] = function redo(range, editor) {
		var editable = Editables.fromBoundary(editor, Boundaries.start(range));
		if (!editable) {
			return range;
		}
		var undoContext = editable.undoContext;
		Undo.redo(undoContext, range, [range]);
		return range;
	};

	actions['ctrl+' + Keys.CODES.bold] = function bold(range, editor) {
		return undoable('bold', range, editor, function (editable) {
			Editing.format(range, 'bold', true, editable);
			return range;
		});
	};

	actions['ctrl+' + Keys.CODES.italic] = function italic(range, editor) {
		return undoable('italic', range, editor, function () {
			Editing.format(range, 'italic', true);
			return range;
		});
	};

	actions.insertText = function insertText(range, text, editor) {
		var boundary = Boundaries.start(range);
		var editable = Editables.fromBoundary(editor, boundary);
		if (!editable) {
			return;
		}
		var undoContext = editable.undoContext;
		Undo.advanceHistory(undoContext);
		Undo.capture(undoContext, {
			meta: {type: 'typing'},
			oldRange: range
		}, function () {
			if (!range.collapsed) {
				range = delete_(range, true, editor);
				boundary = Boundaries.start(range);
			}
			if (' ' === text) {
				var elem = Traversing.upWhile(Boundaries.container(boundary), Dom.isTextNode);
				var whiteSpaceStyle = Dom.getComputedStyle(elem, 'white-space');
				if (!Html.isWhiteSpacePreserveStyle(whiteSpaceStyle)) {
					text = '\xa0';
				}
			}

			boundary = Overrides.consume(boundary, editable.overrides);
			Dom.setRangeFromBoundaries(range, boundary, boundary);

			var insertPath = Undo.pathFromBoundary(editable.elem, boundary);
			var insertContent = [editable.elem.ownerDocument.createTextNode(text)];
			var change = Undo.makeInsertChange(insertPath, insertContent);
			function capture(context) {
				return context.capture();
			}
			Undo.capture(undoContext, {noObserve: true}, function () {
				Dom.insertTextAtBoundary(text, boundary, true, [range]);
				return {changes: [change]};
			});
			return {newRange: range};
		});
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
		press: press,
		actions: actions
	};

	exports['down'] = down;

	return exports;
});
