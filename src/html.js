/* html.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'cursors'
], function Html(
	dom,
	cursors
) {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('html');
	}

	/**
	 * White space characters as defined by HTML 4
	 * (http://www.w3.org/TR/html401/struct/text.html)
	 *
	 * @type {RegExp}
	 */
	var nonWhitespaceRx = /[^\r\n\t\f \u200B]/;

	var nonBlockDisplayValuesMap = {
		'inline'		: true,
		'inline-block'	: true,
		'inline-table'	: true,
		'none'			: true
	};

	/**
	 * A map of node tag names which are classified as block-level element.
	 *
	 * NB: "block-level" is not technically defined for elements that are new in
	 * HTML5.
	 *
	 * @type {Object}
	 */
	var BLOCK_LEVEL_ELEMENTS = {
		ADDRESS    : true,
		ARTICLE    : true, // HTML5
		ASIDE      : true, // HTML5
		AUDIO      : true, // HTML5
		BLOCKQUOTE : true,
		CANVAS     : true, // HTML5
		DD         : true,
		DIV        : true,
		DL         : true,
		FIELDSET   : true,
		FIGCAPTION : true,
		FIGURE     : true,
		FOOTER     : true,
		FORM       : true,
		H1         : true,
		H2         : true,
		H3         : true,
		H4         : true,
		H5         : true,
		H6         : true,
		HEADER     : true,
		HGROUP     : true,
		HR         : true,
		NOSCRIPT   : true,
		OL         : true,
		OUTPUT     : true,
		P          : true,
		PRE        : true,
		SECTION    : true, // HTML5
		TABLE      : true,
		TFOOT      : true,
		UL         : true,
		VIDEO      : true  // HTML5
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
	 * @param {DOMObject} node
	 * @return {Boolean}
	 *         True if the given node is rendered with block style.
	 */
	function hasBlockStyle(node) {
		if (!node) {
			return false;
		}
		switch (node.nodeType) {
		case dom.Nodes.DOCUMENT:
		case dom.Nodes.DOCUMENT_FRAGMENT:
			return true;
		case dom.Nodes.ELEMENT:
			return !nonBlockDisplayValuesMap[dom.getComputedStyle(node, 'display')];
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
	 * @param {DOMObject} node
	 * @return {Boolean}
	 *         True if the given node is rendered with inline style.
	 */
	function hasInlineStyle(node) {
		return !hasBlockStyle(node);
	}

	/**
	 * Similar to hasBlockStyle() except relies on the nodeName of the given
	 * node which works for attached as well as and detached nodes.
	 *
	 * @param {DOMObject} node
	 * @return {Boolean}
	 *         True if the given node is a block node type--regardless of how it
	 *         is rendered.
	 */
	function isBlockType(node) {
		return BLOCK_LEVEL_ELEMENTS[node.nodeName];
	}

	/**
	 * Similar to hasInlineStyle() in the same sense as isBlockType() is similar
	 * to hasBlockStyle()
	 *
	 * @param {DOMObject} node
	 * @return {Boolean}
	 *         True if the given node is an inline node type--regardless of how
	 *         it is rendered.
	 */
	function isInlineType(node) {
		return !isBlockType(node);
	}

	/**
	 * Checks whether the given node is content editable.  An editing host is a
	 * node that is either an Element with a contenteditable attribute set to
	 * the true state, or the Element child of a Document whose designMode is
	 * enabled.
	 *
	 * The check for design mode was removed because we only care about
	 * contenteditable in Aloha.
	 *
	 * @param {DOMObject} node
	 * @return {Boolean}
	 *         True if `node` is content editable.
	 */
	function isEditingHost(node) {
		return 1 === node.nodeType && 'true' === node.contentEditable;
	}

	/**
	 * Checks whether the given string represents a whitespace preservation
	 * style property.
	 *
	 * @param {String} string
	 * @return {Boolean}
	 */
	function isWhiteSpacePreserveStyle(cssWhiteSpaceValue) {
		return (cssWhiteSpaceValue === 'pre'
				|| cssWhiteSpaceValue === 'pre-wrap'
				|| cssWhiteSpaceValue === '-moz-pre-wrap');
	}

	/**
	 * Returns true if the given node is unrendered whitespace, with the caveat
	 * that it only examines the given node and not any siblings.  An additional
	 * check is necessary to determine whether the node occurs after/before a
	 * linebreaking node.
	 *
	 * Taken from
	 * http://code.google.com/p/rangy/source/browse/trunk/src/js/modules/rangy-cssclassapplier.js
	 * under the MIT license.
	 *
	 * @param {DOMObject} node
	 * @return {Boolean}
	 */
	function isUnrenderedWhitespaceNoBlockCheck(node) {
		if (3 !== node.nodeType) {
			return false;
		}
		if (!node.length) {
			return true;
		}
		if (nonWhitespaceRx.test(node.nodeValue)) {
			return false;
		}
        var cssWhiteSpace = dom.getComputedStyle(node.parentNode, 'white-space');
		if (isWhiteSpacePreserveStyle(cssWhiteSpace)) {
			return false;
		}
		if ('pre-line' === cssWhiteSpace) {
            if (/[\r\n]/.test(node.data)) {
                return false;
            }
        }
		return true;
	}

	/**
	 * Empty inline elements are unrendered, with the exception of img
	 * and br elements. Idea from engine.js.
	 */
	function isRenderedEmptyInlineNode(node) {
		return 'IMG' === node.nodeName || 'BR' === node.nodeName;
	}

	/**
	 * Returns true for nodes that introduce linebreaks.
	 */
	function isLinebreakingNode(node) {
		return 'BR' === node.nodeName || hasBlockStyle(node);
	}

	/**
	 * Returns true if the node at point is unrendered, with the caveat that it
	 * only examines the node at point and not any siblings.  An additional
	 * check is necessary to determine whether the whitespace occurrs
	 * after/before a linebreaking node.
	 */
	function isUnrenderedAtPoint(point) {
		return (isUnrenderedWhitespaceNoBlockCheck(point.node)
				|| (1 === point.node.nodeType
					&& hasInlineStyle(point.node)
					&& !isRenderedEmptyInlineNode(point.node)));
	}

	/**
	 * Tries to move the given point to the end of the line, stopping to the
	 * left of a br or block node, ignoring any unrendered nodes. Returns true
	 * if the point was successfully moved to the end of the line, false if some
	 * rendered content was encountered on the way. point will not be mutated
	 * unless true is returned.
	 *
	 * @param {Cursor} point
	 * @return {Boolean}
	 *         True if the cursor is moved.
	 */
	function skipUnrenderedToEndOfLine(point) {
		var cursor = point.clone();
		cursor.nextWhile(isUnrenderedAtPoint);
		if (!isLinebreakingNode(cursor.node)) {
			return false;
		}
		point.setFrom(cursor);
		return true;
	}

	/**
	 * Tries to move the given point to the start of the line, stopping to the
	 * right of a br or block node, ignoring any unrendered nodes. Returns true
	 * if the point was successfully moved to the start of the line, false if
	 * some rendered content was encountered on the way. point will not be
	 * mutated unless true is returned.
	 *
	 * @param {Cursor} point
	 * @return {Boolean}
	 *         True if the cursor is moved.
	 */
	function skipUnrenderedToStartOfLine(point) {
		var cursor = point.clone();
		cursor.prev();
		cursor.prevWhile(isUnrenderedAtPoint);
		if (!isLinebreakingNode(cursor.node)) {
			return false;
		}
		var isBr = ('BR' === cursor.node.nodeName);
		cursor.next(); // after/out of the linebreaking node
		// Because point may be to the right of a br at the end of a
		// block, in which case the line starts before the br.
		if (isBr) {
			var endOfBlock = point.clone();
			if (skipUnrenderedToEndOfLine(endOfBlock) && endOfBlock.atEnd) {
				cursor.skipPrev(); // before the br
				cursor.prevWhile(isUnrenderedAtPoint);
				if (!isLinebreakingNode(cursor.node)) {
					return false;
				}
				cursor.next(); // after/out of the linebreaking node
			}
		}
		point.setFrom(cursor);
		return true;
	}

	/**
	 * Tries to move the given boundary to the start of line, skipping over any
	 * unrendered nodes, or if that fails to the end of line (after a br element
	 * if present), and for the last line in a block, to the very end of the
	 * block.
	 *
	 * If the selection is inside a block with only a single empty line (empty
	 * except for unrendered nodes), and both boundary points are normalized,
	 * the selection will be collapsed to the start of the block.
	 *
	 * For some operations it's useful to think of a block as a number of lines,
	 * each including its respective br and any preceding and following
	 * unrendered whitespace.
	 *
	 * @param {Cursor} point
	 * @return {Boolean}
	 *         True if the cursor is moved.
	 */
	function normalizeBoundary(point) {
		if (skipUnrenderedToStartOfLine(point)) {
			return true;
		}
		if (!skipUnrenderedToEndOfLine(point)) {
			return false;
		}
		if ('BR' === point.node.nodeName) {
			point.skipNext();
			// Because, if this is the last line in a block, any unrendered
			// whitespace after the last br will not constitute an independent
			// line, and as such we must include it in the last line.
			var endOfBlock = point.clone();
			if (skipUnrenderedToEndOfLine(endOfBlock) && endOfBlock.atEnd) {
				point.setFrom(endOfBlock);
			}
		}
		return true;
	}

	/**
	 * Returns true if the given node is unrendered whitespace.
	 *
	 * @param {DOMObject} node
	 * @return {Boolean}
	 */
	function isUnrenderedWhitespace(node) {
		if (!isUnrenderedWhitespaceNoBlockCheck(node)) {
			return false;
		}
		return (
			skipUnrenderedToEndOfLine(cursors.cursor(node, false))
			||
			skipUnrenderedToStartOfLine(cursors.cursor(node, false))
		);
	}

	/**
	 * Checks whether the given DOM element is rendered empty or not.
	 *
	 * @param {DOMObject} elem
	 * @return {Boolean}
	 */
	function isEmpty(elem) {
		var child = elem.firstChild;
		while (child) {
			if (!isUnrenderedWhitespace(child)
					&& (1 === child.nodeType || 3 === child.nodeType)) {
				return true;
			}
			child = child.nextSibling;
		}
		return true;
	}

	/**
	 * TODO currently this function only knows about 'background-color' not
	 * being inherited, while 'color', 'font-size', 'font-family' are inherited.
	 * Any other relevant styles should be added when needed.
	 *
	 * @param {String} styleName
	 * @return {Boolean}
	 */
	function isStyleInherited(styleName) {
		return 'background-color' !== styleName;
	}

	/**
	 * Returns true if the given character is a control character. Control
	 * characters are usually not rendered if they are inserted into the DOM.
	 * Returns false for whitespace 0x20 (which may or may not be rendered see
	 * isUnrenderedWhitespace()) and non-breaking whitespace 0xa0 but returns
	 * true for tab 0x09 and linebreak 0x0a and 0x0d.
	 *
	 * @param {String} chr
	 * @return {Boolean}
	 */
	function isControlCharacter(chr) {
		// Regex matches C0 and C1 control codes, which seems to be good enough.
		// "The C0 set defines codes in the range 00HEX–1FHEX and the C1
		// set defines codes in the range 80HEX–9FHEX."
		// In addition, we include \x007f which is "delete", which just
		// seems like a good idea.
		// http://en.wikipedia.org/wiki/List_of_Unicode_characters
		// http://en.wikipedia.org/wiki/C0_and_C1_control_codes
		return (/[\x00-\x1f\x7f-\x9f]/).test(chr);
	}

	/**
	 * Functions for working with HTML content.
	 */
	var exports = {
		isControlCharacter: isControlCharacter,
		isStyleInherited: isStyleInherited,
		isBlockType: isBlockType,
		isInlineType: isInlineType,
		hasBlockStyle: hasBlockStyle,
		hasInlineStyle: hasInlineStyle,
		isUnrenderedWhitespace: isUnrenderedWhitespace,
		isWhiteSpacePreserveStyle: isWhiteSpacePreserveStyle,
		skipUnrenderedToStartOfLine: skipUnrenderedToStartOfLine,
		skipUnrenderedToEndOfLine: skipUnrenderedToEndOfLine,
		normalizeBoundary: normalizeBoundary,
		isEmpty: isEmpty,
		isEditingHost: isEditingHost
	};

	return exports;
});
