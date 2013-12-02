/* boundaries.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'misc',
	'arrays',
	'assert',
	'predicates'
], function Boundaries(
	Dom,
	Misc,
	Arrays,
	Asserts,
	Predicates
) {
	'use strict';

	/**
	 * Creates a "raw" (un-normalized) boundary from the given node and offset.
	 *
	 * @private
	 * @param  {Node} node
	 * @return {number} offset
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
	 * Returns a boundary's offset.
	 *
	 * @param  {Boundary} boundary
	 * @return {number}
	 */
	function offset(boundary) {
		return boundary[1];
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
			Asserts.assertTrue(
				Misc.defined(node.parentNode),
				Asserts.errorLink('boundaries.normalize#parentNode')
			);
			var boundaryOffset = offset(boundary);
			if (0 === boundaryOffset) {
				return raw(node.parentNode, Dom.nodeIndex(node));
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
		return [range.startContainer, range.startOffset];
	}

	/**
	 * Creates a boundary from the given range's end position.
	 *
	 * @param  {Range} range
	 * @return {Boundary}
	 */
	function fromRangeEnd(range) {
		return [range.endContainer, range.endOffset];
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
	 * Checks whether the given boundary is a position between nodes (as
	 * opposed to a position inside of a text node).
	 *
	 * @param  {Boundary} boundary
	 * @return {boolean}
	 */
	function isNodeBoundary(boundary) {
		return !Dom.isTextNode(container(boundary));
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
	 * the boundary positions which can be traversed with this function will be
	 * are those marked with the pipe ("|") below:
	 *
	 * |foo|<p>|bar|<b>|<u>|</u>|baz|<b>|</p>|
	 *
	 * This function complements Boundaries.next()
	 *
	 * @todo do not be partial to void elements
	 * @param  {Boundary} boundary Reference boundary
	 * @return {Boundary} Preceding boundary position
	 */
	function prev(boundary) {
		var node = container(boundary);
		if (Dom.isTextNode(node) || 0 === offset(boundary)) {
			return raw(node.parentNode, Dom.nodeIndex(node));
		}
		node = node.childNodes[offset(boundary) - 1];
		return (Dom.isTextNode(node) || Predicates.isVoidNode(node))
		     ? raw(node.parentNode, Dom.nodeIndex(node))
		     : raw(node, Dom.nodeLength(node));
	}

	/**
	 * Like Boundaries.prev(), but returns the boundary position that follows
	 * from the given.
	 *
	 * @todo do not be partial to void elements
	 * @param  {Boundary} boundary Reference boundary
	 * @return {Boundary} Next boundary position
	 */
	function next(boundary) {
		var node = container(boundary);
		var boundaryOffset = offset(boundary);
		if (Dom.isTextNode(node) || Dom.nodeLength(node) === boundaryOffset) {
			return raw(node.parentNode, Dom.nodeIndex(node) + 1);
		}
		node = node.childNodes[boundaryOffset];
		return (Dom.isTextNode(node) || Predicates.isVoidNode(node))
		     ? raw(node.parentNode, boundaryOffset + 1)
		     : raw(node, 0);
	}

	/**
	 * Steps through boundaries while the given condition is true.
	 *
	 * @param  {Boundary} boundary Boundary from which to start stepping
	 * @param  {function(Boundary, Element, offset):boolean} cond Predicate
	 * @param  {function(Boundary):Boundary} step Returns the next boundary
	 * @return {Boundary} Boundary at which stepping was terminated
	 */
	function stepWhile(boundary, cond, step) {
		var pos = boundary;
		while (cond(pos)) {
			pos = step(pos);
		}
		return pos;
	}

	/**
	 * Step forward while the given condition is true.
	 *
	 * @param  {Boundary} boundary
	 * @param  {function(Boundary, Element, offset):boolean} cond
	 * @return {Boundary}
	 */
	function nextWhile(boundary, cond) {
		return stepWhile(boundary, cond, next);
	}

	/**
	 * Step backwards while the given condition is true.
	 *
	 * @param  {Boundary} boundary
	 * @param  {function(Boundary, Element, offset):boolean} cond
	 * @return {Boundary}
	 */
	function prevWhile(boundary, cond) {
		return stepWhile(boundary, cond, prev);
	}

	/**
	 * Returns the node that is after the given boundary position.
	 *
	 * Will return null if the given boundary is at the end position, otherwise
	 * returns the node that is after the given boundary position.
	 *
	 * Note that the given boundary will be normalized.
	 *
	 * @param  {Boundary} boundary
	 * @return {Node}.
	 */
	function nodeAfter(boundary) {
		boundary = normalize(boundary);
		Asserts.assertTrue(
			isNodeBoundary(boundary),
			Asserts.errorLink('boundaries.nodeAfter#isNodeBoundary')
		);
		return isAtEnd(boundary) ? null : Dom.nthChild(container(boundary), offset(boundary));
	}

	/**
	 * The node that is before the given boundary position.
	 *
	 * Note that the given boundary will be normalized.
	 *
	 * Will returns null if the given boundary is at the start position,
	 * otherwise returns the node after `boundary`.
	 *
	 * @param  {Boundary} boundary
	 * @return {Node}
	 */
	function nodeBefore(boundary) {
		boundary = normalize(boundary);
		Asserts.assertTrue(
			isNodeBoundary(boundary),
			Asserts.errorLink('boundaries.nodeBefore#isNodeBoundary')
		);
		return isAtStart(boundary) ? null : Dom.nthChild(container(boundary), offset(boundary) - 1);
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
	 * @deprecated Use Boundaries.nextNode() instead
	 */
	function nodeAtBoundary(boundary) {
		console.error(Asserts.errorLink('boundaries.nodeAtBoundary#deprecated'));
		return Dom.nodeAtOffset(container(boundary), offset(boundary));
	}

	/**
	 * Calculates the cumulative length of contiguous text nodes immediately
	 * preceding the given boundary.
	 *
	 * @param  {Boundary} boundary
	 * @return {number}
	 */
	function precedingTextLength(boundary) {
		boundary = normalize(boundary);
		var node = nodeBefore(boundary);
		var len = 0;
		if (!isNodeBoundary(boundary)) {
			len += offset(boundary);
			node = node.previousSibling;
		}
		while (node && Dom.isTextNode(node)) {
			len += Dom.nodeLength(node);
			node = node.previousSibling;
		}
		return len;
	}

	return {
		create         : create,
		equals         : equals,
		normalize      : normalize,
		container      : container,
		offset         : offset,

		fromRange      : fromRange,
		fromRanges     : fromRanges,
		fromRangeStart : fromRangeStart,
		fromRangeEnd   : fromRangeEnd,
		fromNode       : fromNode,

		isAtStart      : isAtStart,
		isAtEnd        : isAtEnd,
		isNodeBoundary : isNodeBoundary,

		next           : next,
		prev           : prev,
		nextWhile      : nextWhile,
		prevWhile      : prevWhile,

		nextNode       : nextNode,
		prevNode       : prevNode,
		nodeAfter      : nodeAfter,
		nodeBefore     : nodeBefore,
		nodeAtBoundary : nodeAtBoundary,

		setRange       : setRange,
		setRanges      : setRanges,

		precedingTextLength : precedingTextLength
	};
});
