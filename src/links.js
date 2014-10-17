/**
 * links.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * @namespace links
 */
define([
	'dom',
	'html',
	'events',
	'ranges',
	'arrays',
	'mutation',
	'boundaries',
	'links/link-util',
	'links/link-selection'
], function (
	Dom,
	Html,
	Events,
	Ranges,
	Arrays,
	Mutation,
	Boundaries,
	LinkUtil,
	LinkSelection
) {
	'use strict';

	/**
	 * Checks if the range is valid for create a link.
	 *
	 * @param  {!Range} range
	 * @return {boolean}
	 */
	function isValidRangeForCreateLink(range) {
		return !range.collapsed && (!range.textContent || range.textContent.trim().length === 0);
	}

	/**
	 * Creates anchor elements between the given boundaries.
	 *
	 * @private
	 * @param  {!Boundary} start
	 * @param  {!Boundary} end
	 * @return {Array.<Element>}
	 */
	function createAnchors(start, end) {
		var doc = Boundaries.document(start);
		var groups = LinkSelection.collectLinkableNodeGroups(start, end);
		return groups.reduce(function (anchors, group) {
			var anchor = doc.createElement('a');
			Dom.insert(anchor, group[0]);
			Dom.move(group, anchor);
			return anchors.concat(anchor);
		}, []);
	}

	/**
	 * Creates links from the content between the given boundaries.
	 *
	 * If the boundaries represent a collapsed selection (visually equal), then
	 * the a link will be created at the boundary position with href as both the
	 * anchor text and the value of the href attribute.
	 *
	 * Will pass newly created anchor elements to optional `created` array.
	 *
	 * @todo
	 * - This function should return a list of newly created anchor elements.
	 * - This function also needs to return the modified boundaries.
	 *
	 * @param  {string}           href
	 * @param  {!Boundary}        start
	 * @param  {!Boundary}        end
	 * @param  {Array.<Element>=} created
	 * @return {Array.<Boundary>}
	 * @memberOf links
	 */
	function create(href, start, end, created) {
		var anchors;
		if (Html.isBoundariesEqual(start, end)) {
			var a = Boundaries.document(start).createElement('a');
			a.innerHTML = href;
			Mutation.insertNodeAtBoundary(a, start, true);
			anchors = [a];
		} else {
			anchors = createAnchors(start, end);
		}
		anchors.forEach(function (anchor) {Dom.setAttr(anchor, 'href', href);});
		if (created) {
			anchors.reduce(function (list, a) {list.push(a); return list;}, created);
		}
		return [
			Boundaries.fromFrontOfNode(anchors[0]),
			Boundaries.fromBehindOfNode(Arrays.last(anchors))
		];
	}

	/**
	 * Checks whether the given nodes are equal according to their type and
	 * attributes.
	 *
	 * @private
	 * @see    http://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-isEqualNode
	 * @param  {!Node} src
	 * @param  {!Node} dst
	 * @return {boolean}
	 */
	function isEqualNodeShallow(src, dst) {
		return Dom.cloneShallow(src).isEqualNode(Dom.cloneShallow(dst));
	}

	/**
	 * Checks two nodes are are compatible to be joined.
	 *
	 * @private
	 * @param  {!Node} src
	 * @param  {!Node} dst
	 * @return {boolean}
	 */
	function areJoinable(src, dst) {
		return !Dom.isTextNode(src) && isEqualNodeShallow(src, dst);
	}

	/**
	 * Joins two nodes if they are compatible.
	 *
	 * @private
	 * @param {!Node} src
	 * @param {!Node} dst
	 */
	function joinNodes(src, dst) {
		var last;
		while (src && dst && areJoinable(src, dst)) {
			last = LinkUtil.nextRenderedNode(src.firstChild);
			dst.appendChild(last);
			Dom.remove(src);
			src = last;
			dst = dst.firstChild;
		}
	}

	/**
	 * Removes link anchor.
	 *
	 * @private
	 * @param {!Node} anchor
	 */
	function removeIfLink(anchor) {
		if (!LinkUtil.isAnchorNode(anchor)) {
			return;
		}
		var firstChild = LinkUtil.nextRenderedNode(anchor.firstChild);
		var prevAnchorSibling = LinkUtil.prevRenderedNode(anchor.previousSibling);
		joinNodes(firstChild, prevAnchorSibling);
		var lastChild = LinkUtil.prevRenderedNode(anchor.lastChild);
		var nextAnchorSibling = LinkUtil.nextRenderedNode(anchor.nextSibling);
		joinNodes(nextAnchorSibling, lastChild);
		Dom.removeShallow(anchor);
	}

	/**
	 * Removes children links if exists inside `node`.
	 *
	 * @private
	 * @param {!Node} node
	 */
	function removeChildrenLinks(node) {
		if (Dom.isElementNode(node)) {
			Arrays.coerce(node.querySelectorAll('a')).forEach(removeIfLink);
		}
	}

	/**
	 * Removes parent links if exists and returns the next node which should be
	 * analyze.
	 *
	 * @private
	 * @param  {Node} next
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
	 * Removes any links in the content between the given boundaries.
	 *
	 * @param {!Boundary} start
	 * @param {!Boundary} end
	 * @memberOf links
	 */
	function remove(start, end) {
		var startBoundary = LinkUtil.boundaryLinkable(
			Boundaries.container(start),
			Boundaries.offset(start)
		);
		var endBoundary = LinkUtil.boundaryLinkable(
			Boundaries.container(end),
			Boundaries.offset(end)
		);
		var sc = Boundaries.container(startBoundary);
		var ec = Boundaries.container(endBoundary);
		removeChildrenLinks(sc);
		removeChildrenLinks(ec);
		var next = sc;
		while (next && !Dom.isSameNode(next, ec)) {
			next = removeParentLinksAndGetNext(next);
			if (next) {
				removeChildrenLinks(next);
			}
		}
		while (ec && ec.parentNode && LinkUtil.isLinkable(ec)) {
			removeIfLink(ec);
			ec = ec.parentNode;
		}
	}

	function notAnchor(node) {
		return 'A' !== node.nodeName;
	}

	/**
	 * This function is missing documentation.
	 * @TODO Complete documentation.
	 *
	 * @memberOf links
	 */
	function handleLinks(event) {
		if ('click' !== event.type) {
			return event;
		}
		var cac = Boundaries.commonContainer(
			event.selection.boundaries[0],
			event.selection.boundaries[1]
		);
		var anchor = Dom.upWhile(cac, notAnchor);
		if (anchor) {
			Events.preventDefault(event.nativeEvent);
		}
		return event;
	}

	return {
		handleLinks : handleLinks,
		create      : create,
		remove      : remove
	};
});
