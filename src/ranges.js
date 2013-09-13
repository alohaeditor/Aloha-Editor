/** ranges.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'html',
	'traversing',
	'functions',
	'arrays',
	'cursors'
], function Ranges(
	dom,
	html,
	traversing,
	fn,
	arrays,
	cursors
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
		var range = document.createRange();
		if (startContainer) {
			range.setStart(startContainer, startOffset || 0);
		}
		if (endContainer) {
			range.setEnd(endContainer, endOffset || 0);
		} else if (startContainer) {
			range.setEnd(startContainer, startOffset || 0);
		}
		return range;
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

	/**
	 * @private
	 */
	function seekBoundaryPoint(range, container, offset, oppositeContainer,
	                           oppositeOffset, setFn, ignore, backwards) {
		var cursor = cursors.cursorFromBoundaryPoint(container, offset);

		// Because when seeking backwards, if the boundary point is inside a
		// text node, trimming starts after it. When seeking forwards, the
		// cursor starts before the node, which is what
		// cursorFromBoundaryPoint() does automatically.
		if (backwards
				&& dom.Nodes.TEXT === container.nodeType
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
		var opposite = cursors.cursorFromBoundaryPoint(
			oppositeContainer,
			oppositeOffset
		);
		var changed = false;
		while (ignore(cursor, opposite)
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
		return dom.isTextNode(container) || (
			container.childNodes[offset]
			&& dom.isTextNode(container.childNodes[offset])
		);
	}

	function isLinebreakingNode(node) {
		return html.isRenderedEmptyInlineNode(node)
		    || html.isLinebreakingNode(node);
	}

	/**
	 * Ensures that the given position is nested in at least 2 levels of
	 * ancestors, and at the start.
	 *
	 * @private
	 * @param {Cursor} pos
	 * @param {Boolean}
	 */
	function canExpandBackward(container, offset) {
		return container
		    && container.parentNode
		    && container.parentNode.parentNode
		    && dom.isAtStart(container, offset)
		    && !isLinebreakingNode(container);
	}

	/**
	 * Ensures that the given position is nested in at least 2 levels of
	 * ancestors, and at the end.
	 *
	 * @private
	 * @param {Cursor} pos
	 * @param {Boolean}
	 */
	function canExpandForward(container, offset) {
		return container
		    && container.parentNode
		    && container.parentNode.parentNode
		    && dom.isAtEnd(container, offset)
		    && !isLinebreakingNode(container);
	}

	/**
	 * Checks whether the corresponding container node and offset boundaries are
	 * equal.
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
		    && !isLinebreakingNode(container.childNodes[offset] || container)
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
				dom.isAtStart(container, offset)
					? !isLinebreakingNode(container)
					: !isLinebreakingNode(container.childNodes[offset - 1])
		    );
	}

	/**
	 * Expands the given range.
	 *
	 * expand() will move the range's start and end boundary positions as far
	 * apart as possible in the document order whithout altering how the range
	 * would be visually represented when selected.
	 *
	 * The start and end boundary positions will not be expanded across elements
	 * which affect visual line breaks.  These include all elements with
	 * block-level display styling, img tags, and br tags ofcourse.
	 *
	 * Note that an element's styling can only be determined if that element is
	 * attached to the document.  If working with a range in a detached DOM,
	 * then line-breaking nodes are determined simply by their tag name.
	 *
	 * Also note that expand() will never move the start or end boundary
	 * position inside of a text node.
	 *
	 * @param {Range} range
	 * @return {Range}
	 *         The modified range.
	 */
	function expand(range) {
		var start = traversing.prevNodeBoundaryWhile(
			range.startContainer,
			range.startOffset,
			canExpandBackward
		);
		var end = traversing.nextNodeBoundaryWhile(
			range.endContainer,
			range.endOffset,
			canExpandForward
		);
		range.setStart(start.container, start.offset);
		range.setEnd(end.container, end.offset);
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
		var end = traversing.prevNodeBoundaryWhile(
			range.endContainer,
			range.endOffset,
			function (container, offset) {
				return canContractBackward(
					container,
					offset,
					range.startContainer,
					range.startOffset
				);
			}
		);
		var start = traversing.nextNodeBoundaryWhile(
			range.startContainer,
			range.startOffset,
			function (container, offset) {
				return canContractForward(
					container,
					offset,
					range.endContainer,
					range.endOffset
				);
			}
		);
		range.setStart(start.container, start.offset);
		range.setEnd(end.container, end.offset);
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
		var behind = traversing.findWordBoundaryBehind(
			range.startContainer,
			range.startOffset
		);
		var ahead = traversing.findWordBoundaryAhead(
			range.endContainer,
			range.endOffset
		);
		range.setStart(behind.node, behind.offset);
		range.setEnd(ahead.node, ahead.offset);
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
		ignoreLeft = ignoreLeft || fn.returnFalse;
		ignoreRight = ignoreRight || fn.returnFalse;
		if (range.collapsed) {
			return range;
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
			cursors.setRangeStart,
			ignoreLeft,
			false
		);
		seekBoundaryPoint(
			range,
			ec,
			eo,
			sc,
			so,
			cursors.setRangeEnd,
			ignoreRight,
			true
		);
		return range;
	}

	/**
	 * Like trim() but ignores closing (to the left) and opening positions
	 * (to the right).
	 *
	 * @param {Range} range
	 * @param {Function=} ignoreLeft
	 * @param {Function=} ignoreRight
	 * @return {Range}
	 *         The given range, modified.
	 */
	function trimClosingOpening(range, ignoreLeft, ignoreRight) {
		ignoreLeft = ignoreLeft || fn.returnFalse;
		ignoreRight = ignoreRight || fn.returnFalse;
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
		var start = traversing.childAndParentsUntil(
			this.startContainer,
			fn.returnFalse
		);
		var end = traversing.childAndParentsUntil(
			this.endContainer,
			fn.returnFalse
		);
		this.commonAncestorContainer = arrays.intersect(start, end)[0];
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
	 * Creates a "stable" copy of the given range.
	 *
	 * A native range is live, which means that modifying the DOM may mutate the
	 * range. Also, using setStart/setEnd may not set the properties correctly
	 * (the browser may perform its own normalization of boundary points). The
	 * behaviour of a native range is very erratic and should be converted to a
	 * stable range as the first thing in any algorithm.
	 *
	 * @param {Range} range
	 * @return {StableRange}
	 */
	function stableRange(range) {
		return new StableRange(range);
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
		until = until || fn.returnFalse;
		ignore = ignore || fn.returnFalse;
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
		until = until || fn.returnFalse;
		ignore = ignore || fn.returnFalse;
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
	 * Because Firefox, the range may not be inside the editable even though the
	 * selection may be inside the editable.
	 *
	 * @param {Range} liveRange
	 * @param {DOMObject} Editing host, or null if none is found.
	 */
	function getNearestEditingHost(liveRange) {
		var editable = dom.getEditingHost(range.startContainer);
		if (editable) {
			return editable;
		}
		var range = stableRange(liveRange);
		var isNotEditingHost = fn.complement(dom.isEditingHost);
		trim(range, isNotEditingHost, isNotEditingHost);
		return dom.getEditingHost(
			dom.nodeAtOffset(range.startContainer, range.startOffset)
		);
	}

	/**
	 * Insert the given text to the left of the given range.
	 *
	 * @param {Range} range
	 * @param {String} text
	 *        The text to insert.
	 * @return {Range}
	 *         The given range at which the text was inserted.  If text is
	 *         inserted, this range will have been modified.
	 */
	function insertText(range, text) {
		// Because empty text nodes are generally not nice and even cause
		// problems with IE8 (elem.childNodes).
		if (!text.length) {
			return range;
		}
		var node = dom.nodeAtOffset(range.startContainer, range.startOffset);
		var atEnd = dom.isAtEnd(range.startContainer, range.startOffset);
		// Because if the node following the insert position is already a text
		// node we can just reuse it.
		if (!atEnd && dom.Nodes.TEXT === node.nodeType) {
			var offset = dom.Nodes.TEXT === range.startContainer.nodeType
			           ? range.startOffset
			           : 0;
			node.insertData(offset, text);
			range.setStart(node, offset);
			range.setEnd(node, offset + text.length);
			return range;
		}
		// Because if the node preceding the insert position is already a text
		// node we can just reuse it.
		var prev = atEnd ? node.lastChild : node.previousSibling;
		if (prev && dom.Nodes.TEXT === prev.nodeType) {
			prev.insertData(prev.length, text);
			range.setStart(prev, prev.length - text.length);
			range.setEnd(prev, prev.length);
			return range;
		}
		// Because if we can't reuse any text nodes, we have to insert a new
		// one.
		var textNode = document.createTextNode(text);
		dom.insert(textNode, node, atEnd);
		range.setStart(textNode, 0);
		range.setEnd(textNode, textNode.length);
	}

	function insertTextBehind(range, text) {
		insertText(range, text);
		collapseToEnd(range);
		select(range);
	}

	/**
	 * Library functions for working with DOM ranges.
	 * It assums native support for document.getSelection() and
	 * document.createRange().
	 *
	 * ranges.collapseToEnd()
	 * ranges.collapseToStart()
	 * ranges.create()
	 * ranges.equal()
	 * ranges.expandBoundaries()
	 * ranges.expandToWord()
	 * ranges.get()
	 * ranges.insertText()
	 * ranges.insertTextBehind()
	 * ranges.select()
	 * ranges.setFromReference()
	 * ranges.stableRange()
	 * ranges.trim()
	 * ranges.trimBoundaries()
	 * ranges.trimClosingOpening()
	 * ranges.getNearestEditingHost()
	 */
	var exports = {
		collapseToEnd: collapseToEnd,
		collapseToStart: collapseToStart,
		create: create,
		equal: equal,
		expand: expand,
		contract: contract,
		expandBoundaries: expandBoundaries,
		expandToWord: expandToWord,
		get: get,
		insertText: insertText,
		insertTextBehind: insertTextBehind,
		select: select,
		setFromReference: setFromReference,
		stableRange: stableRange,
		trim: trim,
		trimBoundaries: trimBoundaries,
		trimClosingOpening: trimClosingOpening,
		getNearestEditingHost: getNearestEditingHost
	};

	exports['collapseToEnd'] = exports.collapseToEnd;
	exports['collapseToStart'] = exports.collapseToStart;
	exports['create'] = exports.create;
	exports['equal'] = exports.equal;
	exports['expand'] = exports.expand;
	exports['contract'] = exports.contract;
	exports['expandBoundaries'] = exports.expandBoundaries;
	exports['expandToWord'] = exports.expandToWord;
	exports['get'] = exports.get;
	exports['insertText'] = exports.insertText;
	exports['insertTextBehind'] = exports.insertTextBehind;
	exports['select'] = exports.select;
	exports['setFromReference'] = exports.setFromReference;
	exports['stableRange'] = exports.stableRange;
	exports['trim'] = exports.trim;
	// remove
	exports['trimBoundaries'] = exports.trimBoundaries;
	exports['trimClosingOpening'] = exports.trimClosingOpening;
	exports['getNearestEditingHost'] = exports.getNearestEditingHost;

	return exports;
});
