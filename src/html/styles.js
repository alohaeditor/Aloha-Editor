/**
 * html/styles.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom/nodes',
	'dom/style',
	'predicates'
], function HtmlStyles(
	Nodes,
	Style,
	Predicates
) {
	'use strict';

	/**
	 * Tags representing non-block-level elements which are nevertheless line
	 * breaking.
	 *
	 * @private
	 * @type {Object.<string, boolean>}
	 */
	var LINE_BREAKING_VOID_ELEMENTS = {
		'BR'  : true,
		'HR'  : true,
		'IMG' : true
	};

	/**
	 * Tags representing list item elements.
	 *
	 * @private
	 * @type {Object.<string, boolean>}
	 */
	var LIST_ITEMS = {
		'LI' : true,
		'DT' : true,
		'DD' : true
	};

	/**
	 * Map of CSS values for the display property that would cause an element
	 * to be rendered with inline style.
	 *
	 * @private
	 * @type {Object.<string, boolean>}
	 */
	var nonBlockDisplayValuesMap = {
		'inline'       : true,
		'inline-block' : true,
		'inline-table' : true,
		'none'         : true
	};

	/**
	 * Checks whether the given node is rendered with block style.
	 *
	 * A block node is either an Element whose "display" property does not have
	 * resolved value "inline" or "inline-block" or "inline-table" or "none", or
	 * a Document, or a DocumentFragment.
	 *
	 * Note that this function depends on style inheritance which only works if
	 * the given node is attached to the document.
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function hasBlockStyle(node) {
		if (!node) {
			return false;
		}
		switch (node.nodeType) {
		case Nodes.Nodes.DOCUMENT:
		case Nodes.Nodes.DOCUMENT_FRAGMENT:
			return true;
		case Nodes.Nodes.ELEMENT:
			var style = Style.getComputedStyle(node, 'display');
			return style ? !nonBlockDisplayValuesMap[style] : Predicates.isBlockNode(node);
		default:
			return false;
		}
	}

	/**
	 * Checks whether the given node is rendered with inline style.
	 *
	 * An inline node is a node that is not a block node.
	 *
	 * Note that this function depends on style inheritance which only works if
	 * the given node is attached to the document.
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function hasInlineStyle(node) {
		return !hasBlockStyle(node);
	}

	/**
	 * Returns true for nodes that introduce linebreaks.
	 *
	 * Unlike hasBlockStyle...
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function hasLinebreakingStyle(node) {
		return LINE_BREAKING_VOID_ELEMENTS[node.nodeName]
		    || LIST_ITEMS[node.nodeName]
		    || hasBlockStyle(node);
	}

	/**
	 * Checks whether the given string represents a whitespace preservation
	 * style property.
	 *
	 * @param  {string} string
	 * @return {boolean}
	 */
	function isWhiteSpacePreserveStyle(cssWhiteSpaceValue) {
		return cssWhiteSpaceValue === 'pre'
		    || cssWhiteSpaceValue === 'pre-wrap'
		    || cssWhiteSpaceValue === '-moz-pre-wrap';
	}

	/**
	 * A map of style properties that are not inheritable.
	 *
	 * TODO This list is incomplete but should look something like
	 * http://www.w3.org/TR/CSS21/propidx.html
	 *
	 * @type <string, boolean>
	 */
	var notInheritedStyles = {
		'background-color': true,
		'underline': true
	};

	/**
	 * Checks whether the given style name is among those that are not
	 * inheritable.
	 *
	 * TODO complete the list of inherited/notInheritedStyles
	 *
	 * @param  {String} styleName
	 * @return {boolean}
	 */
	function isStyleInherited(styleName) {
		return !notInheritedStyles[styleName];
	}

	return {
		isStyleInherited          : isStyleInherited,
		isWhiteSpacePreserveStyle : isWhiteSpacePreserveStyle,
		hasBlockStyle             : hasBlockStyle,
		hasInlineStyle            : hasInlineStyle,
		hasLinebreakingStyle      : hasLinebreakingStyle,
	};
});
