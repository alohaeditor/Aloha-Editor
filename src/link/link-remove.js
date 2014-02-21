/**
 * link-remove.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'arrays',
	'boundaries',
	'dom',
	'editing',
	'html',
	'mutation',
	'link-util'
], function(
	Arrays,
	Boundaries,
	Dom,
	Editing,
    Html,
    Mutation,
    LinkUtil
) {
	'use strict';

	/**
	 * Checks if `nodeSrc` and `nodeDst` are shallow equal.
	 * (Comparison is not made in children, only for attributes).
	 * @param {Node} nodeSrc
	 * @param {Node} nodeDst
	 * @return {boolean}
	 */
	function isEqualShallowNode(nodeSrc, nodeDst) {
		var clone1 = Dom.cloneShallow(nodeSrc);
		var clone2 = Dom.cloneShallow(nodeDst);

		return clone1.isEqualNode(clone2);
	}

	/**
	 * Checks if `nodeSrc` and `nodeDst` are compatible nodes to join.
	 * @param nodeSrc
	 * @param nodeDst
	 * @return {*|boolean}
	 */
	function isCompatibleNodes(nodeSrc, nodeDst) {
		return nodeSrc
			&& nodeDst
			&& !Dom.isTextNode(nodeSrc)
			&& isEqualShallowNode(nodeSrc, nodeDst);
	}

	/**
	 * Joins `nodeSrc` and `nodeDst` if both are compatibles.
	 * @param nodeSrc
	 * @param nodeDst
	 */
	function joinNodesIfCompatible(nodeSrc, nodeDst) {
		var lastChild;

		while (isCompatibleNodes(nodeSrc, nodeDst)) {
			lastChild = LinkUtil.nextRenderedNode(nodeSrc.firstChild);
			nodeDst.appendChild(lastChild);

			Dom.remove(nodeSrc);

			nodeSrc = lastChild;
			nodeDst = nodeDst.firstChild;
		}
	}

	/**
	 * Removes link anchor.
	 * @param {Node} anchor
	 */
	function removeIfLink(anchor) {
		if (!LinkUtil.isAnchorNode(anchor)) {
			return;
		}

		var firstChild = LinkUtil.nextRenderedNode(anchor.firstChild);
		var prevAnchorSibling = LinkUtil.prevRenderedNode(anchor.previousSibling);

		joinNodesIfCompatible(firstChild, prevAnchorSibling);

		var lastChild = LinkUtil.prevRenderedNode(anchor.lastChild);
		var nextAnchorSibling = LinkUtil.nextRenderedNode(anchor.nextSibling);

		joinNodesIfCompatible(nextAnchorSibling, lastChild);

		Dom.removeShallow(anchor);
	}


	/**
	 * Removes children links if exists inside `node`.
	 * @param {Node} node
	 */
	function removeChildrenLinks(node) {
		if (node && Dom.isElementNode(node)) {
			Arrays
			    .coerce(node.querySelectorAll('a'))
			    .forEach(removeIfLink);
		}
	}

	/**
	 * Removes parent links if exists and returns the next node which
	 * should be analyze.
	 * @param {Node} next
	 * @return {Node}
	 */
	function removeParentLinksAndGetNext(next) {
		var parent;
		while (!next.nextSibling && next.parentNode) {
			parent = next.parentNode;

			removeIfLink(next);

			next = parent;
		}

		var nextSibling = next.nextSibling;

		removeIfLink(next);

		return nextSibling;
	}

	/**
	 * Removes links from `range`.
	 * @param {Range} range
	 */
	function removeLinkFromRange(range) {
		var startBoundary = LinkUtil.boundaryLinkable(range.startContainer, range.startOffset);
		var endBoundary = LinkUtil.boundaryLinkable(range.endContainer, range.endOffset);

		var startContainer = Boundaries.container(startBoundary);
		var endContainer =  Boundaries.container(endBoundary);

		removeChildrenLinks(startContainer);
		removeChildrenLinks(endContainer);

		var next = startContainer;
		while (next && !Dom.isSameNode(next, endContainer)) {
			next = removeParentLinksAndGetNext(next);

			removeChildrenLinks(next);
		}

		while (endContainer && endContainer.parentNode && LinkUtil.isLinkable(endContainer)) {
			removeIfLink(endContainer);
			endContainer = endContainer.parentNode;
		}
	}

	return {
		removeLinkFromRange: removeLinkFromRange
	};
});
