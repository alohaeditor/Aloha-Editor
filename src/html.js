/**
 * html.js is part of Aloha Editor project http://aloha-editor.org
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
	'mutation',
	'predicates',
	'arrays',
	'cursors',
	'content',
	'browsers',
	'boundaries',
	'traversing',
	'overrides',
	'functions',
	'assert'
], function Html(
	Dom,
	Mutation,
	Predicates,
	Arrays,
	Cursors,
	Content,
	Browsers,
	Boundaries,
	Traversing,
	Overrides,
	Fn,
	Asserts
) {
	'use strict';

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

	function isVoidType(node) {
		return Predicates.isVoidNode(node) || !Dom.isEditableNode(node);
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
	var NBSP_CHARACTER = new RegExp('[' + NON_BREAKING_SPACE_CHARACTERS.join('') + ']');

	/**
	 * Checks whether the given node positioned at either extremity of it's
	 * sibling linked list.
	 *
	 * @param {DOMObject} node
	 * @return {boolean} True if node is wither the first or last child of its
	 *                   parent.
	 */
	function isTerminalNode(node) {
		var parent = node.parentNode;
		return parent
		    && (node === parent.firstChild || node === parent.lastChild);
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

		if (!Predicates.isVoidNode(node) && 0 === Dom.nodeLength(node)) {
			return true;
		}

		if (node.firstChild && !Traversing.nextWhile(node.firstChild, isUnrendered)) {
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
				&& 'BR' === node.nodeName) {
			return true;
		}

		if (maybeUnrenderedNode && (
				isTerminalNode(node)
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
	 * @param  {Boundary} left
	 * @param  {Boundary} right
	 * @return {Boolean}
	 */
	function isVisuallyAdjacent(left, right) {
		var adjacent = false;
		Boundaries.prevWhile(right, function (pos) {
			if (Boundaries.equals(left, pos)) {
				adjacent = true;
				return false;
			}
			if (Boundaries.offset(pos) > 0) {
				// TODO:
				// var node = Boundaries.nodeBefore(pos);
				var node = Dom.nodeAtOffset(
					Boundaries.container(pos),
					Boundaries.offset(pos) - 1
				);
				if ((Dom.isTextNode(node) || Predicates.isVoidNode(node)) && isRendered(node)) {
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
		if (Browsers.msie || !Predicates.isBlockNode(elem)) {
			return;
		}
		if (!elem.firstChild || !Traversing.nextWhile(elem.firstChild, isUnrenderedWhitespace)) {
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
	 * @param  {Boundary} boundary
	 * @return {Function(Node, OutParameter):boolean}
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
	 * @param  {Boundary} above
	 * @param  {Boundary} below
	 * @return {Boundary}
	 */
	function nextLineBreak(above, below) {
		return Boundaries.nextWhile(above, function (pos) {
			if (Boundaries.equals(pos, below)) {
				return false;
			}
			if (hasLinebreakingStyle(Boundaries.nextNode(pos))) {
				return false;
			}
			if (!Boundaries.isAtEnd(pos)) {
				return true;
			}
			return !Dom.isEditingHost(Boundaries.container(pos));
		});
	}

	/**
	 * Removes the visual line break between the adjacent boundaries `above`
	 * and `below` by moving the nodes after `below` over to before `above`.
	 *
	 * @param {Boundary} above
	 * @param {Boundary} below
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

		if (Boundaries.equals(linebreak, below)) {
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

		if (parent) {
			context.overrides = context.overrides.concat(Overrides.harvest(parent, isVisible));
			Traversing.climbUntil(parent, Dom.remove, isVisible);
		}
	}

	function determineBreakingNode(context, container) {
		var name;
		if (context && context.settings && context.settings.defaultBlockNodeName) {
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
	 * Inserts a <br> element behind the given boundary position.
	 *
	 * @param  {Boundary} boundary
	 * @param  {object}
	 * @return {Boundary}
	 */
	function insertLineBreak(boundary, context) {
		var br = document.createElement('br');
		Mutation.insertNodeAtBoundary(br, boundary);
		boundary = Boundaries.next(boundary);
		if (!isSignificantBr(br)) {
			Mutation.insertNodeAtBoundary(document.createElement('br'), boundary);
		}
		return boundary;
	}

	function insertBreakingNodeBeforeBoundary(boundary, context) {
		var next = Boundaries.nextNode(boundary);
		var name = determineBreakingNode(context, next.parentNode);
		if (!name) {
			return insertLineBreak(boundary, context);
		}
		var node = document.createElement(name);
		Mutation.insertNodeAtBoundary(node, boundary);
		return Boundaries.create(node, 0);
	}

	/**
	 * Inserts a visual line break after the given boundary position.
	 *
	 * @param  {Boundary} boundary
	 * @param  {Object} context
	 * @return {Boundary}
	 *         The "forward position".  This is the deepest node that is
	 *         visually adjacent to the newly created line.
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
				Mutation.insertNodeAtBoundary(anchor, boundary, true);
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
		     ? Boundaries.fromNode(heirarchy)
		     : Boundaries.create(heirarchy, 0);
	}

	var zwChars = ZERO_WIDTH_CHARACTERS.join('');
	var breakingWhiteSpaces = Arrays.difference(
		WHITE_SPACE_CHARACTERS,
		NON_BREAKING_SPACE_CHARACTERS
	).join('');

	var WSP_FROM_END = new RegExp('[' + breakingWhiteSpaces + ']+[' + zwChars + ']*$');
	var NOT_WSP_FROM_END = new RegExp('[^' + breakingWhiteSpaces + ']'
	                     + '[' + breakingWhiteSpaces + zwChars + ']*$');
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
	 *      http://www.whatwg.org/specs/web-apps/current-work/multipage/editing.html#best-practices-for-in-page-editors
	 *
	 * @param  {Boundary} boundary Text boundary
	 * @return {Boolean}
	 */
	function areNextWhiteSpacesSignificant(boundary) {
		var textnode = Boundaries.container(boundary);
		var offset = Boundaries.offset(boundary);
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
	 * Returns the visible character offset immediately behind the given text
	 * boundary.
	 *
	 * @param  {Boundary} boundary Text boundary
	 * @return {number}
	 */
	function prevSignificantOffset(boundary) {
		var textnode = Boundaries.container(boundary);
		var offset = Boundaries.offset(boundary);
		var text = textnode.data.substr(0, offset);

		//
		// ""    ==> return -1
		//
		// " "   ==> return 1
		//  .
		//
		// "  "  ==> return 1
		//  ..
		//
		// "   " ==> return 1
		//  ...
		if (!NOT_WSP.test(text)) {
			// Because `text` may be a sequence of white spaces so we need to
			// check if any of them are significant.
			return areNextWhiteSpacesSignificant(Boundaries.raw(textnode, 0))
			     ?  1
			     : -1;
		}

		// "a"    ==> spaces=0 ==> return offset - 0
		//
		// "a "   ==> spaces=1 ==> return offset - 0
		//   .
		//
		// "a  "  ==> spaces=2 ==> return offset - 1
		//   ..
		//
		// "a   " ==> spaces=3 ==> return offset - 2
		//   ...
		var spaces = text.match(NOT_WSP_FROM_END)[0].length - 1;
		return (spaces < 2) ? offset : offset - spaces + 1;
	}

	/**
	 * Returns the visible character offset immediately after the given
	 * text boundary.
	 *
	 * @param  {Boundary} boundary Text boundary
	 * @return {number}
	 */
	function nextSignificantOffset(boundary) {
		var textnode = Boundaries.container(boundary);
		var offset = Boundaries.offset(boundary);
		var index = textnode.data.substr(offset).search(
			areNextWhiteSpacesSignificant(boundary) ? NOT_ZWSP : NOT_WSP
		);
		return (-1 === index) ? -1 : offset + index;
	}

	/**
	 * Returns the boundary of the next visible character from the given
	 * position in the document.
	 *
	 * All all insignificant characters (including "zero-width" characters are
	 * ignored).
	 *
	 * @param  {Boundary} boundary Text boundary
	 * @return {Boundary}
	 */
	function nextCharacterBoundary(boundary) {
		Asserts.assertFalse(
			Boundaries.isNodeBoundary(boundary),
			'Html.nextSignificantOffset#requires-text-boundary'
		);
		var offset = nextSignificantOffset(boundary);
		return (-1 === offset)
		     ? null
		     : Boundaries.create(Boundaries.container(boundary), offset + 1);
	}

	/**
	 * Returns the boundary of the previous visible character from the given
	 * position in the document.
	 *
	 * All all insignificant characters (including "zero-width" characters are
	 * ignored).
	 *
	 * @param  {Boundary} boundary Text boundary
	 * @return {Boundary}
	 */
	function prevCharacterBoundary(boundary) {
		Asserts.assertFalse(
			Boundaries.isNodeBoundary(boundary),
			'Html.prevSignificantOffset#requires-text-boundary'
		);
		var offset = prevSignificantOffset(boundary);
		return (-1 === offset)
		     ? null
		     : Boundaries.create(Boundaries.container(boundary), offset - 1);
	}

	/**
	 * Checks whether a boundary can pass in or out of the given node without
	 * the visual position of the boundary being changed.
	 *
	 * Calling this function with a <b> node will return true, for example
	 * because the boundary position right infront of a B element's start tag
	 * and the boundary position right after the start tag are renderd at the
	 * same visual position.
	 *
	 * "|<b>foo..." is visually at the same position as "<b>|foo.."
	 *
	 * Likewise "..bar|</div>" is visually the same as "..bar</div>|" therefore
	 * it is deemed possible for a boundary to pass through (into or out of)
	 * the DIV element without the boundary being moved visually.
	 *
	 * The same is not true with single-tag elements like textnode and IMG
	 * elements:
	 *
	 * "|foo" is not visually the same as "f|oo".
	 *
	 * Nor is "|<img>" visually the same as "<img>|"
	 *
	 * Visible text nodes and void-type (blocks) nodes are therefore deemed as
	 * nodes that we cannot pass through.
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function canPassThrough(node) {
		return !(Dom.isTextNode(node) || isVoidType(node)) || isUnrendered(node);
	}

	/**
	 * Steps from one node boundary to the next until we reach a node that we
	 * cannot step into or out of without causing the visual position of
	 * `boundary` to change.
	 *
	 * @param  {Boundary} boundary
	 * @param  {function(Boundary):Node} nextNode
	 * @param  {function(Boundary):Boundary} nextBoundary
	 * @return {Object}
	 */
	function nextVisiblePosition(boundary, nextNode, nextBoundary) {
		var crossedVisualBreak = false;
		while (boundary) {
			var node = nextNode(boundary);

			//   .-- node --.
			//   |          |
			//   v          v
			// |<p>   or |</h1>
			//  <p>|  or  </h1>|
			crossedVisualBreak = crossedVisualBreak
					|| (hasLinebreakingStyle(node) && isRendered(node));

			if (!canPassThrough(node) || Dom.isEditingHost(node)) {
				break;
			}

			boundary = nextBoundary(boundary);
		}
		return {
			boundary           : boundary,
			crossedVisualBreak : crossedVisualBreak
		};
	}

	/**
	 * Returns the an node/offset namedtuple of the next visible position in
	 * the document.
	 *
	 * The next visible position is always the next visible character, or the
	 * next visible line break or space.
	 *
	 * @param  {Boundary} boundary
	 * @return {Object}
	 */
	function stepVisualBoundary(boundary, steps) {
		// Inside of text node
		//
		// <#te|xt>
		if (Boundaries.isTextBoundary(boundary)) {
			return steps.nextCharacter(boundary)
			    || stepVisualBoundary(steps.stepBoundary(boundary), steps);
		}

		var move = nextVisiblePosition(
			boundary,
			steps.nodeAt,
			steps.stepBoundary
		);

		var next = move.boundary;
		var crossedVisualBreak = move.crossedVisualBreak;
		var node = steps.adjacentNode(next);

		// At start or end of block
		//
		//       <    >
		// <host>| or |</host>
		//    <p>| or |</p>
		if (!node) {
			return next;
		}

		// Before void element
		//
		//   .------- node -------.
		//   |                    |
		//   v  <              >  v
		//  <br>|<b>   or   <b>|<br>
		//
		//   .------- node -------.
		//   |                    |
		//   v  <              >  v
		// <img>|<div> or <div>|<img>
		if (isVoidType(node)) {
			return Boundaries.stepWhile(steps.stepBoundary(next), function (pos) {
				var node = steps.nodeAt(pos);
				return canPassThrough(node) && !Dom.isEditingHost(node);
			}, steps.stepBoundary);
		}

		// If crossedVisualBreak
		//
		//    .-------- node --------.
		//    |                      |
		//    v   <              >   v
		// <#text>|<div> or <div>|<#text>
		//
		// else
		//
		//    .-------- node --------.
		//    |                      |
		//    v   <              >   v
		// <#text>|<b>   or   <b>|<#text>
		return crossedVisualBreak ? next : steps.stepVisualBoundary(node);
	}

	/**
	 * Like Boundaries.next() except that is accomodates void-type nodes.
	 *
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function stepForward(boundary) {
		if (Boundaries.isNodeBoundary(boundary)) {
			var node = Boundaries.nodeAfter(boundary);
			if (node && isVoidType(node)) {
				return Boundaries.create(node.parentNode, Dom.nodeIndex(node) + 1);
			}
		}
		return Boundaries.next(boundary);
	}

	/**
	 * Like Boundaries.prev() except that is accomodates void-type nodes.
	 *
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function stepBackward(boundary) {
		if (Boundaries.isNodeBoundary(boundary)) {
			var node = Boundaries.nodeBefore(boundary);
			if (node && isVoidType(node)) {
				return Boundaries.fromNode(node);
			}
		}
		return Boundaries.prev(boundary);
	}

	var forwardSteps = {
		nextCharacter : nextCharacterBoundary,
		stepBoundary  : stepForward,
		adjacentNode  : Boundaries.nodeAfter,
		nodeAt        : Boundaries.nextNode,
		followingSibling: function followingSibling(node) {
			return node.nextSibling;
		},
		stepVisualBoundary: function stepVisualBoundary(node) {
			return nextVisualBoundary(Boundaries.raw(node, 0));
		}
	};

	var backwardSteps = {
		nextCharacter : prevCharacterBoundary,
		stepBoundary  : stepBackward,
		adjacentNode  : Boundaries.nodeBefore,
		nodeAt        : Boundaries.prevNode,
		followingSibling: function followingSibling(node) {
			return node.previousSibling;
		},
		stepVisualBoundary: function stepVisualBoundary(node) {
			return prevVisualBoundary(Boundaries.raw(node, Dom.nodeLength(node)));
		}
	};

	/**
	 * Steps to the next visual boundary ahead of the given boundary.
	 *
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function nextVisualBoundary(boundary) {
		return stepVisualBoundary(boundary, forwardSteps);
	}

	/**
	 * Steps to the next visual boundary behind of the given boundary.
	 *
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function prevVisualBoundary(boundary) {
		return stepVisualBoundary(boundary, backwardSteps);
	}

	/**
	 * Tag names which represent elements that do not imply a word boundary.
	 *
	 * eg: <b>bar</b>camp where there is no word boundary in "barcamp".
	 *
	 * In HTML5 parlance, these would be many of those elements that fall in
	 * the category of "Text Level Semantics":
	 * http://www.w3.org/TR/html5/text-level-semantics.html
	 *
	 * @type {Object.<string, boolean>}
	 */
	var IN_WORD_TAGS = {
		'A'       : true,
		'ABBR'    : true,
		'B'       : true,
		'CITE'    : true,
		'CODE'    : true,
		'DEL'     : true,
		'EM'      : true,
		'I'       : true,
		'INS'     : true,
		'S'       : true,
		'SMALL'   : true,
		'SPAN'    : true,
		'STRONG'  : true,
		'SUB'     : true,
		'SUP'     : true,
		'U'       : true,
		'#text'   : true
	};

	/**
	 * Characters that delimit boundaries of words.
	 *
	 * These include whitespaces, hyphens, and punctuation.
	 *
	 * @type {Array.<string>}
	 */
	var wordChars = [
		'\u0041-', '\u005A', '\u0061-', '\u007A', '\u00AA', '\u00B5', '\u00BA',
		'\u00C0-', '\u00D6', '\u00D8-', '\u00F6', '\u00F8-',

		'\u02C1',  '\u02C6-', '\u02D1', '\u02E0-', '\u02E4', '\u02EC', '\u02EE',
		'\u0370-', '\u0374',  '\u0376', '\u0377',  '\u037A-', '\u037D',
		'\u0386',  '\u0388-', '\u038A', '\u038C',  '\u038E-', '\u03A1',
		'\u03A3-', '\u03F5', '\u03F7-', '\u0481', '\u048A-', '\u0525',
		'\u0531-', '\u0556', '\u0559', '\u0561-', '\u0587', '\u05D0-', '\u05EA',
		'\u05F0-', '\u05F2', '\u0621-', '\u064A', '\u066E', '\u066F', '\u0671-',
		'\u06D3', '\u06D5', '\u06E5', '\u06E6', '\u06EE', '\u06EF', '\u06FA-',
		'\u06FC', '\u06FF', '\u0710', '\u0712-', '\u072F', '\u074D-', '\u07A5',
		'\u07B1', '\u07CA-', '\u07EA', '\u07F4', '\u07F5', '\u07FA', '\u0800-',
		'\u0815', '\u081A', '\u0824', '\u0828', '\u0904-', '\u0939', '\u093D',
		'\u0950', '\u0958-', '\u0961', '\u0971', '\u0972', '\u0979-', '\u097F',
		'\u0985-', '\u098C', '\u098F', '\u0990', '\u0993-', '\u09A8', '\u09AA-',
		'\u09B0', '\u09B2', '\u09B6-', '\u09B9', '\u09BD', '\u09CE', '\u09DC',
		'\u09DD', '\u09DF-', '\u09E1', '\u09F0', '\u09F1',

		'\u0A05-', '\u0A0A', '\u0A0F', '\u0A10', '\u0A13-', '\u0A28', '\u0A2A-',
		'\u0A30', '\u0A32', '\u0A33', '\u0A35', '\u0A36', '\u0A38', '\u0A39',
		'\u0A59-', '\u0A5C', '\u0A5E', '\u0A72-', '\u0A74', '\u0A85-', '\u0A8D',
		'\u0A8F-', '\u0A91', '\u0A93-', '\u0AA8', '\u0AAA-', '\u0AB0', '\u0AB2',
		'\u0AB3', '\u0AB5-', '\u0AB9', '\u0ABD', '\u0AD0', '\u0AE0', '\u0AE1',

		'\u0B05-', '\u0B0C', '\u0B0F', '\u0B10', '\u0B13-', '\u0B28', '\u0B2A-',
		'\u0B30', '\u0B32', '\u0B33', '\u0B35-', '\u0B39', '\u0B3D', '\u0B5C',
		'\u0B5D', '\u0B5F-', '\u0B61', '\u0B71', '\u0B83', '\u0B85-', '\u0B8A',
		'\u0B8E-', '\u0B90', '\u0B92-', '\u0B95', '\u0B99', '\u0B9A', '\u0B9C',
		'\u0B9E', '\u0B9F', '\u0BA3', '\u0BA4', '\u0BA8-', '\u0BAA', '\u0BAE-',
		'\u0BB9', '\u0BD0',

		'\u0C05-', '\u0C0C', '\u0C0E-', '\u0C10', '\u0C12-', '\u0C28',
		'\u0C2A-', '\u0C33', '\u0C35-', '\u0C39', '\u0C3D', '\u0C58', '\u0C59',
		'\u0C60', '\u0C61', '\u0C85-', '\u0C8C', '\u0C8E-', '\u0C90', '\u0C92-',
		'\u0CA8', '\u0CAA-', '\u0CB3', '\u0CB5-', '\u0CB9', '\u0CBD', '\u0CDE',
		'\u0CE0', '\u0CE1',

		'\u0D05-', '\u0D0C', '\u0D0E-', '\u0D10', '\u0D12-', '\u0D28',
		'\u0D2A-', '\u0D39', '\u0D3D', '\u0D60', '\u0D61', '\u0D7A-', '\u0D7F',
		'\u0D85-', '\u0D96', '\u0D9A-', '\u0DB1', '\u0DB3-', '\u0DBB', '\u0DBD',
		'\u0DC0-', '\u0DC6',

		'\u0E01-', '\u0E30', '\u0E32', '\u0E33', '\u0E40-', '\u0E46', '\u0E81',
		'\u0E82', '\u0E84', '\u0E87', '\u0E88', '\u0E8A', '\u0E8D', '\u0E94-',
		'\u0E97', '\u0E99-', '\u0E9F', '\u0EA1-', '\u0EA3', '\u0EA5', '\u0EA7',
		'\u0EAA', '\u0EAB', '\u0EAD-', '\u0EB0', '\u0EB2', '\u0EB3', '\u0EBD',
		'\u0EC0-', '\u0EC4', '\u0EC6', '\u0EDC', '\u0EDD',

		'\u0F00', '\u0F40-', '\u0F47', '\u0F49-', '\u0F6C', '\u0F88-', '\u0F8B',

		'\u1000-', '\u102A', '\u103F', '\u1050-', '\u1055', '\u105A-', '\u105D',
		'\u1061', '\u1065', '\u1066', '\u106E-', '\u1070', '\u1075-', '\u1081',
		'\u108E', '\u10A0-', '\u10C5', '\u10D0-', '\u10FA', '\u10FC',

		'\u1100-', '\u1248', '\u124A-', '\u124D', '\u1250-', '\u1256', '\u1258',
		'\u125A-', '\u125D', '\u1260-', '\u1288', '\u128A-', '\u128D',
		'\u1290-', '\u12B0', '\u12B2-', '\u12B5', '\u12B8-', '\u12BE', '\u12C0',
		'\u12C2-', '\u12C5', '\u12C8-', '\u12D6', '\u12D8-', '\u1310',
		'\u1312-', '\u1315', '\u1318-', '\u135A', '\u1380-', '\u138F',
		'\u13A0-', '\u13F4', '\u1401-', '\u166C', '\u166F-', '\u167F',
		'\u1681-', '\u169A', '\u16A0-', '\u16EA', '\u1700-', '\u170C',
		'\u170E-', '\u1711', '\u1720-', '\u1731', '\u1740-', '\u1751',
		'\u1760-', '\u176C', '\u176E-', '\u1770', '\u1780-', '\u17B3', '\u17D7',
		'\u17DC', '\u1820-', '\u1877', '\u1880-', '\u18A8', '\u18AA', '\u18B0-',
		'\u18F5', '\u1900-', '\u191C', '\u1950-', '\u196D', '\u1970-', '\u1974',
		'\u1980-', '\u19AB', '\u19C1-', '\u19C7',

		'\u1A00-', '\u1A16', '\u1A20-', '\u1A54', '\u1AA7', '\u1B05-', '\u1B33',
		'\u1B45-', '\u1B4B', '\u1B83-', '\u1BA0', '\u1BAE', '\u1BAF', '\u1C00-',
		'\u1C23', '\u1C4D-', '\u1C4F', '\u1C5A-', '\u1C7D', '\u1CE9-', '\u1CEC',
		'\u1CEE-', '\u1CF1', '\u1D00-', '\u1DBF', '\u1E00-', '\u1F15',
		'\u1F18-', '\u1F1D', '\u1F20-', '\u1F45', '\u1F48-', '\u1F4D',
		'\u1F50-', '\u1F57', '\u1F59', '\u1F5B', '\u1F5D', '\u1F5F-', '\u1F7D',
		'\u1F80-', '\u1FB4', '\u1FB6-', '\u1FBC', '\u1FBE', '\u1FC2-', '\u1FC4',
		'\u1FC6-', '\u1FCC', '\u1FD0-', '\u1FD3', '\u1FD6-', '\u1FDB',
		'\u1FE0-', '\u1FEC', '\u1FF2-', '\u1FF4', '\u1FF6-', '\u1FFC',

		'\u2071', '\u207F', '\u2090-', '\u2094', '\u2102', '\u2107', '\u210A-',
		'\u2113', '\u2115', '\u2119-', '\u211D', '\u2124', '\u2126', '\u2128',
		'\u212A-', '\u212D', '\u212F-', '\u2139', '\u213C-', '\u213F',
		'\u2145-', '\u2149', '\u214E', '\u2183', '\u2184', '\u2C00-', '\u2C2E',
		'\u2C30-', '\u2C5E', '\u2C60-', '\u2CE4', '\u2CEB-', '\u2CEE',
		'\u2D00-', '\u2D25', '\u2D30-', '\u2D65', '\u2D6F', '\u2D80-', '\u2D96',
		'\u2DA0-', '\u2DA6', '\u2DA8-', '\u2DAE', '\u2DB0-', '\u2DB6',
		'\u2DB8-', '\u2DBE', '\u2DC0-', '\u2DC6', '\u2DC8-', '\u2DCE',
		'\u2DD0-', '\u2DD6', '\u2DD8-', '\u2DDE', '\u2E2F',

		'\u3005', '\u3006', '\u3031-', '\u3035', '\u303B', '\u303C', '\u3041-',
		'\u3096', '\u309D-', '\u309F', '\u30A1-', '\u30FA', '\u30FC-', '\u30FF',
		'\u3105-', '\u312D', '\u3131-', '\u318E', '\u31A0-', '\u31B7',
		'\u31F0-', '\u31FF', '\u3400-',

		'\u4DB5', '\u4E00-',

		'\u9FCB',

		'\uA000-', '\uA48C', '\uA4D0-', '\uA4FD', '\uA500-', '\uA60C',
		'\uA610-', '\uA61F', '\uA62A', '\uA62B', '\uA640-', '\uA65F', '\uA662-',
		'\uA66E', '\uA67F-', '\uA697', '\uA6A0-', '\uA6E5', '\uA717-', '\uA71F',
		'\uA722-', '\uA788', '\uA78B', '\uA78C', '\uA7FB-', '\uA801', '\uA803-',
		'\uA805', '\uA807-', '\uA80A', '\uA80C-', '\uA822', '\uA840-', '\uA873',
		'\uA882-', '\uA8B3', '\uA8F2-', '\uA8F7', '\uA8FB', '\uA90A-', '\uA925',
		'\uA930-', '\uA946', '\uA960-', '\uA97C', '\uA984-', '\uA9B2', '\uA9CF',
		'\uAA00-', '\uAA28', '\uAA40-', '\uAA42', '\uAA44-', '\uAA4B',
		'\uAA60-', '\uAA76', '\uAA7A', '\uAA80-', '\uAAAF', '\uAAB1', '\uAAB5',
		'\uAAB6', '\uAAB9-', '\uAABD', '\uAAC0', '\uAAC2', '\uAADB-', '\uAADD',
		'\uABC0-', '\uABE2', '\uAC00-',

		'\uD7A3', '\uD7B0-', '\uD7C6', '\uD7CB-', '\uD7FB',

		'\uF900-', '\uFA2D', '\uFA30-', '\uFA6D', '\uFA70-', '\uFAD9',
		'\uFB00-', '\uFB06', '\uFB13-', '\uFB17', '\uFB1D', '\uFB1F-', '\uFB28',
		'\uFB2A-', '\uFB36', '\uFB38-', '\uFB3C', '\uFB3E', '\uFB40', '\uFB41',
		'\uFB43', '\uFB44', '\uFB46-', '\uFBB1', '\uFBD3-', '\uFD3D', '\uFD50-',
		'\uFD8F', '\uFD92-', '\uFDC7', '\uFDF0-', '\uFDFB', '\uFE70-', '\uFE74',
		'\uFE76-', '\uFEFC', '\uFF21-', '\uFF3A', '\uFF41-', '\uFF5A',
		'\uFF66-', '\uFFBE', '\uFFC2-', '\uFFC7', '\uFFCA-', '\uFFCF',
		'\uFFD2-', '\uFFD7', '\uFFDA-', '\uFFDC'
	].join('');

	var WORD_BOUNDARY = new RegExp('[^' + wordChars + ']');

	var WORD_BOUNDARY_FROM_END = new RegExp('[^' + wordChars + '][' + wordChars + ']*$');

	function isWordbreakingNode(node) {
		return !IN_WORD_TAGS[node.nodeName];
	}

	/**
	 * Looks backwards in the node tree for the nearest word boundary position.
	 *
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function prevWordBoundary(boundary) {
		if (Boundaries.isAtStart(boundary)) {
			return isWordbreakingNode(Boundaries.container(boundary))
			     ? null
			     : prevWordBoundary(Boundaries.prev(boundary));
		}
		var node, offset;
		if (Boundaries.isNodeBoundary(boundary)) {
			node = Boundaries.nodeBefore(boundary);
			if (isWordbreakingNode(node)) {
				return null;
			}
			if (!Dom.isTextNode(node)) {
				return prevWordBoundary(Boundaries.prev(boundary));
			}
			offset = Dom.nodeLength(node);
		} else {
			node = Boundaries.container(boundary);
			offset = prevSignificantOffset(boundary);
		}
		var text = node.data.substr(0, offset);
		var index = text.search(WORD_BOUNDARY_FROM_END);
		if (-1 === index) {
			var prev = Boundaries.prev(boundary);
			return prevWordBoundary(prev) || prev;
		}
		return (offset === index + 1)
			 // Because `text` may end with punctuation or trailing space
		     ? Boundaries.create(node, index)
		     : Boundaries.create(node, index + 1);
	}

	/**
	 * Looks forwards in the node tree for the nearest word boundary position.
	 *
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function nextWordBoundary(boundary) {
		if (Boundaries.isAtEnd(boundary)) {
			return isWordbreakingNode(Boundaries.container(boundary))
			     ? null
			     : nextWordBoundary(Boundaries.next(boundary));
		}
		var node, offset;
		if (Boundaries.isNodeBoundary(boundary)) {
			node = Boundaries.nodeAfter(boundary);
			if (isWordbreakingNode(node)) {
				return null;
			}
			if (!Dom.isTextNode(node)) {
				return nextWordBoundary(Boundaries.next(boundary));
			}
			offset = 0;
		} else {
			node = Boundaries.container(boundary);
			offset = nextSignificantOffset(boundary);
		}
		var text = node.data.substr(offset);
		var index = text.search(WORD_BOUNDARY);
		if (-1 === index) {
			var next = Boundaries.next(boundary);
			return nextWordBoundary(next) || next;
		}
		return (0 === index)
		     // Because `text` may start with punctuation or trailing space
		     ? Boundaries.create(node, offset + index + 1)
		     : Boundaries.create(node, offset + index);
	}

	/**
	 * Returns the next boundary position that is visually behind the given
	 * boundary.
	 *
	 * @param  {Boundary} boundary
	 * @param  {string=}  stride   One of "char", "word", or "visual" (default)
	 * @return {Boundary}
	 */
	function prev(boundary, stride) {
		switch (stride) {
		case 'char':
			return prevCharacterBoundary(boundary);
		case 'word':
			return prevWordBoundary(boundary);
		default:
			return prevVisualBoundary(boundary);
		}
	}

	/**
	 * Returns the next boundary position that is visually ahead the given
	 * boundary.
	 *
	 * @param  {Boundary} boundary
	 * @param  {string=}  stride   One of "char", "word", or "visual" (default)
	 * @return {Boundary}
	 */
	function next(boundary, stride) {
		switch (stride) {
		case 'char':
			return nextCharacterBoundary(boundary);
		case 'word':
			return nextWordBoundary(boundary);
		default:
			return nextVisualBoundary(boundary);
		}
	}

	function isAtEnd(boundary) {
		if (Boundaries.isAtEnd(boundary)) {
			return true;
		}
		if (Boundaries.isNodeBoundary(boundary)) {
			return false;
		}
		var textnode = Boundaries.nextNode(boundary);
		var next = Traversing.nextWhile(textnode, isUnrendered);
		if (next && next !== textnode) {
			return false;
		}
		return !NOT_WSP.test(textnode.data.substr(Boundaries.offset(boundary)));
	}

	function isAtStart(boundary) {
		if (Boundaries.isAtStart(boundary)) {
			return true;
		}
		if (Boundaries.isNodeBoundary(boundary)) {
			return false;
		}
		var textnode = Boundaries.nextNode(boundary);
		var next = Traversing.prevWhile(textnode, isUnrendered);
		if (next && next !== textnode) {
			return false;
		}
		return !NOT_WSP.test(textnode.data.substr(0, Boundaries.offset(boundary)));

	}

	function nextNode(boundary) {
		var node = Boundaries.nextNode(boundary);
		return isAtEnd(boundary) ? node.parentNode : node;
	}

	function prevNode(boundary) {
		var node = Boundaries.prevNode(boundary);
		return isAtStart(boundary) ? node.parentNode : node;
	}

	return {
		isRendered                    : isRendered,
		isUnrendered                  : isUnrendered,
		isUnrenderedWhitespace        : isUnrenderedWhitespace,

		isStyleInherited              : isStyleInherited,
		hasBlockStyle                 : hasBlockStyle,
		hasInlineStyle                : hasInlineStyle,
		hasLinebreakingStyle          : hasLinebreakingStyle,
		isWhiteSpacePreserveStyle     : isWhiteSpacePreserveStyle,

		skipUnrenderedToStartOfLine   : skipUnrenderedToStartOfLine,
		skipUnrenderedToEndOfLine     : skipUnrenderedToEndOfLine,

		normalizeBoundary             : normalizeBoundary,

		isAtEnd                       : isAtEnd,
		isAtStart                     : isAtStart,
		isEmpty                       : isEmpty,
		isVisuallyAdjacent            : isVisuallyAdjacent,

		insertVisualBreak             : insertVisualBreak,
		insertLineBreak               : insertLineBreak,
		removeVisualBreak             : removeVisualBreak,

		nextLineBreak                 : nextLineBreak,

		prop                          : prop,

		prev                          : prev,
		next                          : next,

		prevVisualBoundary            : prevVisualBoundary,
		nextVisualBoundary            : nextVisualBoundary,

		prevCharacterBoundary         : prevCharacterBoundary,
		nextCharacterBoundary         : nextCharacterBoundary,

		prevWordBoundary              : prevWordBoundary,
		nextWordBoundary              : nextWordBoundary,

		prevSignificantOffset         : prevSignificantOffset,
		nextSignificantOffset         : nextSignificantOffset,

		prevNode                      : prevNode,
		nextNode                      : nextNode,

		nextVisiblePosition           : nextVisiblePosition,

		areNextWhiteSpacesSignificant : areNextWhiteSpacesSignificant
	};
});
