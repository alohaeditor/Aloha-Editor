/**
 * list-selection.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'boundaries',
	'dom',
	'html',
	'list-util'
], function (
	Boundaries,
    Dom,
    Html,
    ListUtil
) {
	'use strict';

	function getParentBlock(node) {
		while (node.parentNode && !Html.hasBlockStyle(node) && !ListUtil.isItem(node)) {
			node = node.parentNode;
		}

		return node;
	}

	/**
	 * Gets element from `boundary`.
	 * @param {Boundary} boundary
	 * @param {function(Node):Node} nextNodeFn returns next node. 
	 * @return {Node}
	 */
	function nodeFromBoundary(node, nextNodeFn) {
		node = nextNodeFn(node);

		while (Dom.isElementNode(node) && Dom.hasChildren(node)) {
			node = node.firstChild;
			node = nextNodeFn(node);
		}

		while (Dom.isTextNode(node)) {
			node = node.parentNode;
		}

		return getParentBlock(node);
	}

	/**
	 * Gets next rendered node.
	 * @param {Node} node
	 * @return {Node}
	 */
	function nextRenderedNode(node) {
		while (Html.isUnrendered(node) && node.nextSibling) {
			node = node.nextSibling;
		}

		return node;
	}

	/**
	 * Gets previous rendered node.
	 * @param {Node} node
	 * @return {Node}
	 */
	function prevRenderedNode(node) {
		while (Html.isUnrendered(node) && node.previousSibling) {
			node = node.previousSibling;
		}
		return node;
	}

	/**
	 * Gets next valida element from `boundary`.
	 * @param {Boundary} boundary
	 * @return {Node}
	 */
	function nextElementFromBoundary(boundary) {
		var node = Boundaries.nextNode(boundary);
		return nodeFromBoundary(node, nextRenderedNode);
	}

	/**
	 * Gets previous valid element from `boundary`.
	 * @param {Boundary} boundary
	 * @return {Node}
	 */
	function prevElementFromBoundary(boundary) {
		var node = Boundaries.prevNode(boundary);
		return nodeFromBoundary(node, prevRenderedNode);
	}

	/**
	 * Checks if `node` is valid node to be selected.
	 * Skips the ListElement, but accepts the LiElement.
	 * @param node
	 * @return {boolean}
	 */
	function isSelectableNode(node) {
		return !ListUtil.isList(node);
	}

	/**
	 * Gets next element.
	 * @param {Node} node
	 * @return {node}
	 */
	function nextElement(node) {
		if (ListUtil.isList(node) && node.firstElementChild) {
			return node.firstElementChild;
		}

		while (node.parentNode && !node.nextSibling && !Html.isRendered(node.nextSibling)) {
			node = node.parentNode;
		}

		return node.nextSibling;
	}

	/**
	 * Retrieves elements from `boundaries`.
	 * @param {[Boundary, Boundary]} boundaries
	 * @return {Array.<Element>}
	 */
	function elementsFromBoundaries(boundaries) {
		var elements = [];
		var node = nextElementFromBoundary(boundaries[0]);
		var lastElement = prevElementFromBoundary(boundaries[1]);

		while (node && !ListUtil.isSameNode(node, lastElement)) {
			if (isSelectableNode(node)) {
				elements.push(node);
			}
			node = nextElement(node);
		}

		elements.push(lastElement);

		return elements;
	}

	return {
		elementsFromBoundaries: elementsFromBoundaries
	};
});
