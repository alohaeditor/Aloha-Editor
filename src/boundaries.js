/**
 * boundaries.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'ranges',
	'arrays',
	'assert'
], function (
	Dom,
	Ranges,
	Arrays,
	Assert
) {
	'use strict';

	/**
	 * Creates a "raw" (un-normalized) boundary from the given node and offset.
	 *
	 * @param  {Node} node
	 * @param  {number} offset
	 * @return {Boundary}
	 */
	function raw(node, offset) {
		return [node, offset];
	}

	/**
	 * Returns a boundary's container node.
	 *
	 * @param  {Boundary} boundary
	 * @return {Node}
	 */
	function container(boundary) {
		return boundary[0];
	}

	/**
	 * Returns the document associated with the given boundary.
	 *
	 * @param  {!Boundary} boundary
	 * @return {Document}
	 */
	function document(boundary) {
		return container(boundary).ownerDocument;
	}

	/**
	 * Returns a boundary's offset.
	 *
	 * @param  {Boundary} boundary
	 * @return {number}
	 */
	function offset(boundary) {
		return boundary[1];
	}

	/**
	 * Returns a boundary that is right in front of the given node.
	 *
	 * @param  {Node} node
	 * @return {Boundary}
	 */
	function fromNode(node) {
		return raw(node.parentNode, Dom.nodeIndex(node));
	}

	/**
	 * Returns a boundary that is at the end position of the given node.
	 *
	 * @param  {Node} node
	 * @return {Boundary}
	 */
	function fromEndOfNode(node) {
		return raw(node, Dom.nodeLength(node));
	}

	/**
	 * Normalizes the boundary point (represented by a container and an offset
	 * tuple) such that it will not point to the start or end of a text node.
	 *
	 * This normalization reduces the number of states the a boundary can be
	 * in, and thereby slightly increases the robusteness of the code written
	 * against it.
	 *
	 * It should be noted that native ranges controlled by the browser's DOM
	 * implementation have the habit of changing by themselves, so even if a
	 * range is set using a boundary that has been normalized this way, the
	 * range could revert to an un-normalized state.  See StableRange().
	 *
	 * The returned value will either be a normalized copy of the given
	 * boundary, or the given boundary itself if no normalization was done.
	 *
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function normalize(boundary) {
		var node = container(boundary);
		if (Dom.isTextNode(node)) {
			Assert.assertNotNou(node.parentNode);
			var boundaryOffset = offset(boundary);
			if (0 === boundaryOffset) {
				return fromNode(node);
			}
			if (boundaryOffset >= Dom.nodeLength(node)) {
				return raw(node.parentNode, Dom.nodeIndex(node) + 1);
			}
		}
		return boundary;
	}

	/**
	 * Creates a node boundary representing an offset position inside of a
	 * container node.
	 *
	 * The resulting boundary will be a normalized boundary, such that the
	 * boundary will never describe a terminal position in a text node.
	 *
	 * @param  {Node} node
	 * @param  {number} offset Positive integer
	 * @return {Boundary}
	 */
	function create(node, offset) {
		return normalize(raw(node, offset));
	}

	/**
	 * Compares two boundaries for equality.  Boundaries are equal if their
	 * corresponding containers and offsets are strictly equal.
	 *
	 * @param  {Boundary} a
	 * @param  {Boundary} b
	 * @retufn {boolean}
	 */
	function equals(a, b) {
		return (container(a) === container(b)) && (offset(a) === offset(b));
	}

	/**
	 * Sets the given range's start boundary.
	 *
	 * @param {Range}    range Range to modify.
	 * @param {Boundary} boundary
	 */
	function setRangeStart(range, boundary) {
		boundary = normalize(boundary);
		range.setStart(container(boundary), offset(boundary));
	}

	/**
	 * Sets the given range's end boundary.
	 *
	 * @param {Range} range Range to modify
	 * @param {Boundary}
	 */
	function setRangeEnd(range, boundary) {
		boundary = normalize(boundary);
		range.setEnd(container(boundary), offset(boundary));
	}

	/**
	 * Sets the given range's start and end position from two respective
	 * boundaries.
	 *
	 * @param {Range}    range Range to modify.
	 * @param {Boundary} start Boundary to set the start position to
	 * @param {Boundary} end   Boundary to set the end position to
	 */
	function setRange(range, start, end) {
		setRangeStart(range, start);
		setRangeEnd(range, end);
	}

	/**
	 * Sets the start and end position of a list of ranges from the given list
	 * of boundaries.
	 *
	 * Because the range at index i in `ranges` will be modified using the
	 * boundaries at index 2i and 2i + 1 in `boundaries`, the size of `ranges`
	 * must be no less than half the size of `boundaries`.
	 *
	 * Because the list of boundaries will need to be partitioned into pairs of
	 * start/end tuples, it is required that the length of `boundaries` be
	 * even.  See Arrays.partition().
	 *
	 * @param {Array.<Range>}    ranges     List of ranges to modify
	 * @param {Array.<Boundary>} boundaries Even list of boundaries
	 */
	function setRanges(ranges, boundaries) {
		Arrays.partition(boundaries, 2).forEach(function (boundaries, i) {
			setRange(ranges[i], boundaries[0], boundaries[1]);
		});
	}

	/**
	 * Creates a boundary from the given range's start position.
	 *
	 * @param  {Range} range
	 * @return {Boundary}
	 */
	function fromRangeStart(range) {
		return create(range.startContainer, range.startOffset);
	}

	/**
	 * Creates a boundary from the given range's end position.
	 *
	 * @param  {Range} range
	 * @return {Boundary}
	 */
	function fromRangeEnd(range) {
		return create(range.endContainer, range.endOffset);
	}

	/**
	 * Returns a start/end boundary tuple representing the start and end
	 * positions of the given range.
	 *
	 * @param  {Range} range
	 * @return {Array.<Boundary>}
	 */
	function fromRange(range) {
		return [fromRangeStart(range), fromRangeEnd(range)];
	}

	/**
	 * Returns an even-sized contiguous sequence of start/end boundaries
	 * aligned in their pairs.
	 *
	 * @param  {Array.<Range>} ranges
	 * @return {Array.<Boundary>}
	 */
	function fromRanges(ranges) {
		// TODO: after refactoring range-preserving functions to use
		// boundaries we can remove this.
		ranges = ranges || [];
		return Arrays.mapcat(ranges, fromRange);
	}

	/**
	 * Checks if a boundary (when normalized) represents a position at the
	 * start of its container's content.
	 *
	 * The start boundary of the given ranges is at the start position:
	 * <b><i>f</i>[oo]</b> and <b><i>{f</i>oo}</b>
	 * The first is at the start of the text node "oo" and the other at start
	 * of the <i> element.
	 *
	 * @param  {Boundary} boundary
	 * @return {boolean}
	 */
	function isAtStart(boundary) {
		return 0 === offset(normalize(boundary));
	}

	/**
	 * Checks if a boundary represents a position at the end of its container's
	 * content.
	 *
	 * The end boundary of the given ranges is at the end position:
	 * <b><i>f</i>{oo]</b> and <b><i>f</i>{oo}</b>
	 * The first is at end of the text node "oo"and the other at end of the <b>
	 * element.
	 *
	 * @param  {Boundary} boundary
	 * @return {boolean}
	 */
	function isAtEnd(boundary) {
		boundary = normalize(boundary);
		return offset(boundary) === Dom.nodeLength(container(boundary));
	}

	/**
	 * Checks if the unnormalized boundary is at the start position of it's
	 * container.
	 *
	 * @param  {Boundary} boundary
	 * @return {boolean}
	 */
	function isAtRawStart(boundary) {
		return 0 === offset(boundary);
	}

	/**
	 * Checks if the unnormalized boundary is at the end position of it's
	 * container.
	 *
	 * @param  {Boundary} boundary
	 * @return {boolean}
	 */
	function isAtRawEnd(boundary) {
		return offset(boundary) === Dom.nodeLength(container(boundary));
	}

	/**
	 * Checks whether the given boundary is a position inside of a text nodes.
	 *
	 * @param  {Boundary} boundary
	 * @return {boolean}
	 */
	function isTextBoundary(boundary) {
		return Dom.isTextNode(container(boundary));
	}

	/**
	 * Checks whether the given boundary is a position between nodes (as
	 * opposed to a position inside of a text node).
	 *
	 * @param  {Boundary} boundary
	 * @return {boolean}
	 */
	function isNodeBoundary(boundary) {
		return !isTextBoundary(boundary);
	}

	/**
	 * Returns the node that is after the given boundary position.
	 * Will return null if the given boundary is at the end position.
	 *
	 * Note that the given boundary will be normalized.
	 *
	 * @param  {Boundary} boundary
	 * @return {Node}
	 */
	function nodeAfter(boundary) {
		boundary = normalize(boundary);
		return isAtEnd(boundary) ? null : Dom.nthChild(container(boundary), offset(boundary));
	}

	/**
	 * Returns the node that is before the given boundary position.
	 * Will returns null if the given boundary is at the start position.
	 *
	 * Note that the given boundary will be normalized.
	 *
	 * @param  {Boundary} boundary
	 * @return {Node}
	 */
	function nodeBefore(boundary) {
		boundary = normalize(boundary);
		return isAtStart(boundary) ? null : Dom.nthChild(container(boundary), offset(boundary) - 1);
	}

	/**
	 * Returns the node after the given boundary, or the boundary's container
	 * if the boundary is at the end position.
	 *
	 * @param  {Boundary} boundary
	 * @return {Node}
	 */
	function nextNode(boundary) {
		boundary = normalize(boundary);
		return nodeAfter(boundary) || container(boundary);
	}

	/**
	 * Returns the node before the given boundary, or the boundary container if
	 * the boundary is at the end position.
	 *
	 * @param  {Boundary} boundary
	 * @return {Node}
	 */
	function prevNode(boundary) {
		boundary = normalize(boundary);
		return nodeBefore(boundary) || container(boundary);
	}

	/**
	 * Skips the given boundary over the node that is next to the boundary.
	 *
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function jumpOver(boundary) {
		var node = nextNode(boundary);
		return raw(node.parentNode, Dom.nodeIndex(node) + 1);
	}

	/**
	 * Returns a boundary that is at the previous position to the given.
	 *
	 * If the given boundary represents a position inside of a text node, the
	 * returned boundary will be moved behind that text node.
	 *
	 * Given the markup below:
	 *
	 *	<div>
	 *		foo
	 *		<p>
	 *			bar
	 *			<b>
	 *				<u></u>
	 *				baz
	 *			</b>
	 *		</p>
	 *	</div>
	 *
	 * the boundary positions which can be traversed with this function are
	 * those marked with the pipe ("|") below:
	 *
	 * |foo|<p>|bar|<b>|<u>|</u>|baz|<b>|</p>|
	 *
	 * This function complements Boundaries.next()
	 *
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function prev(boundary) {
		boundary = normalize(boundary);
		var node = container(boundary);
		if (Dom.isTextNode(node) || isAtStart(boundary)) {
			return fromNode(node);
		}
		node = Dom.nthChild(node, offset(boundary) - 1);
		return Dom.isTextNode(node)
		     ? fromNode(node)
		     : raw(node, Dom.nodeLength(node));
	}

	/**
	 * Like Boundaries.prev(), but returns the boundary position that follows
	 * from the given.
	 *
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function next(boundary) {
		boundary = normalize(boundary);
		var node = container(boundary);
		var boundaryOffset = offset(boundary);
		if (Dom.isTextNode(node) || isAtEnd(boundary)) {
			return jumpOver(boundary);
		}
		var nextNode = Dom.nthChild(node, boundaryOffset);
		return Dom.isTextNode(nextNode)
		     ? raw(nextNode.parentNode, boundaryOffset + 1)
		     : raw(nextNode, 0);
	}

	/**
	 * Like Boundaries.prev() but treats the given boundary as an unnormalized
	 * boundary.
	 *
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function prevRawBoundary(boundary) {
		var node = container(boundary);
		if (isAtRawStart(boundary)) {
			return fromNode(node);
		}
		if (isTextBoundary(boundary)) {
			return raw(node, 0);
		}
		node = Dom.nthChild(node, offset(boundary) - 1);
		return fromEndOfNode(node);
	}

	/**
	 * Like Boundaries.next() but treats the given boundary as an unnormalized
	 * boundary.
	 *
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function nextRawBoundary(boundary) {
		var node = container(boundary);
		if (isAtRawEnd(boundary)) {
			return raw(node.parentNode, Dom.nodeIndex(node) + 1);
		}
		if (isTextBoundary(boundary)) {
			return fromEndOfNode(node);
		}
		return raw(Dom.nthChild(node, offset(boundary)), 0);
	}

	/**
	 * Steps through boundaries while the given condition is true.
	 *
	 * @param  {Boundary}                    boundary Start position
	 * @param  {function(Boundary):boolean}  cond     Predicate
	 * @param  {function(Boundary):Boundary} step     Gets the next boundary
	 * @return {Boundary}
	 */
	function stepWhile(boundary, cond, step) {
		var pos = boundary;
		while (cond(pos)) {
			pos = step(pos);
		}
		return pos;
	}

	/**
	 * Steps forward while the given condition is true.
	 *
	 * @param  {Boundary}                   boundary
	 * @param  {function(Boundary):boolean} cond
	 * @return {Boundary}
	 */
	function nextWhile(boundary, cond) {
		return stepWhile(boundary, cond, next);
	}

	/**
	 * Steps backwards while the given condition is true.
	 *
	 * @param  {Boundary}                   boundary
	 * @param  {function(Boundary):boolean} cond
	 * @return {Boundary}
	 */
	function prevWhile(boundary, cond) {
		return stepWhile(boundary, cond, prev);
	}

	/**
	 * Walks along boundaries according to step(), applying callback() to each
	 * boundary along the traversal until cond() returns false.
	 *
	 * @param  {Boundary}                    boundary Start position
	 * @param  {function(Boundary):boolean}  cond     Predicate
	 * @param  {function(Boundary):Boundary} step     Gets the next boundary
	 * @param  {function(Boundary)}          callback Applied to each boundary
	 */
	function walkWhile(boundary, cond, step, callback) {
		var pos = boundary;
		while (pos && cond(pos)) {
			callback(pos);
			pos = step(pos);
		}
	}

	/**
	 * Gets the boundaries of the currently selected range from the given
	 * document element.
	 *
	 * @param  {Document} doc
	 * @return {?Array<Boundary>}
	 */
	function get(doc) {
		var selection = doc.getSelection();
		return (selection.rangeCount > 0)
		     ? fromRange(selection.getRangeAt(0))
		     : null;
	}

	/**
	 * Creates a range based on the given start and end boundaries.
	 *
	 * @param  {Boundary} start
	 * @param  {Boundary} end
	 * @return {Range}
	 */
	function toRange(start, end) {
		return Ranges.create(
			container(start),
			offset(start),
			container(end),
			offset(end)
		);
	}

	/**
	 * Sets the a range to the browser selection according to the given start
	 * and end boundaries.  This operation will cause the selection to be
	 * visually rendered by the user agent.
	 *
	 * @param {Boundary}  start
	 * @param {Boundary=} end
	 */
	function select(start, end) {
		if (!end) {
			end = start;
		}
		var range = toRange(start, end);
		var doc = range.commonAncestorContainer.ownerDocument;
		var selection = doc.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	}

	/**
	 * Return the ancestor container that contains both the given boundaries.
	 *
	 * @param  {Boundary} start
	 * @param  {Boundary} end
	 * @return {Node}
	 */
	function commonContainer(start, end) {
		return toRange(start, end).commonAncestorContainer;
	}

	function fromPosition(x, y, doc) {
		var range = Ranges.fromPosition(x, y, doc);
		return range && fromRange(range);
	}

	return {
		get                 : get,
		select              : select,

		raw                 : raw,
		create              : create,
		normalize           : normalize,

		equals              : equals,

		container           : container,
		offset              : offset,
		document            : document,

		range               : toRange,

		fromRange           : fromRange,
		fromRanges          : fromRanges,
		fromRangeStart      : fromRangeStart,
		fromRangeEnd        : fromRangeEnd,
		fromNode            : fromNode,
		fromEndOfNode       : fromEndOfNode,
		fromPosition        : fromPosition,

		/* these functions should be in ranges.js */
		setRange            : setRange,
		setRanges           : setRanges,
		setRangeStart       : setRangeStart,
		setRangeEnd         : setRangeEnd,

		isAtStart           : isAtStart,
		isAtEnd             : isAtEnd,
		isAtRawStart        : isAtRawStart,
		isAtRawEnd          : isAtRawEnd,
		isTextBoundary      : isTextBoundary,
		isNodeBoundary      : isNodeBoundary,

		next                : next,
		prev                : prev,
		nextRawBoundary     : nextRawBoundary,
		prevRawBoundary     : prevRawBoundary,

		jumpOver            : jumpOver,

		nextWhile           : nextWhile,
		prevWhile           : prevWhile,
		stepWhile           : stepWhile,
		walkWhile           : walkWhile,

		nextNode            : nextNode,
		prevNode            : prevNode,
		nodeAfter           : nodeAfter,
		nodeBefore          : nodeBefore,

		commonContainer     : commonContainer
	};
});
