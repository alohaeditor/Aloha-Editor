/**
 * transform/ms-word/toc.js is part of Aloha Editor project http://aloha-editor.org
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
    WordUtils
) {
	'use strict';

	/**
	 * @const
	 * @type {RegExp}
	 * */
	var TOC_CLASS_NAME = /MsoToc(\d+)/;

	/**
	 * Gets the TOC element level number.
	 *
	 * @param  {Element} element
	 * @return {?number} TOC number or null if not exists
	 */
	function getTocLevel(element) {
		var match = TOC_CLASS_NAME.exec(Dom.getAttr(element, 'class'));
		return (match && match[1]) ? parseInt(match[1], 10) : null;
	}

	/**
	 * Creates list item containing the contents of the given element.
	 *
	 * @param  {Element} element
	 * @return {Element} An LI element
	 */
	function createListItem(element) {
		var li = element.ownerDocument.createElement('li');
		//li.innerHTML = Dom.textContent(element);
		Dom.move(Dom.children(Dom.clone(element)), li);
		return li;
	}

	/**
	 * Creates an unordered list.
	 *
	 * @param  {Element} doc
	 * @return {Element}
	 */
	function createUnorderedList(doc) {
		var ul = doc.createElement('ul');
		Dom.setAttr(ul, 'style', 'list-style: none;');
		return ul;
	}

	/**
	 * Creates a nested list.
	 *
	 * @param  {number}  actualTocNumber Number of TOC level
	 * @param  {number}  lastTocNumber   Number of the last TOC level
	 * @param  {Element} listElement
	 * @return {Element} List element
	 */
	function createNestedList(actualTocNumber, lastTocNumber, listElement) {
		var list;
		var doc = listElement.ownerDocument;
		    createListFn = function() {
		        var list = doc.createElement('ul');
		        Dom.setAttr(list, 'style', 'list-style: none;');
		        return list;
		    };
		return WordUtils.createNestedList(actualTocNumber, lastTocNumber, listElement, createListFn);

	}

	/**
	 * Transforms table of contents.
	 *
	 * @param {!Element} tocElement
	 * @param {!Element} parentNode Parent node of the tocElement
	 * @return {Element}
	 */
	function transformTocHeading(tocElement, parentNode) {
		var doc = tocElement.ownerDocument,
		    nextSibling = tocElement,
		    listElement = createUnorderedList(doc),
		    lastTocNumber = 1,
		    actualTocNumber;

		while (nextSibling && (actualTocNumber = getTocLevel(nextSibling))) {
			if (actualTocNumber !== lastTocNumber) {
				listElement = createNestedList(actualTocNumber, lastTocNumber, listElement);
				lastTocNumber = actualTocNumber;
			}
			listElement.appendChild(createListItem(nextSibling));
			nextSibling = WordUtils.nextSiblingAndRemoves(nextSibling, parentNode);
		}

		// Get the first list
		while (listElement.parentNode) {
			listElement = listElement.parentNode;
		}
		return listElement;
	}


	/**
	 * Remove useless TOC elements.
	 * 
	 * @param {Element} element
	 */
	function removeUselessElements(element) {
		var i,
		    len,
		    msoHideSpans = element.querySelectorAll('span[style*="mso-hide"]'),
		    tocRefs = element.querySelectorAll('a[name^="_Toc"]');

		for (i = 0, len = tocRefs.length; i < len; i++) {
			Dom.removeShallow(tocRefs[i]);
		}

		for (i = 0, len = msoHideSpans.length; i < len; i++) {
			msoHideSpans[i].parentNode.removeChild(msoHideSpans[i]);
		}
	}

	/**
	 * Replaces Table of Contents headings by headers 'h1'.
	 * 
	 * @param {Element} element
	 */
	function replaceTocHeadings(element) {
		var headingH1,
			tocHeadings = element.querySelectorAll('p[class^="MsoTocHeading"]'),
		    doc = element.ownerDocument;

		for (var i = 0, len = tocHeadings.length; i < len; i++) {
			headingH1 = doc.createElement('h1');
			headingH1.appendChild(doc.createTextNode(tocHeadings[i].textContent));
			tocHeadings[i].parentNode.replaceChild(headingH1, tocHeadings[i]);
		}
	}

	/**
	 * Transforms MS Office table of contents.
	 *
	 * @param {Element} element
	 */
	function transform(element) {
		var msoToc;
		var anchorSpan;
		var listElement;

		removeUselessElements(element);
		replaceTocHeadings(element);

		while ((msoToc = element.querySelector('p[class^="MsoToc"]')) !== null) {
			anchorSpan = msoToc.ownerDocument.createElement('span');
			msoToc.parentNode.insertBefore(anchorSpan, msoToc);
			listElement = transformTocHeading(msoToc, anchorSpan.parentNode);
			anchorSpan.parentNode.replaceChild(listElement, anchorSpan);
		}
	}

	return {
		transform: transform
	};
});
