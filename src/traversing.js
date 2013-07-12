/* traversing.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'functions'
], function TraversingUtilities(
	Dom,
	Fn
) {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('Traversing');
	}

	/**
	 * Starting from the given node and moving forward, traverses the set of
	 * `node`'s sibiling nodes until either the predicate `cond` returns false
	 * or we reach the last sibling of `node`'s parent element.
	 *
	 * @param {DomElement} node
	 * @param {Function(DomElement, *?):Boolean} cond
	 * @param {*} arg
	 *        Optional arbitrary value that will be passed to the `cond()`
	 *        predicate.
	 * @return {DomElement}
	 *         `node`, or one if it's next siblings.
	 */
	function nextWhile(node, cond, arg) {
		while (node && cond(node, arg)) {
			node = node.nextSibling;
		}
		return node;
	}

	/**
	 * Starting from the given node and moving backwards, traverses the set of
	 * `node`'s sibiling nodes until either the predicate `cond` returns false
	 * or we reach the last sibling of `node`'s parent element.
	 *
	 * @param {DomElement} node
	 * @param {Function(DomElement, *?):Boolean} cond
	 * @param {*} arg
	 *        Optional arbitrary value that will be passed to the `cond()`
	 *        predicate.
	 * @return {DomElement}
	 *         `node`, or one if it's previous siblings.
	 */
	function prevWhile(node, cond, arg) {
		while (node && cond(node, arg)) {
			node = node.prevSibling;
		}
		return node;
	}

	/**
	 *
	 */
	function walkUntil(node, fn, until, arg) {
		while (node && !until(node, arg)) {
			var next = node.nextSibling;
			fn(node, arg);
			node = next;
		}
	}

	function walk(node, fn, arg) {
		walkUntil(node, fn, Fn.returnFalse, arg);
	}

	/**
	 * Depth-first postwalk of the given DOM node.
	 */
	function walkRec(node, fn, arg) {
		if (Dom.Nodes.ELEMENT_NODE === node.nodeType) {
			walk(node.firstChild, function (node) {
				walkRec(node, fn, arg);
			});
		}
		fn(node, arg);
	}

	function walkUntilNode(node, fn, untilNode, arg) {
		walkUntil(node, fn, function (nextNode) {
			return nextNode === untilNode;
		}, arg);
	}

	var exports = {
		nextWhile: nextWhile,
		prevWhile: prevWhile,
		walk: walk,
		walkRec: walkRec,
		walkUntil: walkUntil,
		walkUntilNode: walkUntilNode
	};

	return exports;
});
