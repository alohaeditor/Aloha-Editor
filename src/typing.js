/* typing.js is part of Aloha Editor project http://aloha-editor.org
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
	'undo',
	'overrides'
], function Typing(
	Dom,
	Keys,
	Maps,
	Html,
	Ranges,
	Editing,
	Traversing,
	Boundaries,
	Fn,
	Undo,
	Overrides
) {
	'use strict';

	function undoable(type, event, fn) {
		var range = event.range;
		var undoContext = event.editable.undoContext;
		Undo.capture(undoContext, {
			meta: {type: type},
			oldRange: range
		}, function () {
			range = fn();
			return {newRange: range};
		});
		return range;
	}

	function delete_(direction, event) {
		var range = event.range;
		if (range.collapsed) {
			range = (
				direction
					? Ranges.expandForwardToVisiblePosition
					: Ranges.expandBackwardToVisiblePosition
			)(range);
		}
		Editing.delete(
			Ranges.expandToVisibleCharacter(range),
			event.editable
		);
		Html.prop(range.commonAncestorContainer);
		return range;
	}

	function format(style, event) {
		Editing.format(event.range, style, true, event.editable);
		return event.range;
	}

	function break_(isLinebreak, event) {
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

	function toggleUndo(op, event) {
		var undoContext = event.editable.undoContext;
		op(undoContext, event.range, [event.range]);
		return event.range;
	}

	var deleteBackwards = {
		clearOverrides : true,
		preventDefault : true,
		undo           : 'delete',
		mutate         : Fn.partial(delete_, false)
	};

	var deleteForwards = {
		clearOverrides : true,
		preventDefault : true,
		undo           : 'delete',
		mutate         : Fn.partial(delete_, true)
	};

	var breakBlock = {
		deleteRange    : true,
		clearOverrides : true,
		preventDefault : true,
		undo           : 'enter',
		mutate         : Fn.partial(break_, false)
	};

	var breakLine = {
		deleteRange    : true,
		clearOverrides : true,
		preventDefault : true,
		undo           : 'enter',
		mutate         : Fn.partial(break_, true)
	};

	var formatBold = {
		preventDefault : true,
		undo           : 'bold',
		mutate         : Fn.partial(format, 'bold')
	};

	var formatItalic = {
		preventDefault : true,
		undo           : 'italic',
		mutate         : Fn.partial(format, 'italic')
	};

	var inputText = {
		deleteRange    : true,
		preventDefault : true,
		undo           : 'typing',
		mutate         : insertText
	};

	var undo = {
		clearOverrides : true,
		preventDefault : true,
		mutate         : Fn.partial(toggleUndo, Undo.undo)
	};

	var redo = {
		preventDefault : true,
		clearOverrides : true,
		mutate         : Fn.partial(toggleUndo, Undo.redo)
	};

	var handlers = {
		keyup     : {},
		keydown   : {},
		keypress  : {}
	};

	handlers.keydown[Keys.CODES.up] =
	handlers.keydown[Keys.CODES.down] =
	handlers.keydown[Keys.CODES.left] =
	handlers.keydown[Keys.CODES.right] = {clearOverrides: true};

	handlers.keydown[Keys.CODES.delete] = deleteForwards;
	handlers.keydown[Keys.CODES.backspace] = deleteBackwards;

	handlers.keydown[Keys.CODES.enter] = breakBlock;
	handlers.keydown['shift+' + Keys.CODES.enter] = breakLine;

	handlers.keypress['ctrl+' + Keys.CODES.bold] = formatBold;
	handlers.keypress['ctrl+' + Keys.CODES.italic] = formatItalic;

	handlers.keypress['ctrl+2'] = formatBold;
	handlers.keypress['ctrl+9'] = formatItalic;

	handlers.keypress.input = inputText;

	handlers.keyup['ctrl+' + Keys.CODES.undo] = undo;
	handlers.keyup['ctrl+shift+' + Keys.CODES.undo] = redo;

	function handler(event) {
		var modifier = event.meta ? event.meta + '+' : '';
		return (handlers[event.type]
		    && handlers[event.type][modifier + event.which])
		    || (event.isTextInput && handlers.keypress.input);
	}

	function handle(event) {
		if (!event.editable) {
			return;
		}
		var handle = handler(event);
		if (!handle) {
			return;
		}
		var range = event.range;
		if (handle.preventDefault) {
			event.native.preventDefault();
		}
		if (handle.clearOverrides) {
			event.editable.overrides = [];
		}
		if (range && handle.mutate) {
			if (handle.undo) {
				undoable(handle.undo, event, function () {
					if (handle.deleteRange && !range.collapsed) {
						delete_(event, false);
					}
					handle.mutate(event);
					Html.prop(range.commonAncestorContainer);
				});
			} else {
				handle.mutate(event);
			}
		}
		return event;
	}

	var exports = {
		handle : handle
	};

	exports['handle'] = handle;

	return exports;
});
