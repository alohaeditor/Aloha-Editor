/**
 * mutation.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'arrays',
	'boundaries'
], function Mutation(
	Dom,
	Arrays,
	Boundaries
) {
	'use strict';

	/**
	 * Checks whether a node can be split at the given offset to yeild two
	 * nodes.
	 *
	 * @private
	 * @param {!Node} node
	 * @param {number} offset
	 * @return {boolean}
	 */
	function wouldSplitTextNode(node, offset) {
		return 0 < offset && offset < node.nodeValue.length;
	}

	/**
	 * Splits the given text node at the given offset.
	 *
	 * @TODO: could be optimized with insertData() so only a single text node is
	 *        inserted instead of two.
	 *
	 * @param {!Node} node
	 *        DOM text node.
	 * @param {number} offset
	 *        Number between 0 and the length of text of `node`.
	 * @return {!Node}
	 */
	function splitTextNode(node, offset) {
		// Because node.splitText() is buggy on IE, split it manually.
		// http://www.quirksmode.org/dom/w3c_core.html
		if (!wouldSplitTextNode(node, offset)) {
			return node;
		}
		var parent = node.parentNode;
		var text = node.nodeValue;
		var doc = parent.ownerDocument;
		var before = doc.createTextNode(text.substring(0, offset));
		var after = doc.createTextNode(
			text.substring(offset, text.length)
		);
		parent.insertBefore(before, node);
		parent.insertBefore(after, node);
		parent.removeChild(node);
		return before;
	}

	function adjustBoundaryAfterSplit(boundary, splitNode, splitOffset,
	                                  newNodeBeforeSplit) {
		var container = boundary[0];
		var offset = boundary[1];
		if (container === splitNode) {
			if (offset <= splitOffset || !splitOffset) {
				container = newNodeBeforeSplit;
			} else {
				container = newNodeBeforeSplit.nextSibling;
				offset -= splitOffset;
			}
		} else if (container === newNodeBeforeSplit.parentNode) {
			var nidx = Dom.nodeIndex(newNodeBeforeSplit);
			if (offset > nidx) {
				offset += 1;
			}
		}
		return [container, offset];
	}

	function adjustBoundaryAfterJoin(boundary, node, nodeLen, sibling,
	                                 siblingLen, parentNode, nidx, prev) {
		var container = boundary[0];
		var offset = boundary[1];
		if (container === node) {
			container = sibling;
			offset += prev ? siblingLen : 0;
		} else if (container === sibling) {
			offset += prev ? 0 : nodeLen;
		} else if (container === parentNode) {
			if (offset === nidx) {
				container = sibling;
				offset = prev ? siblingLen : 0;
			} else if (!prev && offset === nidx + 1) {
				container = sibling;
				offset = nodeLen;
			} else if (offset > nidx) {
				offset -= 1;
			}
		}
		return [container, offset];
	}

	function adjustBoundaryAfterRemove(boundary, node, parentNode, nidx) {
		var container = boundary[0];
		var offset = boundary[1];
		if (container === node || Dom.contains(node, container)) {
			container = parentNode;
			offset = nidx;
		} else if (container === parentNode) {
			if (offset > nidx) {
				offset -= 1;
			}
		}
		return [container, offset];
	}

	function adjustBoundaryAfterInsert(boundary, insertContainer, insertOff, len, insertBefore) {
		var container = boundary[0];
		var offset = boundary[1];
		if (insertContainer === container && (insertBefore ? offset >= insertOff : offset > insertOff)) {
			boundary = [container, offset + len];
		}
		return boundary;
	}

	function adjustBoundaryAfterTextInsert(boundary, node, off, len, insertBefore) {
		boundary = Boundaries.normalize(boundary);
		var container = boundary[0];
		var offset = boundary[1];
		// Because we must adjust boundaries adjacent to the insert
		// correctly, even if they are not inside the text node but
		// between nodes, we must move them in temporarily and normalize
		// again afterwards.
		if (!Dom.isTextNode(container)) {
			var next = offset < Dom.numChildren(container) ? Dom.nthChild(container, offset) : null;
			var prev = offset > 0 ? Dom.nthChild(container, offset - 1) : null;
			if (next === node) {
				boundary = [next, 0];
			} else if (prev === node) {
				boundary = [prev, Dom.nodeLength(prev)];
			}
		}
		return Boundaries.normalize(adjustBoundaryAfterInsert(boundary, node, off, len, insertBefore));
	}

	function adjustBoundaryAfterNodeInsert(boundary, node, insertBefore) {
		boundary = Boundaries.normalize(boundary);
		return adjustBoundaryAfterInsert(boundary, node.parentNode, Dom.nodeIndex(node), 1, insertBefore);
	}

	function adjustBoundaries(fn, boundaries) {
		var args = Array.prototype.slice.call(arguments, 2);
		return boundaries.map(function (boundary) {
			return fn.apply(null, [boundary].concat(args));
		});
	}

	/**
	 * Splits the given text node at the given offset and, if the given
	 * range happens to have start or end containers equal to the given
	 * text node, adjusts it such that start and end position will point
	 * at the same position in the new text nodes.
	 */
	function splitBoundary(boundary, ranges) {
		var splitNode = boundary[0];
		var splitOffset = boundary[1];
		if (Dom.isTextNode(splitNode) && wouldSplitTextNode(splitNode, splitOffset)) {
			var boundaries = Boundaries.fromRanges(ranges);
			boundaries.push(boundary);
			var nodeBeforeSplit = splitTextNode(splitNode, splitOffset);
			var adjusted = adjustBoundaries(
				adjustBoundaryAfterSplit,
				boundaries,
				splitNode,
				splitOffset,
				nodeBeforeSplit
			);
			boundary = adjusted.pop();
			Boundaries.setRanges(ranges, adjusted);
		}
		return boundary;
	}

	/**
	 * Splits text containers in the given range.
	 *
	 * @param {!Range} range
	 * @return {!Range}
	 *         The given range, potentially adjusted.
	 */
	function splitTextContainers(range) {
		splitBoundary(Boundaries.fromRangeStart(range), [range]);
		splitBoundary(Boundaries.fromRangeEnd(range), [range]);
	}

	function joinTextNodeOneWay(node, sibling, ranges, prev) {
		if (!sibling || !Dom.isTextNode(sibling)) {
			return node;
		}
		var boundaries = Boundaries.fromRanges(ranges);
		var parentNode = node.parentNode;
		var nidx = Dom.nodeIndex(node);
		var nodeLen = node.length;
		var siblingLen = sibling.length;
		sibling.insertData(prev ? siblingLen : 0, node.data);
		parentNode.removeChild(node);
		boundaries = adjustBoundaries(
			adjustBoundaryAfterJoin,
			boundaries,
			node,
			nodeLen,
			sibling,
			siblingLen,
			parentNode,
			nidx,
			prev
		);
		Boundaries.setRanges(ranges, boundaries);
		return sibling;
	}

	function joinTextNode(node, ranges) {
		if (!Dom.isTextNode(node)) {
			return;
		}
		node = joinTextNodeOneWay(node, node.previousSibling, ranges, true);
		joinTextNodeOneWay(node, node.nextSibling, ranges, false);
	}

	/**
	 * Joins the given node with its adjacent sibling.
	 *
	 * @param {!Node} A text node
	 * @param {!Range} range
	 * @return {!Range} The given range, modified if necessary.
	 */
	function joinTextNodeAdjustRange(node, range) {
		joinTextNode(node, [range]);
	}

	function adjustRangesAfterTextInsert(node, off, len, insertBefore, boundaries, ranges) {
		boundaries.push([node, off]);
		boundaries = adjustBoundaries(adjustBoundaryAfterTextInsert, boundaries, node, off, len, insertBefore);
		var boundary = boundaries.pop();
		Boundaries.setRanges(ranges, boundaries);
		return boundary;
	}

	function adjustRangesAfterNodeInsert(node, insertBefore, boundaries, ranges) {
		boundaries.push([node.parentNode, Dom.nodeIndex(node)]);
		boundaries = adjustBoundaries(adjustBoundaryAfterNodeInsert, boundaries, node, insertBefore);
		var boundary = boundaries.pop();
		Boundaries.setRanges(ranges, boundaries);
		return boundary;
	}

	function insertTextAtBoundary(text, boundary, insertBefore, ranges) {
		var boundaries = Boundaries.fromRanges(ranges);
		// Because empty text nodes are generally not nice and even cause
		// problems with IE8 (elem.childNodes).
		if (!text.length) {
			return boundary;
		}
		var container = boundary[0];
		var offset = boundary[1];
		if (Dom.isTextNode(container) && offset < Dom.nodeLength(container)) {
			container.insertData(offset, text);
			return adjustRangesAfterTextInsert(container, offset, text.length, insertBefore, boundaries, ranges);
		}
		var node = Dom.nodeAtOffset(container, offset);
		var atEnd = Boundaries.isAtEnd(Boundaries.raw(container, offset));
		// Because if the node following the insert position is already a text
		// node we can just reuse it.
		if (Dom.isTextNode(node)) {
			node.insertData(0, text);
			return adjustRangesAfterTextInsert(node, 0, text.length, insertBefore, boundaries, ranges);
		}
		// Because if the node preceding the insert position is already a text
		// node we can just reuse it.
		var prev = atEnd ? node.lastChild : node.previousSibling;
		if (prev && Dom.isTextNode(prev)) {
			var off = Dom.nodeLength(prev);
			prev.insertData(off, text);
			return adjustRangesAfterTextInsert(prev, off, text.length, insertBefore, boundaries, ranges);
		}
		// Because if we can't reuse any text nodes, we have to insert a new
		// one.
		var textNode = node.ownerDocument.createTextNode(text);
		Dom.insert(textNode, node, atEnd);
		return adjustRangesAfterNodeInsert(textNode, insertBefore, boundaries, ranges);
	}

	function insertNodeAtBoundary(node, boundary, insertBefore, ranges) {
		var boundaries = Boundaries.fromRanges(ranges);
		boundary = splitBoundary(boundary, ranges);
		var ref = Boundaries.nextNode(boundary);
		var atEnd = Boundaries.isAtEnd(boundary);
		Dom.insert(node, ref, atEnd);
		return adjustRangesAfterNodeInsert(node, insertBefore, boundaries, ranges);
	}

	/**
	 * Removes the given node while maintaing the given Ranges.
	 *
	 * @param {!Node} node
	 * @param {!Array.<!Range>} ranges
	 */
	function removePreservingRanges(node, ranges) {
		var range;
		// Because the range may change due to the DOM modification
		// (automatically by the browser).
		var boundaries = Boundaries.fromRanges(ranges);
		var parentNode = node.parentNode;
		var nidx = Dom.nodeIndex(node);
		parentNode.removeChild(node);
		var adjusted = adjustBoundaries(
			adjustBoundaryAfterRemove,
			boundaries,
			node,
			parentNode,
			nidx
		);
		Boundaries.setRanges(ranges, adjusted);
	}

	/**
	 * Removes the given node while maintaing the given range.
	 *
	 * @param {!Node} node
	 * @param {!Range} range
	 */
	function removePreservingRange(node, range) {
		removePreservingRanges(node, [range]);
	}

	function preserveCursorForShallowRemove(node, cursor) {
		if (cursor.node === node) {
			if (cursor.node.firstChild) {
				cursor.next();
			} else {
				cursor.skipNext();
			}
		}
	}

	/**
	 * Does a shallow removal of the given node (see removeShallow()), while
	 * preserving the cursors.
	 *
	 * @param {!Node} node
	 * @param {!Array.<!Cursor>} cursors
	 */
	function removeShallowPreservingCursors(node, cursors) {
		cursors.forEach(function (cursor) {
			preserveCursorForShallowRemove(node, cursor);
		});
		Dom.removeShallow(node);
	}

	return {
		removeShallowPreservingCursors : removeShallowPreservingCursors,
		removePreservingRange          : removePreservingRange,
		removePreservingRanges         : removePreservingRanges,
		insertTextAtBoundary           : insertTextAtBoundary,
		insertNodeAtBoundary           : insertNodeAtBoundary,
		splitTextNode                  : splitTextNode,
		splitTextContainers            : splitTextContainers,
		joinTextNodeAdjustRange        : joinTextNodeAdjustRange,
		joinTextNode                   : joinTextNode,
		splitBoundary                  : splitBoundary
	};
});
