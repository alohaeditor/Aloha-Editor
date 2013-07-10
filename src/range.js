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
	'dom',
	'functions',
	'arrays',
	'cursors'
], function RangeUtilities(
	Dom,
	Fn,
	Arrays,
	Cursors
) {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('Range');
	}

	if ('function' !== typeof document.getSelection
			|| 'function' !== typeof document.createRange) {
		var msg = 'document.getSelection() or document.createRange() is '
		        + 'undefined:\n\n'
		        + 'The JavaScript environment in which you have included this\n'
		        + 'module does not seem to provide native support for the DOM\n'
		        + 'API functions document.getSelection() or '
		        + 'document.createRange().\n\n'
		        + 'Both are needed for you to be able to use this module.\n\n'
		        + 'It is likely the case that you are using an obsolete\n'
		        + 'browser like Internet Explorer 7 or 8.\n\n'
		        + 'It is recommended that you upgrade to an up to date\n'
		        + 'browser (http://google.com/chrome).  If this is not \n'
		        + 'possible, you may consider including the Rangy library\n'
		        + '(http://code.google.com/p/rangy/) as a polyfill.';
		if ('undefined' !== typeof console.error) {
			console.error(msg);
		}
		throw 'document.getSelection() or document.createRange() is undefined';
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
		if (startContainer) {
			range.setStart(startContainer, startOffset || 0);
		}
		if (endContainer) {
			range.setEnd(endContainer, endOffset || 0);
		}
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
		return range;
	}

	function setStartFromCursor(range, cursor) {
		if (cursor.atEnd) {
			range.setStart(cursor.node, Dom.nodeLength(cursor.node));
		} else {
			range.setStart(cursor.node.parentNode, Dom.nodeIndex(cursor.node));
		}
		return range;
	}

	function setEndFromCursor(range, cursor) {
		if (cursor.atEnd) {
			range.setEnd(cursor.node, Dom.nodeLength(cursor.node));
		} else {
			range.setEnd(cursor.node.parentNode, Dom.nodeIndex(cursor.node));
		}
		return range;
	}

	/**
	 * Sets the startContainer/startOffset and endContainer/endOffset boundary
	 * points of the given range, based on the given start and end Cursors.
	 *
	 * @param {Range} range
	 * @param {Cursor} start
	 * @param {Cursor} end
	 * @return {Range} The given range, having had its boundary points modified.
	 */
	function setFromBoundaries(range, start, end) {
		setStartFromCursor(range, start);
		setEndFromCursor(range, end);
		return range;
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
		return range;
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
		return range;
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
		this.update();
	};

	StableRange.prototype.setEnd = function (ec, eo) {
		this.endContainer = ec;
		this.endOffset = eo;
		this.update();
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

	function collapseToEnd(range) {
		range.setStart(range.endContainer, range.endOffset);
		return range;
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
		trimBoundaries: trimBoundaries,
		expandBoundaries: expandBoundaries,
		equal: equal,
		collapseToEnd: collapseToEnd
	};
});
