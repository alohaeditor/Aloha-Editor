/* boundaries.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'arrays',
	'predicates',
	'assert'
], function Boundaries(
	Dom,
	Arrays,
	Predicates,
	Assert
) {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('boundaries');
	}

	function equal(a, b) {
		return a[0] === b[0] && a[1] === b[1];
	}

	function start(range) {
		return [range.startContainer, range.startOffset];
	}

	function end(range) {
		return [range.endContainer, range.endOffset];
	}

	/**
	 * Normalizes the boundary point represented by container and offset
	 * such that it will not point to the start or end of a text node
	 * which reduces the number of different states the boundary can be
	 * in, and thereby increases the the robusteness of the code written
	 * against it slightly.
	 *
	 * It should be noted that native ranges controlled by the browser's
	 * DOM implementation have the habit to change by themselves, so
	 * even if normalized this way the range could revert to an
	 * unnormalized state. See StableRange().
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
	 * @param {!Range} range Range objec to modify.
	 */
	function setRangeStartFromBoundary(range, boundary) {
		boundary = normalize(boundary);
		range.setStart(boundary[0], boundary[1]);
	}

	/**
	 * Sets the given range's end boundary.
	 *
	 * @param {!Range} range Range objec to modify.
	 */
	function setRangeEndFromBoundary(range, boundary) {
		boundary = normalize(boundary);
		range.setEnd(boundary[0], boundary[1]);
	}

	function setRangeFromBoundaries(range, startBoundary, endBoundary) {
		setRangeStartFromBoundary(range, startBoundary);
		setRangeEndFromBoundary(range, endBoundary);
	}

	function setRangesFromBoundaries(ranges, boundaries) {
		Arrays.partition(boundaries, 2).forEach(function (boundaries, i) {
			setRangeFromBoundaries(ranges[i], boundaries[0], boundaries[1]);
		});
	}

	function fromRange(range) {
		return [start(range), end(range)];
	}

	function fromRanges(ranges) {
		// TODO: after refactoring range-preserving functions to use
		// boundaries we can remove this.
		ranges = ranges || [];
		return Arrays.mapcat(ranges, fromRange);
	}

	/**
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
	 *	|foo|<p>|bar|<b>|<u>|</u>|baz|<b>|</p>|
	 */
	function prev(boundary) {
		var node = boundary[0];
		var offset = boundary[1];

		// <p>[foo</p>
		// <p>fo[o</p>
		// <p>foo[</p>
		// ==
		// <p>{foo</p>
		//
		// <p>{<p> ==> {<p></p>
		if (0 === offset || Dom.isTextNode(node)) {
			return [node.parentNode, Dom.nodeIndex(node)];
		}

		// <p>foo{</p> ==> <p>{foo</p>
		// <p><b>foo</b>bar{</p> ==> <p><b>foo</b>{foo</p>
		// <p><b><b>{</p> ==> <p><b>{</b></p>
		// <p><b></b>{foo</p> ==> <p><b>{</b>foo</p>
		// <p><b>foo</b>{bar</p> ==> <p><b>foo{</b>bar</p>
		// <p>foo{<b></b></p> ==> <p>{foo<b></b></p>
		node = node.childNodes[offset - 1];

		return (Dom.isTextNode(node) || Predicates.isVoidNode(node))
		     ? [node.parentNode, Dom.nodeIndex(node)]
		     : [node, Dom.nodeLength(node)];
	}

	function next(boundary) {
		var node = boundary[0];
		var offset = boundary[1];

		// <p>[foo</p>
		// <p>fo[o</p>
		// <p>foo[</p>
		// ==
		// <p>foo{</p>
		//
		// <p><b>foo{</b></p> ==> <p><b>foo</b>{</p>
		// <p><b>{</b></p> ==> <p><b></b>{</p>
		if (Dom.isTextNode(node) || Dom.nodeLength(node) === offset) {
			return [node.parentNode, Dom.nodeIndex(node) + 1];
		}

		// <p>{foo</p> ==> <p>foo{</p>
		// <p>{<b>foo</b></p> ==> <p><b>{foo</b></p>
		node = node.childNodes[offset];

		return (Dom.isTextNode(node) || Predicates.isVoidNode(node))
		     ? [node.parentNode, offset + 1]
		     : [node, 0];
	}

	function stepWhile(boundary, cond, step) {
		var pos = boundary;
		while (pos[0] && cond(pos, pos[0], pos[1])) {
			pos = step(pos);
		}
		return pos;
	}

	function nextWhile(boundary, cond) {
		return stepWhile(boundary, cond, next);
	}

	function prevWhile(boundary, cond) {
		return stepWhile(boundary, cond, prev);
	}

	function isAtEnd(boundary) {
		boundary = normalize(boundary);
		return boundary[1] === Dom.nodeLength(boundary[0]);
	}

	function isAtStart(boundary) {
		boundary = normalize(boundary);
		return 0 === boundary[1];
	}

	function isNodeBoundary(boundary) {
		return !Dom.isTextNode(boundary[0]);
	}

	function nodeAfter(boundary) {
		boundary = normalize(boundary);
		if (!isNodeBoundary(boundary)) {
			return boundary[0].nextSibling;
		}
		return isAtEnd(boundary) ? null : Dom.nthChild(boundary[0], boundary[1]);
	}

	function nodeBefore(boundary) {
		boundary = normalize(boundary);
		if (!isNodeBoundary(boundary)) {
			return boundary[0];
		}
		return isAtStart(boundary) ? null : Dom.nthChild(boundary[0], boundary[1] - 1);
	}

	function beforeNode(node) {
		return [node.parentNode, Dom.nodeIndex(node)];
	}

	function atEndOfNode(node) {
		return [node, Dom.numChilden(node)];
	}

	function container(boundary) {
		return boundary[0];
	}

	function nextNode(boundary) {
		return nodeAfter(boundary) || container(boundary);
	}

	function prevNode(boundary) {
		return nodeBefore(boundary) || container(boundary);
	}

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

	function nodeAtBoundary(boundary) {
		return Dom.nodeAtOffset(boundary[0], boundary[1]);
	}

	var exports = {
		equal     : equal,
		start     : start,
		end       : end,
		next      : next,
		prev      : prev,
		nextWhile : nextWhile,
		prevWhile : prevWhile,
		nextNode  : nextNode,
		prevNode  : prevNode,
		container : container,
		isAtStart : isAtStart,
		isAtEnd   : isAtEnd,
		normalize : normalize,
		nodeAfter : nodeAfter,
		nodeBefore: nodeBefore,
		beforeNode: beforeNode,
		atEndOfNode: atEndOfNode,
		isNodeBoundary: isNodeBoundary,
		precedingTextLength: precedingTextLength,
		nodeAtBoundary: nodeAtBoundary,
		setRangeFromBoundaries: setRangeFromBoundaries,
		setRangesFromBoundaries: setRangesFromBoundaries,
		fromRange: fromRange,
		fromRanges: fromRanges
	};

	exports['equal']     = exports.equal;
	exports['start']     = exports.start;
	exports['end']       = exports.end;
	exports['next']      = exports.next;
	exports['prev']      = exports.prev;
	exports['nextWhile'] = exports.nextWhile;
	exports['prevWhile'] = exports.prevWhile;
	exports['isAtStart'] = exports.isAtStart;
	exports['isAtEnd']   = exports.isAtEnd;
	exports['normalize'] = exports.normalize;
	exports['nodeAtBoundary'] = exports.nodeAtBoundary;

	return exports;
});

