/**
 * transform/ms-word-transform-list.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'transform/ms-word/utils'
], function (
	Dom,
	Utils
) {
	'use strict';

	/**
	 * @const
	 * @type {string}
	 */
	var ORDERED_LIST_NODE_NAME = 'OL';

	/**
	 * @const
	 * @type {string}
	 */
	var UNORDERED_LIST_NODE_NAME = 'UL';

	/**
	 * Gets the numbering type for an ordered list.
	 *
	 * @param  {Element} element
	 * @return {?string}
	 */
	function getNumberFromOrderedList(element) {
		var firstChild = element.firstChild;
		if (!firstChild) {
			return null;
		}
		// otherwise check for a number, letter or '(' as first character
		var match = /^\s*([0-9]{1,3}|[a-zA-Z]{1,5})(\.|\))\s*$/.exec(Dom.textContent(firstChild));
		if (match) {
			match = /(\w+)/i.exec(match[0]);
			return match ? match[1] : null;
		}
		return null;
	}

	/**
	 * Checks whether the given list span (first span in a paragraph which
	 * shall be a list item) belongs to an ordered list.
	 *
	 * @param  {Element} span
	 * @return {boolean} true for ordered lists, false for unordered
	 */
	function isOrderedList(span) {
		var font = Dom.getStyle(span.firstChild, 'fontFamily');
		if (font === 'Wingdings' || font === 'Symbol') {
			return false;
		}
		return null !== getNumberFromOrderedList(span);
	}

	/**
	 * Gets the node name of the given list element.
	 *
	 * @param  {Element} element Contains nodes in MS-WORD
	 * @return {string}
	 */
	function getListNodeName(element) {
		return isOrderedList(element)
		     ? ORDERED_LIST_NODE_NAME
		     : UNORDERED_LIST_NODE_NAME;
	}

	/**
	 * Checks whether the given element is a paragraph that represents a list.
	 *
	 * @param  {Element} paragraph
	 * @return {boolean}
	 */
	function isParagraphList(paragraph) {
		return Dom.hasClass(paragraph, 'MsoListParagraphCxSpMiddle')
		    || Dom.hasClass(paragraph, 'MsoListParagraphCxSpLast');
	}

	/**
	 * Sets the numbering if the list an an ordered list.
	 *
	 * @param {Element} list
	 * @param {Element} paragraphElement
	 */
	function setListNumbering(list, paragraphElement) {
		var numbering = getNumberFromOrderedList(paragraphElement);

		if (list.nodeName !== ORDERED_LIST_NODE_NAME || list.type !== '' || !numbering) {
			return;
		}

		var startValue;
		var typeValue;

		if (/\d+/.test(numbering)) {
			startValue = numbering;
			typeValue = '1';
		} else if (/i/i.test(numbering)) {
			typeValue = (/I/.test(numbering)) ? 'I' : 'i';
		} else {
			typeValue = (/[A-Z]/.test(numbering)) ? 'A' : 'a';
		}

		if (startValue) {
			Dom.setAttr(list, 'start', startValue);
		}

		if (typeValue) {
			Dom.setAttr(list, 'type', typeValue);
		}
	}

	/**
	 * Extracts the depth level of the list.
	 *
	 * @param  {Element} paragraph
	 * @return {number}
	 */
	function extractLevel(paragraph) {
		var match = /mso-list:.*?level(\d+)/i.exec(Dom.getAttr(paragraph, 'style'));
		return (match && match[1]) ? parseInt(match[1], 10) : 1;
	}

	/**
	 * Creates item list Element (<li>) with the content 'element'.
	 *
	 * @param  {Element} element Contains the text to be inserted in the item list
	 * @return {Element} Item list element (<li>)
	 */
	function createItemList(element) {
		Utils.removeEmptyChildren(element);

		var li = element.ownerDocument.createElement('li');
		var children = Dom.children(element);

		// There are 2 span. First contains the numbering or bullet, and the second the content
		for (var i = children.length - 1; i > 0; i--) {
			li.insertBefore(children[i], li.firstChild);
		}
		Utils.cleanElement(li);
		return li;
	}

	/**
	 * Creates nested list.
	 *
	 * @param {integer} actualLevel
	 * @param {integer} lastLevel
	 * @param {Element} listHTML
	 * @param {Element} paragraphElement
	 *
	 * @return {Element} List Element
	 */
	function createNestedList(actualLevel, lastLevel, listHTML, paragraphElement) {
		var nodeName = getListNodeName(paragraphElement),
			newList,
			doc = listHTML.ownerDocument,
		    createListFn = function () {
		        return doc.createElement(nodeName);
		    };

		listHTML = Utils.createNestedList(actualLevel, lastLevel, listHTML, createListFn);

		if (listHTML.nodeName !== nodeName) {
			newList = doc.createElement(nodeName);
			Dom.replaceShallow(listHTML, newList);
			listHTML = newList;
		}

		setListNumbering(listHTML, paragraphElement);
		return listHTML;
	}


	/**
	 * Create List HTML Element from MS-WORD paragraph.
	 *
	 * @param {Element} paragraph
	 *
	 * @return {Element} List HTML Element
	 */
	function createListElement(paragraph) {
		var nextParagraph = paragraph,
		    nodeName = getListNodeName(paragraph),
		    listHTML = paragraph.ownerDocument.createElement(nodeName),
		    parentNode = paragraph.parentNode,
		    lastLevel = 1,
		    actualLevel = 1;

		setListNumbering(listHTML, paragraph);

		do {
			actualLevel = extractLevel(nextParagraph);
			if (actualLevel !== lastLevel) {
				listHTML = createNestedList(actualLevel, lastLevel, listHTML, nextParagraph);
				lastLevel = actualLevel;
			}
			listHTML.appendChild(createItemList(nextParagraph));
			nextParagraph = Utils.nextSiblingAndRemoves(nextParagraph, parentNode);
		} while ((nextParagraph && isParagraphList(nextParagraph)));

		// Get the first list
		while (listHTML.parentNode) {
			listHTML = listHTML.parentNode;
		}
		return listHTML;
	}


	/**
	 * Detect paragraph between list. If a paragraph if inside a List,
	 * the list would split in two and in the middle would be the paragraph.
	 *
	 * @param {Element} element
	 */
	function detectParagraphInsideList(element) {
		var nextSibling,
		    itemLists = element.querySelectorAll('p[class^="MsoListParagraphCxSp"]');

		for (var i = 0, len = itemLists.length; i < len; i++) {
			if (!itemLists[i].querySelector('span[style*="mso-list:"]')) {
				itemLists[i].removeAttribute('class');
				nextSibling = Utils.nextNotEmptyElementSibling(itemLists[i]);
				if (nextSibling && /MsoListParagraphCxSp/i.test(Dom.getAttr(nextSibling, 'class'))) {
					Dom.setAttr(nextSibling, 'class', 'MsoListParagraphCxSpFirst');
				}
			}
		}
	}

	/**
	 * Replaces MS Office lists into HTML lists.
	 *
	 * @param {Element} element
	 */
	function transform(element) {
		var paragraphFirstLists,
		    list,
		    parentNode,
		    spanAnchor,
		    doc = element.ownerDocument;

		detectParagraphInsideList(element);

		paragraphFirstLists = element.querySelectorAll('.MsoListParagraphCxSpFirst[style*="level"],.MsoListParagraph[style*="level"]');

		for (var i = 0, len = paragraphFirstLists.length; i < len; i++) {
			spanAnchor = doc.createElement('span');
			parentNode = paragraphFirstLists[i].parentNode;
			parentNode.insertBefore(spanAnchor, paragraphFirstLists[i]);

			list = createListElement(paragraphFirstLists[i]);

			Dom.replace(list, spanAnchor);
		}
	}

	return {
		transform: transform
	};
});
