/* boundaries.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'arrays',
	'predicates'
], function Boundaries(
	Dom,
	Arrays,
	Predicates
) {
	'use strict';

	/**
	 * Compares two boundaries for equality.  Boundaries are equal if their
	 * corresponding containers and offsets are strictly equal.
	 *
	 * @param  {Boundary} a
	 * @param  {Boundary} b
	 * @retufn {boolean}
	 */
	function equals(a, b) {
		return a[0] === b[0] && a[1] === b[1];
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
	 * range could revert to an unnormalized state.  See StableRange().
	 *
	 * @param  {Boundary} boundary Boundary to be normalized.
	 * @return {Boundary} Normalized copy of the given boundary, or the given
	 *         boundary itself if no normalization was done.
	 */
	function normalize(boundary) {
		var container = boundary[0];
		if (Dom.isTextNode(container)) {
			var parent = container.parentNode;
			var offset = boundary[1];
			if (!offset && parent) {
				boundary = [parent, Dom.nodeIndex(container)];
			} else if (offset >= Dom.nodeLength(container) && parent) {
				boundary = [parent, Dom.nodeIndex(container) + 1];
			}
		}
		return boundary;
	}

	/**
	 * Sets the given range's start boundary.
	 *
	 * @param {Range}    range Range to modify.
	 * @param {Boundary} boundary
	 */
	function setRangeStart(range, boundary) {
		boundary = normalize(boundary);
		range.setStart(boundary[0], boundary[1]);
	}

	/**
	 * Sets the given range's end boundary.
	 *
	 * @param {Range} range Range to modify.
	 * @param {Boundary}
	 */
	function setRangeEnd(range, boundary) {
		boundary = normalize(boundary);
		range.setEnd(boundary[0], boundary[1]);
	}

	/**
	 * Sets the given range's start and end position from two respective
	 * boundaries.
	 *
	 * @param {Range}    range Range to modify.
	 * @param {Boundary} start Boundary to set the start position to.
	 * @param {Boundary} end   Boundary to set the end position to.
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
	 * @param {Array.<Range>}    ranges     List of ranges to modify.
	 * @param {Array.<Boundary>} boundaries Even list of boundaries.  Must be
	 *        no greater than twice the size of `ranges`.
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
	function start(range) {
		return [range.startContainer, range.startOffset];
	}

	/**
	 * Creates a boundary from the given range's end position.
	 *
	 * @param  {Range} range
	 * @return {Boundary}
	 */
	function end(range) {
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
		return [start(range), end(range)];
	}

	/**
	 * Returns an even-sized contiguous sequence of start/end boundaries
	 * aligned in their pairs.
	 *
	 * @param  {Array.<Range>}    ranges
	 * @return {Array.<Boundary>}
	 */
	function fromRanges(ranges) {
		// TODO: after refactoring range-preserving functions to use
		// boundaries we can remove this.
		ranges = ranges || [];
		return Arrays.mapcat(ranges, fromRange);
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
	 * @param  {Boundary} boundary Reference from which to determine the
	 *         preceeding boundary position.
	 * @return {Boundary} Preceding boundary position.
	 */
	function prev(boundary) {
		var node = boundary[0];
		var offset = boundary[1];
		if (Dom.isTextNode(node) || 0 === offset) {
			return [node.parentNode, Dom.nodeIndex(node)];
		}
		node = node.childNodes[offset - 1];
		return (Dom.isTextNode(node) || Predicates.isVoidNode(node))
		     ? [node.parentNode, Dom.nodeIndex(node)]
		     : [node, Dom.nodeLength(node)];
	}

	/**
	 * Like Boundaries.prev(), but returns the boundary position that follows
	 * from the given.
	 *
	 * @todo do not be partial to void elements
	 * @param  {Boundary} boundary Reference from which to determine the
	 *         next boundary position.
	 * @return {Boundary} Next boundary position.
	 */
	function next(boundary) {
		var node = boundary[0];
		var offset = boundary[1];
		if (Dom.isTextNode(node) || Dom.nodeLength(node) === offset) {
			return [node.parentNode, Dom.nodeIndex(node) + 1];
		}
		node = node.childNodes[offset];
		return (Dom.isTextNode(node) || Predicates.isVoidNode(node))
		     ? [node.parentNode, offset + 1]
		     : [node, 0];
	}

	/**
	 * Steps through boundaries while the given condition is true.
	 *
	 * @param  {Boundary} boundary Boundary from which to start stepping.
	 * @param  {function(Boundary, Element, offset):boolean} cond Predicate
	 *         which will cause stepping to terminate when it returns false.
	 * @param  {function(Boundary):Boundary} step Returns the next boundary to
	 *         step through.
	 * @return {Boundary} Boundary at which stepping was terminated.
	 */
	function stepWhile(boundary, cond, step) {
		var pos = boundary;
		while (cond(pos, pos[0], pos[1])) {
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
		return boundary[1] === Dom.nodeLength(boundary[0]);
	}

	/**
	 * Checks if a boundary represents a position at the start of its
	 * container's content.
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
		boundary = normalize(boundary);
		return 0 === boundary[1];
	}

	/**
	 * Checks whether the given boundary is a position between nodes (as
	 * opposed to a position inside of a text node).
	 *
	 * @param  {Boundary} boundary
	 * @return {boolean}
	 */
	function isNodeBoundary(boundary) {
		return !Dom.isTextNode(boundary[0]);
	}

	/**
	 * The node that is after the given boundary position.
	 *
	 * Note that the given boundary will be normalized.
	 *
	 * @param  {Boundary} boundary
	 * @return {Node} Returns null if the given boundary is at the end
	 *         position, otherwise returns the node before `boundary`.
	 */
	function nodeAfter(boundary) {
		boundary = normalize(boundary);
		if (!isNodeBoundary(boundary)) {
			return boundary[0].nextSibling;
		}
		return isAtEnd(boundary) ? null : Dom.nthChild(boundary[0], boundary[1]);
	}

	/**
	 * The node that is before the given boundary position.
	 *
	 * Note that the given boundary will be normalized.
	 *
	 * @param  {Boundary} boundary
	 * @return {Node} Returns null if the given boundary is at the start
	 *         position, otherwise returns the node after `boundary`.
	 */
	function nodeBefore(boundary) {
		boundary = normalize(boundary);
		if (!isNodeBoundary(boundary)) {
			return boundary[0];
		}
		return isAtStart(boundary) ? null : Dom.nthChild(boundary[0], boundary[1] - 1);
	}

	/**
	 * Returns a boundary that is right in front of the given node.
	 *
	 * @param  {Node} node
	 * @return {Boundary}
	 */
	function beforeNode(node) {
		return [node.parentNode, Dom.nodeIndex(node)];
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
		console.error('Boundaries.nodeAtBoundary() is deprecated. Use Boundaries.nextNode() instead');
		return Dom.nodeAtOffset(boundary[0], boundary[1]);
	}

	/**
	 * Calculates the cumulative length of consecutive text nodes immediately
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
			len += boundary[1];
			node = node.previousSibling;
		}
		while (node && Dom.isTextNode(node)) {
			len += Dom.nodeLength(node);
			node = node.previousSibling;
		}
		return len;
	}

	var exports = {
		equals     : equals,

		normalize  : normalize,

		start      : start,
		end        : end,
		fromRange  : fromRange,
		fromRanges : fromRanges,
		beforeNode : beforeNode,

		next       : next,
		prev       : prev,
		nextWhile  : nextWhile,
		prevWhile  : prevWhile,

		nextNode       : nextNode,
		prevNode       : prevNode,
		container      : container,
		nodeAfter      : nodeAfter,
		nodeBefore     : nodeBefore,
		nodeAtBoundary : nodeAtBoundary,

		isAtStart      : isAtStart,
		isAtEnd        : isAtEnd,
		isNodeBoundary : isNodeBoundary,

		setRange  : setRange,
		setRanges : setRanges,

		precedingTextLength : precedingTextLength
	};

	exports['equals'] = exports.equals;

	exports['normalize'] = exports.normalize;

	exports['start'] = exports.start;
	exports['end'] = exports.end;
	exports['fromRange'] = exports.fromRange;
	exports['fromRanges'] = exports.fromRanges;
	exports['beforeNode'] = exports.beforeNode;

	exports['next'] = exports.next;
	exports['prev'] = exports.prev;
	exports['nextWhile'] = exports.nextWhile;
	exports['prevWhile'] = exports.prevWhile;

	exports['nextNode'] = exports.nextNode;
	exports['prevNode'] = exports.prevNode;
	exports['container'] = exports.container;
	exports['nodeAfter'] = exports.nodeAfter;
	exports['nodeBefore'] = exports.nodeBefore;
	exports['nodeAtBoundary'] = exports.nodeAtBoundary;

	exports['isAtStart'] = exports.isAtStart;
	exports['isAtEnd'] = exports.isAtEnd;
	exports['isNodeBoundary'] = exports.isNodeBoundary;

	exports['setRange'] = exports.setRange;
	exports['setRanges'] = exports.setRanges;

	exports['precedingTextLength'] = exports.precedingTextLength;

	return exports;
});
