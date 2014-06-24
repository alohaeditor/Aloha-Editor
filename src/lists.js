/**
 * lists.js is part of Aloha Editor project http://aloha-editor.org
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
	 * Reduces a list of nodes (if any are visible) into an LI element among the
	 * given list.
	 *
	 * This function is to be used in a reduce() call.
	 *
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
			list.push(li);
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
	 * @see format
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
	 * A `parents` arrays will also be created of nodes that may need be removed
	 * once the grouped elements have been moved into their respective
	 * destinations. This is required because we need to later remove any
	 * elements which will become empty once their children are moved into list
	 * elements.
	 *
	 * @see build
	 * @private
	 * @param  {Array.<Node>} siblings
	 * @return {Object.<string, Array.<Node>>}
	 */
	function groupNodes(siblings) {
		var groups = [];
		var parents = [];
		var nodes = siblings.concat();
		var collection;
		var split;
		var node;
		while (nodes.length > 0) {
			node = nodes.shift();
			if (Html.hasLinebreakingStyle(node) && !Html.isGroupContainer(node) && !Html.isVoidType(node)) {
				collection = Dom.children(node);
				parents.push(node);
			} else {
				collection = [node];
				parents.push(node.parentNode);
			}
			split = Arrays.split(nodes, Html.hasLinebreakingStyle);
			collection = collection.concat(split[0]);
			nodes = split[1];
			if (collection.length > 0) {
				groups.push(collection);
			}
		}
		return {
			groups  : groups,
			parents : parents
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
		if (Html.isListContainer(node)) {
			return boundaries;
		}
		Assert.assert(
			Content.allowsNesting(node.parentNode.nodeName, type),
			'Lists.format#Cannot create ' + type + ' inside of a ' + node.parentNode.nodeName
		);
		var list = node.ownerDocument.createElement(type);
		var grouping = groupNodes(nodes);
		Dom.insert(list, node);
		Dom.move(grouping.groups.reduce(reduceGroup, []), list);
		grouping.parents.forEach(removeInvisibleNodes);
		return boundaries;
	}

	/**
	 * Creates a list of the given type.
	 *
	 * @param  {string}           type Either 'ul' or 'ol'
	 * @param  {Array.<Boundary>} boundaries
	 * @return {Array.<Boundary>}
	 */
	function format(type, boundaries) {
		Assert.assert(
			Html.isListContainer({nodeName: type.toUpperCase()}),
			'Lists.format#' + type + ' is not a valid list container'
		);
		var start = boundaries[0];
		var end = boundaries[1];
		var node;
		if (Boundaries.equals(start, end)) {
			node = Dom.upWhile(Boundaries.nextNode(start), function (node) {
				return node
				    && !Html.hasLinebreakingStyle(node)
				    && !Dom.isEditingHost(node.parentNode);
			});
			return build(type, [node], boundaries);
		}
		var cac = Boundaries.commonContainer(start, end);
		if (!Html.hasLinebreakingStyle(cac)) {
			node = Dom.upWhile(cac, function (node) {
				return node.parentNode
				    && !Html.hasLinebreakingStyle(node.parentNode)
				    && !Dom.isEditingHost(node.parentNode);
			});
			return build(type, collectSiblings(node, node), boundaries);
		}
		var isLimit = function (node) {
			return node !== cac && (node.parentNode && node.parentNode !== cac);
		};
		var startNode = Dom.upWhile(Boundaries.nextNode(start), isLimit);
		var endNode = Dom.upWhile(Boundaries.prevNode(end), isLimit);

		// <div>
		//  <p>tw[o}</p>
		//  <p>three</p>
		// </div>
		//
		// ... or ...
		//
		// <div>
		//  <p>{t]wo</p>
		//  <p>three</p>
		// </div>
		if (startNode === cac) {
			startNode = endNode;
		} else if (endNode === cac) {
			endNode = startNode;
		}
		return build(type, collectSiblings(startNode, endNode), boundaries);
	}

	/**
	 * Splits the list at the given list element.
	 *
	 * @private
	 * @param {Element} li
	 */
	function splitList(li) {
		var prev = Dom.prevSiblings(li).filter(Html.isListItem);
		var next = Dom.nextSiblings(li).filter(Html.isListItem);
		var list = li.parentNode;
		if (prev.length > 0) {
			var prevList = Dom.cloneShallow(list);
			Dom.moveBefore([prevList], list);
			Dom.move(prev, prevList);
		}
		if (next.length > 0) {
			var nextList = Dom.cloneShallow(list);
			Dom.moveAfter([nextList], list);
			Dom.move(next, nextList);
		}
	}

	/**
	 * Unwraps the given list item.
	 *
	 * @private
	 * @param  {Element} li
	 */
	function unwrapItem(li) {
		splitList(li);
		Dom.removeShallow(li.parentNode);
		var doc = li.ownerDocument;
		var nodes = Dom.children(li).filter(Html.isRendered);
		var split;
		var container;
		var lines = [];
		while (nodes.length > 0) {
			if (Html.hasLinebreakingStyle(nodes[0])) {
				lines.push(nodes.shift());
			} else {
				split = Arrays.split(nodes, Html.hasLinebreakingStyle);
				container = doc.createElement('p');
				Dom.move(split[0], container);
				lines.push(container);
				nodes = split[1];
			}
		}
		Dom.moveAfter(lines, li);
		Dom.remove(li);
		return lines;
	}

	/**
	 * Removes list formatting around the given boundaries.
	 *
	 * @param  {Array.<Boundary>} boundaries
	 * @return {Array.<Boundary>}
	 */
	function unformat(boundaries) {
		var nearestItem = function (node) {
			return !Html.isListItem(node) && !Dom.isEditingHost(node.parentNode);
		};
		var sc = Boundaries.container(boundaries[0]);
		var so = Boundaries.offset(boundaries[0]);
		var ec = Boundaries.container(boundaries[1]);
		var eo = Boundaries.offset(boundaries[1]);
		var start = Dom.upWhile(sc, nearestItem);
		var end = Dom.upWhile(ec, nearestItem);
		var items;
		var lines;
		if (Html.isListItem(start)) {
			items = Dom.nodeAndNextSiblings(start).filter(Html.isListItem);
			lines = items.reduce(function (lines, node) {
				return lines.concat(unwrapItem(node));
			}, []);
			if (Html.isListItem(sc)) {
				sc = lines[0];
				so = 0;
			}
		}
		if (sc === ec) {
			return boundaries;
		}
		if (Html.isListItem(end)) {
			items = Dom.nodeAndNextSiblings(end).filter(Html.isListItem);
			lines = items.reduce(function (lines, node) {
				return lines.concat(unwrapItem(node));
			}, []);
			if (Html.isListItem(ec)) {
				ec = lines[0];
				eo = 0;
			}
		}
		return [Boundaries.create(sc, so), Boundaries.create(ec, eo)];
	}

	return {
		format   : format,
		unformat : unformat
	};
});
