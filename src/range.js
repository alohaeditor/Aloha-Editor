/** range.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * range.js: Library functions for working with DOM ranges.
 * It assums API support for document.getSelection() and document.createRange().
 */
define([
	'../src/dom',
	'../src/functions',
	'../src/arrays',
	'../src/cursor'
], function RangeUtilities(
	Dom,
	Fn,
	Arrays,
	Cursor
) {
	'use strict';

	if ('function' !== typeof document.getSelection) {
		throw 'getSelection() not supported';
	}

	if ('function' !== typeof document.createRange) {
		throw 'createRange() not supported';
	}

	/**
	 * Extends the ranges start and end positions to the nearest word
	 * boundaries.
	 *
	 * This function will modify the range given to it.
	 *
	 * @param {Range} range
	 * @range {Range}
	 */
	function extendToWord(range) {
		var behind = Dom.findWordBoundaryBehind(
			range.startContainer,
			range.startOffset
		);
		var ahead = Dom.findWordBoundaryAhead(
			range.endContainer,
			range.endOffset
		);
		range.setStart(behind.node, behind.offset);
		range.setEnd(ahead.node, ahead.offset);
		return range;
	}

	function get() {
		var selection = document.getSelection();
		return selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
	}

	function create(startContainer, startOffset, endContainer, endOffset) {
		var range = document.createRange();
		range.setStart(startContainer, startOffset);
		range.setEnd(endContainer, endOffset);
		return range;
	}

	function select(range) {
		var selection = document.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
		return selection;
	}

	function setFromReference(range, reference) {
		range.setStart(reference.startContainer, reference.startOffset);
		range.setEnd(reference.endContainer, reference.endOffset);
	}

	function setStartFromCursor(range, cursor) {
		if (cursor.atEnd) {
			range.setStart(cursor.node, Dom.nodeLength(cursor.node));
		} else {
			range.setStart(cursor.node.parentNode, Dom.nodeIndex(cursor.node));
		}
	}

	function setEndFromCursor(range, cursor) {
		if (cursor.atEnd) {
			range.setEnd(cursor.node, Dom.nodeLength(cursor.node));
		} else {
			range.setEnd(cursor.node.parentNode, Dom.nodeIndex(cursor.node));
		}
	}

	function setFromBoundaries(range, startPoint, endPoint) {
		setStartFromCursor(range, startPoint);
		setEndFromCursor(range, endPoint);
	}

	/**
	 * @private
	 */
	function seekBoundaryPoint(range, container, offset, oppositeContainer,
	                           oppositeOffset, setFn, ignore, backwards) {
		var cursor = Cursor.cursorFromBoundaryPoint(container, offset);

		// Because when seeking backwards, if the boundary point is inside a
		// text node, trimming starts after it. When seeking forwards, the
		// cursor starts before the node, which is what
		// cursorFromBoundaryPoint() does automatically.
		if (backwards
				&& Dom.Nodes.TEXT_NODE === container.nodeType
					&& offset > 0
						&& offset < container.length) {
			if (backwards ? cursor.next() : cursor.prev()) {
				if (!ignore(cursor)) {
					return;
				}
				// Bacause the text node can be ignored, we go back to the
				// initial position.
				if (backwards) {
					cursor.prev();
				} else {
					cursor.next();
				}
			}
		}
		var opposite = Cursor.cursorFromBoundaryPoint(
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
	}

	/**
	 * Starting with the given range's start and end boundary points,
	 * seek inward using a cursor, passing the cursor to ignoreLeft and
	 * ignoreRight, stopping when either of these returns true,
	 * adjusting the given range to the end positions of both cursors.
	 *
	 * The dom cursor passed to ignoreLeft and ignoreRight does not
	 * traverse positions inside text nodes. The exact rules for when
	 * text node containers are passed are as follows: If the left
	 * boundary point is inside a text node, trimming will start before
	 * it. If the right boundary point is inside a text node, trimming
	 * will start after it. ignoreLeft/ignoreRight() are invoked
	 * with the cursor before/after the text node that contains the
	 * boundary point.
	 */
	function trim(range, ignoreLeft, ignoreRight) {
		ignoreLeft = ignoreLeft || Fn.returnFalse;
		ignoreRight = ignoreRight || Fn.returnFalse;
		if (range.collapsed) {
			return;
		}
		// Because range may be mutated, we must store its properties
		// before doing anything else.
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
			setStartFromCursor,
			ignoreLeft,
			false
		);
		seekBoundaryPoint(
			range,
			ec,
			eo,
			sc,
			so,
			setEndFromCursor,
			ignoreRight,
			true
		);
	}

	/**
	 * Like trimRange() but ignores closing (to the left) and opening positions
	 * (to the right).
	 */
	function trimClosingOpening(range, ignoreLeft, ignoreRight) {
		ignoreLeft = ignoreLeft || Fn.returnFalse;
		ignoreRight = ignoreRight || Fn.returnFalse;
		trim(range, function (cursor) {
			return cursor.atEnd || ignoreLeft(cursor.node);
		}, function (cursor) {
			return !cursor.prevSibling() || ignoreRight(cursor.prevSibling());
		});
	}

	// ~~~ `stable range ~~~

	function StableRange(range) {
		if (!range) {
			return;
		}
		this.startContainer = range.startContainer;
		this.startOffset = range.startOffset;
		this.endContainer = range.endContainer;
		this.endOffset = range.endOffset;
		this.commonAncestorContainer = range.commonAncestorContainer;
		this.collapsed = range.collapsed;
	}

	StableRange.prototype.update = function () {
		if (!this.startContainer || !this.endContainer) {
			return;
		}
		this.collapsed = (this.startContainer === this.endContainer
						  && this.startOffset === this.endOffset);
		var start = Dom.childAndParentsUntil(
			this.startContainer,
			Fn.returnFalse
		);
		var end = Dom.childAndParentsUntil(
			this.endContainer,
			Fn.returnFalse
		);
		this.commonAncestorContainer = Arrays.intersect(start, end)[0];
	};

	StableRange.prototype.setStart = function (sc, so) {
		this.startContainer = sc;
		this.startOffset = so;
		this.update(); // rangeobject ?
	};

	StableRange.prototype.setEnd = function (ec, eo) {
		this.endContainer = ec;
		this.endOffset = eo;
		this.update(); // ?
	};

	/**
	 * A native range is live, which means that modifying the DOM may
	 * mutate the range. Also, using setStart/setEnd may not set the
	 * properties correctly (the browser may perform its own
	 * normalization of boundary points). The behaviour of a native
	 * range is very erratic and should be converted to a stable range
	 * as the first thing in any algorithm.
	 */
	function stableRange(range) {
		return new StableRange(range);
	}

	function equal(a, b) {
		return a.startContainer === b.startContainer
			&& a.startOffset    === b.startOffset
			&& a.endContainer   === b.endContainer
			&& a.endOffset      === b.endOffset;
	}

	/**
	 * Ensures that the given startPoint is not in a start position and the
	 * given endPoint is not in an end position by moving the points to the left
	 * and right respectively - the opposite of trimBoundaries().
	 */
	function expandBoundaries(startPoint, endPoint, until, ignore) {
		until = until || Fn.returnFalse;
		ignore = ignore || Fn.returnFalse;
		startPoint.prevWhile(function (startPoint) {
			var prevSibling = startPoint.prevSibling();
			return prevSibling ? ignore(prevSibling) : !until(startPoint.parent());
		});
		endPoint.nextWhile(function (endPoint) {
			return !endPoint.atEnd ? ignore(endPoint.node) : !until(endPoint.parent());
		});
	}

	/**
	 * Ensures that the given startPoint is not in an end position and the given
	 * endPoint is not in a start position by moving the points to the right and
	 * left respectively - the opposite of expandBoundaries().
	 *
	 * If the boundaries are equal (collapsed), or become equal during this
	 * operation, or if until returns true for either point, they may remain in
	 * start and end position respectively.
	 *
	 * @param until may be used to stop the trimming process from moving
	 *        the range from within an element outside of it.
	 * @param ignore may be used to ignore followning/preceding siblings
	 *        which otherwise would stop trimming process, like
	 *        for example underendered whitespace.
	 */
	function trimBoundaries(startPoint, endPoint, until, ignore) {
		until = until || Fn.returnFalse;
		ignore = ignore || Fn.returnFalse;
		startPoint.nextWhile(function (startPoint) {
			return (
				!startPoint.equals(endPoint)
					&& (
						!startPoint.atEnd
							? ignore(startPoint.node)
							: !until(startPoint.parent())
					)
			);
		});
		endPoint.prevWhile(function (endPoint) {
			var prevSibling = endPoint.prevSibling();
			return (
				!startPoint.equals(endPoint)
					&& (
						prevSibling
							? ignore(prevSibling)
							: !until(endPoint.parent())
					)
			);
		});
	}

	function collapseToEnd(range) {
		range.setStart(range.endContainer, range.endOffset);
	}

	return {
		get: get,
		create: create,
		select: select,
		extendToWord: extendToWord,
		setFromReference: setFromReference,
		setStartFromCursor: setStartFromCursor,
		setEndFromCursor: setEndFromCursor,
		setFromBoundaries: setFromBoundaries,
		stableRange: stableRange,
		trim: trim,
		trimClosingOpening: trimClosingOpening,
		equal: equal,
		collapseToEnd: collapseToEnd
	};
});
