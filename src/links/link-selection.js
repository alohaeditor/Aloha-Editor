/**
 * link-create.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'html',
	'arrays',
	'mutation',
	'boundaries',
	'./link-util'
], function(
	Dom,
    Html,
	Arrays,
    Mutation,
	Boundaries,
    LinkUtil
) {
	'use strict';

	/**
	 * Clones `node` and append `child`.
	 *
	 * @private
	 * @param  {!Node} node
	 * @param  {!Node} child
	 * @return {Node}
	 */
	function cloneAndAppend(node, child) {
		var clone = Dom.cloneShallow(node);
		node.insertBefore(clone, child);
		clone.appendChild(child);
		return clone;
	}

	/**
	 * Splits `node` by 'offset' and wraps to match unbalance node.
	 *
	 * @private
	 * @param  {!Node}    node
	 * @param  {string}   offset
	 * @param  {!Element} reachParent
	 * @return {Object.<string, Node>} {after: Node, before: Node}
	 */
	function splitTextNode(node, offset, reachParent) {
		if (isTextNodeSelectionAtEnd(node, offset)) {
			return {after: node.nextSibling, before: node};
		}

		if (isTextNodeSelectionAtStart(node, offset)) {
			return {after: node, before: node.previousSibling};
		}

		var before = Mutation.splitTextNode(node, offset);
		var after = before.nextSibling;

		if (after
				&& !after.nextSibling
				&& LinkUtil.isLinkable(after.parentNode)
				&& !Dom.isSameNode(node, reachParent)) {
			var parentNode = before.parentNode;
			do {
				after = cloneAndAppend(parentNode, after);
				before = cloneAndAppend(parentNode, before);

				Dom.removeShallow(parentNode);

				parentNode = before.parentNode;
			} while (parentNode
					&& !Dom.isSameNode(parentNode, reachParent)
					&& LinkUtil.isLinkable(parentNode));
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
	 *
	 * @private
	 * @param   {!Node} node
	 * @param   {!Node} child
	 * @param   {!Node} ref
	 * @returns {Node}
	 */
	function splitElement(node, child, ref) {
		var clone = Dom.cloneShallow(node);
		node.parentNode.insertBefore(clone, ref);
		clone.appendChild(child);
		return clone;
	}

	/**
	 * Gets first node and splits is necessary.
	 *
	 * @private
	 * @param  {!Node} container
	 * @param  {!Node} reachParent
	 * @return {Node}
	 */
	function firstNodeAndSplit(container, reachParent) {
		if (Html.hasBlockStyle(container.parentNode)) {
			return container;
		}
		container = container.parentNode;
		var clone = container;
		var parent = container.parentNode;
		while (parent && !Dom.isSameNode(parent, reachParent) && LinkUtil.isLinkable(parent)) {
			clone = splitElement(parent, container, parent.nextSibling);
			container = parent;
			parent = parent.parentNode;
		}
		return clone;
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

		if (!isRendered(clonedNode)) {
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
	 * Gets last linkable node.
	 * @param boundary
	 * @param commonContainer
	 * @return {Node}
	 */
	function lastLinkableNode(boundary, commonContainer) {
		var container = Boundaries.container(boundary);
		var offset = Boundaries.offset(boundary);

		if (isTextNodeSelectionAtMiddle(container, offset)) {
			return splitTextNode(container, offset, commonContainer).before;
		}
		if (isTextNodeSelectionAtStart(container, offset) && container.previousSibling) {
			return prevLinkableNode(container.previousSibling);
		}
		if (!LinkUtil.isLinkable(container.parentNode)) {
			return container;
		}

		return endNodeAndSplit(container, commonContainer);
	}

	var LINE_BREAKING_NODES_TAGS = ['LI', 'TD', 'TR', 'TBODY', 'DD', 'DT'];

	/**
	 * Checks if `node` is a line breaking node.
	 * @param {Node} node
	 * @returns {boolean}
	 */
	function isLineBreakingNode(node) {
		return LINE_BREAKING_NODES_TAGS.indexOf(node.nodeName) >= 0;
	}

	/**
	 * Checks for spaces between line-breaking nodes <li>one</li>  <li>two</li>
	 *
	 * @param   {!Node} node
	 * @returns {boolean}
	 */
	function isWhitSpaceBetweenLineBreakingNodes(node) {
		if (!Dom.isTextNode(node) || node.textContent.trim().length > 0) {
			return false;
		}
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
		return false;
	}

	function isRendered(node) {
		return Html.isRendered(node) && !isWhitSpaceBetweenLineBreakingNodes(node);
	}

	/**
	 * Removes `anchorNode` is this is an anchor element, and put its
	 * children in `linkable` array.
	 * @param {Node} anchorNode
	 * @param {Array.<Element>} linkable
	 * @return {Node}
	 */
	function removeAnchorElement(anchorNode, linkable) {
		if (!isRendered(anchorNode)) {
			return anchorNode;
		}

		if ('A' === anchorNode.nodeName) {
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
	function firstAndLastNode(start, end, cac) {
		var sc = Boundaries.container(start);
		var ec = Boundaries.container(end);
		var so = Boundaries.offset(start);
		var eo = Boundaries.offset(end);
		var isSelectionInSameTextNode = Dom.isTextNode(sc) && Dom.isSameNode(sc, ec);
		var first = firstLinkableNode(start, cac);
		if (isSelectionInSameTextNode) {
			// If the first elements was split, we have to take precaution.
			end = Boundaries.raw(first, eo - so);
			cac = first;
		}
		return {
			startNode: first,
			endNode: lastLinkableNode(end, cac)
		};
	}

	/**
	 * Checks if the range is in the same Text Node.
	 *
	 * @param  {!Boundary} start
	 * @param  {!Boundary} end
	 * @return {boolean}
	 */
	function rangeInSameTextNode (start, end) {
		var sc = Boundaries.container(start);
		var ec = Boundaries.container(end);
		return Dom.isTextNode(sc) && Dom.isSameNode(sc, ec);
	}

	/**
	 * Checks if the selection completely wrap a Text Node.
	 *
	 * @param  {!Boundary} start
	 * @param  {!Boundary} end
	 * @return {boolean}
	 */
	function isSelectionInWholeTextNode(start, end) {
		var sc = Boundaries.container(start);
		var so = Boundaries.offset(start);
		var eo = Boundaries.offset(end);
		return rangeInSameTextNode(start, end) && so === 0 && sc.length === eo;
	}

	/**
	 * Collects a list of groups of nodes that can be wrapped into anchor tags.
	 *
	 * @param  {!Boundary} start
	 * @param  {!Boundary} end
	 * @return {Array.<Array.<Element>>}
	 */
	function collectLinkableNodeGroups(start, end) {
		var startBoundary = LinkUtil.linkableBoundary(start);
		var endBoundary = LinkUtil.linkableBoundary(end);
		if (isSelectionInWholeTextNode(startBoundary, endBoundary)) {
			// The selection is in the whole Text Node
			// <b>[one]</b>
			return [[Boundaries.container(startBoundary)]];
		}
		var limitNodes = firstAndLastNode(
			startBoundary,
			endBoundary,
			Boundaries.commonContainer(start, end)
		);
		if (rangeInSameTextNode(startBoundary, endBoundary)) {
			// endElement is the element selected.
			return [[limitNodes.endNode]];
		}
		return linkableNodesBetween(limitNodes.startNode, limitNodes.endNode);
	}

	function collectGroups(first, last) {
	}

	function collectLinkable(start, end) {
		var startSplit = Mutation.splitBoundaryUntil(start, Boundaries.isNodeBoundary);
		var endSplit = Mutation.splitBoundaryUntil(end, Boundaries.isNodeBoundary);
		var first = Boundaries.nextNode(startSplit);
		var last = Boundaries.prevNode(endSplit);
		var groups = collectGroups(first, last);
		console.log(groups);
		return [startSplit, endSplit];
	}

	window.collectLinkable = collectLinkable;

	return {
		collectLinkableNodeGroups : collectLinkableNodeGroups
	};
});
