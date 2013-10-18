/* html.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * @reference
 * https://en.wikipedia.org/wiki/HTML_element#Content_vs._presentation
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Content_categories
 * http://www.whatwg.org/specs/web-apps/2007-10-26/multipage/section-contenteditable.html
 * http://lists.whatwg.org/htdig.cgi/whatwg-whatwg.org/2011-May/031577.html
 * https://dvcs.w3.org/hg/domcore/raw-file/tip/Overview.html#concept-range-bp
 * http://lists.whatwg.org/htdig.cgi/whatwg-whatwg.org/2011-May/031577.html
 */
define([
	'dom',
	'arrays',
	'cursors',
	'content',
	'browser',
	'boundaries',
	'traversing',
	'functions'
], function Html(
	dom,
	arrays,
	cursors,
	content,
	browser,
	boundaries,
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
			return style ? !nonBlockDisplayValuesMap[style] : dom.isBlockNode(node);
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
	function hasLinebreakingStyle(node) {
		return LINE_BREAKING_VOID_ELEMENTS[node.nodeName]
		    || LIST_ITEMS[node.nodeName]
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
		if (!hasLinebreakingStyle(cursor.node)) {
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
		if (!hasLinebreakingStyle(cursor.node)) {
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
				if (!hasLinebreakingStyle(cursor.node)) {
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
		return dom.isBlockNode(node.previousSibling)
		    || dom.isBlockNode(node.nextSibling);
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
					&& dom.isBlockNode(node.parentNode)
						&& 'BR' === node.nodeName
		) {
			return true;
		}

		if (
			maybeUnrenderedNode && (
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
	 * Determine whether the boundary `left` is visually adjacent to `right`.
	 *
	 * @param {Array.<Element, Number>} left
	 * @param {Array.<Element, Number>} right
	 * @return {Boolean}
	 */
	function isVisuallyAdjacent(left, right) {
		var adjacent = false;
		boundaries.prevWhile(right, function (pos) {
			if (boundaries.equal(left, pos)) {
				adjacent = true;
				return false;
			}
			if (pos[1] > 0) {
				var node = dom.nodeAtOffset(pos[0], pos[1] - 1);
				if ((dom.isTextNode(node) || dom.isVoidNode(node))
					&& isRendered(node)) {
					adjacent = false;
					return false;
				}
			}
			return true;
		});
		return adjacent;
	}

	/**
	 * Checks whether the given node has any rendered children inside of it.
	 *
	 * @param {DOMObject} node
	 * @retur {DOMObject}
	 */
	function hasRenderedContent(node) {
		return dom.isTextNode(node)
		     ? !isUnrenderedWhitespaceNoBlockCheck(node)
		     : isRendered(traversing.nextWhile(node.firstChild, isUnrendered));
	}

	/**
	 * "Props up" the given element if needed.
	 *
	 * The HTML specification specifies that empty block-level elements be not
	 * rendered.  This becomes a problem if an editing operation results in one
	 * of these elements being emptied of all its child nodes.  If this were to
	 * happen, standard conformant browsers will no longer render that empty
	 * block element even though it will remain in the docuement.  Because the
	 * element is invisible, it will no longer be possible for the caret to be
	 * placed into it.
	 *
	 * In order to prevent littering the editable with invisible block-level
	 * elements, we prop them up by ensuring the empty block-level elements are
	 * given a <br> child node to force them to be rendered with one line
	 * height.
	 *
	 * The notable exception to this rule are the Microsoft's non-standard
	 * conformant Trident engines which render empty editable block level
	 * elements with one line height.
	 *
	 * @param {DOMObject} elem
	 */
	function prop(elem) {
		if (browser.browser.msie || !dom.isBlockNode(elem)) {
			return;
		}
		if (!elem.firstChild
		    || !traversing.nextWhile(elem.firstChild, isUnrenderedWhitespace)) {
			dom.insert(document.createElement('br'), elem, true);
		}
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
		return !dom.isVoidNode(node)
		    && !dom.isTextNode(node)
		    && !dom.isTextLevelSemanticNode(node)
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
		return !hasLinebreakingStyle(node);
	}

	/**
	 * Finds a suitable container inwhich to move nodes that are to the right of
	 * `breaker` when removing a visual line break.
	 *
	 * @param {DOMObject} linebreak
	 * @return {DOMObject}
	 */
	function findTransferTarget(node, limit) {
		if (!isRendered(node)) {
			node = traversing.findBackward(node, isRendered, dom.isEditingHost);
		}
		if (!node || suitableTransferTarget(node)) {
			return node;
		}
		node = traversing.findAncestor(
			node,
			suitableTransferTarget,
			function (node) {
				return node === limit || dom.isEditingHost(node);
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
	 * Finds the closest line-breaking node between `above` and `below` in
	 * document order.
	 *
	 * @param {Array.<Element, number>} above
	 * @param {Array.<Element, number>} below
	 * @return {Array.<Element, number>}
	 */
	function nextLineBreak(above, below) {
		return boundaries.nextWhile(above, function (pos, node, offset) {
			if (boundaries.equal(pos, below)) {
				return false;
			}
			var end = boundaries.atEnd(pos);
			var next = end ? node : dom.nodeAtOffset(node, offset);
			if (hasLinebreakingStyle(next)) {
				return false;
			}
			return !(end && dom.isEditingHost(pos[0]));
		});
	}

	/**
	 * Removes the visual line break between the adjacent nodes `above` and
	 * `below` by moving the nodes from `below` to `above`.
	 *
	 * @param {Arrays.<Element, number>} above
	 * @param {Arrays.<Element, number>} below
	 */
	function removeVisualBreak(above, below) {
		above = boundaries.normalize(above);
		below = boundaries.normalize(below);

		if (!isVisuallyAdjacent(above, below)) {
			return;
		}

		var linebreak = nextLineBreak(above, below);

		var isVisible = function (node) {
			return above[0] === node || hasRenderedContent(node);
		};

		if (boundaries.equal(linebreak, below)) {
			traversing.climbUntil(below[0], dom.remove, isVisible);
			return;
		}

		var move = boundaries.atEnd(linebreak)
			? createTransferFunction(linebreak[0], true)
			: createTransferFunction(
				dom.nodeAtOffset(linebreak[0], linebreak[1]),
				false
			);

		var right = boundaries.rightNode(below);
		var parent = right.parentNode;

		if (0 === dom.nodeLength(right)) {
			dom.remove(right);
		} else {
			traversing.walkUntil(
				right,
				move,
				cannotMove,
				fn.outparameter(true)
			);
		}

		traversing.climbUntil(parent, dom.remove, isVisible);
	}

	function isBreak(node) {
		return !dom.isVoidNode(node)
		    && (dom.isEditingHost(node) || hasLinebreakingStyle(node));
	}

	function determineBreakingNode(context) {
		if (context
			&& context.settings
			&& context.settings.defaultBlockNodeName) {
			return context.settings.defaultBlockNodeName;
		}
		return 'div';
	}

	/**
	 * Moves the nodes in `toMove` into the given container, nesting one inside
	 * the other.  Any nodes in `toMove` that are also found in `toPreserve`
	 * will be copied over rather than moved.
	 *
	 * @param {Array.<Element>} toPreserve
	 * @param {Array.<Element>} toMove
	 * @param {Element}
	 */
	function moveNodesInto(toPreserve, toMove, container) {
		var copy;
		var node;
		var i = toMove.length;
		while (i--) {
			node = toMove[i];
			if (arrays.contains(toPreserve, node)) {
				copy = node.cloneNode(false);
				dom.insert(copy, container, true);
				node = node.nextSibling;
			} else {
				copy = null;
			}
			dom.moveSiblingsAfter(
				dom.moveSiblingsInto(node, container, isBreak),
				container
			);
			container = copy || node;
		}
	}

	/**
	 * Inserts a visual line break after the given boundary position.
	 *
	 * @param {Array.<Element, offset>} boundary
	 * @param {!object}
	 * @param {Array.<Element, offset>}
	 *        The "forward position". This is the deepest node that is visually
	 *        adjacent to the newly created line.
	 */
	function insertVisualBreak(boundary, context) {
		var left = boundaries.leftNode(boundary);
		var right = boundaries.rightNode(boundary);
		var leftAscend = traversing.childAndParentsUntil(left, isBreak);
		var rightAscend = traversing.childAndParentsUntilIncl(right, isBreak);
		var breakNode = rightAscend.pop();
		var newBlock;

		// Because if we reached the editing host in the ascent, it means that
		// there was not block-level ancestor in that could be broken.
		if (dom.isEditingHost(breakNode)) {
			newBlock = document.createElement(determineBreakingNode(context));
			breakNode = newBlock.cloneNode(false);
			dom.wrap(arrays.last(leftAscend), breakNode);

		// Because the range may have been just behind a line-breaking node.
		} else if (!boundaries.atEnd(boundary) && isBreak(right)) {
			newBlock = document.createElement(determineBreakingNode(context));
		} else {
			newBlock = breakNode.cloneNode(false);
		}

		dom.insertAfter(newBlock, breakNode);
		moveNodesInto(leftAscend, rightAscend, newBlock);
		dom.moveSiblingsAfter(left.nextSibling, newBlock);

		prop(breakNode);

		var focus = newBlock;
		var next = newBlock;
		while (next && next.firstChild) {
			next = traversing.nextWhile(focus.firstChild, function (node) {
				return !dom.isVoidNode(node) && isUnrendered(node);
			});
			if (!next) {
				break;
			}
			focus = next;
		}

		return dom.isVoidNode(focus) ? [focus.parentNode, dom.nodeIndex(focus)]
		                             : [focus, 0];
	}

	/**
	 * Checks whether or not the given BR element is significant or not.
	 *
	 * @param {Element} br
	 * @return {boolean}
	 */
	function isSignificantBr(br) {
		var ignorable = function (node) {
			return 'BR' !== node.nodeName && isUnrendered(node);
		};

		var prev = br.previousSibling
		        && traversing.prevWhile(br.previousSibling, ignorable);

		var next = br.nextSibling
		        && traversing.nextWhile(br.nextSibling, ignorable);

		var significant = !prev
		               || ((prev && next) && dom.isInlineNode(br.parentNode));

		significant = significant || (
			(
				prev && ('BR' === prev.nodeName || !hasLinebreakingStyle(prev))
			) && (
				next && ('BR' === next.nodeName || !hasLinebreakingStyle(next))
			)
		);

		significant = significant || (
			(
				prev && ('BR' === prev.nodeName)
			) || (
				next && ('BR' === next.nodeName)
			)
		);

		return significant || (!prev && !next);
	}

	/**
	 * Inserts a <br> element at behind the given boundary position.
	 *
	 * @param {Arrays.<Element, number>} boundary
	 * @param {object}
	 * @return {Arrays.<Element, number>}
	 */
	function insertLineBreak(boundary, context) {
		var br = document.createElement('br');

		if (boundaries.atEnd(boundary)) {
			dom.insert(br, boundary[0], true);
		} else {
			dom.insert(br, boundaries.rightNode(boundary));
		}

		boundary = boundaries.next(boundary);

		if (!isSignificantBr(br)) {
			dom.insert(document.createElement('br'), br);
		}

		return boundary;
	}

	var zwChars = ZERO_WIDTH_CHARACTERS.join('');

	var breakingWhiteSpaces = arrays.complement(
		WHITE_SPACE_CHARACTERS,
		NON_BREAKING_SPACE_CHARACTERS
	).join('');

	var WSP_FROM_END = new RegExp(
		'[' + breakingWhiteSpaces + ']+[' + zwChars + ']*$'
	);

	var NOT_WSP_FROM_END = new RegExp(
		  '[^' + breakingWhiteSpaces + ']'
		+ '[' + breakingWhiteSpaces + zwChars + ']*$'
	);

	var NOT_WSP = new RegExp('[^' + breakingWhiteSpaces + zwChars + ']');
	var NOT_ZWSP = new RegExp('[^' + zwChars + ']');

	/**
	 * Checks whether any white space sequence immediately after the specified
	 * offset in the given node is "significant."
	 *
	 * White Space Handling
	 * --------------------
	 *
	 * The HTML specification stipulates that not all "white spaces" in markup
	 * are visible.  Only those deemed "significant" are to be rendered visibly
	 * by the user agent.
	 *
	 * Therefore, if the position from which we are to determine the next
	 * visible character is adjacent to a "white space" (space, tabs,
	 * line-feed), or adjacent to line-breaking elements, determining the next
	 * visible character becomes non-trivial.
	 *
	 * The following rules apply:
	 *
	 * Note that for the purposes of these rules, the set of "white space" does
	 * not include non-breaking spaces (&nbsp;).
	 *
	 * 1. The first sequence of white space immediately after the opening tag
	 *    of a line-breaking element is insignificant and is ignored:
	 *
	 *     ignore
	 *       ||
	 *       vv
	 *    <p>  foo</p>
	 *       ..
	 *
	 *    will be rendered like <p>foo</p>
	 *
	 * 2. The first sequence of white space immediately after the opening tag
	 *    of a non-line-breaking element which is the first visible child of a
	 *    line-breaking element (or whose non-line-breaking ancestors are all
	 *    first visible children) is insignificant and is ignored:
	 *
	 *          ignore
	 *          |   |
	 *          v   v
	 *    <p><i> <b> foo</b></i></p>
	 *          .   .
	 *          ^
	 *          |
	 *          `-- unrendered text node
	 *
	 *    will be rendered like <p><i><b>foo</b></i></p>
	 *
	 * 3. The last sequence of white space immediately before the closing tag
	 *    of a line-breaking element is insignificant and is ignored:
	 *
	 *        ignore
	 *          |
	 *          v
	 *    <p>foo </p>
	 *          .
	 *
	 *    will be rendered like <p>foo</p>
	 *
	 *
	 * 4. The last sequence of white space immediately before the closing tag
	 *    of a non-line-breaking element which is the last visible child of a
	 *    line-breaking element (or whose non-line-breaking ancestors are all
	 *    last visible children) is insignificant and is ignored:
	 *
	 *           ignore               ignore  ignore
	 *             |                    ||    |    |
	 *             v                    vv    v    v
	 *    <p><b>foo </b></p><p><i><b>bar  </b> </i> </p>
	 *             .                    ..   .    .
	 *
	 *    will be rendered like <p><b>bar</b></p><p><i><b>bar</b></i></p>
	 *
	 * 5. The last sequence of white space immediately before the opening tag
	 *    of line-breaking elements or the first sequence of white space
	 *    immediately after the closing tag of line-breaking elements is
	 *    insignificant and is ignored:
	 *
	 *          ignore      ignore
	 *            |          |||
	 *            v          vvv
	 *    <div>foo <p>bar</p>    baz</div>
	 *            .          ...
	 *
	 * 6. The first sequence of white space immediately after a white space
	 *    character is insignificant and is ignored:
	 *
	 *         ignore
	 *           ||
	 *           vv
	 *    foo<b>   bar</b>
	 *          ...
	 *          ^
	 *          |
	 *          `-- significant
	 *
	 * @see For more information on white space handling:
	 *      http://www.w3.org/TR/REC-xml/#sec-white-space
	 *      http://www.w3.org/TR/xhtml1/Overview.html#C_15
	 *      http://lists.w3.org/Archives/Public/www-dom/1999AprJun/0007.html
	 *
	 * @param {DOMObject} node
	 * @param {Number} offset
	 * @return {Boolean}
	 */
	function areNextWhiteSpacesSignificant(textnode, offset) {
		if (textnode.data.substr(0, offset).search(WSP_FROM_END) > -1) {
			return false;
		}
		if (0 === offset) {
			return !!traversing.previousNonAncestor(textnode, function (node) {
				return dom.isInlineNode(node) && isRendered(node);
			}, function (node) {
				return hasLinebreakingStyle(node) || dom.isEditingHost(node);
			});
		}
		if (0 !== textnode.data.substr(offset).search(WSP_FROM_END)) {
			return true;
		}
		return !!traversing.nextNonAncestor(textnode, function (node) {
			return dom.isInlineNode(node) && isRendered(node);
		}, function (node) {
			return hasLinebreakingStyle(node) || dom.isEditingHost(node);
		});
	}

	/**
	 * Returns the node/offset namedtuple, of the next visible character from
	 * the given position in the document.
	 *
	 * All "zero-width character" are ignored.
	 *
	 * @param {DOMObject} node
	 * @param {Number} offset
	 * @return {Object}
	 *         An object with the properities "node" and "offset", representing
	 *         the position of the next visible character.  "node" will be null
	 *         and offset -1 if no next visible character can be found.
	 */
	function nextVisibleCharacter(node, offset) {
		if (!dom.isTextNode(node) || offset === dom.nodeLength(node)) {
			return {
				node: null,
				offset: -1
			};
		}
		var boundary = node.data.substr(offset).search(
			areNextWhiteSpacesSignificant(node, offset) ? NOT_ZWSP : NOT_WSP
		);
		return -1 === boundary ? {
			node: null,
			offset: -1
		} : {
			node: node,
			offset: offset + boundary + 1
		};
	}

	/**
	 * Whether or not it is possible to insert a text or a text node in the
	 * given node.
	 *
	 * This test is useful for determining whether a node is suitable to serve
	 * as a container for range boundary position for the purposes of editing
	 * content.
	 *
	 * @param {DOMObject} node
	 * @return {Boolean}
	 */
	function canInsertText(node) {
		return (dom.isTextNode(node)
		    || content.allowsNesting(node.nodeName, '#text'))
		    && isRendered(node);
	}

	function prevNodeFromPosition(node, offset) {
		return (dom.isAtEnd(node, offset) || dom.isTextNode(node))
			? (node.lastChild || node)
			: traversing.backward(dom.nodeAtOffset(node, offset));
	}

	function nextNodeToFindPosition(start, out_crossedVisualBreak) {
		return traversing.findForward(
			start,
			/**
			 * True if the given node can contain text or if it is a void node
			 * with subequent visible siblings.
			 */
			function (node) {
				return canInsertText(node)
					|| (dom.isVoidNode(node)
						&& traversing.nextWhile(node, isUnrendered));
			},
			function (node) {
				if (node === start) {
					return false;
				}
				if (!out_crossedVisualBreak()) {
					out_crossedVisualBreak(hasLinebreakingStyle(node));
				}
				return dom.isEditingHost(node)
					|| (node.previousSibling
					    && dom.isEditingHost(node.previousSibling));
			}
		);
	}

	/**
	 * Returns the an node/offset namedtuple of the next visible position in the
	 * document.
	 *
	 * The next visible position is always the next visible character, or the
	 * next visible line break or space.
	 *
	 * @param {DOMObject} node
	 * @param {Number} offset
	 * @return {Object}
	 */
	function nextVisiblePosition(node, offset) {
		var pos = nextVisibleCharacter(node, offset);
		if (pos.node) {
			return pos;
		}
		var crossedVisualBreak = fn.outparameter(false);
		var next = nextNodeToFindPosition(
			prevNodeFromPosition(node, offset),
			crossedVisualBreak
		);
		if (!next) {
			return {
				node: node.parentNode,
				offset: dom.nodeLength(node.parentNode)
			};
		}
		if (dom.isVoidNode(next)) {
			var after = traversing.forward(next);
			if (dom.isVoidNode(after) || dom.isInlineNode(after)) {
				return {
					node: next.parentNode,
					offset: dom.nodeIndex(next) + 1
				};
			}
			next = after;
			crossedVisualBreak(true);
		}
		if (crossedVisualBreak()) {
			while (next && next.firstChild) {
				next = traversing.nextWhile(next.firstChild, isUnrendered);
			}
			return {
				node: next,
				offset: 0
			};
		}
		return nextVisiblePosition(next, 0);
	}

	/**
	 * Returns the node/offset namedtuple, of the previous visible character
	 * from the given position in the document.
	 *
	 * All "zero-width character" are ignored.
	 *
	 * @param {DOMObject} node
	 * @param {Number} offset
	 * @return {Object}
	 *         An object with the properities "node" and "offset", representing
	 *         the position of the previous visible character.  "node" will be
	 *         null and offset -1 if no previous visible character can be found.
	 */
	function previousVisibleCharacter(node, offset) {
		if (!dom.isTextNode(node) || 0 === offset) {
			return {
				node: null,
				offset: -1
			};
		}

		var before = node.data.substr(0, offset);

		if ('' === before) {
			return {
				node: null,
				offset: -1
			};
		}

		// Because `before` may be a sequence of white spaces
		if (-1 === before.search(NOT_WSP_FROM_END) && !NOT_WSP.test(before)) {
			return areNextWhiteSpacesSignificant(node, 0)
				? {
					node: node,
					offset: 1 === before.length ? 0 : 1
				}
				: {
					node: null,
					offset: -1
				};
		}

		var boundary = before.match(NOT_WSP_FROM_END)[0].length - 1;
		var moreThanOneWhiteSpace = boundary > 1;

		return {
			node: node,
			offset: moreThanOneWhiteSpace ? offset - boundary + 1 : offset - 1
		};
	}

	/**
	 * Returns the an node/offset namedtuple of the previous visible position
	 * in the document.
	 *
	 * The previous visible position is always the previoys visible character,
	 * or the previous visible line break or space.
	 *
	 * @param {DOMObject} node
	 * @param {Number} offset
	 * @return {Object}
	 */
	function previousVisiblePosition(node, offset) {
		var pos = previousVisibleCharacter(node, offset);
		if (pos.node) {
			return pos;
		}

		var crossedVisualBreak = false;

		var next = (dom.isTextNode(node) || dom.isAtEnd(node, offset))
		         ? node
		         : dom.nodeAtOffset(node, offset);

		var parents = traversing.childAndParentsUntil(next, dom.isEditingHost);

		var landing = traversing.findThrough(
			next,
			function (node) {
				return !arrays.contains(parents, node)
				    && (canInsertText(node) || dom.isVoidNode(node));
			},
			function (node) {
				if (next === node) {
					return false;
				}
				if (!crossedVisualBreak) {
					crossedVisualBreak = hasLinebreakingStyle(node);
				}
				return dom.isEditingHost(node)
					|| (node.nextSibling
					    && dom.isEditingHost(node.nextSibling));
			}
		);

		if (!landing) {
			return {
				node: node,
				offset: 0
			};
		}

		if (!crossedVisualBreak) {
			return previousVisiblePosition(landing, dom.nodeLength(landing));
		}

		if (landing.lastChild) {
			landing = traversing.findBackward(
				traversing.forward(landing.lastChild),
				function (node) {
					return canInsertText(node) || dom.isVoidNode(node);
				}
			);
		}

		if (dom.isVoidNode(landing)) {
			if (!landing.previousSibling
				|| dom.isVoidNode(landing.previousSibling)) {
				return {
					node: landing.parentNode,
					offset: dom.nodeIndex(landing)
				};
			}
			landing = landing.previousSibling;
		}

		if (dom.isTextNode(landing)) {
			var boundary = landing.data.search(WSP_FROM_END);
			return {
				node: landing,
				offset: -1 === boundary ? dom.nodeLength(landing) : boundary
			};
		}

		return {
			node: landing,
			offset: dom.nodeLength(landing)
		};
	}

	/**
	 * Functions for working with HTML content.
	 */
	var exports = {
		isUnrendered: isUnrendered,
		isRendered: isRendered,
		isControlCharacter: isControlCharacter,
		isStyleInherited: isStyleInherited,
		hasBlockStyle: hasBlockStyle,
		hasInlineStyle: hasInlineStyle,
		isUnrenderedWhitespace: isUnrenderedWhitespace,
		skipUnrenderedToStartOfLine: skipUnrenderedToStartOfLine,
		skipUnrenderedToEndOfLine: skipUnrenderedToEndOfLine,
		normalizeBoundary: normalizeBoundary,
		isEmpty: isEmpty,
		hasLinebreakingStyle: hasLinebreakingStyle,
		isVisuallyAdjacent: isVisuallyAdjacent,
		insertVisualBreak: insertVisualBreak,
		insertLineBreak: insertLineBreak,
		removeVisualBreak: removeVisualBreak,
		nextVisibleCharacter: nextVisibleCharacter,
		nextVisiblePosition: nextVisiblePosition,
		nextLineBreak: nextLineBreak,
		previousVisibleCharacter: previousVisibleCharacter,
		previousVisiblePosition: previousVisiblePosition,
		prop: prop,
		areNextWhiteSpacesSignificant: areNextWhiteSpacesSignificant
	};

	exports['isUnrendered'] = exports.isUnrendered;
	exports['isRendered'] = exports.isRendered;
	exports['isControlCharacter'] = exports.isControlCharacter;
	exports['isStyleInherited'] = exports.isStyleInherited;
	exports['hasBlockStyle'] = exports.hasBlockStyle;
	exports['hasInlineStyle'] = exports.hasInlineStyle;
	exports['isUnrenderedWhitespace'] = exports.isUnrenderedWhitespace;
	exports['skipUnrenderedToStartOfLine'] = exports.skipUnrenderedToStartOfLine;
	exports['skipUnrenderedToEndOfLine'] = exports.skipUnrenderedToEndOfLine;
	exports['normalizeBoundary'] = exports.normalizeBoundary;
	exports['isEmpty'] = exports.isEmpty;
	exports['hasLinebreakingStyle'] = exports.hasLinebreakingStyle;
	exports['isVisuallyAdjacent'] = exports.isVisuallyAdjacent;
	exports['removeVisualBreak'] = exports.removeVisualBreak;
	exports['nextVisibleCharacter'] = exports.nextVisibleCharacter;

	return exports;
});
