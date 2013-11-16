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
 * https://dvcs.w3.org/hg/domcore/raw-file/tip/overview.html#concept-range-bp
 * http://lists.whatwg.org/htdig.cgi/whatwg-whatwg.org/2011-May/031577.html
 */
define([
	'dom',
	'predicates',
	'arrays',
	'cursors',
	'content',
	'browsers',
	'boundaries',
	'traversing',
	'overrides',
	'functions'
], function Html(
	Dom,
	Predicates,
	Arrays,
	Cursors,
	Content,
	Browsers,
	Boundaries,
	Traversing,
	Overrides,
	Fn
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
		case Dom.Nodes.DOCUMENT:
		case Dom.Nodes.DOCUMENT_FRAGMENT:
			return true;
		case Dom.Nodes.ELEMENT:
			var style = Dom.getComputedStyle(node, 'display');
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
			cssWhiteSpace = Dom.getComputedStyle(node.parentNode, 'white-space');
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
		return skipUnrenderedToEndOfLine(Cursors.cursor(node, false))
		    || skipUnrenderedToStartOfLine(Cursors.cursor(node, false));
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
		return Predicates.isBlockNode(node.previousSibling)
		    || Predicates.isBlockNode(node.nextSibling);
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

		if (LIST_CONTAINERS[node.nodeName]) {
			return true;
		}

		if (!Predicates.isVoidNode(node) && 0 === Dom.nodeLength(node)) {
			return true;
		}

		if (node.firstChild
		    && !Traversing.nextWhile(node.firstChild, isUnrendered)) {
			return true;
		}

		// Because isUnrenderedWhiteSpaceNoBlockCheck() will give us false
		// positives but never false negatives, the algorithm that will follow
		// will make certain, and will also consider unrendered <br>s.
		var maybeUnrenderedNode = isUnrenderedWhitespaceNoBlockCheck(node);

		// Because a <br> element that is a child node adjacent to its parent's
		// end tag (terminal sibling) must not be rendered.
		if (!maybeUnrenderedNode
		    && (node === node.parentNode.lastChild)
		    && Predicates.isBlockNode(node.parentNode)
		    && 'BR' === node.nodeName
		) {
			return true;
		}

		if (maybeUnrenderedNode && (
		    isTerminalSibling(node)
		    || isAdjacentToBlock(node)
		    || skipUnrenderedToEndOfLine(Cursors.create(node, false))
		    || skipUnrenderedToStartOfLine(Cursors.create(node, false))
		)) {
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
	var isRendered = Fn.complement(isUnrendered);

	/**
	 * Determine whether the boundary `left` is visually adjacent to `right`.
	 *
	 * @param {Array.<Element, Number>} left
	 * @param {Array.<Element, Number>} right
	 * @return {Boolean}
	 */
	function isVisuallyAdjacent(left, right) {
		var adjacent = false;
		Boundaries.prevWhile(right, function (pos) {
			if (Boundaries.equal(left, pos)) {
				adjacent = true;
				return false;
			}
			if (pos[1] > 0) {
				var node = Dom.nodeAtOffset(pos[0], pos[1] - 1);
				if ((Dom.isTextNode(node) || Predicates.isVoidNode(node))
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
		return Dom.isTextNode(node)
		     ? !isUnrenderedWhitespaceNoBlockCheck(node)
		     : isRendered(Traversing.nextWhile(node.firstChild, isUnrendered));
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
		if (Browsers.browser.msie || !Predicates.isBlockNode(elem)) {
			return;
		}
		if (!elem.firstChild
		    || !Traversing.nextWhile(elem.firstChild, isUnrenderedWhitespace)) {
			Dom.insert(document.createElement('br'), elem, true);
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
		return !Predicates.isVoidNode(node)
		    && !Dom.isTextNode(node)
		    && !Predicates.isTextLevelSemanticNode(node)
		    && !LIST_CONTAINERS[node.nodeName];
	}

	/**
	 * Creates a function that will insert the DOM Object that is passed to it
	 * into the given node, only if it is valid to do so. If insertion is not
	 * done because it is deemed invalid, then false is returned, other wise the
	 * function returns true.
	 *
	 * @private
	 * @param {Array<Element, number>} boundary
	 * @return {Function(DOMObject, OutParameter):Boolean}
	 */
	function createTransferFunction(boundary) {
		var ref = Boundaries.nextNode(boundary);
		var atEnd = Boundaries.isAtEnd(boundary);
		if (Dom.isTextNode(ref)) {
			ref = ref.parentNode;
		}
		return function insert(node, out_inserted) {
			if (ref === node) {
				return out_inserted(true);
			}
			if (ref.nodeName === node.nodeName) {
				Dom.merge(ref, node);
				return out_inserted(true);
			}
			var parent = atEnd ? ref : ref.parentNode;
			if (Content.allowsNesting(parent.nodeName, node.nodeName)) {
				Dom.insert(node, ref, atEnd);
				Dom.merge(node.previousSibling, node);
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
	 * Finds a suitable container in which to move nodes that are to the right of
	 * `breaker` when removing a visual line break.
	 *
	 * @param {DOMObject} linebreak
	 * @return {DOMObject}
	 */
	function findTransferTarget(node, limit) {
		if (!isRendered(node)) {
			node = Traversing.findBackward(node, isRendered, Dom.isEditingHost);
		}
		if (!node || suitableTransferTarget(node)) {
			return node;
		}
		node = Traversing.findAncestor(
			node,
			suitableTransferTarget,
			function (node) {
				return node === limit || Dom.isEditingHost(node);
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
		return Boundaries.nextWhile(above, function (pos, node, offset) {
			if (Boundaries.equal(pos, below)) {
				return false;
			}
			var end = Boundaries.isAtEnd(pos);
			var next = end ? node : Dom.nodeAtOffset(node, offset);
			if (hasLinebreakingStyle(next)) {
				return false;
			}
			return !(end && Dom.isEditingHost(pos[0]));
		});
	}

	/**
	 * Removes the visual line break between the adjacent boundaries `above`
	 * and `below` by moving the nodes after `below` over to before `above`.
	 *
	 * @param {Arrays.<Element, number>} above
	 * @param {Arrays.<Element, number>} below
	 */
	function removeVisualBreak(above, below, context) {
		above = Boundaries.normalize(above);
		below = Boundaries.normalize(below);

		if (!isVisuallyAdjacent(above, below)) {
			return;
		}

		var linebreak = nextLineBreak(above, below);
		var isVisible = function (node) {
			return above[0] === node || hasRenderedContent(node);
		};

		if (Boundaries.equal(linebreak, below)) {
			context.overrides = context.overrides.concat(Overrides.harvest(below[0]));
			Traversing.climbUntil(below[0], Dom.remove, isVisible);
			return;
		}

		var right = Boundaries.nextNode(below);
		var parent = right.parentNode;

		if (0 === Dom.nodeLength(right)) {
			context.overrides = context.overrides.concat(Overrides.harvest(right));
			Dom.remove(right);
		} else {
			Traversing.walkUntil(
				right,
				createTransferFunction(linebreak),
				cannotMove,
				Fn.outparameter(true)
			);
		}

		context.overrides = context.overrides.concat(Overrides.harvest(parent, isVisible));
		Traversing.climbUntil(parent, Dom.remove, isVisible);
	}

	function determineBreakingNode(context, container) {
		var name;
		if (context
		    && context.settings
		    && context.settings.defaultBlockNodeName) {
		    name = context.settings.defaultBlockNodeName;
		} else {
			name = 'div';
		}
		return Content.allowsNesting(container.nodeName, name) ? name : null;
	}

	function isBreakingContainer(node) {
		return !Predicates.isVoidNode(node)
		    && (hasLinebreakingStyle(node) || Dom.isEditingHost(node));
	}

	function isUnrenderedTextNode(node) {
		return Dom.isTextNode(node) && isUnrendered(node);
	}

	function insertBreakingNodeBeforeBoundary(boundary, context) {
		var next = Boundaries.nextNode(boundary);
		var name = determineBreakingNode(context, next.parentNode);
		if (!name) {
			return insertLineBreak(boundary, context);
		}
		var node = document.createElement(name);
		Dom.insertNodeAtBoundary(node, boundary);
		return [node, 0];
	}

	function wrapWithBreakingNode(ref, wrapper, context) {
		var first = Traversing.prevWhile(ref, function (node) {
			return node.previousSibling && hasInlineStyle(node.previousSibling);
		});
		if (first) {
			Dom.wrap(first, wrapper);
			Dom.moveSiblingsAfter(first.nextSibling, first, function (node) {
				return node === ref;
			});
			Dom.insert(ref, wrapper, true);
		} else {
			Dom.wrap(ref, wrapper);
		}
	}

	/**
	 * Inserts a visual line break after the given boundary position.
	 *
	 * @param {Array.<Element, offset>} boundary
	 * @param {Object} context
	 * @param {Array.<Element, offset>}
	 *        The "forward position".  This is the deepest node that is
	 *        visually adjacent to the newly created line.
	 */
	function insertVisualBreak(boundary, context) {
		var start = Boundaries.nextNode(boundary);

		// Because any nodes which are entirely after the boundary position
		// don't need to be copied but can be completely moved: "}<b>"
		var movable = Boundaries.isAtEnd(boundary) ? null : start;

		// Because if the boundary is right before a breaking container, The the
		// default new breaking element should be inserted right before it.
		if (movable && isBreakingContainer(movable)) {
			return insertBreakingNodeBeforeBoundary(boundary, context);
		}

		var ascend = Traversing.childAndParentsUntilIncl(
			start,
			isBreakingContainer
		);

		var anchor = ascend.pop();

		// Because if there are no breaking containers below the editing host,
		// then we need to wrap the inline nodes adjacent to the boundary with
		// the default breaking container before attempting to split it.
		if (Dom.isEditingHost(anchor)) {
			var name = determineBreakingNode(context, anchor);
			if (!name) {
				return insertLineBreak(boundary, context);
			}
			var ref = Arrays.last(ascend);
			anchor = document.createElement(name);
			if (ref) {
				wrapWithBreakingNode(ref, anchor, context);
			} else {
				Dom.insertNodeAtBoundary(anchor, boundary, true);
			}
		}

		var heirarchy;
		var parent;
		var copy;
		var node;
		var next;
		var len;
		var i;

		for (i = 0, len = ascend.length; i < len; i++) {
			node = ascend[i];
			parent = node.parentNode.cloneNode(false);
			copy = (node === movable) ? node : node.cloneNode(false);
			next = node.nextSibling;
			Dom.insert(heirarchy || copy, parent, true);
			if (next) {
				Dom.moveSiblingsInto(next, parent);
			}
			heirarchy = parent;
		}

		if (!heirarchy) {
			heirarchy = anchor.cloneNode(false);
		}

		Dom.insertAfter(heirarchy, anchor);
		prop(anchor);

		while (heirarchy && heirarchy.firstChild) {
			heirarchy = Traversing.nextWhile(
				heirarchy.firstChild,
				isUnrenderedTextNode
			) || heirarchy.firstChild;
		}

		var isVisibleOrHasBreakingStyle = function (node) {
			return hasLinebreakingStyle(node) || isRendered(node);
		};

		context.overrides = context.overrides.concat(
			Overrides.harvest(heirarchy, isVisibleOrHasBreakingStyle)
		);

		var nodesToRemove = Traversing.childAndParentsUntil(
			heirarchy,
			isVisibleOrHasBreakingStyle
		);

		if (nodesToRemove.length) {
			heirarchy = Arrays.last(nodesToRemove).parentNode;
			nodesToRemove.forEach(Dom.remove);
		}

		return Predicates.isVoidNode(heirarchy)
		     ? [heirarchy.parentNode, Dom.nodeIndex(heirarchy)]
		     : [heirarchy, 0];
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
		        && Traversing.prevWhile(br.previousSibling, ignorable);

		var next = br.nextSibling
		        && Traversing.nextWhile(br.nextSibling, ignorable);

		var significant = !prev
		               || ((prev && next) && Predicates.isInlineNode(br.parentNode));

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
		Dom.insertNodeAtBoundary(br, boundary);
		boundary = Boundaries.next(boundary);
		if (!isSignificantBr(br)) {
			Dom.insertNodeAtBoundary(document.createElement('br'), boundary);
		}
		return boundary;
	}

	var zwChars = ZERO_WIDTH_CHARACTERS.join('');

	var breakingWhiteSpaces = Arrays.difference(
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
	 *      http://www.w3.org/TR/xhtml1/overview.html#C_15
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
			return !!Traversing.previousNonAncestor(textnode, function (node) {
				return Predicates.isInlineNode(node) && isRendered(node);
			}, function (node) {
				return hasLinebreakingStyle(node) || Dom.isEditingHost(node);
			});
		}
		if (0 !== textnode.data.substr(offset).search(WSP_FROM_END)) {
			return true;
		}
		return !!Traversing.nextNonAncestor(textnode, function (node) {
			return Predicates.isInlineNode(node) && isRendered(node);
		}, function (node) {
			return hasLinebreakingStyle(node) || Dom.isEditingHost(node);
		});
	}

	/**
	 * Returns the boundary of the previous visible character from the given
	 * position in the document.
	 *
	 * All all insignificant characters (including "zero-width" characters are
	 * ignored).
	 *
	 * @param {TextBoundary} boundary
	 * @return {TextBoundary}
	 */
	function previousCharacter(boundary) {
		var node = boundary[0];
		var offset = boundary[1];

		if (0 === offset) {
			return null;
		}

		var textBefore = node.data.substr(0, offset);

		// Because `textBefore` may be a sequence of white spaces
		if (!NOT_WSP.test(textBefore)) {
			return areNextWhiteSpacesSignificant(node, 0)
			     ? [node, 1 === textBefore.length ? 0 : 1]
			     : null;
		}

		var index = textBefore.match(NOT_WSP_FROM_END)[0].length - 1;
		var hasMultipleWhiteSpaces = index > 1;

		return [node, hasMultipleWhiteSpaces ? offset - index + 1 : offset - 1];
	}

	/**
	 * Returns the boundary of the next visible character from the given
	 * position in the document.
	 *
	 * All all insignificant characters (including "zero-width" characters are
	 * ignored).
	 *
	 * @param {TextBoundary} boundary
	 * @return {TextBoundary}
	 */
	function nextCharacter(boundary) {
		var node = boundary[0];
		var offset = boundary[1];
		var index = node.data.substr(offset).search(
			areNextWhiteSpacesSignificant(node, offset) ? NOT_ZWSP : NOT_WSP
		);
		return (-1 === index) ? null : [node, offset + index + 1];
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
	function stepVisualBoundary(boundary, steps) {
		var start;

		if (!Boundaries.isNodeBoundary(boundary)) {
			// <#te|xt>
			var pos = steps.nextCharacter(boundary);
			if (pos) {
				return Boundaries.normalize(pos);
			}
			start = steps.stepBoundary(boundary);
		} else {
			start = Boundaries.normalize(boundary);
		}

		var crossedVisualBreak = false;

		var next = steps.stepWhile(start, function (pos, container) {
			var node = steps.nodeAt(pos);

			if (!crossedVisualBreak) {
				//
				//   .------- node -------.
				//   |         |          |
				//   v         v          v
				// |<br>  or |<p>  or |</h1>
				//  <br>| or  <p>| or  </h1>|
				crossedVisualBreak = hasLinebreakingStyle(node);
			}

			//    editing-host
			//    /          \
			//   v            v
			// <host>| or |</host>
			if (Dom.isEditingHost(node)) {
				return false;
			}

			// Because traversing over start and end tags has no visual
			// significance
			return (!Dom.isTextNode(node) && !Predicates.isVoidNode(node)) || isUnrendered(node);
		});

		//  <host>| or |</host>
		if (Dom.isEditingHost(steps.nodeAt(next))) {
			return start;
		}

		var after = steps.adjacentNode(next);

		// |</p>  or |</b>
		//   <p>| or   <b>|
		if (!after) {
			return next;
		}

		// |<p> or <p>|
		if (hasLinebreakingStyle(after)) {
			var afterNext = steps.stepBoundary(next);
			// <p>|<br> or <br>|</p>
			var sibling = steps.followingSibling(after);
			if ((sibling && hasInlineStyle(sibling)) || hasInlineStyle(after.parentNode)) {
				return afterNext;
			}
			var secondAfterNext = steps.stepBoundary(afterNext);
			if (steps.isLimit(secondAfterNext) && Dom.isEditingHost(secondAfterNext[0])) {
				return afterNext;
			}
			return secondAfterNext;
		}

		//  <p>| or  <br>|
		// |<p>  or |<br>
		if (crossedVisualBreak) {
			// <#text>|<br>
			if (Dom.isTextNode(after)) {
				// Because `next` may be at a insignificant white space (when going backwards)
				/*
				 var offset = after.data.search(WSP_FROM_END);
				if (offset > -1) {
					return [after, offset];
				}
				*/
				return [after, 0];
			}
			return next;
		}

		// <#text>|<b> or </b>|<#text>
		return steps.stepVisualBoundary(after);
	}

	var forwardSteps = {
		nextCharacter : nextCharacter,
		stepBoundary  : Boundaries.next,
		adjacentNode  : Boundaries.nodeAfter,
		stepWhile     : Boundaries.nextWhile,
		nodeAt        : Boundaries.nextNode,
		isLimit       : Boundaries.isAtEnd,
		followingSibling: function followingSibling(node) {
			return node.nextSibling;
		},
		stepVisualBoundary: function stepVisualBoundary(node) {
			return nextVisualBoundary([node, 0]);
		}
	};

	var backwardSteps = {
		nextCharacter : previousCharacter,
		stepBoundary  : Boundaries.prev,
		adjacentNode  : Boundaries.nodeBefore,
		stepWhile     : Boundaries.prevWhile,
		nodeAt        : Boundaries.prevNode,
		isLimit       : Boundaries.isAtStart,
		followingSibling: function followingSibling(node) {
			return node.previousSibling;
		},
		stepVisualBoundary: function stepVisualBoundary(node) {
			return previousVisualBoundary([node, Dom.nodeLength(node)]);
		}
	};

	function nextVisualBoundary(boundary) {
		return stepVisualBoundary(boundary, forwardSteps);
	}

	function previousVisualBoundary(boundary) {
		return stepVisualBoundary(boundary, backwardSteps);
	}

	/**
	 * Functions for working with HTML Content.
	 */
	var exports = {
		isUnrendered: isUnrendered,
		isRendered: isRendered,
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
		isWhiteSpacePreserveStyle: isWhiteSpacePreserveStyle,
		insertVisualBreak: insertVisualBreak,
		insertLineBreak: insertLineBreak,
		removeVisualBreak: removeVisualBreak,
		nextLineBreak: nextLineBreak,
		prop: prop,
		previousCharacter: previousCharacter,
		nextCharacter: nextCharacter,
		previousVisualBoundary: previousVisualBoundary,
		nextVisualBoundary: nextVisualBoundary,
		areNextWhiteSpacesSignificant: areNextWhiteSpacesSignificant
	};

	exports['isUnrendered'] = exports.isUnrendered;
	exports['isRendered'] = exports.isRendered;
	exports['isStyleInherited'] = exports.isStyleInherited;
	exports['hasBlockStyle'] = exports.hasBlockStyle;
	exports['hasInlineStyle'] = exports.hasInlineStyle;
	exports['isUnrenderedWhitespace'] = exports.isUnrenderedWhitespace;
	exports['isWhiteSpacePreserveStyle'] = exports.isWhiteSpacePreserveStyle;
	exports['skipUnrenderedToStartOfLine'] = exports.skipUnrenderedToStartOfLine;
	exports['skipUnrenderedToEndOfLine'] = exports.skipUnrenderedToEndOfLine;
	exports['normalizeBoundary'] = exports.normalizeBoundary;
	exports['isEmpty'] = exports.isEmpty;
	exports['hasLinebreakingStyle'] = exports.hasLinebreakingStyle;
	exports['isVisuallyAdjacent'] = exports.isVisuallyAdjacent;
	exports['removeVisualBreak'] = exports.removeVisualBreak;

	return exports;
});
