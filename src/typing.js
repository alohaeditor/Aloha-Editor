/**
 * typing.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'mutation',
	'keys',
	'html',
	'ranges',
	'editing',
	'traversing',
	'boundaries',
	'functions',
	'undo',
	'overrides'
], function (
	Dom,
	Mutation,
	Keys,
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
		Undo.capture(alohaEvent.editable['undoContext'], {
			'meta': {type: type},
			'oldRange': range
		}, function () {
			range = fn();
			return {'newRange': range};
		});
		return range;
	}

	function delete_(direction, alohaEvent) {
		var range = alohaEvent.range;
		var boundary;
		if (range.collapsed) {
			if (direction) {
				boundary = Boundaries.fromRangeEnd(range);
				Boundaries.setRangeEnd(range, Traversing.next(boundary));
			} else {
				boundary = Boundaries.fromRangeStart(range);
				Boundaries.setRangeStart(range, Traversing.prev(boundary));
			}
		}
		Editing.remove(
			Ranges.envelopeInvisibleCharacters(range),
			alohaEvent.editable
		);
		Html.prop(range.commonAncestorContainer);
		return range;
	}

	function format(style, alohaEvent) {
		var boundaries = Boundaries.fromRange(alohaEvent.range);
		if (Html.isBoundariesEqual(boundaries[0], boundaries[1])) {
			var override = Overrides.nodeToState[style];
			if (override) {
				alohaEvent.editable.overrides = Overrides.toggle(
					alohaEvent.editable.overrides,
					[override, true]
				);
			}
			return alohaEvent.range;
		}
		boundaries = Editing.format(style, boundaries[0], boundaries[1]);
		return Ranges.fromBoundaries(boundaries[0], boundaries[1]);
	}

	function break_(isLinebreak, alohaEvent) {
		Editing.breakline(
			alohaEvent.range,
			alohaEvent.editable.defaultBlockNodeName,
			isLinebreak
		);
		return alohaEvent.range;
	}

	function insertText(alohaEvent) {
		var editable = alohaEvent.editable;
		var text = alohaEvent.chr;
		var range = alohaEvent.range;
		var boundary = Boundaries.fromRangeStart(range);

		if (' ' === text) {
			var elem = Dom.upWhile(
				Boundaries.container(boundary),
				Dom.isTextNode
			);
			var whiteSpaceStyle = Dom.getComputedStyle(elem, 'white-space');
			if (!Html.isWhiteSpacePreserveStyle(whiteSpaceStyle)) {
				text = '\xa0';
			}
		}

		boundary = Overrides.consume(boundary, editable.overrides);
		Boundaries.setRange(range, boundary, boundary);

		var insertPath = Undo.pathFromBoundary(editable['elem'], boundary);
		var insertContent = [editable['elem'].ownerDocument.createTextNode(text)];
		var change = Undo.makeInsertChange(insertPath, insertContent);

		Undo.capture(editable['undoContext'], {noObserve: true}, function () {
			Mutation.insertTextAtBoundary(text, boundary, true, [range]);
			return {changes: [change]};
		});

		return range;
	}

	function toggleUndo(op, alohaEvent) {
		op(alohaEvent.editable['undoContext'], alohaEvent.range, [alohaEvent.range]);
		return alohaEvent.range;
	}

	function selectEditable(alohaEvent) {
		var editable = Dom.editingHost(alohaEvent.range.commonAncestorContainer);
		if (editable) {
			alohaEvent.range = Ranges.create(
				editable,
				0,
				editable,
				Dom.nodeLength(editable)
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
		mutate         : Fn.partial(format, 'B')
	};

	var formatItalic = {
		preventDefault : true,
		undo           : 'italic',
		mutate         : Fn.partial(format, 'I')
	};

	var formatUnderline = {
		preventDefault : true,
		undo           : 'underline',
		mutate         : Fn.partial(format, 'U')
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

	var actions = {
		'deleteBackward' : deleteBackward,
		'deleteForward'  : deleteForward,
		'breakBlock'     : breakBlock,
		'breakLine'      : breakLine,
		'formatBold'     : formatBold,
		'formatItalic'   : formatItalic,
		'inputText'      : inputText,
		'undo'           : undo,
		'redo'           : redo
	};

	var handlers = {
		'keyup'    : {},
		'keydown'  : {},
		'keypress' : {}
	};

	handlers['keydown'][Keys.CODES['up']] =
	handlers['keydown'][Keys.CODES['down']] =
	handlers['keydown'][Keys.CODES['left']] =
	handlers['keydown'][Keys.CODES['right']] = {clearOverrides: true};

	handlers['keydown'][Keys.CODES['delete']] = deleteForward;
	handlers['keydown'][Keys.CODES['backspace']] = deleteBackward;
	handlers['keydown'][Keys.CODES['enter']] = breakBlock;
	handlers['keydown']['shift+' + Keys.CODES['enter']] = breakLine;
	handlers['keydown']['ctrl+'  + Keys.CODES['bold']] =
	handlers['keydown']['meta+'  + Keys.CODES['bold']] = formatBold;
	handlers['keydown']['ctrl+'  + Keys.CODES['italic']] =
	handlers['keydown']['meta+'  + Keys.CODES['italic']] = formatItalic;
	handlers['keydown']['ctrl+'  + Keys.CODES['underline']] =
	handlers['keydown']['meta+'  + Keys.CODES['underline']] = formatUnderline;
	handlers['keydown']['ctrl+'  + Keys.CODES['selectAll']] =
	handlers['keydown']['meta+'  + Keys.CODES['selectAll']] = selectAll;
	handlers['keydown']['ctrl+'  + Keys.CODES['undo']] =
	handlers['keydown']['meta+'  + Keys.CODES['undo']] = undo;
	handlers['keydown']['ctrl+shift+' + Keys.CODES['undo']] =
	handlers['keydown']['meta+shift+' + Keys.CODES['undo']] = redo;

	handlers['keypress']['input'] = inputText;

	function handler(alohaEvent) {
		var modifier = alohaEvent.meta ? alohaEvent.meta + '+' : '';
		return (handlers[alohaEvent.type]
		    && handlers[alohaEvent.type][modifier + alohaEvent.which])
		    || (alohaEvent.isTextInput && handlers['keypress']['input']);
	}

	function doHandling(alohaEvent) {
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
					alohaEvent.range = handle.mutate(alohaEvent);
					Html.prop(range.commonAncestorContainer);
				});
			} else {
				alohaEvent.range = handle.mutate(alohaEvent);
			}
		}
		return alohaEvent;
	}

	return {
		handle  : doHandling,
		actions : actions
	};
});
