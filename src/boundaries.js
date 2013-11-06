/* boundaries.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'predicates',
	'assert'
], function Boundaries(
	Dom,
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
		return boundary[1] === Dom.nodeLength(boundary[0]);
	}

	function isAtStart(boundary) {
		return 0 === boundary[1];
	}

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
		boundary = Dom.normalizeBoundary(boundary);
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
		precedingTextLength: precedingTextLength
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

	return exports;
});

