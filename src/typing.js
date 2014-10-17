/**
 * typing.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * @namespace typing
 */
define([
	'dom',
	'keys',
	'html',
	'undo',
	'lists',
	'events',
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
	Lists,
	Events,
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
		var range = Boundaries.range(
			event.selection.boundaries[0],
			event.selection.boundaries[1]
		);
		Undo.capture(event.editable.undoContext, {
			meta: {type: type},
			oldRange: range
		}, function () {
			range = fn();
			return {newRange: range};
		});
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
		var selection = event.selection;
		var start = selection.boundaries[0];
		var end = selection.boundaries[1];
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
		selection.formatting = Overrides.joinToSet(
			selection.formatting,
			Overrides.harvest(Boundaries.container(boundaries[0]))
		);
		boundaries = removeUnrenderedContainers(boundaries);
		Html.prop(Boundaries.commonContainer(boundaries[0], boundaries[1]));
		return boundaries;
	}

	function format(style, event) {
		var selection = event.selection;
		var boundaries = selection.boundaries;
		if (!Html.isBoundariesEqual(boundaries[0], boundaries[1])) {
			return Editing.toggle(boundaries[0], boundaries[1], style);
		}
		var override = Overrides.nodeToState[style];
		if (!override) {
			return boundaries;
		}
		var overrides = Overrides.joinToSet(
			selection.formatting,
			Overrides.harvest(Boundaries.container(boundaries[0])),
			selection.overrides
		);
		selection.overrides = Overrides.toggle(overrides, override, true);
		return selection.boundaries;
	}

	function breakline(isLinebreak, event) {
		if (!isLinebreak) {
			event.selection.formatting = Overrides.joinToSet(
				event.selection.formatting,
				Overrides.harvest(Boundaries.container(event.selection.boundaries[0]))
			);
		}
		var breaker = (event.meta.indexOf('shift') > -1)
		            ? 'BR'
		            : event.editable.settings.defaultBlock;
		return Editing.breakline(event.selection.boundaries[1], breaker);
	}

	/**
	 * Checks whether the given normalized boundary is immediately behind of a
	 * whitespace character.
	 *
	 * @private
	 * @param  {!Boundary} boundary
	 * @return {boolean}
	 */
	function isBehindWhitespace(boundary) {
		var text = Boundaries.container(boundary).data;
		var offset = Boundaries.offset(boundary);
		return Strings.WHITE_SPACE.test(text.substr(offset - 1, 1));
	}

	/**
	 * Checks whether the given normalized boundary is immediately in front of a
	 * whitespace character.
	 *
	 * @private
	 * @param  {!Boundary} boundary
	 * @return {boolean}
	 */
	function isInfrontWhitespace(boundary) {
		var text = Boundaries.container(boundary).data;
		var offset = Boundaries.offset(boundary);
		return Strings.WHITE_SPACE.test(text.substr(offset, 1));
	}

	/**
	 * Given a normalized boundary, determines the appropriate white-space that
	 * should be inserted at the given normalized boundary position.
	 *
	 * Strategy:
	 *
	 * A non-breaking-white-space (0x00a0) is required if none of the two
	 * conditions below is met:
	 *
	 * Condition 1.
	 *
	 * The boundary is inside a text node with non-space characters adjacent on
	 * either side. This is often the case when seperating words with a space.
	 *
	 *
	 * Condition 2.
	 *
	 * From the boundary it is possible to locate a preceeding text node (using
	 * pre-order-backtracing traversal Dom.backwardPreorderBacktracingUntil)
	 * whose last character is a non-space character. This text node must be
	 * located before encountering a linebreaking element.
	 *
	 * ... and ...
	 *
	 * From the boundary it is possible to locate a preceeding text node (using
	 * pre-order-backtracing traversal. Dom.forwardPreorderBacktracingUntil)
	 * whose first character is a non-space character. This text node must be
	 * located before encountering a linebreaking element.
	 *
	 * @private
	 * @param  {!Boundary} boundary
	 * @return {string}
	 */
	function appropriateWhitespace(boundary) {
		if (Boundaries.isTextBoundary(boundary)) {
			return (isBehindWhitespace(boundary) || isInfrontWhitespace(boundary))
			     ? '\xa0'
			     : ' ';
		}
		var node = Boundaries.container(boundary);
		var stop = Dom.backwardPreorderBacktraceUntil(node, function (node) {
			return Dom.isTextNode(node)
			    || Dom.isEditingHost(node)
			    || Html.hasLinebreakingStyle(node);
		});
		if (Dom.isElementNode(stop)) {
			return '\xa0';
		}
		if (isBehindWhitespace(Boundaries.fromEndOfNode(stop))) {
			return '\xa0';
		}
		stop = Dom.forwardPreorderBacktraceUntil(node, function (node) {
			return Dom.isTextNode(node)
			    || Dom.isEditingHost(node)
			    || Html.hasLinebreakingStyle(node);
		});
		if (Dom.isElementNode(stop)) {
			return '\xa0';
		}
		if (isInfrontWhitespace(Boundaries.fromStartOfNode(stop))) {
			return '\xa0';
		}
		return ' ';
	}

	/**
	 * Looks to see if the boundary is immediately in front of a non-breaking
	 * whitespace and replaces it with a regular whitespace.
	 *
	 * It is necessary to do this normalization every time we insert any
	 * character that is not a whitespace character in order to not end up with
	 * a situation where all spaces between words being non-breaking
	 * whitespaces. Such a situation would otherwise arise because, when space
	 * inserting spaces at the end of a block-level element, these spaces need
	 * to be non-breaking whitespace for them to be visible.  But when a
	 * non-space character is inserted, that non-breaking whitespace is no
	 * longer needed and should converted to a collapsable whitespace.
	 *
	 * @private
	 * @param  {!Boundary} boundary
	 */
	function normalizePreceedingWhitespace(boundary) {
		var node, offset;
		if (Boundaries.isTextBoundary(boundary)) {
			node = Boundaries.container(boundary);
			offset = Boundaries.offset(boundary);
		} else {
			node = Boundaries.nodeBefore(boundary);
			if (node && Dom.isTextNode(node)) {
				offset = node.data.length;
			}
		}
		if (!node) {
			return;
		}
		var text = node.data;
		if (text && Strings.NON_BREAKING_SPACE.test(text.substr(offset - 1, 1))) {
			node.data = text.substr(0, offset - 1) + ' ' + text.substr(offset);
		}
	}

	function indent(event) {
		var boundaries = event.selection.boundaries;
		var start = boundaries[0];
		var end = boundaries[1];
		if (Lists.isIndentationRange(start, end)) {
			return Lists.indent(start, end);
		}
		if (!Boundaries.equals(start, end)) {
			event.selection.boundaries = remove(false, event);
		}
		return insertText(event);
	}

	function insertText(event) {
		var editable = event.editable;
		var selection = event.selection;
		var text = String.fromCharCode(event.keycode);
		var boundary = selection.boundaries[0];
		if ('\t' === text) {
			text = '\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0';
		} else if (' ' === text) {
			var whiteSpaceStyle = Dom.getComputedStyle(
				Dom.upWhile(Boundaries.container(boundary), Dom.isTextNode),
				'white-space'
			);
			if (!Html.isWhiteSpacePreserveStyle(whiteSpaceStyle)) {
				text = appropriateWhitespace(boundary);
			}
		} else {
			normalizePreceedingWhitespace(boundary);
		}
		boundary = Overrides.consume(boundary, Overrides.joinToSet(
			selection.formatting,
			selection.overrides
		));
		selection.overrides = [];
		selection.formatting = [];
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
		var range = Boundaries.range(
			event.selection.boundaries[0],
			event.selection.boundaries[1]
		);
		op(event.editable.undoContext, range, [range]);
		return Boundaries.fromRange(range);
	}

	function selectEditable(event) {
		var editable = Dom.editingHost(Boundaries.commonContainer(
			event.selection.boundaries[0],
			event.selection.boundaries[1]
		));
		return !editable ? event.selection.boundaries : [
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

	var indentContent = {
		preventDefault : true,
		undo           : 'indent',
		mutate         : indent
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

	/**
	 * This variable is missing documentation.
	 * @TODO Complete documentation.
	 *
	 * @memberOf typing
	 */
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

	handlers['keydown']['up'] =
	handlers['keydown']['down'] =
	handlers['keydown']['left'] =
	handlers['keydown']['right'] = {clearOverrides: true};

	handlers['keydown']['delete'] = deleteForward;
	handlers['keydown']['backspace'] = deleteBackward;
	handlers['keydown']['enter'] = breakBlock;
	handlers['keydown']['shift+enter'] = breakLine;
	handlers['keydown']['ctrl+b'] =
	handlers['keydown']['meta+b'] = formatBold;
	handlers['keydown']['ctrl+i'] =
	handlers['keydown']['meta+i'] = formatItalic;
	handlers['keydown']['ctrl+u'] =
	handlers['keydown']['meta+u'] = formatUnderline;
	handlers['keydown']['ctrl+a'] =
	handlers['keydown']['meta+a'] = selectAll;
	handlers['keydown']['ctrl+z'] =
	handlers['keydown']['meta+z'] = undo;
	handlers['keydown']['ctrl+shift+z'] =
	handlers['keydown']['meta+shift+z'] = redo;
	handlers['keydown']['tab'] = indentContent;

	handlers['keypress']['input'] = inputText;

	handlers['keydown']['ctrl+0'] = {mutate : function toggleUndo(event) {
		if (event.editable) {
			Metaview.toggle(event.editable.elem);
		}
		return event.selection.boundaries;
	}};

	handlers['keydown']['ctrl+1'] = {mutate : function toggleUndo(event) {
		if (event.editable) {
			Metaview.toggle(event.editable.elem, {
				'outline': true,
				'tagname': true
			});
		}
		return event.selection.boundaries;
	}};

	handlers['keydown']['ctrl+2'] = {mutate : function toggleUndo(event) {
		if (event.editable) {
			Metaview.toggle(event.editable.elem, {
				'outline': true,
				'tagname': true,
				'padding': true
			});
		}
		return event.selection.boundaries;
	}};

	function handler(event) {
		return Keys.shortcutHandler(event.meta, event.keycode, handlers[event.type] || [])
		    || (isTextInput(event) && handlers['keypress']['input']);
	}

	/**
	 * Updates selection and nativeEvent
	 * @memberOf typing
	 */
	function handleTyping(event) {
		var selection = event.selection;
		var start = selection.boundaries[0];
		var end = selection.boundaries[1];
		var handling = handler(event);
		if (!handling) {
			return event;
		}
		if (handling.preventDefault) {
			Events.preventDefault(event.nativeEvent);
		}
		if (handling.clearOverrides) {
			selection.overrides = [];
			selection.formatting = [];
		}
		if (handling.mutate) {
			if (handling.undo) {
				undoable(handling.undo, event, function () {
					if (handling.removeContent && !Boundaries.equals(start, end)) {
						selection.boundaries = remove(false, event);
					}
					selection.boundaries = handling.mutate(event);
					Html.prop(Boundaries.commonContainer(
						selection.boundaries[0],
						selection.boundaries[1]
					));
				});
			} else {
				selection.boundaries = handling.mutate(event);
			}
		}
		return event;
	}

	return {
		handleTyping  : handleTyping,
		actions       : actions
	};
});
