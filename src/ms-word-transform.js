/* ms-word-transform.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */

define([
	'dom',
	'html',
	'arrays',
	'ms-word-transform-list',
	'ms-word-transform-heading',
	'ms-word-transform-table',
	'ms-word-transform-table-of-contents',
	'ms-word-transform-paragraph',
	'ms-word-transform-image',
	'ms-word-transform-utils'
], function (
	Dom,
	Html,
	Arrays,
	WordContentList,
	WordContentHeading,
	WordContentTable,
	WordContentTableOfContents,
	WordContentParagraph,
    WordContentImage,
    WordContentUtils
) {
	'use strict';

	/**
	 * This regular expression matchs the node names that contains no
	 * useful information.
	 *
	 * @const
	 * @type {RegExp}
	 */
	var UNUSEFUL_NODE_NAME_REG_EXP = /(xml|o:\w+|v:\w+)/i;

	/**
	 * Removes MS office elements that has not important information.
	 *
	 * @param {Element} element
	 */
	function removeUselessElements(element) {
		WordContentUtils.removeDescendants(element, function (child) {
			return child.nodeType === Dom.Nodes.COMMENT;
		});

		WordContentUtils.unwrapDescendants(element, function (child) {
			return UNUSEFUL_NODE_NAME_REG_EXP.test(child.nodeName);
		});
	}


	/**
	 * Removes whitespace that are not rendered.
	 *
	 * @param {Element} element
	 */
	function removeUnrenderedWhitespace(element) {
		WordContentUtils.removeDescendants(element, function (child) {
			return Html.isUnrenderedWhitespace(child);
		});
	}

	/**
	 * Transforms the string html into an Element.
	 *
	 * @param {string} html
	 * @return {Element}
	 */
	function htmlToDOM(html, doc) {
		var div = doc.createElement('div');
		div.innerHTML = html;
		return div;
	}

	/**
	 * Extract body content if the content is an HTML page. Otherwise
	 * it returns the content itself.
	 *
	 * @param {string} content
	 * @return {string} body
	 */
	function extractBodyContent(content) {
		var match,
		    matchEnd,
		    index,
		    lastIndex;

		content = content.replace(/\n/g, ' ');

		match = /<body.*?>/i.exec(content);
		matchEnd = /<\/body.*?>/i.exec(content);

		if (match && matchEnd) {
			index = content.indexOf(match[0]) + match[0].length;
			lastIndex = content.indexOf(matchEnd[0]);
			content = content.slice(index, lastIndex);
		}

		return content;
	}

	/**
	 * Fills empty blocks elements with a <br> tag.
	 *
	 * @param {Element} element
	 */
	function propEmptyBlockElements(element) {
		Arrays.coerce(element.querySelectorAll('p,li,h1,h2,h3,h4,h5,h6')).forEach(Html.prop);
	}

	/**
	 * Transforms the MS Office content to a string html.
	 *
	 * @param {!string} content
	 * @param {Document=} doc
	 *
	 * @return {string}
	 */
	function transform(content, doc) {
		var element;

		doc = doc || document;
		content = extractBodyContent(content);
		element = htmlToDOM(content, doc);

		removeUselessElements(element);

		WordContentImage.transform(element);
		WordContentTableOfContents.transform(element);
		WordContentList.transform(element);
		WordContentTable.transform(element);
		WordContentHeading.transform(element);
		WordContentParagraph.transform(element);

		removeUnrenderedWhitespace(element);
		propEmptyBlockElements(element);

		return element.innerHTML;
	}

	/**
	 * Checks if the 'content' contains MS Office syntax.
	 *
	 * @param {!string} content
	 * @param {Document=} doc
	 *
	 * @return {boolean}
	 */
	function isMSWordContent(content, doc) {
		doc = doc || document;
		return null !== htmlToDOM(content, doc).querySelector('[style*="mso-"], [class^="Mso"]');
	}


	return {
		transform: transform,
		isMSWordContent: isMSWordContent
	};
});
