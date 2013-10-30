/* interaction.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'keys',
	'maps',
	'html',
	'ranges',
	'editing',
	'traversing',
	'boundaries',
	'functions',
	'editables',
	'undo',
	'overrides',
	'misc'
], function Interaction(
	Dom,
	Keys,
	Maps,
	Html,
	Ranges,
	Editing,
	Traversing,
	Boundaries,
	Fn,
	Editables,
	Undo,
	Overrides,
	Misc
) {
	'use strict';

	function undoable(type, range, editable, fn) {
		var undoContext = editable.undoContext;
		Undo.capture(undoContext, {
			meta: {type: type},
			oldRange: range
		}, function () {
			range = fn();
			return {newRange: range};
		});
		return range;
	}

	function delete_(event, direction) {
		var range = event.range;
		if (range.collapsed) {
			range = (
				direction
					? Ranges.expandForwardToVisiblePosition
					: Ranges.expandBackwardToVisiblePosition
			)(range);
		}
		Editing.delete(Ranges.expandToVisibleCharacter(range), event.editable);
		Html.prop(range.commonAncestorContainer);
		return range;
	}

	function format(event, format) {
		Editing.format(event.range, format, true, event.editable);
		return event.range;
	}

	function break_(event, isLinebreak) {
		Editing.break(event.range, event.editable, isLinebreak);
		return event.range;
	}

	function insertText(event) {
		var editable = event.editable;
		var range = event.range;
		var text = event.chr;
		var boundary = Boundaries.start(range);

		if (' ' === text) {
			var elem = Traversing.upWhile(
				Boundaries.container(boundary),
				Dom.isTextNode
			);
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

		Undo.capture(editable.undoContext, {noObserve: true}, function () {
			Dom.insertTextAtBoundary(text, boundary, true, [range]);
			return {changes: [change]};
		});

		return range;
	}

	function toggleUndo(event, op) {
		var undoContext = event.editable.undoContext;
		op(undoContext, event.range, [event.range]);
		return event.range;
	}

	var deleteBackwards = {
		clearOverrides : true,
		preventDefault : true,
		arg            : false,
		undo           : 'delete',
		mutate         : delete_
	};

	var deleteForwards = {
		clearOverrides : true,
		preventDefault : true,
		arg            : true,
		undo           : 'delete',
		mutate         : delete_
	};

	var breakBlock = {
		deleteRange    : true,
		clearOverrides : true,
		preventDefault : true,
		arg            : false,
		undo           : 'enter',
		mutate         : break_
	};

	var breakLine = {
		deleteRange    : true,
		clearOverrides : true,
		preventDefault : true,
		arg            : true,
		undo           : 'enter',
		mutate         : break_
	};

	var formatBold = {
		preventDefault : true,
		arg            : 'bold',
		undo           : 'bold',
		mutate         : format
	};

	var formatItalic = {
		preventDefault : true,
		arg            : 'italic',
		undo           : 'italic',
		mutate         : format
	};

	var inputText = {
		deleteRange    : true,
		preventDefault : true,
		undo           : 'typing',
		mutate         : insertText
	}

	var undo = {
		clearOverrides : true,
		preventDefault : true,
		arg            : Undo.undo,
		mutate         : toggleUndo
	};

	var redo = {
		preventDefault : true,
		clearOverrides : true,
		arg            : Undo.redo,
		mutate         : toggleUndo
	};

	var handlers = {
		keyup     : {},
		keydown   : {},
		keypress  : {},
		mousedown : {}
	};

	handlers.mousedown[1]                           =
	handlers.mousedown[2]                           =
	handlers.mousedown[3]                           =
	handlers.keydown[Keys.CODES.up]                 =
	handlers.keydown[Keys.CODES.down]               =
	handlers.keydown[Keys.CODES.left]               =
	handlers.keydown[Keys.CODES.right]              = {clearOverrides: true};

	handlers.keydown[Keys.CODES.backspace]          = deleteBackwards;
	handlers.keydown[Keys.CODES.delete]             = deleteForwards;

	handlers.keydown[Keys.CODES.enter]              = breakBlock;
	handlers.keydown['shift+' + Keys.CODES.enter]   = breakLine;

	handlers.keypress['ctrl+' + Keys.CODES.bold]    = formatBold;
	handlers.keypress['ctrl+' + Keys.CODES.italic]  = formatItalic;

	handlers.keypress.input                         = inputText;

	handlers.keyup['ctrl+' + Keys.CODES.undo]       = undo;
	handlers.keyup['ctrl+shift+' + Keys.CODES.undo] = redo;

	function handlerFromEvent(event) {
		var modifier = event.meta ? event.meta + '+' : '';
		return (handlers[event.name]
		    && handlers[event.name][modifier + event.code])
		    || (event.isTextInput && handlers.keypress.input);
	}

	function basic(event) {
		var handler = handlerFromEvent(event);
		if (!handler) {
			return;
		}
		var range = event.range;
		if (handler.preventDefault) {
			event.event.preventDefault();
		}
		if (handler.clearOverrides) {
			Maps.forEach(
				event.editable ? [event.editable] : event.editor.editables,
				function (editable) {
					editable.overrides = [];
				}
			);
		}
		if (handler.deleteRange && range && !range.collapsed) {
			delete_(event, false);
		}
		if (handler.mutate) {
			if (handler.undo) {
				undoable(handler.undo, range, event.editable, function () {
					handler.mutate(event, handler.arg);
					Html.prop(range.commonAncestorContainer);
				});
			} else {
				handler.mutate(event, handler.arg);
				Html.prop(range.commonAncestorContainer);
			}
		}
		return event;
	}

	function thread() {
		var needle = arguments[0];
		var i;
		var len = arguments.length;
		for (i = 1; i < len; i++) {
			needle = Misc.copy(arguments[i](needle)) || needle;
		}
	}

	var exports = {
		basic  : basic,
		thread : thread
	};

	exports['basic'] = basic;
	exports['thread'] = thread;

	return exports;
});
