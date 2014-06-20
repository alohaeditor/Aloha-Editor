/**
 * list-util.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'arrays',
	'dom',
	'html'
], function (
	Arrays,
    Dom,
    Html
) {
	'use strict';

	/**
	 * @const
	 * @type {string[]}
	 */
	var LIST_NODE_NAMES = ['UL', 'OL'];

	/**
	 * Checks if `node` is a list.
	 * @param {Node} node
	 * @return {boolean}
	 */
	function isList(node) {
		return Arrays.contains(LIST_NODE_NAMES, node.nodeName);
	}

	/**
	 * Checks if `node` is a item list.
	 * @param {Node} node
	 * @return {boolean}
	 */
	function isItem(node) {
		return node.nodeName === 'LI';
	}

	/**
	 * Adds `node` to `list`, only if it not already inserted.
	 * @param {Node} node
	 * @param {Array.<Node> list
	 */
	function addElementToList(node, list) {
		if (list.indexOf(node) < 0) {
			list.push(node);
		}
	}

	/**
	 * Moves the elements from `listSrc` to `listDst`.
	 * @param {ListElement} listSrc
	 * @param {ListElement} listDst
	 */
	function moveToList(listSrc, listDst) {
		var liItems = Arrays.coerce(listSrc.children);
		liItems.forEach(function (item) {
			if (isList(item) && item.nodeName !== listDst.nodeName) {
				var cloneDst = Dom.cloneShallow(listDst);
				moveToList(item, cloneDst);
				item = cloneDst;
			}
			listDst.appendChild(item);

		});

		Dom.replace(listSrc, listDst);
	}

	/**
	 * Checks if `node1` is the same node as `node2`.
	 * @param {Node} node1
	 * @param {Node} node2
	 * @return {boolean}
	 */
	function isSameNode(node1, node2) {
		return node1 === node2;
	}

	/**
	 * Removes unrendered list elements from `list`.
	 * @param {Array.<ListElement>} list
	 */
	function removeUnrenderedElements(list) {
		list.forEach(function (item) {
			if (!Html.isRendered(item)) {
				Dom.remove(item);
			}
		});
	}


	return {
		isItem: isItem,
		isList: isList,
		addElementToList: addElementToList,
		moveToList: moveToList,
		isSameNode: isSameNode,
		removeUnrenderedElements: removeUnrenderedElements
	};
});
