/** ranges.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * @reference
 * https://dvcs.w3.org/hg/editing/raw-file/tip/editing.html#deleting-the-selection
 */
define([
	'dom',
	'arrays',
	'stable-range',
	'html',
	'traversing',
	'functions',
	'cursors',
	'boundaries'
], function Ranges(
	Dom,
	Arrays,
	StableRange,
	Html,
	Traversing,
	Fn,
	Cursors,
	Boundaries
) {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('ranges');
	}

	/**
	 * Gets the currently selected range.
	 *
	 * @return {?Range}
	 *         Browser's selected range object or null if not selection exists.
	 */
	function get() {
		var selection = document.getSelection();
		return selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
	}

	/**
	 * Creates a range object with boundaries defined by containers and offsets
	 * in those containers.
	 *
	 * @param {DOMElement} startContainer
	 * @param {Number} startOffset
	 * @param {DOMElement} endContainer
	 * @param {Number} endOffset
	 * @return {Range}
	 */
	function create(startContainer, startOffset, endContainer, endOffset) {
		var range = startContainer.ownerDocument.createRange();
		range.setStart(startContainer, startOffset || 0);
		if (endContainer) {
			range.setEnd(endContainer, endOffset || 0);
		} else {
			range.setEnd(startContainer, startOffset || 0);
		}
		return range;
	}

	/**
	 * Whether two ranges are equal.
	 *
	 * @param a {!Range} one of the two ranges to compare
	 * @param b {!Range} one of the two ranges to compare
	 */
	function isEqual(a, b) {
		return (a.startContainer === b.startContainer
		        && a.endContainer === b.endContainer
		        && a.startOffset === b.startOffset
		        && a.endOffset === b.endOffset);
	}

	/**
	 * Sets the given range to the browser selection.  This will cause the
	 * selection to be visually highlit by the browser.
	 *
	 * @param {Range} range
	 * @return {Selection}
	 *         The browser selection to which the range was set.
	 */
	function select(range) {
		var selection = document.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
		return selection;
	}

	/**
	 * Sets the start and end boundaries of `range` from `reference`.
	 *
	 * @param {Range} range
	 * @param {Range} reference
	 * @return {Range}
	 *         The modified range.
	 */
	function setFromReference(range, reference) {
		range.setStart(reference.startContainer, reference.startOffset);
		range.setEnd(reference.endContainer, reference.endOffset);
		return range;
	}

	function setStartFromBoundary(range, boundary) {
		range.setStart(boundary[0], boundary[1]);
	}

	function setEndFromBoundary(range, boundary) {
		range.setEnd(boundary[0], boundary[1]);
	}

	function setFromBoundaries(range, start, end) {
		range.setStart(start[0], start[1]);
		range.setEnd(end[0], end[1]);
	}

	/**
	 * @private
	 */
	function seekBoundaryPoint(range, container, offset, oppositeContainer,
	                           oppositeOffset, setFn, ignore, backwards) {
		var cursor = Cursors.cursorFromBoundaryPoint(container, offset);

		// Because when seeking backwards, if the boundary point is inside a
		// text node, trimming starts after it. When seeking forwards, the
		// cursor starts before the node, which is what
		// cursorFromBoundaryPoint() does automatically.
		if (backwards
				&& Dom.Nodes.TEXT === container.nodeType
					&& offset > 0
						&& offset < container.length) {
			if (cursor.next()) {
				if (!ignore(cursor)) {
					return range;
				}
				// Bacause the text node can be ignored, we go back to the
				// initial position.
				cursor.prev();
			}
		}
		var opposite = Cursors.cursorFromBoundaryPoint(
			oppositeContainer,
			oppositeOffset
		);
		var changed = false;
		while (!cursor.equals(opposite)
		           && ignore(cursor)
		           && (backwards ? cursor.prev() : cursor.next())) {
			changed = true;
		}
		if (changed) {
			setFn(range, cursor);
		}
		return range;
	}

	/**
	 * Checks whether or not the position is at a text node.
	 *
	 * @private
	 * @param {DOMObject} container
	 * @param {Number} offset
	 * @return {Boolean}
	 */
	function isAtTextNode(container, offset) {
		return Dom.isTextNode(container) || (
			container.childNodes[offset]
			&& Dom.isTextNode(container.childNodes[offset])
		);
	}

	/**
	 * Ensures that the given position is nested in at least 2 levels of
	 * ancestors, and at the start.
	 *
	 * @private
	 * @param {Cursor} pos
	 * @param {Boolean}
	 */
	function canExpandBackward(boundary, container, offset) {
		return container
		    && container.parentNode
		    && container.parentNode.parentNode
		    && Boundaries.isAtStart(boundary)
		    && !Html.hasLinebreakingStyle(container);
	}

	/**
	 * Ensures that the given position is nested in at least 2 levels of
	 * ancestors, and at the end.
	 *
	 * @private
	 * @param {Cursor} pos
	 * @param {Boolean}
	 */
	function canExpandForward(boundary, container, offset) {
		return container
		    && container.parentNode
		    && container.parentNode.parentNode
		    && Boundaries.isAtEnd(boundary)
		    && !Html.hasLinebreakingStyle(container);
	}

	/**
	 * Checks whether the corresponding container node and offset boundaries
	 * are equal.
	 *
	 * @private
	 * @param {DOMObject} container
	 * @param {Number} offset
	 * @param {DOMObject} oppositeContainer
	 * @param {Number} oppositeOffset
	 * @return {Boolean}
	 */
	function boundariesEqual(container1, offset1, container2, offset2) {
		return container1 === container2 && offset1 === offset2;
	}

	/**
	 * Checks whether or not a given position can be moved forward without
	 * colliding with the other boundary position.
	 *
	 * @private
	 * @param {DOMObject} container
	 * @param {Number} offset
	 * @param {DOMObject} oppositeContainer
	 * @param {Number} oppositeOffset
	 * @return {Boolean}
	 */
	function canContractForward(container, offset,
	                            oppositeContainer, oppositeOffset) {
		return !boundariesEqual(container, offset, oppositeContainer, oppositeOffset)
		    && !isAtTextNode(container, offset)
		    && !Html.hasLinebreakingStyle(container.childNodes[offset] || container);
	}

	/**
	 * Checks whether or not a given position can be moved backward without
	 * colliding with the other boundary position.
	 *
	 * @private
	 * @param {DOMObject} container
	 * @param {Number} offset
	 * @param {DOMObject} oppositeContainer
	 * @param {Number} oppositeOffset
	 * @return {Boolean}
	 */
	function canContractBackward(container, offset,
	                             oppositeContainer, oppositeOffset) {
		return !boundariesEqual(container, offset, oppositeContainer, oppositeOffset)
		    && !isAtTextNode(container, offset - 1)
		    && (
				Dom.isAtStart(container, offset)
					? !Html.hasLinebreakingStyle(container)
					: !Html.hasLinebreakingStyle(container.childNodes[offset - 1])
		    );
	}

	/**
	 * Expands the given range.
	 *
	 * expand() will move the range's start and end boundary positions as far
	 * apart as possible in the document order whithout altering how the range
	 * would be visually represented when selected.
	 *
	 * The start and end boundary positions will not be expanded across
	 * elements which affect visual line breaks.
	 *
	 * Note that an element's styling can only be determined if that element is
	 * attached to the document.  If working with a range in a detached DOM,
	 * then line-breaking nodes are guessed simply by their tag name.
	 *
	 * Also note that expand() will never move the start or end boundary
	 * position inside of a text node.
	 *
	 * @param {Range} range
	 * @return {Range}
	 *         The modified range.
	 */
	function expand(range) {
		var start = Boundaries.prevWhile(
			Boundaries.start(range),
			canExpandBackward
		);
		var end = Boundaries.nextWhile(
			Boundaries.end(range),
			canExpandForward
		);
		range.setStart(start[0], start[1]);
		range.setEnd(end[0], end[1]);
		return range;
	}

	/**
	 * Contracts the given range.
	 *
	 * contract() will move the range's start and end boundary positions as
	 * close together as possible in the document order whithout altering how
	 * the range would be visually represented when selected.
	 *
	 * The start and end boundary positions will not contract across elements
	 * which affect visual line breaks.  These include all elements with
	 * block-level display styling, img tags, and br tags ofcourse.
	 *
	 * Note that an element's styling can only be determined if that element is
	 * attached to the document.  If working with a range in a detached DOM,
	 * then line-breaking nodes are determined simply by their tag name.
	 *
	 * Also note that contract() will never move the start or end boundary
	 * position inside of a text node.
	 *
	 * @param {Range} range
	 * @return {Range}
	 *         The modified range.
	 */
	function contract(range) {
		var end = Boundaries.prevWhile(
			Boundaries.end(range),
			function (boundary, container, offset) {
				return canContractBackward(
					container,
					offset,
					range.startContainer,
					range.startOffset
				);
			}
		);
		var start = Boundaries.nextWhile(
			Boundaries.start(range),
			function (boundary, container, offset) {
				return canContractForward(
					container,
					offset,
					range.endContainer,
					range.endOffset
				);
			}
		);
		range.setStart(start[0], start[1]);
		range.setEnd(end[0], end[1]);
		return range;
	}

	/**
	 * Expands the ranges start and end positions to the nearest word
	 * boundaries.
	 *
	 * @param {Range} range
	 * @return {Range}
	 */
	function expandToWord(range) {
		var behind = Traversing.findWordBoundaryBehind(Boundaries.start(range));
		var ahead = Traversing.findWordBoundaryAhead(Boundaries.end(range));
		setFromBoundaries(range, behind, ahead);
		return range;
	}

	function expandToBlock(range) {
		var start = range.commonAncestorContainer;
		var ancestors = Traversing.childAndParentsUntilIncl(start , function (node) {
			return Html.hasLinebreakingStyle(node) || Dom.isEditingHost(node);
		});
		var node = Arrays.last(ancestors);
		var len = Dom.nodeLength(node);
		var end = Html.nextVisualBoundary([node, len]);
		return create(node, 0, end[0], end[1]);
	}

	/**
	 * Expands the given range to encapsulate all adjacent unrendered
	 * characters.
	 *
	 * This operation should therefore never cause the visual representation of
	 * the range to change.
	 *
	 * Since it is impossible to place a range immediately behind an invisible
	 * character, this function will only ever need to expand the range's end
	 * position.
	 *
	 * @param {Range}
	 * @return {Range}
	 */
	function expandToVisibleCharacter(range) {
		if (!Dom.isTextNode(range.endContainer)) {
			return range;
		}
		var boundary = Html.nextCharacter(Boundaries.end(range));
		if (boundary) {
			if (boundary[1] > 0) {
				boundary[1]--;
				setEndFromBoundary(range, boundary);
			}
		} else {
			range.setEnd(
				range.endContainer,
				Dom.nodeLength(range.endContainer)
			);
		}
		return range;
	}

	/**
	 * Expands the range's start position backward to the previous visible
	 * position.
	 *
	 * @param {Range}
	 * @return {Range}
	 */
	function expandBackwardToVisiblePosition(range) {
		var boundary = Html.previousVisualBoundary(Boundaries.start(range));
		if (boundary) {
			setStartFromBoundary(range, boundary);
		}
		return range;
	}

	/**
	 * Expands the range's end position forward to the next furthest visible
	 * position.
	 *
	 * @param {Range}
	 * @return {Range}
	 */
	function expandForwardToVisiblePosition(range) {
		var pos = Html.nextVisualBoundary(Boundaries.end(range));
		if (pos[0]
			&& Dom.isTextNode(pos[0])
			&& !Html.areNextWhiteSpacesSignificant(pos[0], pos[1])) {
			pos = Html.nextVisualBoundary(pos);
			if (pos[0]) {
				pos = Html.previousVisualBoundary(pos);
			}
		}
		if (pos) {
			setEndFromBoundary(range, pos);
		}
		return range;
	}

	function contractBackwardToVisiblePosition(range) {
		var pos = Html.previousVisualBoundary(Boundaries.end(range));
		if (pos[0]
			&& Dom.isTextNode(pos[0])
			&& !Html.areNextWhiteSpacesSignificant(pos[0], pos[1])) {
			pos = Html.nextVisualBoundary(pos);
			if (pos[0]) {
				pos = Html.previousVisualBoundary(pos);
			}
		}
		if (pos) {
			setEndFromBoundary(range, pos);
		}
		return range;
	}

	/**
	 * Starting with the given range's start and end boundary points, seek
	 * inward using a cursor, passing the cursor to ignoreLeft and ignoreRight,
	 * stopping when either of these returns true, adjusting the given range to
	 * the end positions of both cursors.
	 *
	 * The dom cursor passed to ignoreLeft and ignoreRight does not traverse
	 * positions inside text nodes. The exact rules for when text node
	 * containers are passed are as follows: If the left boundary point is
	 * inside a text node, trimming will start before it. If the right boundary
	 * point is inside a text node, trimming will start after it.
	 * ignoreLeft/ignoreRight() are invoked with the cursor before/after the
	 * text node that contains the boundary point.
	 *
	 * @param {Range} range
	 * @param {Function=} ignoreLeft
	 * @param {Function=} ignoreRight
	 * @return {Range}
	 *         The given range, modified.
	 */
	function trim(range, ignoreLeft, ignoreRight) {
		ignoreLeft = ignoreLeft || Fn.returnFalse;
		ignoreRight = ignoreRight || Fn.returnFalse;
		if (range.collapsed) {
			return range;
		}
		// Because range may be mutated, we must store its properties before
		// doing anything else.
		var sc = range.startContainer;
		var so = range.startOffset;
		var ec = range.endContainer;
		var eo = range.endOffset;
		seekBoundaryPoint(
			range,
			sc,
			so,
			ec,
			eo,
			Cursors.setRangeStart,
			ignoreLeft,
			false
		);
		sc = range.startContainer;
		so = range.startOffset;
		seekBoundaryPoint(
			range,
			ec,
			eo,
			sc,
			so,
			Cursors.setRangeEnd,
			ignoreRight,
			true
		);
		return range;
	}

	/**
	 * Like trim() but ignores closing (to the left) and opening positions (to
	 * the right).
	 *
	 * @param {Range} range
	 * @param {Function=} ignoreLeft
	 * @param {Function=} ignoreRight
	 * @return {Range}
	 *         The given range, modified.
	 */
	function trimClosingOpening(range, ignoreLeft, ignoreRight) {
		ignoreLeft = ignoreLeft || Fn.returnFalse;
		ignoreRight = ignoreRight || Fn.returnFalse;
		trim(range, function (cursor) {
			return cursor.atEnd || ignoreLeft(cursor.node);
		}, function (cursor) {
			return !cursor.prevSibling() || ignoreRight(cursor.prevSibling());
		});
		return range;
	}

	/**
	 * Checks whether the two given range object are equal.
	 *
	 * @param {Range} a
	 * @param {Range} b
	 * @return {Boolean}
	 *         True if ranges `a` and `b` have the same boundary points.
	 */
	function equal(a, b) {
		return a.startContainer === b.startContainer
			&& a.startOffset    === b.startOffset
			&& a.endContainer   === b.endContainer
			&& a.endOffset      === b.endOffset;
	}

	/**
	 * Ensures that the given start point Cursor is not at a "start position"
	 * and the given end point Cursor is not at an "end position" by moving the
	 * points to the left and right respectively.  This is effectively the
	 * opposite of trimBoundaries().
	 *
	 * @param {Cusor} start
	 * @param {Cusor} end
	 * @param {Function:Boolean} until
	 *        Optional predicate.  May be used to stop the trimming process from
	 *        moving the Cursor from within an element outside of it.
	 * @param {Function:Boolean} ignore
	 *        Optional predicate.  May be used to ignore (skip)
	 *        following/preceding siblings which otherwise would stop the
	 *        trimming process, like for example underendered whitespace.
	 */
	function expandBoundaries(start, end, until, ignore) {
		until = until || Fn.returnFalse;
		ignore = ignore || Fn.returnFalse;
		start.prevWhile(function (start) {
			var prevSibling = start.prevSibling();
			return prevSibling ? ignore(prevSibling) : !until(start.parent());
		});
		end.nextWhile(function (end) {
			return !end.atEnd ? ignore(end.node) : !until(end.parent());
		});
	}

	/**
	 * Ensures that the given start point Cursor is not at an "start position"
	 * and the given end point Cursor is not at an "end position" by moving the
	 * points to the left and right respectively.  This is effectively the
	 * opposite of expandBoundaries().
	 *
	 * If the boundaries are equal (collapsed), or become equal during this
	 * operation, or if until() returns true for either point, they may remain
	 * in start and end position respectively.
	 *
	 * @param {Cusor} start
	 * @param {Cusor} end
	 * @param {Function:Boolean} until
	 *        Optional predicate.  May be used to stop the trimming process from
	 *        moving the Cursor from within an element outside of it.
	 * @param {Function:Boolean} ignore
	 *        Optional predicate.  May be used to ignore (skip)
	 *        following/preceding siblings which otherwise would stop the
	 *        trimming process, like for example underendered whitespace.
	 */
	function trimBoundaries(start, end, until, ignore) {
		until = until || Fn.returnFalse;
		ignore = ignore || Fn.returnFalse;
		start.nextWhile(function (start) {
			return (
				!start.equals(end)
					&& (
						!start.atEnd
							? ignore(start.node)
							: !until(start.parent())
					)
			);
		});
		end.prevWhile(function (end) {
			var prevSibling = end.prevSibling();
			return (
				!start.equals(end)
					&& (
						prevSibling
							? ignore(prevSibling)
							: !until(end.parent())
					)
			);
		});
	}

	/**
	 * Collapses the given range start boundary towards the end boundary.
	 *
	 * @param {Range} range
	 * @return {Range}
	 *         The given range, modified.
	 */
	function collapseToStart(range) {
		range.setEnd(range.startContainer, range.startOffset);
		return range;
	}

	/**
	 * Collapses the given range start boundary towards the end boundary.
	 *
	 * @param {Range} range
	 * @return {Range}
	 *         The given range, modified.
	 */
	function collapseToEnd(range) {
		range.setStart(range.endContainer, range.endOffset);
		return range;
	}

	/**
	 * Gets the nearest editing host to the given range.
	 *
	 * Because Firefox, the range may not be inside the editable even though
	 * the selection may be inside the editable.
	 *
	 * @param {Range} liveRange
	 * @param {DOMObject} Editing host, or null if none is found.
	 */
	function getNearestEditingHost(liveRange) {
		var range = StableRange(liveRange);
		var editable = Dom.getEditingHost(range.startContainer);
		if (editable) {
			return editable;
		}
		var isNotEditingHost = Fn.complement(Dom.isEditingHost);
		trim(range, isNotEditingHost, isNotEditingHost);
		return Dom.getEditingHost(
			Dom.nodeAtOffset(range.startContainer, range.startOffset)
		);
	}

	function insertTextBehind(range, text) {
		var boundary = [range.startContainer, range.startOffset];
		boundary = Dom.insertTextAtBoundary(text, boundary, true, [range]);
		collapseToStart(range);
		select(range);
	}

	function createFromPoint(x, y) {
		if (document.caretRangeFromPoint) {
			return document.caretRangeFromPoint(x, y);
		}
		if (document.caretPositionFromPoint) {
			var pos = document.caretPositionFromPoint(x, y);
			return create(pos.offsetNode, pos.offset);
		}
		if (document.elementFromPoint) {
			// @see
			// http://stackoverflow.com/questions/3189812/creating-a-collapsed-range-from-a-pixel-position-in-ff-webkit
			// http://jsfiddle.net/timdown/ABjQP/8/
		}
	}

	/**
	 * Return a range based on the given event object.
	 *
	 * @param  {Object} event An Aloha Editor event
	 * @return {?Range}
	 */
	function fromEvent(event) {
		return event.range
		    || createFromPoint(event.native.clientX, event.native.clientY)
		    || get();
	}

	/**
	 * Gets the bounding rectangle offsets for the given range from is start or
	 * end container.
	 *
	 * This function is a hack to work around the problems that user agenst
	 * have in determining the bounding client rect for collapsed ranges.
	 *
	 * @param  {Range}   range
	 * @param  {boolean} isStart
	 * @return {Object.<string, number>}
	 */
	function bounds(range, isStart) {
		var clone = range.cloneRange();

		if (isStart && clone.startOffset > 0) {
			clone.setStart(clone.startContainer, clone.startOffset - 1);
		}

		var len = Dom.nodeLength(clone.endContainer);

		if (!isStart && clone.endOffset < len) {
			clone.setEnd(clone.endContainer, clone.endOffset + 1);
		}

		var rect = clone.getBoundingClientRect();

		return {
			top    : rect.top,
			left   : rect.left,
			width  : rect.width,
			height : rect.height
		};
	}

	/**
	 * Gets the bounding box of offets for the given range.
	 *
	 * @param  {Range} range
	 * @return {Object.<string, number>}
	 */
	function box(range) {
		var rect = bounds(range, false);
		if (rect.width > 0) {
			return rect;
		}
		rect = bounds(range, true);
		if (rect.width > 0) {
			rect.left += rect.width;
			return rect;
		}
		return rect;
	}

	/**
	 * Library functions for working with DOM ranges.
	 * It assums native support for document.getSelection() and
	 * document.createRange().
	 */
	var exports = {
		box: box,
		collapseToEnd: collapseToEnd,
		collapseToStart: collapseToStart,
		create: create,
		isEqual: isEqual,
		equal: equal,
		expand: expand,
		contract: contract,
		expandBoundaries: expandBoundaries,
		expandToWord: expandToWord,
		expandToBlock: expandToBlock,
		expandToVisibleCharacter: expandToVisibleCharacter,
		get: get,
		insertTextBehind: insertTextBehind,
		select: select,
		setFromReference: setFromReference,
		setStartFromBoundary: setStartFromBoundary,
		setEndFromBoundary: setEndFromBoundary,
		setFromBoundaries: setFromBoundaries,
		trim: trim,
		trimBoundaries: trimBoundaries,
		trimClosingOpening: trimClosingOpening,
		getNearestEditingHost: getNearestEditingHost,
		expandBackwardToVisiblePosition: expandBackwardToVisiblePosition,
		expandForwardToVisiblePosition: expandForwardToVisiblePosition,
		contractBackwardToVisiblePosition: contractBackwardToVisiblePosition,
		createFromPoint: createFromPoint,
		fromEvent: fromEvent
	};

	exports['box'] = exports.box;
	exports['collapseToEnd'] = exports.collapseToEnd;
	exports['collapseToStart'] = exports.collapseToStart;
	exports['create'] = exports.create;
	exports['isEqual'] = exports.isEqual;
	exports['equal'] = exports.equal;
	exports['expand'] = exports.expand;
	exports['contract'] = exports.contract;
	exports['expandBoundaries'] = exports.expandBoundaries;
	exports['expandToWord'] = exports.expandToWord;
	exports['expandToVisibleText'] = exports.expandToVisibleText;
	exports['get'] = exports.get;
	exports['insertTextBehind'] = exports.insertTextBehind;
	exports['select'] = exports.select;
	exports['setFromReference'] = exports.setFromReference;
	exports['trim'] = exports.trim;
	exports['trimBoundaries'] = exports.trimBoundaries;
	exports['trimClosingOpening'] = exports.trimClosingOpening;
	exports['getNearestEditingHost'] = exports.getNearestEditingHost;
	exports['expandBackwardToVisiblePosition'] = exports.expandBackwardToVisiblePosition;

	return exports;
});
