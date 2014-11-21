/**
 * lists.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * @namespace lists
 */
define([
	'functions',
	'dom',
	'html',
	'arrays',
	'assert',
	'boromir',
	'zippers',
	'strings',
	'content',
	'mutation',
	'boundaries'
], function (
	Fn,
	Dom,
	Html,
	Arrays,
	Assert,
	Boromir,
	Zip,
	Strings,
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
	 * @param  {!Node} node
	 * @return {boolean}
	 */
	function hasInlineStyle(node) {
		return !Html.hasLinebreakingStyle(node)
		    && !(node.parentNode && Dom.isEditingHost(node.parentNode));
	}

	/**
	 * Reduces a list of nodes (if any are visible) into an LI element among the
	 * given list by moving nodes into LI elements.
	 *
	 * This function is to be used in a reduce() call.
	 *
	 * @private
	 * @param  {Array.<Element>} list collection of list items
	 * @param  {Array.<Node>}    children
	 * @return {Array.<Element>}
	 */
	function reduceGroup(list, children) {
		list = list.concat();
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
	 * Empty list items will be removed even though it would be considered
	 * visible in general cases.
	 *
	 * @see build
	 * @private
	 * @param {!Node} node
	 */
	function removeInvisibleNodes(node) {
		var boundaries = [];
		Dom.climbUntil(
			node,
			function (node) {
				boundaries = Mutation.removeNode(node, boundaries);
			},
			function (node) {
				if (Html.isListItem(node) && 0 === Dom.children(node).length) {
					return false;
				}
				return !node.parentNode
				    || Dom.isEditingHost(node)
				    || Html.isRendered(node);
			}
		);
	}

	function isCollectLimit(node) {
		return !Html.isListItem(node) && Html.hasLinebreakingStyle(node);
	}

	/**
	 * Collects siblings between `start` and `end` and any adjacent inline nodes
	 * next to each.
	 *
	 * @see format
	 * @private
	 * @param  {!Node} start
	 * @param  {!Node} end
	 * @return {Array.<Node>}
	 */
	function collectSiblings(start, end) {
		var nodes = Dom.prevSiblings(start, isCollectLimit).concat(start);
		if (start !== end) {
			nodes = nodes.concat(Dom.nextSiblings(start, function (node) {
				return node === end;
			}), end);
		}
		return nodes.concat(Dom.nextSiblings(end, isCollectLimit));
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
			var canUnwrap = !Html.isGroupContainer(node)
			             && !Html.isVoidType(node)
			             && !Html.isHeading(node);
			if (Html.hasLinebreakingStyle(node) && canUnwrap) {
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
	 * @param  {string}       type
	 * @param  {Array.<Node>} nodes
	 */
	function build(type, nodes) {
		if (0 === nodes.length) {
			return;
		}
		var node = Dom.upWhile(nodes[0], hasInlineStyle);
		if (Html.isListItem(node) && !Dom.prevSibling(node)) {
			node = node.parentNode;
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
	}

	/**
	 * Creates a list of the given type.
	 *
	 * @param  {string}    type Either 'ul' or 'ol'
	 * @param  {!Boundary} start
	 * @param  {!Boundary} end
	 * @return {Array.<Boundary>}
	 * @memberOf lists
	 */
	function format(type, start, end) {
		Assert.assert(
			Html.isListContainer({nodeName: type.toUpperCase()}),
			'Lists.format#' + type + ' is not a valid list container'
		);
		var node;
		if (Html.isBoundariesEqual(start, end)) {
			node = Dom.upWhile(Boundaries.nextNode(start), function (node) {
				return !Html.hasLinebreakingStyle(node)
				    && !Dom.isEditingHost(node.parentNode);
			});
			build(type, collectSiblings(node, node));
			return [start, end];
		}
		var cac = Boundaries.commonContainer(start, end);
		if (!Html.hasLinebreakingStyle(cac)) {
			node = Dom.upWhile(cac, function (node) {
				return node.parentNode
				    && !isCollectLimit(node.parentNode)
				    && !Dom.isEditingHost(node.parentNode);
			});
			build(type, collectSiblings(node, node));
			return [start, end];
		}
		var startNode = Dom.upWhile(Boundaries.nextNode(start), function (node) {
			return !isCollectLimit(node)
				&& !Dom.isEditingHost(node.parentNode);
		});
		var endNode = Dom.upWhile(Boundaries.prevNode(end), function (node) {
			return !isCollectLimit(node)
				&& !Dom.isEditingHost(node.parentNode);
		});

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
		/*
		if (startNode === cac) {
			startNode = endNode;
		} else if (endNode === cac) {
			endNode = startNode;
		}
		*/
		build(type, collectSiblings(startNode, endNode));
		return [start, end];
	}

	/**
	 * Unwraps all LI elements in the given collection of siblings.
	 *
	 * @private
	 * @param  {Array.<Node>} nodes
	 * @return {Array.<Node>} List of unwrapped nodes
	 */
	function unwrapItems(nodes) {
		return nodes.filter(Html.isListItem).reduce(function (lines, node) {
			return lines.concat(Html.unwrapListItem(node));
		}, []);
	}

	/**
	 * Removes list formatting around the given boundaries.
	 *
	 * @param  {!Boundary} start
	 * @param  {!Boundary} end
	 * @return {Array.<Boundary>}
	 * @memberOf lists
	 */
	function unformat(start, end) {
		var nearestItem = function (node) {
			return !Html.isListItem(node) && !Dom.isEditingHost(node.parentNode);
		};
		var sc = Boundaries.container(start);
		var so = Boundaries.offset(start);
		var ec = Boundaries.container(end);
		var eo = Boundaries.offset(end);
		var startLi = Dom.upWhile(sc, nearestItem);
		var endLi = Dom.upWhile(ec, nearestItem);
		var lines;
		if (Html.isListItem(startLi)) {
			lines = unwrapItems(Dom.nodeAndNextSiblings(startLi));
			if (Html.isListItem(sc)) {
				sc = lines[0];
				so = 0;
			}
		}
		if (sc === ec) {
			return [Boundaries.create(sc, so), end];
		}
		if (Html.isListItem(endLi)) {
			lines = unwrapItems(Dom.nodeAndNextSiblings(endLi));
			if (Html.isListItem(ec)) {
				ec = lines[0];
				eo = 0;
			}
		}
		return [Boundaries.create(sc, so), Boundaries.create(ec, eo)];
	}

	/**
	 * Formats the content between the given boundaries into a list.
	 * If the content is already a list, it will either unformat the content or
	 * reformat the content into the given list type.
	 *
	 * @param  {string}   type Either 'ul' or 'ol'
	 * @param  {!Boundary} start
	 * @param  {!Boundary} end
	 * @return {Array.<Boundary>}
	 * @memberOf lists
	 */
	function toggle(type, start, end) {
		var sc = Boundaries.container(start);
		var ec = Boundaries.container(end);
		var si = Dom.upWhile(sc, Html.isListItem);
		var ei = Dom.upWhile(ec, Html.isListItem);
		if (Html.isListItem(si) && Html.isListItem(ei) && si.parentNode === ei.parentNode) {
			if (si.parentNode.nodeName.toLowerCase() === type) {
				return unformat(start, end);
			}
		}
		return format(type, start, end);
	}

	/**
	 * Starting with the given, returns the first node that matches the given
	 * predicate.
	 *
	 * @private
	 * @param  {!Node}                  node
	 * @param  {function(Node):boolean} pred
	 * @return {Node}
	 */
	function nearest(node, pred) {
		return Dom.upWhile(node, function (node) {
			return !pred(node)
			    && !(node.parentNode && Dom.isEditingHost(node.parentNode));
		});
	}

	/**
	 * Checks if the given (normalized) boundary is (visually) at the start of a
	 * list item element.
	 *
	 * Strategy:
	 *
	 * 1. If a text boundary is given, there must not be any non-collapsable
	 *    characters in front of the boundary.
	 *
	 *    ... otherwise ...
	 *
	 * 2. The boundary must be container inside of a list item. This means that
	 *    it must have a list item as its container or an ancestor of its
	 *    container.
	 *
	 *    ... and ...
	 *
	 *    We must not find any visible nodes between  the start of this element
	 *    and the boundary that was given to start of with.
	 *
	 * @private
	 * @param  {!Boundary} boundary
	 * @return {boolean}
	 */
	function isAtStartOfListItem(boundary) {
		var node = Boundaries.prevNode(boundary);
		if (Dom.isTextNode(node)) {
			var text = node.data;
			var offset = Boundaries.offset(boundary);
			var prefix = text.substr(0, offset);
			var isVisible = Strings.NOT_SPACE.test(prefix)
			             || Strings.NON_BREAKING_SPACE.test(prefix);
			if (isVisible) {
				return false;
			}
			node = node.previousSibling || node.parentNode;
		}
		var stop = nearest(node, Html.isListItem);
		if (!Html.isListItem(stop)) {
			return false;
		}
		var start = Boundaries.fromFrontOfNode(stop);
		var visible = 0;
		Html.walkBetween(start, boundary, function (nodes) {
			visible += nodes.filter(Html.isRendered).length;
		});
		return 0 === visible;
	}

	function removeNext(loc, num) {
		var records = [];
		while (num--) {
			records.push(Zip.after(loc));
			loc = Zip.remove(loc);
		}
		return {
			loc     : loc,
			records : records
		};
	}

	function isRenderedRecord(record) {
		return Html.isRendered(record.domNode());
	}

	function prevVisible(loc) {
		var index = Arrays.someIndex(loc.lefts.concat().reverse(), isRenderedRecord);
		return -1 === index ? null : Zip.prev(loc, index + 1);
	}

	function nextVisible(loc) {
		var index = Arrays.someIndex(loc.rights, isRenderedRecord);
		return -1 === index ? null : Zip.next(loc, index);
	}

	function bottomJoiningLoc(loc) {
		loc = nextVisible(loc);
		if (!loc || !Html.isListItem(Zip.dom(loc))) {
			return null;
		}
		loc = nextVisible(Zip.down(loc));
		if (!loc || !Html.isListContainer(Zip.dom(loc))) {
			return null;
		}
		return loc;
	}

	function topJoiningLoc(loc) {
		loc = prevVisible(loc);
		if (!loc || !Html.isListItem(Zip.dom(loc))) {
			return null;
		}
		var atLiEnd = Zip.next(Zip.down(loc), loc.rights.length);
		loc = prevVisible(atLiEnd);
		if (!loc || !Html.isListContainer(Zip.dom(loc))) {
			return atLiEnd;
		}
		loc = Zip.down(loc);
		return Zip.next(loc, loc.rights.length);
	}

	function insertAt(loc, records) {
		if (!Html.isListContainer(Zip.dom(Zip.up(loc)))) {
			loc = Zip.down(Zip.insert(loc, Boromir(document.createElement('UL'))));
		}
		return Zip.insert(loc, records);
	}

	function indent(start, end) {
		var startLi = nearest(Boundaries.prevNode(start), Html.isListItem);
		var endLi = nearest(Boundaries.nextNode(end), Html.isListItem);
		// Because otherwise the range between `start` and `end` is not within a
		// list
		if (!Html.isListItem(startLi) || !Html.isListItem(endLi)) {
			return [start, end];
		}
		start = Boundaries.fromFrontOfNode(startLi);
		end = Boundaries.fromBehindOfNode(endLi);
		var cac = Boundaries.commonContainer(start, end);
		var zip = Zip.zipper(Dom.editingHost(startLi), {
			start : start,
			end   : end
		});
		var isBelowCac = function (loc) { return Zip.dom(Zip.up(loc)) === cac; };
		var loc = zip.loc;
		loc = Zip.splitAt(loc, zip.markers.start, isBelowCac);
		loc = Zip.splitAt(loc, zip.markers.end, isBelowCac);
		var bottom = bottomJoiningLoc(Zip.next(Zip.go(loc, zip.markers.end)));
		var records = [];
		var removed;
		if (bottom) {
			loc = Zip.down(bottom);
			removed = removeNext(loc, loc.rights.length);
			records = records.concat(removed.records);
			loc = Zip.remove(Zip.up(Zip.up(removed.loc)));
		}
		loc = Zip.go(loc, zip.markers.start);
		removed = removeNext(loc, Arrays.someIndex(loc.rights.slice(1), Zip.isMarker) + 2);
		records = removed.records.concat(records);
		loc = topJoiningLoc(removed.loc) || Zip.down(Zip.insert(
			removed.loc,
			Boromir(document.createElement('LI'))
		));
		var markers = Zip.update(Zip.root(insertAt(loc, records)));
		return [Boundaries.next(markers.start), Boundaries.prev(markers.end)];
	}

	function isIndentationRange(start, end) {
		var startLi = nearest(Boundaries.prevNode(start), Html.isListItem);
		if (!Html.isListItem(startLi)) {
			return false;
		}
		var endLi = nearest(Boundaries.nextNode(end), Html.isListItem);
		if (!Html.isListItem(endLi)) {
			return false;
		}
		// ✘ <li><b>fo[o</b><u>b]ar</u></li>
		// ✔ <li><b>{foo</b><u>b]ar</u></li>
		// ✔ <li><b>fo[o</b></li><li><u>b]ar</u></li>
		return startLi !== endLi || isAtStartOfListItem(start);
	}

	return {
		indent              : indent,
		format              : format,
		unformat            : unformat,
		toggle              : toggle,
		isIndentationRange  : isIndentationRange
	};
});
