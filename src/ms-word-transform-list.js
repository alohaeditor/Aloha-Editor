/** ms-word-transform-list.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'ms-word-transform-utils'
], function (
	Dom,
	WordTransformUtils
) {
	'use strict';

	/**
	 * @const
	 * @type {string}
	 */
	var ORDERED_LIST_NODE_NAME = 'OL',
		/**
		 * @const
		 * @type {string}
		 */
	    UNORDERED_LIST_NODE_NAME = 'UL',
		/**
		 * @const
		 * @type {number}
		 */
	    DEFAULT_LIST_LEVEL = 1;

	/**
	 * Get list HTML NodeName, ordered or unordered list.
	 *
	 * @param {!Element} element Contains nodes in MS-WORD
	 * @return {string} Node name
	 */
	function getListNodeName(element) {
		return (isOrderedList(element)) ? ORDERED_LIST_NODE_NAME : UNORDERED_LIST_NODE_NAME;
	}

	/**
	 * Gets the numbering type for an ordered list.
	 *
	 * @param {!Element} element
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
	 * Check whether the given list span (first span in a paragraph which shall be a list item)
	 * belongs to an ordered list.
	 *
	 * @param {!Element} listSpan
	 * @return {boolean} true for ordered lists, false for unordered
	 */
	function isOrderedList(element) {
		var firstChild = element.firstChild,
		    fontFamily = Dom.getStyle(firstChild, 'fontFamily');

		if (fontFamily === 'Wingdings' || fontFamily === 'Symbol') {
			return false;
		}

		return null !== getNumberFromOrderedList(element);
	}


	/**
	 * Checks if the element is a paragraph list.
	 *
	 * @param {!Element} paragraphElement
	 * @return {boolean}
	 */
	function isParagraphList(paragraphElement) {
		return    Dom.hasClass(paragraphElement, 'MsoListParagraphCxSpMiddle')
		       || Dom.hasClass(paragraphElement, 'MsoListParagraphCxSpLast');
	}

	/**
	 * Sets the numbering if the list is an ordered list.
	 *
	 * @param {!Element} listHTML
	 * @param {!Element} paragraphElement
	 */
	function setListNumbering(listHTML, paragraphElement) {
		var numbering = getNumberFromOrderedList(paragraphElement),
		    startValue,
		    typeValue;

		if (listHTML.nodeName !== ORDERED_LIST_NODE_NAME || listHTML.type !== ''
			|| !numbering) {
			return;
		}

		if (numbering) {
			if (/\d+/.test(numbering)) {
				startValue = numbering;
				typeValue = '1';
			} else if (/i/i.test(numbering)) {
				typeValue = (/I/.test(numbering)) ? 'I' : 'i';
			} else {
				typeValue = (/[A-Z]/.test(numbering)) ? 'A' : 'a';
			}
		}

		if (startValue) {
			Dom.setAttr(listHTML, 'start', startValue);
		}

		if (typeValue) {
			Dom.setAttr(listHTML, 'type', typeValue);
		}
	}

	/**
	 * Extract the depth level of the list
	 *
	 * @param {!Element} paragraphElement
	 * @return {number} number of depth
	 */
	function extractLevel(paragraphElement) {
		var match = /mso-list:.*?level(\d+)/i.exec(Dom.getAttr(paragraphElement, 'style'));
		return (match && match[1]) ? parseInt(match[1], 10) : DEFAULT_LIST_LEVEL;
	}


	/**
	 * Create item list Element (<li>) with the content 'element'.
	 *
	 * @param {!Element} element Contains the text to be inserted in the item list
	 *
	 * @return {Element} Item list element (<li>)
	 */
	function createItemList(element) {
		var liElem = element.ownerDocument.createElement('li'),
		    childNodes;

		WordTransformUtils.removeEmptyChildren(element);
		childNodes = element.childNodes;

		// There are 2 span. First contains the numbering or bullet, and the second the content
		for (var i = childNodes.length - 1; i > 0; i--) {
			liElem.insertBefore(childNodes[i], liElem.firstChild);
		}
		WordTransformUtils.cleanElement(liElem);
		return liElem;
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

		listHTML = WordTransformUtils.createNestedList(actualLevel, lastLevel, listHTML, createListFn);

		if (listHTML.nodeName !== nodeName) {
			newList = doc.createElement(nodeName);
			WordTransformUtils.replaceNode(listHTML, newList);
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
			nextParagraph = WordTransformUtils.nextSiblingAndRemoves(nextParagraph, parentNode);
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
				nextSibling = WordTransformUtils.nextNotEmptyElementSibling(itemLists[i]);
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

			parentNode.replaceChild(list, spanAnchor);
		}
	}

	return {
		transform: transform
	};
});
