/**
 * link-create.js is part of Aloha Editor project http://aloha-editor.org
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
	 * Clones `node` and append `child`.
	 * @param node
	 * @param child
	 * @return {Node|*}
	 */
	function cloneAndAppend(node, child) {
		var clonedNode = Dom.cloneShallow(node);

		node.insertBefore(clonedNode, child);

		clonedNode.appendChild(child);

		return clonedNode;
	}

	/**
	 * Splits `node` by 'offset' and wraps to match unbalance node.
	 *
	 * @param node
	 * @param offset
	 * @param reachParent
	 * @return {{after: Node, before: !Node}}
	 */
	function splitTextNode(node, offset, reachParent) {
		if (LinkUtil.isTextNodeSelectionAtEnd(node, offset)) {
			return {after: node.nextSibling, before: node};
		}

		if (LinkUtil.isTextNodeSelectionAtStart(node, offset)) {
			return {after: node, before: node.previousSibling};
		}

		var before = Mutation.splitTextNode(node, offset);
		var after = before.nextSibling;

		if (after && !after.nextSibling && LinkUtil.isLinkable(after.parentNode) && !Dom.isSameNode(node, reachParent)) {
			var parentNode = before.parentNode;
			do {
				after = cloneAndAppend(parentNode, after);
				before = cloneAndAppend(parentNode, before);

				Dom.removeShallow(parentNode);

				parentNode = before.parentNode;
			} while (parentNode && !Dom.isSameNode(parentNode, reachParent) && LinkUtil.isLinkable(parentNode));
		} else if (!after) {
			after = before;
			while (after.parentNode && !after.nextSibling && !Dom.isSameNode(after.parentNode, reachParent)) {
				after = after.parentNode;
			}
			after = after.nextSibling;
		}

		return {after: after, before: before};
	}

	/**
	 * Splits node, append `child` and insert `node` before `ref`.
	 * @param {Node} node
	 * @param {Node} child
	 * @param {Node} ref
	 * @returns {Node}
	 */
	function splitElement(node, child, ref) {
		var clonedNode = Dom.cloneShallow(node);

		node.parentNode.insertBefore(clonedNode, ref);

		clonedNode.appendChild(child);
		return clonedNode;
	}

	/**
	 * Gets first node and splits is necessary.
	 * @param {Node} container
	 * @param {Node} reachParent
	 * @return {Node}
	 */
	function firstNodeAndSplit(container, reachParent) {
		if (Html.hasBlockStyle(container.parentNode)) {
			return container;
		}

		container = container.parentNode;

		var clonedNode = container;
		var parentNode = container.parentNode;

		while (parentNode && !Dom.isSameNode(parentNode, reachParent) && LinkUtil.isLinkable(parentNode)) {
			clonedNode = splitElement(parentNode, container, parentNode.nextSibling);

			container = parentNode;
			parentNode = parentNode.parentNode;
		}

		return clonedNode;
	}


	/**
	 * Gets previous linkable node.
	 * @param {node} node
	 * @return {Node}
	 */
	function prevLinkableNode(node) {
		while (!LinkUtil.isLinkable(node)) {
			node = node.lastChild;
		}
		return node;
	}

	/**
	 * Gets the end element of container, splitting if necessary.
	 * @param {Node} container
	 * @param {Node} reachParent
	 * @return {Node}
	 */
	function endNodeAndSplit(container, reachParent) {
		container = container.parentNode;

		var clonedNode = container;
		var parentNode = container.parentNode;

		while (parentNode && !Dom.isSameNode(parentNode, reachParent) && LinkUtil.isLinkable(parentNode)) {
			clonedNode = splitElement(parentNode, container, parentNode);

			container = parentNode;
			parentNode = parentNode.parentNode;
		}

		if (!LinkUtil.isRendered(clonedNode)) {
			var previousSibling = LinkUtil.prevRenderedNode(clonedNode);
			Dom.remove(clonedNode);
			clonedNode = prevLinkableNode(previousSibling);
		}

		return clonedNode;
	}

	/**
	 * Gets the first linkable node
	 * @param {Boundary} boundary
	 * @param {Node} commonContainer
	 * @return {Node}
	 */
	function firstLinkableNode(boundary, commonContainer) {
		var container = Boundaries.container(boundary);
		var offset = Boundaries.offset(boundary);

		if (Dom.isTextNode(container)) {
			return splitTextNode(container, offset, commonContainer).after;
		}
		if (Dom.isSameNode(container.parentNode, commonContainer)
			|| !LinkUtil.isLinkable(container.parentNode)) {
			return container;
		}

		return firstNodeAndSplit(container, commonContainer);
	}

	/**
	 * Gets last linkable node.
	 * @param boundary
	 * @param commonContainer
	 * @return {Node}
	 */
	function lastLinkableNode(boundary, commonContainer) {
		var container = Boundaries.container(boundary);
		var offset = Boundaries.offset(boundary);

		if (LinkUtil.isTextNodeSelectionAtMiddle(container, offset)) {
			return splitTextNode(container, offset, commonContainer).before;
		}
		if (LinkUtil.isTextNodeSelectionAtStart(container, offset) && container.previousSibling) {
			return prevLinkableNode(container.previousSibling);
		}
		if (!LinkUtil.isLinkable(container.parentNode)) {
			return container;
		}

		return endNodeAndSplit(container, commonContainer);
	}

	/**
	 * Removes `anchorNode` is this is an anchor element, and put its
	 * children in `linkable` array.
	 * @param {Node} anchorNode
	 * @param {Array.<Element>} linkable
	 * @return {Node}
	 */
	function removeAnchorElement(anchorNode, linkable) {
		if (!LinkUtil.isRendered(anchorNode)) {
			return anchorNode;
		}

		if (LinkUtil.isAnchorNode(anchorNode)) {
			var firstChild = anchorNode.firstChild;

			Dom.children(anchorNode).forEach(function (item) {
					linkable.push(item);
				});

			Dom.removeShallow(anchorNode);

			anchorNode = firstChild;
		} else {
			linkable.push(anchorNode);
		}

		return anchorNode;
	}

	/**
	 * Saves `linkable` inside `linkableNodes` and create a new one.
	 * @param {Array.<Node>} linkable
	 * @param {Array.<Array<Node>>} linkableNodes
	 * @returns {*}
	 */
	function saveAndCreateLinkable(linkable, linkableNodes) {
		if (linkable.length > 0) {
			linkableNodes.push(linkable);
		}
		// create new linkable
		return [];
	}

	/**
	 * Gets next
	 * @param first
	 * @returns {{first: *, createLinkable: boolean}}
	 */
	function nextLinkable(first) {
		var createLinkable = false;
		while (first && !first.nextSibling && first.parentNode) {
			first = first.parentNode;
			if (!LinkUtil.isLinkable(first)) {
				createLinkable = true;
			}
		}
		return {next: first, createLinkable: createLinkable};
	}

	/**
	 * Gets linkable nodes between node `first` and node `last`.
	 * @param {Node} first
	 * @param {Node} last
	 * @return {Array.<Array<Element>>}
	 */
	function linkableNodesBetween(first, last) {
		var linkableNodes = [];
		var linkable = [];            // Array of consecutive nodes that belong to a single link

		while (first && !Dom.isSameNode(first, last)) {
			if (LinkUtil.isLinkable(first)) {
				first = removeAnchorElement(first, linkable);

				var nextLinkableRet = nextLinkable(first);

				first = nextLinkableRet.next.nextSibling;

				if (nextLinkableRet.createLinkable) {
					linkable = saveAndCreateLinkable(linkable, linkableNodes);
				}
			} else {
				linkable = saveAndCreateLinkable(linkable, linkableNodes);
				first = first.firstChild;
			}
		}

		if (LinkUtil.isLinkable(last)) {
			removeAnchorElement(last, linkable);
		}

		if (linkable.length > 0) {
			linkableNodes.push(linkable);
		}

		return linkableNodes;
	}

	/**
	 * Gets the start and end element contained in the selection, splitting the text
	 * if necessary.
	 * @param {Boundary} startBoundary
	 * @param {Boundary} endBoundary
	 * @param {Element} commonContainer
	 * @return {{startElement: Element, endElement: Element}}
	 */
	function firstAndLastNode(startBoundary, endBoundary, commonContainer) {
		var startContainer = Boundaries.container(startBoundary);
		var endContainer =  Boundaries.container(endBoundary);

		var startOffset = Boundaries.offset(startBoundary);
		var endOffset = Boundaries.offset(endBoundary);

		var isSelectionInSameTextNode = Dom.isTextNode(startContainer) && Dom.isSameNode(startContainer, endContainer);

		var first = firstLinkableNode(startBoundary, commonContainer);

		if (isSelectionInSameTextNode) {
			// If the first elements was split, we have to take precaution.
			endBoundary = Boundaries.raw(first, endOffset - startOffset);
			commonContainer = first;
		}

		var last = lastLinkableNode(endBoundary, commonContainer);

		return {startNode: first, endNode: last};
	}

	/**
	 * Checks if the range is in the same Text Node.
	 * @param {Boundary} startBoundary
	 * @param {Boundary} endBoundary
	 * @return {boolean}
	 */
	function rangeInSameTextNode (startBoundary, endBoundary) {
		var startContainer = Boundaries.container(startBoundary);
		var endContainer = Boundaries.container(endBoundary);

		return Dom.isTextNode(startContainer) && Dom.isSameNode(startContainer, endContainer);
	}

	/**
	 * Checks if the selection completely wrap a Text Node.
	 * @param {Boundary} startBoundary
	 * @param {Boundary} endBoundary
	 * @return {boolean}
	 */
	function isSelectionInWholeTextNode(startBoundary, endBoundary) {
		var startContainer = Boundaries.container(startBoundary);
		var startOffset = Boundaries.offset(startBoundary);
		var endOffset = Boundaries.offset(endBoundary);

		return rangeInSameTextNode(startBoundary, endBoundary)
		    && startOffset === 0
		    && startContainer.length === endOffset;
	}

	/**
	 * Get Linkable elements
	 * @param {Range} range
	 * @return {Array.<Array.<Element>>}
	 */
	function linkableNodesInsideRange(range) {
		var startBoundary = LinkUtil.boundaryLinkable(range.startContainer, range.startOffset);
		var endBoundary = LinkUtil.boundaryLinkable(range.endContainer, range.endOffset);

		if (isSelectionInWholeTextNode(startBoundary, endBoundary)) {
			// The selection is in the whole Text Node
			return [[Boundaries.container(startBoundary)]];
		}

		var limitNodes = firstAndLastNode(startBoundary, endBoundary, range.commonAncestorContainer);

		if (rangeInSameTextNode(startBoundary, endBoundary)) {
			// endElement is the element selected.
			return [[limitNodes.endNode]];
		}

		return linkableNodesBetween(limitNodes.startNode, limitNodes.endNode);
	}

	/**
	 * Places anchors in `range`.
	 * @param {Range} range
	 * @param {Document} doc
	 * @return {Array.<Element>}
	 */
	function createAnchorsInRange(range, doc) {
		var anchors = [];

		linkableNodesInsideRange(range).forEach(function (link) {
			var anchor = doc.createElement('a');

			Dom.insert(anchor, link[0]);

			link.forEach(function (item) {
				anchor.appendChild(item);
			});

			anchors.push(anchor);
		});

		return anchors;
	}

	return {
		createAnchorsInRange: createAnchorsInRange,
		linkableNodesInsideRange: linkableNodesInsideRange
	};
});
