/**
 * link-util.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'html',
	'boundaries'
], function(
	Dom,
    Html,
	Boundaries
) {
	'use strict';

	/**
	 * Checks if `node` is an anchor node.
	 *
	 * @param  {!Node} node
	 * @return {boolean}
	 */
	function isAnchorNode(node) {
		return 'A' === node.nodeName;
	}

	/**
	 * Checks if `node` could be inserted inside a Anchor element.
	 *
	 * @param  {!Node} node
	 * @return {boolean}
	 */
	function isLinkable(node) {
		return !Html.isGroupContainer(node) && !Html.isGroupedElement(node);
	}

	/**
	 * Gets first parent element which is an anchor.
	 *
	 * @private
	 * @param   {!Node} node
	 * @returns {?Element}
	 */
	function nearestAnchorParent(node) {
		var parent = Dom.upWhile(node, function (node) {
			return !isAnchorNode(node) && isLinkable(node) && !Dom.isEditingHost(node);	
		});
		return isAnchorNode(parent) ? parent : null;
	}

	/**
	 * Gets next rendered node of `node`.
	 *
	 * @param   {!Node} node
	 * @returns {?Node}
	 */
	function nextRenderedNode(node) {
		return Dom.nextWhile(node, Html.isUnrendered);
	}

	/**
	 * Gets previous rendered node of `node`.
	 *
	 * @param   {!Node} node
	 * @returns {?Node}
	 */
	function prevRenderedNode(node) {
		return Dom.prevWhile(node, Html.isUnrendered);
	}

	/**
	 * Returns a boundary in a linkable element.
	 *
	 * @param  {!Boundary} boundary
	 * @return {Boundary}
	 */
	function linkableBoundary(boundary) {
		var node = Boundaries.container(boundary);
		var offset = Boundaries.offset(boundary);
		if (Boundaries.isNodeBoundary(boundary)) {
			node = node.childNodes[offset];
			offset = 0;
		}
		var next = nextRenderedNode(node);
		return Boundaries.create(nearestAnchorParent(next) || next, offset);
	}

	return {
		isLinkable       : isLinkable,
		linkableBoundary : linkableBoundary,
		nextRenderedNode : nextRenderedNode,
		prevRenderedNode : prevRenderedNode
	};
});
