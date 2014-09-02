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
	'undo',
	'arrays',
	'editing',
	'strings',
	'metaview',
	'mutation',
	'selections',
	'traversing',
	'boundaries',
	'overrides',
	'functions'
], function (
	Dom,
	Keys,
	Html,
	Undo,
	Arrays,
	Editing,
	Strings,
	Metaview,
	Mutation,
	Selections,
	Traversing,
	Boundaries,
	Overrides,
	Fn
) {
	'use strict';

	function undoable(type, event, fn) {
		var range = Boundaries.range(event.boundaries[0], event.boundaries[1]);
		Undo.capture(event.editable.undoContext, {
			meta: {type: type},
			oldRange: range
		}, function () {
			range = fn();
			return {newRange: range};
		});
	}

	/**
	 * Joins a variable list of overrides-lists into a single unique set.
	 *
	 * @private
	 * @param  {Array.<Override>...}
	 * @param  {Array.<Override>}
	 */
	function joinToSet() {
		return Overrides.unique(
			Array.prototype.concat.apply([], Arrays.coerce(arguments))
		);
	}

	/**
	 * Removes unrendered containers from each of the given boundaries while
	 * preserving the correct position of all.
	 *
	 * Returns a new set of boundaries that represent the corrected positions
	 * following node-removal. The order of the returned list corresponds with
	 * the list of boundaries that was given.
	 *
	 * @private
	 * @param  {Array.<Boundary>} boundaries
	 * @return {Array.<Boundary>}
	 */
	function removeUnrenderedContainers(boundaries) {
		function remove (node) {
			boundaries = Mutation.removeNode(node, boundaries);
		}
		for (var i = 0; i < boundaries.length; i++) {
			Dom.climbUntil(Boundaries.container(boundaries[i]), remove, Html.isRendered);
		}
		return boundaries;
	}

	function remove(direction, event) {
		var start = event.boundaries[0];
		var end = event.boundaries[1];
		if (Boundaries.equals(start, end)) {
			if (direction) {
				end = Traversing.next(end);
			} else {
				start = Traversing.prev(start);
			}
		}
		var boundaries = Editing.remove(
			start,
			Traversing.envelopeInvisibleCharacters(end)
		);
		event.editor.selection.formatting = joinToSet(
			event.editor.selection.formatting,
			Overrides.harvest(Boundaries.container(boundaries[0]))
		);
		boundaries = removeUnrenderedContainers(boundaries);
		Html.prop(Boundaries.commonContainer(boundaries[0], boundaries[1]));
		return boundaries;
	}

	function format(style, event) {
		var boundaries = event.boundaries;
		if (!Html.isBoundariesEqual(boundaries[0], boundaries[1])) {
			return Editing.toggle(boundaries[0], boundaries[1], style);
		}
		var override = Overrides.nodeToState[style];
		if (!override) {
			return event.boundaries;
		}
		var context = event.editor.selection;
		var overrides = joinToSet(
			context.formatting,
			Overrides.harvest(Boundaries.container(boundaries[0])),
			context.overrides
		);
		context.overrides = Overrides.toggle(overrides, override, true);
		return event.boundaries;
	}

	function breakline(isLinebreak, event) {
		if (!isLinebreak) {
			event.editor.selection.formatting = joinToSet(
				event.editor.selection.formatting,
				Overrides.harvest(Boundaries.container(event.boundaries[0]))
			);
		}
		var breaker = (event.meta.indexOf('shift') > -1)
		            ? 'BR'
		            : event.editable.settings.defaultBlock;
		return Editing.breakline(event.boundaries[1], breaker);
	}

	function insertText(event) {
		var editable = event.editable;
		var text = String.fromCharCode(event.keycode);
		var boundary = event.boundaries[0];
		if ('\t' === text) {
			text = '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0';
		}
		if (' ' === text) {
			var whiteSpaceStyle = Dom.getComputedStyle(
				Dom.upWhile(Boundaries.container(boundary), Dom.isTextNode),
				'white-space'
			);
			if (!Html.isWhiteSpacePreserveStyle(whiteSpaceStyle)) {
				text = '\xa0';
			}
		}
		var context = event.editor.selection;
		boundary = Overrides.consume(
			boundary,
			joinToSet(context.formatting, context.overrides)
		);
		context.overrides = [];
		context.formatting = [];
		var range = Boundaries.range(boundary, boundary);
		var insertPath = Undo.pathFromBoundary(editable.elem, boundary);
		var insertContent = [editable.elem.ownerDocument.createTextNode(text)];
		var change = Undo.makeInsertChange(insertPath, insertContent);
		Undo.capture(editable.undoContext, {noObserve: true}, function () {
			Mutation.insertTextAtBoundary(text, boundary, true, [range]);
			return {changes: [change]};
		});
		return Boundaries.fromRange(range);
	}

	function toggleUndo(op, event) {
		var range = Boundaries.range(event.boundaries[0], event.boundaries[1]);
		op(event.editable.undoContext, range, [range]);
		return Boundaries.fromRange(range);
	}

	function selectEditable(event) {
		var editable = Dom.editingHost(Boundaries.commonContainer(
			event.boundaries[0],
			event.boundaries[1]
		));
		return !editable ? event.boundaries : [
			Boundaries.create(editable, 0),
			Boundaries.fromEndOfNode(editable)
		];
	}

	/**
	 * Whether or not the given event represents a text input.
	 *
	 * @see
	 * https://lists.webkit.org/pipermail/webkit-dev/2007-December/002992.html
	 *
	 * @private
	 * @param  {AlohaEvent} event
	 * @return {boolean}
	 */
	function isTextInput(event) {
		return 'keypress' === event.type
		    && 'alt' !== event.meta
			&& 'ctrl' !== event.meta
		    && !Strings.isControlCharacter(String.fromCharCode(event.keycode));
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
		removeContent  : true,
		preventDefault : true,
		undo           : 'enter',
		mutate         : Fn.partial(breakline, false)
	};

	var breakLine = {
		removeContent  : true,
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
		removeContent  : true,
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

	// alt+0
	handlers['keydown']['ctrl+48'] = {mutate : function toggleUndo(event) {
		if (event.editable) {
			Metaview.toggle(event.editable.elem);
		}
		return event.boundaries;
	}};
	// alt+1
	handlers['keydown']['ctrl+49'] = {mutate : function toggleUndo(event) {
		if (event.editable) {
			Metaview.toggle(event.editable.elem, {
				'outline': true,
				'tagname': true
			});
		}
		return event.boundaries;
	}};
	// alt+2
	handlers['keydown']['ctrl+50'] = {mutate : function toggleUndo(event) {
		if (event.editable) {
			Metaview.toggle(event.editable.elem, {
				'outline': true,
				'tagname': true,
				'padding': true
			});
		}
		return event.boundaries;
	}};

	function handler(event) {
		var modifier = event.meta ? event.meta + '+' : '';
		return (handlers[event.type]
		    && handlers[event.type][modifier + event.keycode])
		    || (isTextInput(event) && handlers['keypress']['input']);
	}

	/**
	 * Updates:
	 * 		boundaries
	 * 		editor.selection
	 * 		nativeEvent
	 */
	function handleTyping(event) {
		if (!event.editable) {
			return event;
		}
		var handling = handler(event);
		if (!handling) {
			return event;
		}
		if (handling.preventDefault) {
			event.nativeEvent.preventDefault();
		}
		if (handling.clearOverrides) {
			event.editor.selection.overrides = [];
			event.editor.selection.formatting = [];
		}
		if (event.boundaries && handling.mutate) {
			if (handling.undo) {
				undoable(handling.undo, event, function () {
					if (handling.removeContent
						&& !Boundaries.equals(event.boundaries[0], event.boundaries[1])) {
						remove(false, event);
					}
					event.boundaries = handling.mutate(event);
					Html.prop(Boundaries.commonContainer(
						event.boundaries[0],
						event.boundaries[1]
					));
				});
			} else {
				event.boundaries = handling.mutate(event);
			}
		}
		return event;
	}

	return {
		handleTyping  : handleTyping,
		actions       : actions
	};
});
