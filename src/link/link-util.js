/**
 * link-util.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'boundaries',
	'dom',
	'editing',
	'functions',
	'html'
], function(
	Boundaries,
	Dom,
	Editing,
	Fn,
    Html
) {
	'use strict';

	/**
	 * Not linkable node names
	 * @type {Array}
	 * @const
	 */
	var NOT_LINKABLE_NODE_NAMES = ['TBODY', 'TD', 'TR', 'LI', 'DT', 'DD', 'TABLE'];

	/**
	 * Anchor node name.
	 * @type {string}
	 * @const
	 */
	var ANCHOR_NODE_NAME = 'A';

	var LINE_BREAKING_NODES_TAGS = ["LI", "TD", "TR", "TBODY", "DD", "DT"];

	/**
	 * Checks if `node` could be inserted inside a Anchor element.
	 * @param {Node} node
	 * @return {boolean}
	 */
	function isLinkable(node) {
		return !Html.hasBlockStyle(node) && (NOT_LINKABLE_NODE_NAMES.indexOf(node.nodeName) < 0);
	}

	/**
	 * Check if parent has a anchor node.
	 * @param node
	 * @returns {boolean}
	 */
	function hasAnchorParent(node) {
		while (node && isLinkable(node)) {
			if (isAnchorNode(node)) {
				return true;
			}
			node = node.parentNode;
		}
		return false;
	}

	/**
	 * Gets first parent which is a anchor.
	 * @param node
	 * @returns {*}
	 */
	function firstAnchorParent(node) {
		while (node && !isAnchorNode(node)) {
			node = node.parentNode;
		}
		return node;
	}

	/**
	 * Gets next rendered node.
	 * @param {Node} node
	 * @returns {Node}
	 */
	function nextRenderedNode(node) {
		var conditions = Fn.and(Dom.nextSibling, Fn.complement(Html.isRendered));
		return Dom.nextWhile(node, conditions);
	}

	/**
	 * Gets previous rendered node of `node`.
	 * @param {Node} node
	 * @returns {*}
	 */
	function prevRenderedNode(node) {
		while (node && node.previousSibling && !Html.isRendered(node)) {
			node = node.previousSibling;
		}
		return node;
	}


	/**
	 * Creates a new boundary in a parent anchor link, if this anchor link exists.
	 * @param {Boundary} boundary
	 * @return {Boundary}
	 */
	function setBoundaryInAnchor(boundary) {
		var container = Boundaries.container(boundary);
		var offset = Boundaries.offset(boundary);

		if (hasAnchorParent(container)) {
			container = firstAnchorParent(container);
			offset = 0;
		}
		return Boundaries.raw(container, offset);
	}

	/**
	 * Creates boundary in a linkable element.
	 * @param {Node} node
	 * @param {integer} offset
	 * @return {Boundary}
	 */
	function boundaryLinkable(node, offset) {
		if (Dom.isElementNode(node)) {
			node = node.childNodes[offset];
			offset = 0;
		}

		var next = nextRenderedNode(node);

		var boundary = Boundaries.raw(next, offset);

		return setBoundaryInAnchor(boundary);
	}

	/**
	 * Checks if `node` is a Anchor node.
	 * @param {Node} node
	 * @return {boolean}
	 */
	function isAnchorNode(node) {
		return node.nodeName === ANCHOR_NODE_NAME;
	}

	/**
	 * Checks if text node `node` has some text selected.
	 * @param {Node} node
	 * @param {integer} offset
	 * @return {boolean}
	 */
	function isTextNodeSelectionAtMiddle(node, offset) {
		return Dom.isTextNode(node) && offset > 0;
	}

	/**
	 * Checks if the text node `node` NOT has some text selected inside.
	 * @param {Node} node
	 * @param {integer} offset
	 * @return {boolean}
	 */
	function isTextNodeSelectionAtStart(node, offset) {
		return Dom.isTextNode(node) && offset === 0;
	}

	/**
	 * Checks if the text node `node` NOT has some text selected inside.
	 * @param {Node} node
	 * @param {integer} offset
	 * @return {boolean}
	 */
	function isTextNodeSelectionAtEnd(node, offset) {
		return Dom.isTextNode(node) && node.length === offset;
	}

	/**
	 * Checks if `node` is a line breaking node.
	 * @param {Node} node
	 * @returns {boolean}
	 */
	function isLineBreakingNode(node) {
		return LINE_BREAKING_NODES_TAGS.indexOf(node.nodeName) >= 0;
		}

	/**
	 * Check for spaces between line-breaking nodes <li>one</li>  <li>two</li>
	 * @param {Node} node
	 * @returns {boolean}
	 */
	function isWhitSpaceBetweenLineBreakingNodes(node) {
		if (Dom.isTextNode(node) && node.textContent.trim().length === 0) {
			if (node.previousElementSibling && (isLineBreakingNode(node.previousElementSibling)) &&
					node.nextElementSibling && (isLineBreakingNode(node.nextElementSibling))) {
					return true;
				}
			if (node.previousElementSibling && (isLineBreakingNode(node.previousElementSibling)) &&
					!node.nextElementSibling) {
					return true;
				}
			if (!node.previousElementSibling &&
					node.nextElementSibling && (isLineBreakingNode(node.nextElementSibling))) {
					return true;
				}
			}
		return false;
		}

	function isRendered(node) {
		return Html.isRendered(node) && !isWhitSpaceBetweenLineBreakingNodes(node);
	}

	return {
		boundaryLinkable: boundaryLinkable,
		isLinkable: isLinkable,
		isAnchorNode: isAnchorNode,
		nextRenderedNode: nextRenderedNode,
		prevRenderedNode: prevRenderedNode,
		isTextNodeSelectionAtMiddle: isTextNodeSelectionAtMiddle,
		isTextNodeSelectionAtStart: isTextNodeSelectionAtStart,
		isTextNodeSelectionAtEnd: isTextNodeSelectionAtEnd,
		isRendered: isRendered
	};
});
