/**
 * list.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'arrays',
	'dom',
	'ranges',
	'editing',
	'html',
	'list-util',
	'predicates'
], function (
	Arrays,
	Dom,
	Ranges,
	Editing,
	Html,
	ListUtil,
    Predicates
) {
	'use strict';


	/**
	 * Checks if `node` is an allowed place to insert a list.
	 * Only if the node is a li (nested lists) or a block element.
	 * @param node
	 * @return {boolean}
	 */
	function isAllowToInsertList(node) {
		return Html.hasBlockStyle(node) && node.nodeName !== 'LI';
	}

	/**
	 * Inserts `list` at `reference`.
	 * @param list
	 * @param reference
	 */
	function insertList(list, reference) {
		while (!isAllowToInsertList(reference)) {
			reference = reference.parentNode;
		}

		if (ListUtil.isList(reference)) {
			Dom.insertAfter(list, reference);
		} else {
			Dom.insert(list, reference);
		}
	}

	/**
	 * Checks if the root element are equals.
	 * @param {Node} node1
	 * @param {Node} node2
	 * @return {boolean}
	 */
	function isEqualRoot(node1, node2) {
		var clone1 = Dom.cloneShallow(node1);
		var clone2 = Dom.cloneShallow(node2);

		return clone1.isEqualNode(clone2);
	}

	/**
	 * Merges sibling list that are equals.
	 * @param {ListElement} list
	 */
	function mergeSiblingList(list) {
		if (list.nextSibling && ListUtil.isList(list.nextSibling) && isEqualRoot(list.nextSibling, list)) {
			ListUtil.moveToList(list.nextSibling, list);
		}
		if (list.previousSibling && ListUtil.isList(list.previousSibling) && isEqualRoot(list.previousSibling, list)) {
			ListUtil.moveToList(list, list.previousSibling);
		}
	}

	/**
	 * Cleans `node` that is the content of a new Li item.
	 * @param {Element} node
	 */
	function cleanLiContent(node) {
		if (!Dom.isTextNode(node)) {
			var brs = Arrays.coerce(node.querySelectorAll('br'));
			brs.forEach(Dom.remove);
		}

		if (Predicates.isBlockNode(node)) {
			Dom.removeShallow(node);
		} else if (node.nodeName === 'BR') {
			Dom.remove(node);
		}
	}

	/**
	 * Creates a li item which contains `node`.
	 * @param {Node} node
	 * @return {LiElement}
	 */
	function createLiItem(node) {
		var listItem = document.createElement('li');

		Dom.wrap(node, listItem);
		cleanLiContent(node);

		return listItem;
	}

	/**
	 * Transforms `elements` to `list`.
	 * @param {Array.<Element>} elements
	 * @param <ListElement> list
	 */
	function toList(elements, list) {
		var lastItemList = null;
		var element;
		var visitedLists = [];

		insertList(list, elements[0]);

		for (var i = 0, len = elements.length; i < len; i++) {
			element = elements[i];

			if (ListUtil.isList(element)) {
				ListUtil.moveToList(element, list);
			} else if (ListUtil.isItem(element)) {
				lastItemList = element;

				ListUtil.addElementToList(element.parentNode, visitedLists);

				list.appendChild(element);
			}  else if (Html.isRendered(element)) {
				var listItem = createLiItem(element);

				list.appendChild(listItem);
			} else {
				Dom.remove(element);
			}
		}

		ListUtil.removeUnrenderedElements(visitedLists);

		mergeSiblingList(list);
	}

	return {
		toListFromRange: toList
	};
});
