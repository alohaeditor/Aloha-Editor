/**
 * ranges.js is part of Aloha Editor project http://aloha-editor.org
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
	'mutation',
	'arrays',
	'stable-range',
	'html',
	'traversing',
	'functions',
	'cursors',
	'boundaries'
], function Ranges(
	Dom,
	Mutation,
	Arrays,
	StableRange,
	Html,
	Traversing,
	Fn,
	Cursors,
	Boundaries
) {
	'use strict';

	/**
	 * Gets the currently selected range from the given document element.
	 *
	 * If no document element is given, the document element of the calling
	 * frame's window will be used.
	 *
	 * @param  {Document=} doc
	 * @return {?Range} Browser's selected range or null if not selection exists
	 */
	function get(doc) {
		var selection = (doc || document).getSelection();
		return selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
	}

	/**
	 * Sets the given range to the browser selection.  This will cause the
	 * selection to be visually rendered by the user agent.
	 *
	 * @param  {Range} range
	 * @param  {Document=} doc
	 * @return {Selection} Browser selection to which the range was set
	 */
	function select(range, doc) {
		doc = doc || range.startContainer.ownerDocument;
		var selection = doc.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
		return selection;
	}

	/**
	 * Creates a range object with boundaries defined by containers, and
	 * offsets in those containers.
	 *
	 * @param  {Element} startContainer
	 * @param  {number}  startOffset
	 * @param  {Element} endContainer
	 * @param  {number}  endOffset
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
	 * Checks whether two ranges are equal.  Ranges are equal if their
	 * corresponding boundary containers and boundary offsets are strictly
	 * equal.
	 *
	 * @param  {Range} a
	 * @param  {Range} b
	 * @return {boolean}
	 */
	function equals(a, b) {
		return a.startContainer === b.startContainer
		    && a.startOffset    === b.startOffset
		    && a.endContainer   === b.endContainer
		    && a.endOffset      === b.endOffset;
	}

	/**
	 * Given the position offsets `left` and `top` (relative to the document),
	 * returns a collapsed range for the position where the text insertion
	 * point indicator would be inserted.
	 *
	 * @reference:
	 * http://dev.w3.org/csswg/cssom-view/#dom-document-caretpositionfrompoint
	 * http://stackoverflow.com/questions/3189812/creating-a-collapsed-range-from-a-pixel-position-in-ff-webkit
	 * http://jsfiddle.net/timdown/ABjQP/8/
	 * http://lists.w3.org/Archives/Public/public-webapps/2009OctDec/0113.html
	 *
	 * @private
	 * @param  {number} x
	 * @param  {number} y
	 * @param  {Document=} doc
	 * @return {?Range}
	 */
	function fromPoint(x, y, doc) {
		if (x < 0 || y < 0) {
			return null;
		}
		doc = doc || document;
		if (doc.caretRangeFromPoint) {
			return doc.caretRangeFromPoint(x, y);
		}
		if (doc.caretPositionFromPoint) {
			var pos = doc.caretPositionFromPoint(x, y);
			return create(pos.offsetNode, pos.offset);
		}
		if (doc.elementFromPoint) {
			throw 'createFromPoint() unimplemented for this browser';
		}
	}

	/**
	 * Calculates a range according to the given document offset positions.
	 *
	 * Will ensure that the range is contained in a content editable node.
	 *
	 * @param  {number} x
	 * @param  {number} y
	 * @return {?Range} Null if no suitable range can be determined
	 */
	function fromPosition(x, y) {
		var range = fromPoint(x, y);
		if (!range) {
			return null;
		}
		if (Dom.isEditableNode(range.commonAncestorContainer)) {
			return range;
		}
		var block = Traversing.parentBlock(range.commonAncestorContainer);
		if (!block || !block.parentNode) {
			return null;
		}
		var body = block.ownerDocument.body;
		var offsets = Dom.offset(block);
		var offset = Dom.nodeIndex(block);
		var pointX = x + body.scrollLeft;
		var blockX = offsets.left + body.scrollLeft + block.offsetWidth;
		if (pointX > blockX) {
			offset += 1;
		}
		return create(block.parentNode, offset);
	}

	/**
	 * Creates a range based on the given start and end boundaries.
	 *
	 * @param  {Boundary} start
	 * @param  {Boundary} end
	 * @return {Range}
	 */
	function fromBoundaries(start, end) {
		return create(
			Boundaries.container(start),
			Boundaries.offset(start),
			Boundaries.container(end),
			Boundaries.offset(end)
		);
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
	 * @todo: Implement in terms of boundaries
	 *
	 * @param  {Range} range
	 * @param  {Function=} ignoreLeft
	 * @param  {Function=} ignoreRight
	 * @return {Range}
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
	 * Expands the range's start and end positions to the nearest word
	 * boundaries.
	 *
	 * foo b[a]r baz ==> foo [bar] baz
	 *
	 * @param  {Range} range
	 * @return {Range}
	 */
	function expandToWord(range) {
		var start = Boundaries.fromRangeStart(range);
		var end = Boundaries.fromRangeEnd(range);
		var prev = Html.prevWordBoundary(start);
		var next = Html.nextWordBoundary(end);
		return fromBoundaries(prev || start, next || end);
	}

	/**
	 * Expands the ranges's start and end positions to the nearest block
	 * boundaries.
	 *
	 * [,] = start,end boundary
	 *
	 *  +-------+     [ +-------+
	 *  | block |       | block |
	 *  |       |  ==>  |       |
	 *  | []    |       |       |
	 *  +-------+       +-------+ ]
	 *
	 * @param  {Range} range
	 * @return {Range}
	 */
	function expandToBlock(range) {
		var start = range.commonAncestorContainer;
		var ancestors = Traversing.childAndParentsUntilIncl(start, function (node) {
			return Html.hasLinebreakingStyle(node) || Dom.isEditingHost(node);
		});
		var node = Arrays.last(ancestors);
		var len = Dom.nodeLength(node);
		var end = Html.nextVisualBoundary(Boundaries.create(node, len));
		return fromBoundaries(Boundaries.create(node, 0), end);
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
	 * @param  {Range} range
	 * @return {Range}
	 */
	function envelopeInvisibleCharacters(range) {
		var end = Boundaries.fromRangeEnd(range);
		if (!Boundaries.isNodeBoundary(end)) {
			var offset = Html.nextSignificantOffset(end);
			if (-1 === offset) {
				range.setEnd(range.endContainer, Dom.nodeLength(range.endContainer));
			} else {
				range.setEnd(Boundaries.container(end), offset);
			}
		}
		return range;
	}

	/**
	 * Expands the range's start position backward to the previous visible
	 * position.
	 *
	 * @param  {Range} range
	 * @return {Range}
	 */
	function expandBackwardToVisiblePosition(range) {
		var boundary = Html.prevVisualBoundary(Boundaries.fromRangeStart(range));
		if (boundary) {
			Boundaries.setRangeStart(range, boundary);
		}
		return range;
	}

	/**
	 * Expands the range's end position forward to the next furthest visible
	 * position.
	 *
	 * @param  {Range} range
	 * @return {Range}
	 */
	function expandForwardToVisiblePosition(range) {
		var boundary = Html.nextVisualBoundary(Boundaries.fromRangeEnd(range));
		if (!boundary) {
			return range;
		}
		if (!Boundaries.isNodeBoundary(boundary) && !Html.areNextWhiteSpacesSignificant(boundary)) {
			var next = Html.nextVisualBoundary(boundary);
			if (next) {
				boundary = Html.prevVisualBoundary(next);
			}
		}
		if (boundary) {
			Boundaries.setRangeEnd(range, boundary);
		}
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
	 * Ensures that the given start point Cursor is not at a "start position"
	 * and the given end point Cursor is not at an "end position" by moving the
	 * points to the left and right respectively.  This is effectively the
	 * opposite of trimBoundaries().
	 *
	 * @param {Cusor} start
	 * @param {Cusor} end
	 * @param {Function:boolean} until
	 *        Optional predicate.  May be used to stop the trimming process from
	 *        moving the Cursor from within an element outside of it.
	 * @param {Function:boolean} ignore
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
	 * @param {Function:boolean} until
	 *        Optional predicate.  May be used to stop the trimming process from
	 *        moving the Cursor from within an element outside of it.
	 * @param {Function:boolean} ignore
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
	 * Collapses the given range's end boundary to the start.
	 *
	 * @param  {Range} range
	 * @return {Range}
	 */
	function collapseToStart(range) {
		range.setEnd(range.startContainer, range.startOffset);
		return range;
	}

	/**
	 * Collapses the given range's start boundary to the end.
	 *
	 * @param  {Range} range
	 * @return {Range}
	 */
	function collapseToEnd(range) {
		range.setStart(range.endContainer, range.endOffset);
		return range;
	}

	/**
	 * Inserts `text` behind the start boundary of the given range.
	 *
	 * @param {Ranges} range
	 * @param {string} text
	 */
	function insertTextBehind(range, text) {
		var boundary = Boundaries.create(range.startContainer, range.startOffset);
		boundary = Mutation.insertTextAtBoundary(text, boundary, true, [range]);
		collapseToStart(range);
		select(range);
	}

	/**
	 * Gets the bounding rectangle offsets for the given range from is start or
	 * end container.
	 *
	 * This function is a hack to work around the problems that user agents
	 * have in determining the bounding client rect for collapsed ranges.
	 *
	 * @param  {Range}   range
	 * @param  {boolean} isStart
	 * @return {Object.<string, number>}
	 */
	function bounds(range, isStart) {
		var clone = range.cloneRange();
		var boundary;

		if (isStart && clone.startOffset > 0) {
			boundary = Boundaries.fromRangeStart(clone);
			if (Html.hasLinebreakingStyle(Html.prevNode(boundary))) {
				return {};
			}
			Boundaries.setRangeStart(clone, Html.prev(boundary));
		}

		var len = Dom.nodeLength(clone.endContainer);

		if (!isStart && clone.endOffset < len) {
			boundary = Boundaries.fromRangeEnd(clone);
			if (Html.hasLinebreakingStyle(Html.nextNode(boundary))) {
				return {};
			}
			Boundaries.setRangeEnd(clone, Html.next(boundary));
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
	 * Checks whether the text boundary is at a visible position.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {boolean}
	 */
	function isVisibleTextBoundary(boundary) {
		return Html.prevSignificantOffset(boundary) === Boundaries.offset(boundary);
	}

	/**
	 * Checks whether the node boundary is at a visible position.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {boolean}
	 */
	function isVisibleNodeBoundary(boundary) {
		var next = Boundaries.nextNode(boundary);
		if (Html.hasLinebreakingStyle(next)) {
			return false;
		}
		var prev = Boundaries.prevNode(boundary);
		if (Html.hasLinebreakingStyle(prev)) {
			return false;
		}
		return true;
	}

	/**
	 * Checks whether the given boundary is at a visible position.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {boolean}
	 */
	function isVisibleBoundary(boundary) {
		return Boundaries.isTextBoundary(boundary)
		     ? isVisibleTextBoundary(boundary)
		     : isVisibleNodeBoundary(boundary);
	}

	/**
	 * Returns the previous visible boundary from the given.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function prevVisibleBoundary(boundary) {
		var move = Html.nextVisiblePosition(
			boundary,
			Boundaries.prevNode,
			Boundaries.prev
		);
		boundary = move.boundary;
		while (!isVisibleBoundary(boundary)) {
			boundary = Html.prev(boundary);
		}
		return boundary;
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

		var len = Dom.nodeLength(range.startContainer);
		if (range.startOffset === len) {
			var boundary = prevVisibleBoundary(Boundaries.fromRangeStart(range));
			return box(fromBoundaries(boundary, boundary));
		}

		var node = Dom.nthChild(range.startContainer, range.startOffset);
		var body = node.ownerDocument.body;

		return {
			top    : node.parentNode.offsetTop - body.scrollTop,
			left   : node.parentNode.offsetLeft - body.scrollLeft,
			width  : node.offsetWidth,
			height : parseInt(Dom.getComputedStyle(node, 'line-height'), 10)
		};
	}

	/**
	 * Contracts the given range until it enters an editing host.
	 *
	 * Because in Firefox, the range may not be inside the editable even though
	 * the selection may be inside the editable.
	 *
	 * @param {Range} range
	 * @param {Element} Editing host, or null if none is found.
	 */
	function nearestEditingHost(range) {
		var editable = Dom.editingHost(range.startContainer);
		if (editable) {
			return editable;
		}
		var isNotEditingHost = Fn.complement(Dom.isEditingHost);
		var stable = StableRange(range);
		trim(stable, isNotEditingHost, isNotEditingHost);
		return Dom.editingHost(stable.startContainer);
	}

	return {
		box                             : box,

		get                             : get,
		select                          : select,
		create                          : create,
		equals                          : equals,

		collapseToEnd                   : collapseToEnd,
		collapseToStart                 : collapseToStart,

		insertTextBehind                : insertTextBehind,

		trim                            : trim,
		trimBoundaries                  : trimBoundaries,
		trimClosingOpening              : trimClosingOpening,

		nearestEditingHost              : nearestEditingHost,

		expandBoundaries                : expandBoundaries,
		expandToWord                    : expandToWord,
		expandToBlock                   : expandToBlock,
		expandBackwardToVisiblePosition : expandBackwardToVisiblePosition,
		expandForwardToVisiblePosition  : expandForwardToVisiblePosition,
		envelopeInvisibleCharacters     : envelopeInvisibleCharacters,

		fromBoundaries                  : fromBoundaries,
		fromPosition                    : fromPosition
	};
});
