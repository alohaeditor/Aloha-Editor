/* html.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * @reference
 * https://en.wikipedia.org/wiki/HTML_element#Content_vs._presentation
 */
define([
	'dom',
	'arrays',
	'cursors',
	'content',
	'traversing',
	'functions'
], function Html(
	dom,
	arrays,
	cursors,
	content,
	traversing,
	fn
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
		'inline'       : true,
		'inline-block' : true,
		'inline-table' : true,
		'none'         : true
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
		'ADDRESS'    : true,
		'ARTICLE'    : true, // HTML5
		'ASIDE'      : true, // HTML5
		'AUDIO'      : true, // HTML5
		'BLOCKQUOTE' : true,
		'CANVAS'     : true, // HTML5
		'DD'         : true,
		'DIV'        : true,
		'DL'         : true,
		'FIELDSET'   : true,
		'FIGCAPTION' : true,
		'FIGURE'     : true,
		'FOOTER'     : true,
		'FORM'       : true,
		'H1'         : true,
		'H2'         : true,
		'H3'         : true,
		'H4'         : true,
		'H5'         : true,
		'H6'         : true,
		'HEADER'     : true,
		'HGROUP'     : true,
		'HR'         : true,
		'NOSCRIPT'   : true,
		'OL'         : true,
		'OUTPUT'     : true,
		'P'          : true,
		'PRE'        : true,
		'SECTION'    : true, // HTML5
		'TABLE'      : true,
		'TFOOT'      : true,
		'UL'         : true,
		'VIDEO'      : true  // HTML5
	};

	/**
	 * Void elements are elements which are not permitted to contain content.
	 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element
	 *
	 * @type {Object}
	 */
	var VOID_ELEMENTS = {
		'AREA'    : true,
		'BASE'    : true,
		'BR'      : true,
		'COL'     : true,
		'COMMAND' : true,
		'EMBED'   : true,
		'HR'      : true,
		'IMG'     : true,
		'INPUT'   : true,
		'KEYGEN'  : true, // HTML5
		'LINK'    : true,
		'META'    : true,
		'PARAM'   : true,
		'SOURCE'  : true,
		'TRACK'   : true,
		'WBR'     : true
	};

	var TEXT_LEVEL_SEMANTIC_ELEMENTS = {
		'A'      : true,
		'ABBR'   : true,
		'B'      : true,
		'BDI'    : true, // HTML5
		'BDO'    : true,
		'BR'     : true,
		'CITE'   : true,
		'CODE'   : true,
		'DATA'   : true, // HTML5
		'DFN'    : true,
		'EM'     : true,
		'I'      : true,
		'KBD'    : true,
		'MARK'   : true, // HTML5
		'Q'      : true,
		'RP'     : true, // HTML5
		'RT'     : true, // HTML5
		'RUBY'   : true, // HTML5
		'S'      : true,
		'SAMP'   : true,
		'SMALL'  : true,
		'SPAN'   : true,
		'STRONG' : true,
		'SUB'    : true,
		'SUP'    : true,
		'TIME'   : true, // HTML5
		'U'      : true,
		'VAR'    : true,
		'WBR'    : true  // HTML5
	};

	/**
	 * Non-block-level elements which are nevertheless line breaking.
	 *
	 * @type {Object}
	 */
	var LINE_BREAKING_VOID_ELEMENTS = {
		'BR'  : true,
		'HR'  : true,
		'IMG' : true
	};

	var LIST_CONTAINERS = {
		'OL' : true,
		'UL' : true,
		'DL' : true
	};

	var LIST_ITEMS = {
		'LI' : true,
		'DT' : true,
		'DD' : true
	};

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
		return BLOCK_LEVEL_ELEMENTS[node.nodeName] || false;
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
	 * Check whether the given node is a void element type.
	 *
	 * @param {DOMObject} node
	 * @return {Boolean}
	 */
	function isVoidType(node) {
		return VOID_ELEMENTS[node.nodeName] || false;
	}

	/**
	 * Check whether the given node is a text-level semantic element type.
	 *
	 * @param {DOMObject} node
	 * @return {Boolean}
	 */
	function isTextLevelSemanticType(node) {
		return TEXT_LEVEL_SEMANTIC_ELEMENTS[node.nodeName] || false;
	}

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
			var style = dom.getComputedStyle(node, 'display');
			return style ? !nonBlockDisplayValuesMap[style] : isBlockType(node);
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
	 * Returns true for nodes that introduce linebreaks.
	 */
	function isLinebreakingNode(node) {
		return LINE_BREAKING_VOID_ELEMENTS[node.nodeName]
		    || hasBlockStyle(node);
	}

	/**
	 * Checks whether the given string represents a whitespace preservation
	 * style property.
	 *
	 * @param {String} string
	 * @return {Boolean}
	 */
	function isWhiteSpacePreserveStyle(cssWhiteSpaceValue) {
		return cssWhiteSpaceValue === 'pre'
		    || cssWhiteSpaceValue === 'pre-wrap'
		    || cssWhiteSpaceValue === '-moz-pre-wrap';
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
		var cssWhiteSpace;
		if (node.parentNode) {
			cssWhiteSpace = dom.getComputedStyle(node.parentNode, 'white-space');
			if (isWhiteSpacePreserveStyle(cssWhiteSpace)) {
				return false;
			}
		}
		if ('pre-line' === cssWhiteSpace) {
            if (/[\r\n]/.test(node.data)) {
                return false;
            }
        }
		return true;
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
					&& !LINE_BREAKING_VOID_ELEMENTS[point.node]));
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
	 * each including its respective br and any preceding unrendered whitespace
	 * and in case of the last line, also any following unrendered whitespace.
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
				return false;
			}
			child = child.nextSibling;
		}
		return true;
	}

	// TODO This list is incomplete but should look something like
	// http://www.w3.org/TR/CSS21/propidx.html
	var notInheritedStyles = {
		'background-color': true,
		'underline': true
	};

	/**
	 * TODO complete the list of inherited/notInheritedStyles
	 *
	 * @param {String} styleName
	 * @return {Boolean}
	 */
	function isStyleInherited(styleName) {
		return !notInheritedStyles[styleName];
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
	 * Unicode space characters as defined in the W3 HTML5 specification:
	 * http://www.w3.org/TR/html5/infrastructure.html#common-parser-idioms
	 *
	 * @const
	 * @type {Array.<string>}
	 */
	var NON_BREAKING_SPACE_CHARACTERS = [
		'\\u00A0', // NON BREAKING SPACE ("&nbsp;")
		'\\u202F'  // NARROW NON BREAKING SPACE
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
	var WHITE_SPACE_CHARACTERS = [
		'\\u0009',
		'\\u000A',
		'\\u000B',
		'\\u000C',
		'\\u000D',
		'\\u0020',
		'\\u0085',
		'\\u00A0',
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

	/**
	 * Regular expression that matches a white space character.
	 *
	 * @type {RegExp}
	 */
	var WSP_CHARACTER = new RegExp('[' + WHITE_SPACE_CHARACTERS.join('') + ']');

	/**
	 * Regular expression that matches a zero width character.
	 *
	 * @type {RegExp}
	 */
	var ZWSP_CHARACTER = new RegExp('[' + ZERO_WIDTH_CHARACTERS.join('') + ']');

	/**
	 * Regular expression that matches a non breaking space character.
	 *
	 * @type {RegExp}
	 */
	var NBSP_CHARACTER = new RegExp(
		'[' + NON_BREAKING_SPACE_CHARACTERS.join('') + ']'
	);

	/**
	 * Checks whether the given node positioned at either extremity of it's
	 * sibling linked list.
	 *
	 * @param {DOMObject} node
	 * @return {boolean} True if node is wither the first or last child of its
	 *                   parent.
	 */
	function isTerminalSibling(node) {
		var parent = node.parentNode;
		return parent && (
			node === parent.firstChild || node === parent.lastChild
		);
	}

	/**
	 * Checks whether the given node is next to a block level elemnt.
	 *
	 * @param {DOMObject} node
	 * @return {boolean}
	 */
	function isAdjacentToBlock(node) {
		return isBlockType(node.previousSibling)
		    || isBlockType(node.nextSibling);
	}

	/**
	 * Checks whether the given node is visually rendered according to HTML5
	 * specification.
	 *
	 * @param {DOMObject} node
	 * @return {Boolean}
	 */
	function isUnrendered(node) {
		if (!node) {
			return true;
		}

		// Because isUnrenderedWhiteSpaceNoBlockCheck() will give us false
		// positives but never false negatives, the algorithm that will follow
		// will make certain, and will also consider unrendered <br>s.
		var maybeUnrenderedNode = isUnrenderedWhitespaceNoBlockCheck(node);

		// Because a <br> element that is a child node adjacent to its parent's
		// end tag (terminal sibling) must not be rendered.
		if (
			!maybeUnrenderedNode
				&& (node === node.parentNode.lastChild)
					&& isBlockType(node.parentNode)
						&& 'BR' === node.nodeName
		) {
			return true;
		}

		if (
			maybeUnrenderedNode
				&& (
					isTerminalSibling(node)
						|| isAdjacentToBlock(node)
							|| skipUnrenderedToEndOfLine(cursors.create(node, false))
								|| skipUnrenderedToStartOfLine(cursors.create(node, false))
				)
		) {
			return true;
		}

		return false;
	}

	/**
	 * Returns true of the fiven node is rendered.
	 *
	 * @param {DOMOjbect} node
	 * @return {Boolean}
	 */
	var isRendered = fn.complement(isUnrendered);

	/**
	 * Determine whether node `left` is visually adjacent to `right`.
	 *
	 * In the following example, <p>, <i>, and "left" are all visually adjacent
	 * to <u> and "right":
	 * <p>...<i>left</i></p><u>right</u>
	 *
	 * @param {DOMObject} left
	 * @param {DOMObject} right
	 * @return {Boolean}
	 */
	function isVisuallyAdjacent(left, right) {
		if (left === traversing.findBackward(right, isRendered)) {
			return true;
		}
		var node = traversing.previousNonAncestor(right);
		while (node) {
			if (left === node) {
				return true;
			}
			if (isUnrendered(node)) {
				return isVisuallyAdjacent(left, node);
			}
			node = node.lastChild;
		}
		return false;
	}

	/**
	 * Checks whether the given node has any rendered children inside of it.
	 *
	 * @param {DOMObject} node
	 * @retur {DOMObject}
	 */
	function hasRenderedChildren(node) {
		return isRendered(traversing.nextWhile(node.firstChild, isUnrendered));
	}

	/**
	 * Checks whether or not the given node may be used to receive moved nodes
	 * in the process of removing a *visual* line break.
	 *
	 * The rule is simple: void elements are unsuitable because they are not
	 * permitted to contain any content, and text-level semantic elements are
	 * also unsuitable because any text-level content that would be moved into
	 * them will likely have it's semantic styling changed.
	 *
	 * @private
	 * @param {DOMObject} node
	 * @return {Boolean}
	 */
	function suitableTransferTarget(node) {
		return !isVoidType(node)
		    && !dom.isTextNode(node)
		    && !isTextLevelSemanticType(node)
			&& !LIST_CONTAINERS[node.nodeName];
	}

	/**
	 * Creates a function that will insert the DOM Object that is passed to it
	 * into the given node, only if it is valid to do so. If insertion is not
	 * done because it is deemed invalid, then false is returned, other wise the
	 * function returns true.
	 *
	 * @private
	 * @param {DOMObject} ref
	 *        The node to use a reference point by which to insert DOM Objects
	 *        that will be passed into the insert function.
	 * @param {Boolean} atEnd
	 *        True if the received DOM objects should be inserted as the last
	 *        child of `ref`.  Otherwise they will be inserted before `ref` as
	 *        it's previousSibling.
	 * @return {Function(DOMObject, OutParameter):Boolean}
	 */
	function createTransferFunction(ref, atEnd) {
		if (dom.isTextNode(ref)) {
			ref = ref.parentNode;
		}
		return function insert(node, out_inserted) {
			if (ref === node) {
				return out_inserted(true);
			}
			if (ref.nodeName === node.nodeName) {
				dom.merge(ref, node);
				return out_inserted(true);
			}
			var parent = atEnd ? ref : ref.parentNode;
			if (content.allowsNesting(parent.nodeName, node.nodeName)) {
				dom.insert(node, ref, atEnd);
				dom.merge(node.previousSibling, node);
				return out_inserted(true);
			}
			return out_inserted(false);
		};
	}

	/**
	 * Checks whether or not the given node can be moved across a line break in
	 * the process of removing a visual line break.
	 *
	 * @reference http://www.htmlhelp.com/reference/html40/block.html
	 *
	 * @private
	 * @param {DOMObject} node
	 * @return {Boolean}
	 */
	function isTransferable(node) {
		return !isLinebreakingNode(node);
	}

	/**
	 * Finds a suitable container inwhich to move node that are to the right of
	 * `breaker` when removing a visual line break.
	 *
	 * @param {DOMObject} above
	 * @param {DOMObject} breaker
	 * @return {DOMObject}
	 */
	function findTransferTarget(above, breaker) {
		var node = above;
		if (!isRendered(node)) {
			node = traversing.findBackward(node, isRendered, dom.isEditingHost);
		}
		if (!node || suitableTransferTarget(node)) {
			return node;
		}
		return traversing.findAncestor(
			node,
			suitableTransferTarget,
			function (node) {
				return node === breaker.parentNode || dom.isEditingHost(node);
			}
		);
	}

	/**
	 * Whether the given node can be removed.
	 *
	 * @private
	 * @param {DOMObject} node
	 * @param {OutParameter(Boolean):Boolean} out_continueMoving
	 * @return {Boolean}
	 */
	function cannotMove(node, out_continueMoving) {
		return !out_continueMoving() || !isTransferable(node);
	}

	/**
	 * Finds the closest linebreaking node from above.
	 */
	function findLineBreakingNodeBetween(above, below) {
		if (isLinebreakingNode(above)) {
			return above;
		}
		var node = traversing.findForward(
			above,
			isLinebreakingNode,
			function (node) { return node === below; }
		);
		if (node) {
			return node;
		}
		return isLinebreakingNode(below) ? below : null;
	}

	/**
	 * Removes the visual line break between the adjacent nodes `above` and
	 * `below` by moving the nodes from `below` to `above`.
	 *
	 * @param {DOMObject} above
	 * @param {DOMObject} below
	 */
	function removeVisualBreak(above, below) {
		if (!isVisuallyAdjacent(above, below)) {
			return {
				container: above,
				offset: dom.nodeLength(above)
			};
		}
		var breaker = findLineBreakingNodeBetween(above, below);
		if (!breaker) {
			return {
				container: above,
				offset: dom.nodeLength(above)
			};
		}
		var target = findTransferTarget(above, breaker);
		var move;
		var container;
		var offset;
		if (target) {
			move = createTransferFunction(target, true);
			container = target;
			offset = dom.nodeLength(container);
		} else {
			move = createTransferFunction(breaker, false);
			container = breaker.parentNode;
			offset = dom.nodeIndex(breaker);
		}
		var parent = below.parentNode;
		if (0 === dom.nodeLength(below)) {
			dom.remove(below);
		} else {
			traversing.walkUntil(below, move, cannotMove, fn.outparameter(true));
		}
		traversing.climbUntil(parent, dom.remove, hasRenderedChildren);
		return {
			container: container,
			offset: offset
		};
	}

	var zwChars = ZERO_WIDTH_CHARACTERS.join('');

	var breakingSpaces = arrays.complement(
		WHITE_SPACE_CHARACTERS,
		NON_BREAKING_SPACE_CHARACTERS
	).join('');

	var VISIBLE_CHARACTER_FROM_END = new RegExp(
		'(^[' + breakingSpaces + '])|'
		+ '([^' + breakingSpaces + '][' + breakingSpaces + ',' + zwChars + ']*$)'
	);

	var BREAKING_SPACE_FROM_END = new RegExp('[' + breakingSpaces + '][' + zwChars + ']*$');
	var ALWAYS_RENDERED_CHAR = new RegExp('[^' + breakingSpaces + ',' + zwChars + ']');
	var NON_IGNORABLE_CHAR = new RegExp('[^' + zwChars + ']');

	function nextVisibleCharacter(node, offset) {
		if (!dom.isTextNode(node) || offset === dom.nodeLength(node)) {
			return {
				node: null,
				offset: -1
			};
		}
		var before = 0 === offset ? '' : node.data.substr(0, offset);
		var after = node.data.substr(offset);
		// Because if the previous character (ignoring zero-width characters) is
		// a breaking white space character, any consecutive ones are not
		// rendered.
		var boundary = BREAKING_SPACE_FROM_END.test(before)
		             ? after.search(ALWAYS_RENDERED_CHAR)
		             : after.search(NON_IGNORABLE_CHAR);
		return {
			node: node,
			offset: -1 === boundary ? dom.nodelength(node) : offset + boundary
		};
	}

	function previousVisibleCharacter(node, offset) {
		if (!dom.isTextNode(node) || 0 === offset) {
			return {
				node: null,
				offset: -1
			};
		}
		var match = node.data.substr(0, offset).match(
			VISIBLE_CHARACTER_FROM_END
		);
		var boundary;
		if (!match) {
			boundary = 0;
		} else {
			boundary = (1 === match[0].length)
					 ? offset - 1
					 : offset - match[0].length + 1;
		}
		return {
			node: node,
			offset: boundary
		};
	}

	function atVisualStartOfBlock(node, offset) {
		return (
			 0 == offset || (
				 1 === offset
				 &&
				 BREAKING_SPACE_FROM_END.test(node.data.charAt(offset - 1))
			)
		) && isLinebreakingNode(node.parentNode);
	}

	function previousVisiblePosition(node, offset) {
		if (offset > 0 && dom.isTextNode(node)) {
			var pos = previousVisibleCharacter(node, offset);
			offset = -1 === pos.offset ? 0 : pos.offset;

			if (atVisualStartOfBlock(node, offset)) {
				node = traversing.previousNonAncestor(
					node,
					isRendered,
					dom.isEditingHost
				);
				if (node) {
					offset = dom.nodeLength(node);
				} else {
					node = pos.node;
					offset = 0;
				}
			}
			return {
				node: node,
				offset: offset
			};
		}
		if (dom.isAtEnd(node, offset) && node.lastChild && isRendered(node.lastChild)) {
			return {
				node: node.lastChild,
				offset: dom.nodeLength(node.lastChild)
			};
		}
		var crossedVisualBreak = false;
		var next = traversing.previousNonAncestor(
			dom.nodeAtOffset(node, offset),
			isRendered,
			function (node) {
				if (!crossedVisualBreak) {
					crossedVisualBreak = isLinebreakingNode(node);
				}
				return dom.isEditingHost(node);
			}
		);
		if (!next) {
			return {
				node: null,
				offset: -1
			};
		}
		if (crossedVisualBreak) {
			return {
				node: next,
				offset: dom.nodeLength(next)
			};
		}
		return previousVisiblePosition(next, dom.nodeLength(next));
	}

	/**
	 * Functions for working with HTML content.
	 */
	var exports = {
		isUnrendered: isUnrendered,
		isRendered: isRendered,
		isControlCharacter: isControlCharacter,
		isStyleInherited: isStyleInherited,
		isBlockType: isBlockType,
		isInlineType: isInlineType,
		isVoidType: isVoidType,
		isTextLevelSemanticType: isTextLevelSemanticType,
		hasBlockStyle: hasBlockStyle,
		hasInlineStyle: hasInlineStyle,
		isUnrenderedWhitespace: isUnrenderedWhitespace,
		skipUnrenderedToStartOfLine: skipUnrenderedToStartOfLine,
		skipUnrenderedToEndOfLine: skipUnrenderedToEndOfLine,
		normalizeBoundary: normalizeBoundary,
		isEmpty: isEmpty,
		isLinebreakingNode: isLinebreakingNode,
		isVisuallyAdjacent: isVisuallyAdjacent,
		removeVisualBreak: removeVisualBreak,
		nextVisibleCharacter: nextVisibleCharacter,
		previousVisibleCharacter: previousVisibleCharacter,
		previousVisiblePosition: previousVisiblePosition
	};

	exports['isUnrendered'] = exports.isUnrendered;
	exports['isRendered'] = exports.isRendered;
	exports['isControlCharacter'] = exports.isControlCharacter;
	exports['isStyleInherited'] = exports.isStyleInherited;
	exports['isBlockType'] = exports.isBlockType;
	exports['isInlineType'] = exports.isInlineType;
	exports['isVoidType'] = exports.isVoidType;
	exports['isTextLevelSemanticType'] = exports.isTextLevelSemanticType;
	exports['hasBlockStyle'] = exports.hasBlockStyle;
	exports['hasInlineStyle'] = exports.hasInlineStyle;
	exports['isUnrenderedWhitespace'] = exports.isUnrenderedWhitespace;
	exports['skipUnrenderedToStartOfLine'] = exports.skipUnrenderedToStartOfLine;
	exports['skipUnrenderedToEndOfLine'] = exports.skipUnrenderedToEndOfLine;
	exports['normalizeBoundary'] = exports.normalizeBoundary;
	exports['isEmpty'] = exports.isEmpty;
	exports['isLinebreakingNode'] = exports.isLinebreakingNode;
	exports['isVisuallyAdjacent'] = exports.isVisuallyAdjacent;
	exports['removeVisualBreak'] = exports.removeVisualBreak;
	exports['nextVisibleCharacter'] = exports.nextVisibleCharacter;

	return exports;
});
