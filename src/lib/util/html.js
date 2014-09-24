/* html.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 *
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
 */
define([
	'jquery',
	'util/dom',
	'util/maps',
	'util/arrays'
], function (
	jQuery,
	Dom,
	Maps,
	Arrays
) {
	'use strict';

	var inlineFormattableMap = {
		'A': true,
		'B': true,
		'EM': true,
		'FONT': true,
		'I': true,
		'S': true,
		'SPAN': true,
		'STRIKE': true,
		'STRONG': true,
		'SUB': true,
		'SUP': true,
		'U': true
	};

	// NB: "block-level" is not technically defined for elements that are new in
	// HTML5.
	var BLOCKLEVEL_ELEMENTS = [
		'address',
		'article',    // HTML5
		'aside',      // HTML5
		'audio',      // HTML5
		'blockquote',
		'canvas',     // HTML5
		'dd',
		'div',
		'dl',
		'fieldset',
		'figcaption',
		'figure',
		'footer',
		'form',
		'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
		'header',
		'hgroup',
		'hr',
		'noscript',
		'ol',
		'output',
		'p',
		'pre',
		'section',   // HTML5
		'table',
		'tfoot',
		'ul',
		'video'      // HTML5
	];

	/**
	 * Void elements are elements which are not permitted to contain content.
	 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element
	 *
	 * @type {Object}
	 */
	var VOID_ELEMENTS = [
		'area',
		'base',
		'br',
		'col',
		'command',
		'embed',
		'hr',
		'img',
		'input',
		'keygen',
		'link',
		'meta',
		'param',
		'source',
		'track',
		'wbr'
	];

	/**
	 * Text-level semantic and edit elements to be remove during
	 * copying or pasting.
	 *
	 * See:
	 * http://dev.w3.org/html5/spec/text-level-semantics.html#usage-summary
	 *
	 * Configurable.
	 *
	 * @type {Array.<string>}
	 */
	var TEXT_LEVEL_SEMANTIC_ELEMENTS = [
		'a',
		'abbr',
		'b',
		'bdi',
		'bdo',
		'cite',
		'code',
		'del',
		'dfn',
		'em',
		'i',
		'ins',
		'kbd',
		'mark',
		'q',
		'rp',
		'rt',
		'ruby',
		's',
		'samp',
		'small',
		'strong',
		'sub',
		'sup',
		'time',
		'u',
		'var'
	];

	/**
	 * Unicode zero width space characters:
	 * http://www.unicode.org/Public/UNIDATA/Scripts.txt
	 *
	 * @const
	 * @type {Array.<string>}
	 */
	var ZERO_WIDTH_CHARACTERS = [
		'\\u200B', // ZWSP
		'\\u200C',
		'\\u200D',
		'\\uFEFF'  // ZERO WIDTH NO-BREAK SPACE
	];

	/**
	 * Unicode White_Space characters are those that have the Unicode property
	 * "White_Space" in the Unicode PropList.txt data file.
	 *
	 * http://www.unicode.org/Public/UNIDATA/PropList.txt
	 *
	 * @const
	 * @type {Array.<string>}
	 */
	var WHITE_SPACE_CHARACTERS_UNICODES = [
		'\\u0009',
		'\\u000A',
		'\\u000B',
		'\\u000C',
		'\\u000D',
		'\\u0020',
		'\\u0085',
		'\\u00A0', // NON BREAKING SPACE ("&nbsp;")
		'\\u1680',
		'\\u180E',
		'\\u2000',
		'\\u2001',
		'\\u2002',
		'\\u2003',
		'\\u2004',
		'\\u2005',
		'\\u2006',
		'\\u2007',
		'\\u2008',
		'\\u2009',
		'\\u200A',
		'\\u2028',
		'\\u2029',
		'\\u202F',
		'\\u205F',
		'\\u3000'
	];

	var wspChars = WHITE_SPACE_CHARACTERS_UNICODES.join('');

	/**
	 * Regular expression that checks whether a string consists only of one or
	 * more white space characters.
	 *
	 * @type {RegExp}
	 */
	var WSP_CHARACTERS = new RegExp('^[' + wspChars + ']+$');
	var WSP_CHARACTERS_LEFT = new RegExp('^[' + wspChars + ']+');
	var WSP_CHARACTERS_RIGHT = new RegExp('[' + wspChars + ']+$');

	/**
	 * Regular expression that matches one or more sequences of zero width
	 * characters.
	 *
	 * @type {RegExp}
	 */
	var ZWSP_CHARACTERS = new RegExp('[' + ZERO_WIDTH_CHARACTERS.join('') + ']+');
	var ZWSP_CHARACTERS_LEFT = new RegExp('^[' + ZERO_WIDTH_CHARACTERS.join('') + ']+');
	var ZWSP_CHARACTERS_RIGHT = new RegExp('[' + ZERO_WIDTH_CHARACTERS.join('') + ']+$');

	function isWSPorZWSPText(text) {
		return WSP_CHARACTERS.test(text) || ZWSP_CHARACTERS.test(text);
	}

	function isWSPorZWSPNode(node) {
		return 3 === node.nodeType && isWSPorZWSPText(node.data);
	}

	/**
	 * Checks is `elem` has only White Spaces chilren.
	 * @paran {Element} elem
	 */
	function hasOnlyWhiteSpaceChildren(elem) {
		var children = elem.childNodes;
		var i, len;
		for (i = 0, len = children.length; i < len; i++) {
			if (!isWSPorZWSPNode(children[i])) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Map containing lowercase and uppercase tagnames of block element as keys
	 * mapped against true.
	 *
	 * @type {object<string, boolean>}
	 */
	var blocksTagnameMap = {};
	Maps.fillKeys(blocksTagnameMap, BLOCKLEVEL_ELEMENTS, true);
	Maps.fillKeys(
		blocksTagnameMap,
		Arrays.map(BLOCKLEVEL_ELEMENTS, function (str) {
			return str.toUpperCase();
		}),
		true
	);

	function isBlock(node) {
		return blocksTagnameMap[node.nodeName];
	}

	function isIgnorableWhitespace(node) {
		return 3 === node.nodeType && !node.length;
	}

	function isInlineFormattable(node) {
		return inlineFormattableMap[node.nodeName];
	}

	/**
	 * Checks whether the given element is a block that contains a "propping"
	 * <br> element.
	 *
	 * A propping <br> is one which is inserted into block element to ensure
	 * that the otherwise empty element will be rendered visibly.
	 *
	 * @param {HTMLElement} node
	 * @return {boolean} True if node contains a propping <br>
	 */
	function isProppedBlock(node) {
		if (!blocksTagnameMap[node.nodeName]) {
			return false;
		}
		var found = false;
		var kids = node.children;
		var len = kids.length;
		var i;
		for (i = 0; i < len; i++) {
			if (!found && 'br' === kids[i].nodeName.toLowerCase()) {
				found = true;
			} else if (!isIgnorableWhitespace(kids[i])) {
				return false;
			}
		}
		return found;
	}

	function isEditingHost(node) {
		return 1 === node.nodeType && "true" === node.contentEditable;
	}

	/**
	 * Starting from the given node, and working backwards through the siblings,
	 * find the node that satisfies the given condition.
	 *
	 * @param {HTMLElement} node The node at which to start the search.
	 * @param {function(HTMLElement):boolean} condition A predicate the receives
	 *                                        one of children of `node`.
	 *
	 * @return {HTMLElement} The first node that meets the given condition.
	 */
	function findNodeRight(node, condition) {
		while (node && !condition(node)) {
			node = node.previousSibling;
		}
		return node;
	}

	function findNodeLeft(node, condition) {
		while (node && !condition(node)) {
			node = node.nextSibling;
		}
		return node;
	}

	/**
	 * Checks if the given editable is a valid container for paragraphs.
	 *
	 * @param {Aloha.Editable} editable The editable to be checked
	 *
	 * @return {boolean} False if the editable may not contain paragraphs
	 */
	function allowNestedParagraph(editable) {
		if (editable.obj[0] && Dom.allowsNesting(editable.obj[0], jQuery("<p>")[0])) {
			return true;
		}
		return false;
	}

	/**
	 * Removes a strange characters from at the beginning and end of the string
	 * 
	 * @param {String} str A string to be trimmed
	 * 
	 * @return {String}
	 */
	function trimWhitespaceCharacters(str) {
		return str
			.replace(WSP_CHARACTERS_LEFT, '')
			.replace(WSP_CHARACTERS_RIGHT, '')
			.replace(ZWSP_CHARACTERS_LEFT, '')
			.replace(ZWSP_CHARACTERS_RIGHT, '');
	}

	/**
	 * Checks if `node` is unrendered.
	 * @param {Node} node Node to be checked
	 * @return {boolean} true if `node` is unrendered, false otherwise.
	 */
	function isUnrenderedNode(node) {
		if (3 === node.nodeType && 0 === node.data.length) {
			return true;
		}
		if ((node === node.parentNode.lastChild)
				&& isBlock(node.parentNode)
					&& 'BR' === node.nodeName) {
			return true;
		}
		return isWSPorZWSPNode(node);
	}

	/**
	 * Checks if `node` is rendered.
	 * @param {Node} node Node to be checked
	 * @return {boolean} true if `node` is rendered, false otherwise.
	 */
	function isRenderedNode(node) {
		return !isUnrenderedNode(node);
	}
	return {
		BLOCKLEVEL_ELEMENTS: BLOCKLEVEL_ELEMENTS,
		VOID_ELEMENTS: VOID_ELEMENTS,
		TEXT_LEVEL_SEMANTIC_ELEMENTS: TEXT_LEVEL_SEMANTIC_ELEMENTS,
		isBlock: isBlock,
		isIgnorableWhitespace: isIgnorableWhitespace,
		isInlineFormattable: isInlineFormattable,
		isProppedBlock: isProppedBlock,
		isEditingHost: isEditingHost,
		findNodeLeft: findNodeLeft,
		findNodeRight: findNodeRight,
		allowNestedParagraph: allowNestedParagraph,
		trimWhitespaceCharacters: trimWhitespaceCharacters,
		isWSPorZWSPNode: isWSPorZWSPNode,
		isWSPorZWSPText: isWSPorZWSPText,
		isUnrenderedNode: isUnrenderedNode,
		isRenderedNode: isRenderedNode,
		hasOnlyWhiteSpaceChildren: hasOnlyWhiteSpaceChildren
	};
});
