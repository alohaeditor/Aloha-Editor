/**
 * transform/ms-word/toc.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'functions',
	'dom',
	'arrays',
	'../utils'
], function (
	Fn,
	Dom,
	Arrays,
	Utils
) {
	'use strict';

	/**
	 * Match MsoToc.
	 *
	 * @private
	 * @type {RegExp}
	 */
	var TOC_CLASS_NAME = /MsoToc(\d+)/;

	/**
	 * Extracts the TOC element level number, otherwise returns null.
	 *
	 * @private
	 * @param  {Element} element
	 * @return {?number}
	 */
	function extractLevel(element) {
		var match = TOC_CLASS_NAME.exec(Dom.getAttr(element, 'class'));
		return (match && match[1]) ? parseInt(match[1], 10) : null;
	}

	/**
	 * Checks whether the given node is a TOC header paragraph.
	 *
	 * @private
	 * @param  {Node}
	 * @return {boolean}
	 */
	function isTocHeading(node) {
		return 'P' === node.nodeName && Dom.hasClass(node, 'MsoTocHeading');
	}

	/**
	 * Checks whether the given node is a TOC list item.
	 *
	 * @private
	 * @param  {Node}
	 * @return {boolean}
	 */
	function isTocItem(node) {
		if (!Dom.isElementNode(node)) {
			return false;
		}
		var match = TOC_CLASS_NAME.exec(Dom.getAttr(node, 'class'));
		return match ? match.length > 0 : false;
	}

	/**
	 * Creates a list DOM structure based on the given `list` data structure
	 * (created from createList()).
	 *
	 * @private
	 * @param  {Object} list
	 * @param  {string} marker
	 * @return {Element}
	 */
	function constructList(list, marker) {
		var container = list.node.ownerDocument.createElement('ul');
		var items = list.items.reduce(function (items, item) {
			var children = item.reduce(function (children, contents) {
				return children.concat(
					contents[marker] ? constructList(contents, marker)
					                 : contents
				);
			}, []);
			var li = list.node.ownerDocument.createElement('li');
			Dom.copy(children, li);
			return items.concat(li);
		}, []);
		Dom.move(items, container);
		return container;
	}

	/**
	 * Takes a flat list of nodes, which consitutes a (multi-level) list in
	 * MS-Word and generates a standard HTML list DOM structure from it.
	 *
	 * This function requires that the given list of nodes must begin with a
	 * list-paragraph, and must end with a list-paragraph since this is the only
	 * valid way that lists are represented in MS-Word.
	 *
	 * @private
	 * @param  {Array.<Node>}              nodes
	 * @param  {function(Element):Element} transform
	 * @return {?Element}
	 */
	function createList(nodes, transform) {
		var i, j, l, node, list, first, last, level;
		var marker = '_aloha' + (new Date().getTime());

		for (i = 0; i < nodes.length; i++) {
			node = transform(nodes[i]);
			level = extractLevel(node);

			if (!list) {
				first = list = {
					parent : null,
					level  : 1,
					node   : node,
					items  : []
				};
				list[marker] = true;
			} else if (level > list.level) {
				for (j = list.level; j < level; j++) {
					list = {
						parent : list,
						level  : j + 1,
						node   : node,
						items  : []
					};
					list[marker] = true;
					last = Arrays.last(list.parent.items);
					if (!last) {
						last = [];
						list.parent.items.push(last);
					}
					last.push(list);
				}
			} else if (level < list.level) {
				for (j = level, l = list.level; j < l && list.parent; j++) {
					list = list.parent;
				}
			}

			list.items.push(Dom.children(node));
		}

		return first && constructList(first, marker);
	}

	/**
	 * Transforms MS Office table of contents into a normalized HTML list.
	 *
	 * @param  {Element} element
	 * @return {Element} A normalized copy of `element`
	 */
	function transform(element) {
		var notTocItem = Fn.complement(isTocItem);
		var children = Dom.children(element);
		var processed = [];
		var l = children.length;
		var i;
		var list;
		var node;
		var nodes;
		for (i = 0; i < l; i++) {
			node = children[i];
			if (isTocHeading(node)) {
				processed.push(Utils.rewrap(node, 'h1'));
			} else if (isTocItem(node)) {
				nodes = Arrays.split(Dom.nodeAndNextSiblings(node), notTocItem)[0];
				list = createList(nodes, transform);
				if (list) {
					processed.push(list);
					i += nodes.length - 1;
				}
			} else {
				processed.push(transform(node));
			}
		}
		var clone = Dom.clone(element, false);
		Dom.move(processed, clone);
		return clone;
	}

	return {
		transform: transform
	};
});
