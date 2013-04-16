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
	'util/dom2',
	'util/maps',
	'util/arrays'
], function (
	Dom,
	Maps,
	Arrays
) {
	'use strict';

	// White space characters as defined by HTML 4 (http://www.w3.org/TR/html401/struct/text.html)
	var nonWhitespaceRx = /[^\r\n\t\f \u200B]/;

	var nonBlockDisplayValuesMap = {
		"inline": true,
		"inline-block": true,
		"inline-table": true,
		"none": true
	};

	var blockTypeNodes = {
		'P': true,
		'H1': true,
		'H2': true,
		'H3': true,
		'H4': true,
		'H5': true,
		'H6': true,
		'OL': true,
		'UL': true,
		'PRE': true,
		'ADDRESS': true,
		'BLOCKQUOTE': true,
		'DL': true,
		'DIV': true,
		'fieldset': true,
		'FORM': true,
		'HR': true,
		'NOSCRIPT': true,
		'TABLE': true
	};

	/**
	 * From engine.js
	 * "A block node is either an Element whose "display" property does not have
	 * resolved value "inline" or "inline-block" or "inline-table" or "none", or a
	 * Document, or a DocumentFragment."
	 * Note that this function depends on style inheritance which only
	 * works if the given node is attached to the document.
	 */
	function hasBlockStyle(node) {
		return node && ((node.nodeType == 1 && !nonBlockDisplayValuesMap[Dom.getComputedStyle(node, 'display')])
						|| node.nodeType == 9
						|| node.nodeType == 11);
	}

	/**
	 * From engine.js:
	 * "An inline node is a node that is not a block node."
	 * Note that this function depends on style inheritance which only
	 * works if the given node is attached to the document.
	 */
	function hasInlineStyle(node) {
		return !hasBlockStyle(node);
	}

	/**
	 * From engine.js:
	 * "An editing host is a node that is either an Element with a contenteditable
	 * attribute set to the true state, or the Element child of a Document whose
	 * designMode is enabled."
	 * The check for design mode was removed because we only care about
	 * contenteditable in Aloha.
	 */
	function isEditingHost(node) {
		return 1 === node.nodeType && "true" === node.contentEditable;
	}

	/**
	 * Similar to hasBlockStyle() except relies on the nodeName of the
	 * given node which works for attached as well as and detached
	 * nodes.
	 */
	function isBlockType(node) {
		return blockTypeNodes[node.nodeName];
	}

	/**
	 * isInlineType() is similar to hasInlineStyle()
	 * in the same sense as
	 * isBlockType() is similar to hasBlockStyle()
	 */
	function isInlineType(node) {
		return !isBlockType(node);
	}

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

	// Taken from
	// http://code.google.com/p/rangy/source/browse/trunk/src/js/modules/rangy-cssclassapplier.js
	// under the MIT license.
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
        var cssWhiteSpace = Dom.getComputedStyle(node.parentNode, "whiteSpace");
        switch (cssWhiteSpace) {
		case "pre":
        case "pre-wrap":
        case "-moz-pre-wrap":
            return false;
        case "pre-line":
            if (/[\r\n]/.test(node.data)) {
                return false;
            }
			break;
        }
		return true;
	}

	function isVisibleEmptyInlineNode(node) {
		// Because IMG and BR are the only inline nodes that can be
		// visible even when they're empty. Idea from engine.js.
		return 'IMG' === node.nodeName || 'BR' === node.nodeName;
	}

	function isLinebreakingNode(node) {
		return 'BR' === node.nodeName || hasBlockStyle(node);
	}

	function isUnrenderedAtPoint(point) {
		return (isUnrenderedWhitespaceNoBlockCheck(point.node)
				|| (1 === point.node.nodeType
					&& hasInlineStyle(point.node)
					&& !isVisibleEmptyInlineNode(point.node)));
	}

	function skipUnrenderedToEndOfLine(point) {
		var cursor = point.clone();
		cursor.nextWhile(isUnrenderedAtPoint);
		if (isLinebreakingNode(cursor.node)) {
			point.setFrom(cursor);
			return true;
		}
		return false;
	}

	function skipUnrenderedToStartOfLine(point) {
		var cursor = point.clone();
		cursor.prev();
		cursor.prevWhile(isUnrenderedAtPoint);
		if (isLinebreakingNode(cursor.node)) {
			cursor.next();
			point.setFrom(cursor);
			return true;
		}
		return false;
	}

	/**
	 * Tries to move the given boundary to the start of line, skipping
	 * over any unrendered nodes, or if that fails to the end of line
	 * after the br element (if present), and for the last line in a
	 * block, to the very end of the block.
	 *
	 * If the selection is inside a block with only a single empty line
	 * (empty except for unrendered nodes), and both boundary points are
	 * normalized, the selection will be collapsed to the start of the
	 * block.
	 *
	 * For some operations it's useful to think of a block as a number
	 * of lines, each including its respective br and any preceding and
	 * following unrendered whitespace.
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
			// Because, if this is the last line in a block, any
			// unrendered whitespace after the last br will not
			// constitute an independent line, and as such we must
			// include it in the last line.
			var endOfBlock = point.clone();
			if (skipUnrenderedToEndOfLine(endOfBlock) && endOfBlock.atEnd) {
				point.setFrom(endOfBlock);
			}
		}
		return true;
	}

	function isUnrenderedWhitespace(node) {
		if (!isUnrenderedWhitespaceNoBlockCheck(node)) {
			return false;
		}
		// Algorithm like engine.js isCollapsedWhitespaceNode().
		return skipUnrenderedToEndOfLine(Dom.cursor(node, false)) || skipUnrenderedToStartOfLine(Dom.cursor(node, false));
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

	// TODO currently this function only knows about 'background-color'
	// not being inherited, while 'color', 'font-size', 'font-family'
	// are inherited. Any other relevant styles should be added when
	// needed.
	function isStyleInherited(styleName) {
		return 'background-color' !== styleName;
	}

	return {
		isStyleInherited: isStyleInherited,
		BLOCKLEVEL_ELEMENTS: BLOCKLEVEL_ELEMENTS,
		isBlockType: isBlockType,
		isInlineType: isInlineType,
		hasBlockStyle: hasBlockStyle,
		hasInlineStyle: hasInlineStyle,
		isBlock: isBlock,
		isUnrenderedWhitespace: isUnrenderedWhitespace,
		skipUnrenderedToStartOfLine: skipUnrenderedToStartOfLine,
		skipUnrenderedToEndOfLine: skipUnrenderedToEndOfLine,
		normalizeBoundary: normalizeBoundary,
		isIgnorableWhitespace: isIgnorableWhitespace,
		isEmpty: isEmpty,
		isProppedBlock: isProppedBlock,
		isEditingHost: isEditingHost,
		findNodeRight: findNodeRight
	};
});
