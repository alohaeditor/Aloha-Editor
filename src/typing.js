/**
 * typing.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom/nodes',
	'dom/style',
	'dom',
	'mutation',
	'keys',
	'maps',
	'html',
	'ranges',
	'editing',
	'dom/traversing',
	'boundaries',
	'functions',
	'undo',
	'overrides'
], function Typing(
	Nodes,
	Style,
	Dom,
	Mutation,
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

	function undoable(type, alohaEvent, fn) {
		var range = alohaEvent.range;
		var undoContext = alohaEvent.editable.undoContext;
		Undo.capture(undoContext, {
			meta: {type: type},
			oldRange: range
		}, function () {
			range = fn();
			return {newRange: range};
		});
		return range;
	}

	function delete_(direction, alohaEvent) {
		var range = alohaEvent.range;
		var boundary;
		if (range.collapsed) {
			if (direction) {
				boundary = Boundaries.fromRangeEnd(range);
				Boundaries.setRangeEnd(range, Html.next(boundary));
			} else {
				boundary = Boundaries.fromRangeStart(range);
				Boundaries.setRangeStart(range, Html.prev(boundary));
			}
		}
		Editing.delete(
			Ranges.envelopeInvisibleCharacters(range),
			alohaEvent.editable
		);
		Html.prop(range.commonAncestorContainer);
		return range;
	}

	function format(style, alohaEvent) {
		Editing.format(alohaEvent.range, style, true, alohaEvent.editable);
		return alohaEvent.range;
	}

	function break_(isLinebreak, alohaEvent) {
		Editing.break(alohaEvent.range, alohaEvent.editable, isLinebreak);
		return alohaEvent.range;
	}

	function insertText(alohaEvent) {
		var editable = alohaEvent.editable;
		var range = alohaEvent.range;
		var text = alohaEvent.chr;
		var boundary = Boundaries.fromRangeStart(range);

		if (' ' === text) {
			var elem = Traversing.upWhile(
				Boundaries.container(boundary),
				Nodes.isTextNode
			);
			var whiteSpaceStyle = Style.getComputedStyle(elem, 'white-space');
			if (!Html.isWhiteSpacePreserveStyle(whiteSpaceStyle)) {
				text = '\xa0';
			}
		}

		boundary = Overrides.consume(boundary, editable.overrides);
		Boundaries.setRange(range, boundary, boundary);

		var insertPath = Undo.pathFromBoundary(editable.elem, boundary);
		var insertContent = [editable.elem.ownerDocument.createTextNode(text)];
		var change = Undo.makeInsertChange(insertPath, insertContent);

		Undo.capture(editable.undoContext, {noObserve: true}, function () {
			Mutation.insertTextAtBoundary(text, boundary, true, [range]);
			return {changes: [change]};
		});

		return range;
	}

	function toggleUndo(op, alohaEvent) {
		var undoContext = alohaEvent.editable.undoContext;
		op(undoContext, alohaEvent.range, [alohaEvent.range]);
		return alohaEvent.range;
	}

	function selectEditable(alohaEvent) {
		var editable = Dom.editingHost(alohaEvent.range.commonAncestorContainer);
		if (editable) {
			alohaEvent.range = Ranges.create(
				editable,
				0,
				editable,
				Nodes.nodeLength(editable)
			);
		}
	}

	var deleteBackward = {
		clearOverrides : true,
		preventDefault : true,
		undo           : 'delete',
		mutate         : Fn.partial(delete_, false)
	};

	var deleteForward = {
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

	var formatUnderline = {
		preventDefault : true,
		undo           : 'underline',
		mutate         : Fn.partial(format, 'underline')
	};

	var inputText = {
		deleteRange    : true,
		preventDefault : true,
		undo           : 'typing',
		mutate         : insertText
	};

	var selectAll = {
		preventDefault : true,
		clearOverrides : true,
		mutate         : selectEditable
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
		keyup    : {},
		keydown  : {},
		keypress : {}
	};

	var actions = {
		deleteBackward: deleteBackward,
		deleteForward: deleteForward,
		breakBlock: breakBlock,
		breakLine: breakLine,
		formatBold: formatBold,
		formatItalic: formatItalic,
		inputText: inputText,
		undo: undo,
		redo: redo
	};

	handlers.keydown[Keys.CODES.up] =
		handlers.keydown[Keys.CODES.down] =
		handlers.keydown[Keys.CODES.left] =
		handlers.keydown[Keys.CODES.right] = {clearOverrides: true};

	handlers.keydown[Keys.CODES.delete] = deleteForward;
	handlers.keydown[Keys.CODES.backspace] = deleteBackward;
	handlers.keydown[Keys.CODES.enter] = breakBlock;
	handlers.keydown['shift+' + Keys.CODES.enter] = breakLine;
	handlers.keydown['ctrl+' + Keys.CODES.bold] = formatBold;
	handlers.keydown['ctrl+' + Keys.CODES.italic] = formatItalic;
	handlers.keydown['ctrl+' + Keys.CODES.underline] = formatUnderline;
	handlers.keydown['ctrl+' + Keys.CODES.selectAll] = selectAll;

	handlers.keypress.input = inputText;

	handlers.keyup['ctrl+' + Keys.CODES.undo] = undo;
	handlers.keyup['ctrl+shift+' + Keys.CODES.undo] = redo;

	function handler(alohaEvent) {
		var modifier = alohaEvent.meta ? alohaEvent.meta + '+' : '';
		return (handlers[alohaEvent.type]
		    && handlers[alohaEvent.type][modifier + alohaEvent.which])
		    || (alohaEvent.isTextInput && handlers.keypress.input);
	}

	function handle(alohaEvent) {
		if (!alohaEvent.editable) {
			return alohaEvent;
		}
		var handle = handler(alohaEvent);
		if (!handle) {
			return alohaEvent;
		}
		var range = alohaEvent.range;
		if (handle.preventDefault) {
			alohaEvent.nativeEvent.preventDefault();
		}
		if (handle.clearOverrides) {
			alohaEvent.editable.overrides = [];
		}
		if (range && handle.mutate) {
			if (handle.undo) {
				undoable(handle.undo, alohaEvent, function () {
					if (handle.deleteRange && !range.collapsed) {
						delete_(false, alohaEvent);
					}
					handle.mutate(alohaEvent);
					Html.prop(range.commonAncestorContainer);
				});
			} else {
				handle.mutate(alohaEvent);
			}
		}
		return alohaEvent;
	}

	return {
		handle  : handle,
		actions : actions
	};
});
