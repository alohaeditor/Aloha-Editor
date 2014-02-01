/* transform/ms-word-transform.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * Refernces:
 * CF_HTML:
 * http://msdn.microsoft.com/en-us/library/windows/desktop/ms649015(v=vs.85).aspx
 */
define([
	'dom',
	'html',
	'arrays',
	'ms-word/lists',
	/*
	'ms-word/tables',
	'ms-word/toc',
	*/
	'utils'
], function (
	Dom,
	Html,
	Arrays,
	Lists,
	/*
	Tables,
	TOC,
	*/
	Utils
) {
	'use strict';

	/**
	 * Matches tags in the markup that are deemed superfluous: having no effect
	 * in the representation of the content.
	 *
	 * This will be used to strip tags like "<w:data>08D0C9EA7...</w:data>" and
	 * "<o:p></o:p>"
	 *
	 * @private
	 * @const
	 * @type {RegExp}
	 */
	var SUPERFLUOUS_TAG = /(xml|o:\w+|v:\w+)/i;

	/**
	 * Checks whether the given node is considered superfluous (has not affect
	 * to the visual presentation of the content).
	 *
	 * @private
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function isSuperfluous(node) {
		return node.nodeType === Dom.Nodes.COMMENT
		    && SUPERFLUOUS_TAG.test(node.nodeName);
	}

	/**
	 * Creates a rewrapped copy of `element`.  Will create a an element based
	 * on `nodeName`, and copies the content of the given element into it.
	 *
	 * @private
	 * @param  {Element}  element
	 * @param  {String}   nodeName
	 * @param  {Document} doc
	 * @return {Element}
	 */
	function rewrap(element, nodeName, doc) {
		var node = doc.createElement(nodeName);
		Dom.copy(Dom.children(element), node);
		return node;
	}

	/**
	 * Cleans the given node.
	 *
	 * @param  {Node}     node
	 * @param  {Document} doc
	 * @return {Node} A copy of `node`
	 */
	function clean(node, doc) {
		if (isSuperfluous(node)) {
			return null;
		}
		if (Dom.isTextNode(node)) {
			return Dom.clone(node);
		}
		if (Dom.hasClass(node, 'MsoTitle')) {
			return rewrap(node, 'h1', doc);
		}
		if (Dom.hasClass(node, 'MsoSubtitle')) {
			return rewrap(node, 'h2', doc);
		}
		return Dom.clone(node);
	}

	/**
	 * Checks if the given markup originates from MS Office.
	 *
	 * TODO: use <meta name="Generator" content="WORD|OPENOFFICE|ETC">
	 *       this is more formally correct
	 *
	 * @param  {string}   markup
	 * @param  {Document} doc
	 * @return {boolean}
	 */
	function isMSWordContent(markup, doc) {
		var element = Html.parse(markup, doc);
		return null !== element.querySelector('[style*="mso-"],[class^="Mso"]');
	}

	/**
	 * Transforms markup to normalized HTML.
	 *
	 * @param  {string}   markup
	 * @param  {Document} doc
	 * @return {string}
	 */
	function transform(markup, doc) {
		var raw = Html.parse(Utils.extract(markup), doc);
		var cleaned = Utils.normalize(raw, doc, clean) || raw;
		cleaned = Lists.transform(cleaned, doc);
		return cleaned.innerHTML;
	}

	return {
		clean           : clean,
		transform       : transform,
		isMSWordContent : isMSWordContent
	};
});
