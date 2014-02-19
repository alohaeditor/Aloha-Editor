/* transform/ms-word.js is part of Aloha Editor project http://aloha-editor.org
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
	'ms-word/tables',
	//'ms-word/toc',
	'./utils'
], function (
	Dom,
	Html,
	Arrays,
	Lists,
	Tables,
	//TOC,
	Utils
) {
	'use strict';

	/**
	 * Matches tags in the markup that are deemed superfluous: having no effect
	 * in the representation of the content.
	 *
	 * This will be used to strip tags like "<w:data>08D0C9EA7...</w:data>" but
	 * not "<o:p></o:p>"
	 *
	 * @private
	 * @const
	 * @type {RegExp}
	 */
	var SUPERFLUOUS_TAG = /xml|v\:\w+/i;

	/**
	 * Matches namespaced tags like "<o:p></o:p>".
	 *
	 * @private
	 * @const
	 * @type {RegExp}
	 */
	var NAMESPACED_NODENAME = /o\:(\w+)/i;

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
		    || SUPERFLUOUS_TAG.test(node.nodeName);
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
	 * Returns the the non-namespaced version of the given node's nodeName.
	 * If the node is not namespaced, will return null.
	 *
	 * @private
	 * @param  {Node} node
	 * @return {String}
	 */
	function namespacedNodeName(node) {
		var match = node.nodeName.match(NAMESPACED_NODENAME);
		return match ? match[1] : null;
	}

	/**
	 * Returns a clean copy of the given node.
	 *
	 * @private
	 * @param  {Node}     node
	 * @param  {Document} doc
	 * @return {Array.<Node>}
	 */
	function clean(node, doc) {
		if (isSuperfluous(node)) {
			return [];
		}
		if (Dom.isTextNode(node)) {
			return [Dom.clone(node)];
		}
		if (Dom.hasClass(node, 'MsoTitle')) {
			return [rewrap(node, 'h1', doc)];
		}
		if (Dom.hasClass(node, 'MsoSubtitle')) {
			return [rewrap(node, 'h2', doc)];
		}
		var nodeName = namespacedNodeName(node);
		if (nodeName) {
			return [rewrap(node, nodeName, doc)];
		}
		return [Dom.clone(node)];
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
		var fragment = Utils.normalize(raw, doc, clean) || raw;
		fragment = Lists.transform(fragment, doc);
		fragment = Tables.transform(fragment, doc);
		return Dom.children(fragment)[0].innerHTML;
	}

	return {
		transform       : transform,
		isMSWordContent : isMSWordContent
	};
});
