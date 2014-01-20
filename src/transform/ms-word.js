/* transform/ms-word-transform.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'html',
	'arrays',
	'ms-word/lists',
	'ms-word/headings',
	'ms-word/tables',
	'ms-word/toc',
	'ms-word/paragraphs',
	'ms-word/images',
	'ms-word/utils',
	'paste-utils'
], function (
	Dom,
	Html,
	Arrays,
	Lists,
	Headings,
	Tables,
	TOC,
	Paragraphs,
	Images,
	Utils,
	PasteUtils
) {
	'use strict';

	/**
	 * Matches tag in the markup that are deemed superfluous: having no effect
	 * in the representation of the content.
	 *
	 * @const
	 * @type {RegExp}
	 */
	var SUPERFLUOUS_TAG = /(xml|o:\w+|v:\w+)/i;

	/**
	 * Removes superfluous MS office child nodes in the given element.
	 *
	 * @param {Element} element
	 */
	function removeSuperfluousElements(element) {
		Utils.removeDescendants(element, function (child) {
			return child.nodeType === Dom.Nodes.COMMENT;
		});
		Utils.unwrapDescendants(element, function (child) {
			return SUPERFLUOUS_TAG.test(child.nodeName);
		});
	}

	/**
	 * Removes unrendered whitespaces.
	 *
	 * @param {Element} element
	 */
	function removeUnrenderedWhitespace(element) {
		Utils.removeDescendants(element, Html.isUnrenderedWhitespace);
	}

	/**
	 * Transforms the given markup string into into a detached DOM tree inside
	 * fo a div.
	 *
	 * @param  {string} html
	 * @return {Element}
	 */
	function htmlToDOM(html, doc) {
		var div = doc.createElement('div');
		div.innerHTML = html;
		return div;
	}

	/**
	 * Fills empty blocks elements with a <br> tag.
	 *
	 * @param {Element} element
	 */
	function propEmptyBlockElements(element) {
		Arrays.coerce(element.querySelectorAll('p,li,h1,h2,h3,h4,h5,h6'))
		      .forEach(Html.prop);
	}

	/**
	 * Transforms markup from MS Office into normalized HTML.
	 *
	 * @param  {string}   markup
	 * @param  {Document} doc
	 * @return {string}
	 */
	function transform(markup, doc) {
		var element = htmlToDOM(PasteUtils.extractBodyContent(markup), doc);

		removeSuperfluousElements(element);

		Images.transform(element);
		TOC.transform(element);
		Lists.transform(element);
		Tables.transform(element);
		Headings.transform(element);
		Paragraphs.transform(element);

		removeUnrenderedWhitespace(element);
		propEmptyBlockElements(element);

		return element.innerHTML;
	}

	/**
	 * Checks if the given markup originates from MS Office.
	 *
	 * @param {string}   markup
	 * @param {Document} doc
	 *
	 * @return {boolean}
	 */
	function isMSWordContent(markup, doc) {
		return null !== htmlToDOM(markup, doc).querySelector('[style*="mso-"], [class^="Mso"]');
	}

	return {
		transform       : transform,
		isMSWordContent : isMSWordContent
	};
});
