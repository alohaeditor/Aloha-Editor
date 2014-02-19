/**
 * list-to-paragraph.js is part of Aloha Editor project http://aloha-editor.org
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
	'list-util'
], function (
	Arrays,
	Dom,
	Ranges,
	Editing,
	Html,
	ListUtil
) {
	'use strict';

	/**
	 * Breaks `list` in two new lists by `item`.
	 * @param {ListElement} list
	 * @param {LiElement} item
	 * @return {Node}
	 */
	function breakList(list, item) {
		var newlist = Dom.cloneShallow(list);
		var firstElement = list.firstElementChild;

		while (firstElement && !ListUtil.isSameNode(firstElement, item)) {
			newlist.appendChild(firstElement);
			firstElement = list.firstElementChild;
		}

		list.parentNode.insertBefore(newlist, list);
		return newlist;
	}

	/**
	 * Creates a paragraph which contains `node`.
	 * @param {Node} node
	 * @return {ParagraphElement}
	 */
	function createParagraph(node) {
		var paragraph = Dom.wrapWithNodeName(node, 'p');
		Dom.removeShallow(node);
		return paragraph;
	}

	/**
	 * Transforms `elements` to paragraph.
	 * @param elements
	 */
	function toParagraph(elements) {
		var reference = elements[0];
		var parentReference = reference.parentNode;
		var listsVisited = [];
		var doc = reference.ownerDocument;

		if (ListUtil.isItem(reference)) {
			var newList = breakList(reference.parentNode, reference);

			ListUtil.addElementToList(newList, listsVisited);
			ListUtil.addElementToList(reference.parentNode, listsVisited);

			reference = newList.nextSibling;
			parentReference = reference.parentNode;
		}

		var	paragraph;
		var element;

		for (var i = 0, len = elements.length; i < len; i++) {
			element = elements[i];
			if (ListUtil.isItem(element)) {
				ListUtil.addElementToList(element.parentNode, listsVisited);

				paragraph = createParagraph(element);

				if (!Dom.hasChildren(paragraph)) {
					paragraph.appendChild(doc.createElement('br'));
				}

				parentReference.insertBefore(paragraph, reference);
			} else if (Html.isRendered(element)) {
				parentReference = reference.parentNode;
				reference = element.nextSibling;
			}
		}

		ListUtil.removeUnrenderedElements(listsVisited);
	}

	return {
		toParagraph      : toParagraph
	};
});
