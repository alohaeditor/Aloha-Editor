/**
 * typing.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'keys',
	'html',
	'maps',
	'undo',
	'ranges',
	'editing',
	'mutation',
	'traversing',
	'boundaries',
	'overrides',
	'functions'
], function (
	Dom,
	Keys,
	Html,
	Maps,
	Undo,
	Ranges,
	Editing,
	Mutation,
	Traversing,
	Boundaries,
	Overrides,
	Fn
) {
	'use strict';

	function undoable(type, event, fn) {
		var range = event.range;
		Undo.capture(event.editable['undoContext'], {
			meta: {type: type},
			oldRange: range
		}, function () {
			range = fn();
			return {newRange: range};
		});
		return range;
	}

	function remove(direction, event) {
		var range = event.range;
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
			event.editable
		);
		Html.prop(range.commonAncestorContainer);
		return range;
	}

	function format(style, event) {
		var boundaries = Boundaries.fromRange(event.range);
		if (Html.isBoundariesEqual(boundaries[0], boundaries[1])) {
			var override = Overrides.nodeToState[style];
			if (override) {
				var context = event.editor.selectionContext;
				context.overrides = context.overrides.concat([
					Overrides.toggle(
						Overrides.harvest(Boundaries.container(boundaries[0])),
						override,
						true
					)
				]);
			}
			return event.range;
		}
		if (!Boundaries.isBoundaryInsideNode(boundaries[0], style)) {
			boundaries = Editing.format(style, boundaries[0], boundaries[1]);
		} else {
			boundaries = Editing.unFormat(style, boundaries[0], boundaries[1]);
		}
		return Ranges.fromBoundaries(boundaries[0], boundaries[1]);
	}

	function breakline(isLinebreak, event) {
		if (!isLinebreak) {
			event.editor.selectionContext.formatting = event.editor.selectionContext.formatting.concat(
				Overrides.harvest(event.range.startContainer)
			);
		}
		Editing.breakline(
			event.range,
			event.editable.settings.defaultBlockNodeName,
			isLinebreak
		);
		return event.range;
	}

	function insertText(event) {
		var editable = event.editable;
		var range = event.range;
		var text = event.chr;
		var boundary = Boundaries.fromRangeStart(range);

		if ('\t' === text) {
			text = '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0';
		}

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

		boundary = Overrides.consume(
			boundary,
			event.editor.selectionContext.formatting.concat(
				event.editor.selectionContext.overrides
			)
		);
		event.editor.selectionContext.overrides = [];
		event.editor.selectionContext.formatting = [];

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

	function toggleUndo(op, event) {
		op(event.editable['undoContext'], event.range, [event.range]);
		return event.range;
	}

	function selectEditable(event) {
		var editable = Dom.editingHost(event.range.commonAncestorContainer);
		if (editable) {
			event.range = Ranges.fromBoundaries(
				Boundaries.create(editable, 0),
				Boundaries.fromEndOfNode(editable)
			);
		}
		return event.range;
	}

	var deleteBackward = {
		clearOverrides : true,
		preventDefault : true,
		undo           : 'delete',
		mutate         : Fn.partial(remove, false)
	};

	var deleteForward = {
		clearOverrides : true,
		preventDefault : true,
		undo           : 'delete',
		mutate         : Fn.partial(remove, true)
	};

	var breakBlock = {
		deleteRange    : true,
		preventDefault : true,
		undo           : 'enter',
		mutate         : Fn.partial(breakline, false)
	};

	var breakLine = {
		deleteRange    : true,
		preventDefault : true,
		undo           : 'enter',
		mutate         : Fn.partial(breakline, true)
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
		'breakBlock'     : breakBlock,
		'breakLine'      : breakLine,
		'deleteBackward' : deleteBackward,
		'deleteForward'  : deleteForward,
		'formatBold'     : formatBold,
		'formatItalic'   : formatItalic,
		'inputText'      : inputText,
		'redo'           : redo,
		'undo'           : undo
	};

	var handlers = {
		'keydown'  : {},
		'keypress' : {},
		'keyup'    : {}
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
	handlers['keydown'][Keys.CODES['tab']] = inputText;

	handlers['keypress']['input'] = inputText;

	function handler(event) {
		var modifier = event.meta ? event.meta + '+' : '';
		return (handlers[event.type]
		    && handlers[event.type][modifier + event.which])
		    || (event.isTextInput && handlers['keypress']['input']);
	}

	function handle(event) {
		if (!event.editable) {
			return event;
		}
		var handling = handler(event);
		if (!handling) {
			return event;
		}
		var range = event.range;
		if (handling.preventDefault) {
			event.nativeEvent.preventDefault();
		}
		if (handling.clearOverrides) {
			event.editor.selectionContext.overrides = [];
			event.editor.selectionContext.formatting = [];
		}
		if (range && handling.mutate) {
			if (handling.undo) {
				undoable(handling.undo, event, function () {
					if (handling.deleteRange && !range.collapsed) {
						remove(false, event);
					}
					event.range = handling.mutate(event);
					Html.prop(range.commonAncestorContainer);
				});
			} else {
				event.range = handling.mutate(event);
			}
		}
		return event;
	}

	return {
		handle  : handle,
		actions : actions
	};
});
