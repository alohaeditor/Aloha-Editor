/**
 * list.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'functions',
	'dom',
	'html',
	'arrays',
	'assert',
	'content',
	'mutation',
	'boundaries'
], function (
	Fn,
	Dom,
	Html,
	Arrays,
	Assert,
	Content,
	Mutation,
	Boundaries
) {
	'use strict';

	/**
	 * Whether the given node is an inline node and is not right below the
	 * editing host.
	 *
	 * @private
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function isInlineNode(node) {
		return !Html.hasLinebreakingStyle(node)
		    && !(node.parentNode && Dom.isEditingHost(node.parentNode));
	}

	/**
	 * Reduces a list of nodes into an LI element among a list of LI elements.
	 *
	 * @see build
	 * @private
	 * @param  {Array.<Element>} list collection of list items
	 * @param  {Array.<Node>}    children
	 * @return {Array.<Element>}
	 */
	function reduceGroup(list, children) {
		var visible = children.filter(Html.isRendered);
		if (visible.length > 0) {
			var li = visible[0].ownerDocument.createElement('li');
			Dom.move(visible, li);
			return list.concat(li);
		}
		return list;
	}

	/**
	 * Recursively removes the given node and its ancestors if they are
	 * invisible.
	 *
	 * @see build
	 * @private
	 * @param  {Node} node
	 */
	function removeInvisibleNodes(node) {
		var boundaries = [];
		Dom.climbUntil(
			node,
			function (node) {
				boundaries = Mutation.removeNode(node, boundaries);
			},
			function (node) {
				return !node.parentNode
				    || Dom.isEditingHost(node)
				    || Html.isRendered(node);
			}
		);
	}

	/**
	 * Collects siblings between `start` and `end` and any adjacent inline nodes
	 * next to each.
	 *
	 * @see createList
	 * @private
	 * @param  {Node} start
	 * @param  {Node} end
	 * @return {Array.<Node>}
	 */
	function collectSiblings(start, end) {
		var nodes = Dom.prevSiblings(start, Html.hasLinebreakingStyle).concat(start);
		if (start !== end) {
			nodes = nodes.concat(Dom.nextSiblings(start, function (node) {
				return node === end;
			}), end);
		}
		return nodes.concat(Dom.nextSiblings(end, Html.hasLinebreakingStyle));
	}

	/**
	 * Given a list of nodes, will process the list to create a groups of nodes
	 * that should be placed to gether in LI's.
	 *
	 * A `junk` arrays will also be created of nodes that should be removed once
	 * the grouped elements have been moved into their respective destinations.
	 * This is required because we need to later remove any elements which will
	 * become empty once their children are moved into list elements.
	 *
	 * @see build
	 * @private
	 * @param  {Array.<Node>} nodes
	 * @return {Object.<string, Array.<Node>>}
	 */
	function groupNodes(nodes) {
		var junk = [];
		var groups = [];
		var collection = [];
		var split;
		var node;
		while (nodes.length > 0) {
			node = nodes.shift();
			if (Html.hasLinebreakingStyle(node) && !Html.isGroupContainer(node)) {
				collection = Dom.children(node);
				junk.push(node);
			} else {
				collection = [node];
				if (!node.previousSibling && !node.nextSibling) {
					junk.push(node.parentNode);
				}
			}
			split = Arrays.split(nodes, Html.hasLinebreakingStyle);
			collection = collection.concat(split[0]);
			nodes = split[1];
			if (collection.length > 0) {
				groups.push(collection);
			}
		}
		return {
			groups : groups,
			junk   : junk
		};
	}

	/**
	 * Builds a list of type `type` using the given list of nodes.
	 *
	 * @private
	 * @param  {string}           type
	 * @param  {Array.<Node>}     nodes
	 * @param  {Array.<Boundary>} boundaries
	 * @return {Array.<Boundary>}
	 */
	function build(type, nodes, boundaries) {
		if (0 === nodes.length) {
			return boundaries;
		}
		var node = Dom.upWhile(nodes[0], isInlineNode);
		Assert.assert(
			Content.allowsNesting(node.parentNode.nodeName, type),
			'createList#Cannot insert ' + type + ' inside of a ' + node.parentNode.nodeName
		);
		var list = node.ownerDocument.createElement(type);
		var grouping = groupNodes(nodes);
		Dom.insert(list, node);
		Dom.move(grouping.groups.reduce(reduceGroup, []), list);
		grouping.junk.forEach(removeInvisibleNodes);
		return boundaries;
	}

	/**
	 * Creates a list of the given type.
	 *
	 * problem with collectSiblings(startNode, endNode):
	 * "<div>
	 *	<p>tw[o}</p>
	 *	<p>three</p>
	 * </div>"
	 *
	 * @param  {string}           type Either 'ul' or 'ol'
	 * @param  {Array.<Boundary>} boundaries
	 * @return {Array.<Boundary>}
	 */
	function createList(type, boundaries) {
		Assert.assert(
			Html.LIST_CONTAINERS[type.toUpperCase()],
			'createList#' + type + ' is not a valid list container'
		);
		var start = boundaries[0];
		var end = boundaries[1];
		var cac = Boundaries.commonContainer(start, end);
		console.warn(cac.outerHTML);
		if (!Html.hasLinebreakingStyle(cac)) {
			var node = Dom.upWhile(cac, function (node) {
				return node.parentNode
				    && !Html.hasLinebreakingStyle(node.parentNode)
				    && !Dom.isEditingHost(node.parentNode);
			});
			return build(type, collectSiblings(node, node), boundaries);
		}
		var isLimit = function (node) {
			return node !== cac && (node.parentNode && node.parentNode !== cac);
		};
		var startNode = Dom.upWhile(Boundaries.container(start), isLimit);
		var endNode = Dom.upWhile(Boundaries.container(end), isLimit);
		return build(type, collectSiblings(startNode, endNode), boundaries);
	}

	return {
		createList: createList
	};
});
