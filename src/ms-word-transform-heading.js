/* ms-word-transform-heading.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'ms-word-transform-utils'
], function (
	WordContentParserUtils
) {
	'use strict';


	/**
	 * Cleans a list of headings.
	 *
	 * @param {Array.<Element>} headings
	 */
	function cleanHeadings(headings) {
		for (var i = 0, len = headings.length; i < len ; i++) {
			WordContentParserUtils.cleanElement(headings[i]);
		}
	}

	/**
	 * Replaces the list of headings by `nodeName` HTML element.
	 *
	 * @param {Document} doc
	 * @param {Array.<Element>} headings
	 * @param {string} nodeName
	 */
	function transformHeadings(doc, headings, nodeName) {
		var headerHTML,
			heading;

		cleanHeadings(headings);

		for (var i = 0, len = headings.length; i < len ; i++) {
			heading = headings[i];
			headerHTML = doc.createElement(nodeName);

			WordContentParserUtils.copyChildNodes(heading, headerHTML);

			heading.parentNode.replaceChild(headerHTML, heading);
		}
	}

	/**
	 * Replace title and subtitle for h1 and h2 respectively.
	 *
	 * @param {Element} element
	 */
	function transform(element) {
		var titles = element.querySelectorAll('.MsoTitle'),
			subTitles = element.querySelectorAll('.MsoSubtitle'),
		    headings = element.querySelectorAll('h1,h2,h3,h4,h5,h6'),
		    doc = element.ownerDocument;

		transformHeadings(doc, titles, 'h1');
		transformHeadings(doc, subTitles, 'h2');

		cleanHeadings(headings);
	}


	return {
		transform: transform
	};
});