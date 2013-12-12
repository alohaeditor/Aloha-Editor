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
	'strings',
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
	Strings,
	Asserts
) {
	'use strict';

	/**
	 * Tags representing non-block-level elements which are nevertheless line
	 * breaking.
	 *
	 * @private
	 * @type {Object.<string, boolean}
	 */
	var LINE_BREAKING_VOID_ELEMENTS = {
		'BR'  : true,
		'HR'  : true,
		'IMG' : true
	};

	/**
	 * Tags representing list container elements.
	 *
	 * @private
	 * @type {Object.<string, boolean}
	 */
	var LIST_CONTAINERS = {
		'OL'   : true,
		'UL'   : true,
		'DL'   : true,
		'MENU' : true
	};

	/**
	 * Tags representing list item elements.
	 *
	 * @private
	 * @type {Object.<string, boolean}
	 */
	var LIST_ITEMS = {
		'LI' : true,
		'DT' : true,
		'DD' : true
	};

	/**
	 * Tags representing elements which cannot be used as range containers.
	 *
	 * It is impossible to have the browser to maintain a selection inside any
	 * of these elements.
	 *
	 * If a range is to be set inside of a list element, for example, the range
	 * would have to use one of UL's or OL's children (LI) elements as its
	 * start or end container.
	 *
	 * @pravate
	 * @type {Object.<string, boolean>}
	 */
	var INVALID_RANGE_CONTAINERS = {
		// List containers
		'OL'       : true,
		'UL'       : true,
		'DL'       : true,
		'MENU'     : true,

		// Table layout containers
		'TABLE'    : true,
		'COLGROUP' : true,
		'THEAD'    : true,
		'TBODY'    : true,
		'TFOOT'    : true,
		'TR'       : true,

		// Dropdown menu containers
		'DATALIST' : true,
		'SELECT'   : true,
		'OPTION'   : true,
		'OPTGROUP' : true,

		// Code container
		'SCRIPT'   : true,
		'STYLE'    : true,

		// Void Elements
		'AREA'     : true,
		'BASE'     : true,
		'BR'       : true,
		'COL'      : true,
		'COMMAND'  : true,
		'EMBED'    : true,
		'HR'       : true,
		'IMG'      : true,
		'INPUT'    : true,
		'KEYGEN'   : true,
		'LINK'     : true,
		'META'     : true,
		'PARAM'    : true,
		'SOURCE'   : true,
		'TRACK'    : true,
		'WBR'      : true
	};

	/**
	 * Tags which represent elements that do not imply a word boundary.
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
	 * @return {Boolean}
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
	 * @param  {Node} node
	 * @return {Boolean}
	 */
	function hasInlineStyle(node) {
		return !hasBlockStyle(node);
	}

	/**
	 * Returns true for nodes that introduce linebreaks.
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
	 * Checks whether the given node should be treated like a void element.
	 *
	 * Void elements like IMG and INPUT are considered as void type, but so are
	 * "block" (elements inside of editale regions that are not themselves
	 * editable).
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function isVoidType(node) {
		return Predicates.isVoidNode(node) || !Dom.isEditableNode(node);
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
	 * Returns true if the given node is unrendered whitespace, with the caveat
	 * that it only examines the given node and not any siblings.  An additional
	 * check is necessary to determine whether the node occurs after/before a
	 * linebreaking node.
	 *
	 * Taken from
	 * http://code.google.com/p/rangy/source/browse/trunk/src/js/modules/rangy-cssclassapplier.js
	 * under the MIT license.
	 *
	 * @private
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function isUnrenderedWhitespaceNoBlockCheck(node) {
		if (3 !== node.nodeType) {
			return false;
		}
		if (!node.length) {
			return true;
		}
		if (Strings.NOT_SPACE.test(node.nodeValue)) {
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
	 * @param {Node} node
	 * @retur {boolean}
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
	 * @param {Element} elem
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
	 * Creates a function that will insert the nodes that are passed to it at
	 * the given boundary, if it is valid to do so.
	 *
	 * Returns true unless insertion fails because it is deemed invalid.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {function(Node, OutParameter):boolean}
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
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function isTransferable(node) {
		return !hasLinebreakingStyle(node);
	}

	/**
	 * Finds a suitable container in which to move nodes that are to the right of
	 * `breaker` when removing a visual line break.
	 *
	 * @private
	 * @param  {Node} linebreak
	 * @return {Node}
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
	 * @param  {Node} node
	 * @param  {OutParameter(boolean):boolean} out_continueMoving
	 * @return {boolean}
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
	 * @param  {Element} br
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
			(prev && ('BR' === prev.nodeName || !hasLinebreakingStyle(prev)))
			&&
			(next && ('BR' === next.nodeName || !hasLinebreakingStyle(next)))
		);

		significant = significant || (
			(prev && ('BR' === prev.nodeName))
			||
			(next && ('BR' === next.nodeName))
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
	 * @return {?Boundary}
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

	var zwChars = Strings.ZERO_WIDTH_CHARACTERS.join('');
	var breakingWhiteSpaces = Arrays.difference(
		Strings.WHITE_SPACE_CHARACTERS,
		Strings.NON_BREAKING_SPACE_CHARACTERS
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
	 * @return {?Boundary}
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
	 * @return {?Boundary}
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
				return Boundaries.jumpOver(boundary);
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

	function isWordbreakingNode(node) {
		return !IN_WORD_TAGS[node.nodeName];
	}

	/**
	 * Looks backwards in the node tree for the nearest word boundary position.
	 *
	 * @param  {Boundary} boundary
	 * @return {?Boundary}
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
		var index = text.search(Strings.WORD_BOUNDARY_FROM_END);
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
	 * Checks whether the given boundary is immediately followed by a
	 * Strings.WHITE_SPACE character.
	 *
	 * Example:
	 *
	 * "foo] bar"        (true)
	 * "foo ]bar"        (false)
	 * "<i>foo</i>} bar" (true)
	 * "<i>foo}</i> bar  (false)
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {boolean}
	 */
	function isBeforeWhiteSpace(boundary) {
		boundary = Boundaries.normalize(boundary);
		var node, offset;
		if (Boundaries.isTextBoundary(boundary)) {
			node = Boundaries.container(boundary);
			offset = Boundaries.offset(boundary);
			return Strings.WHITE_SPACE.test(node.data.charAt(offset));
		}
		node = Boundaries.nodeAfter(boundary);
		if (!node || !Dom.isTextNode(node)) {
			return false;
		}
		return Strings.WHITE_SPACE.test(node.data.charAt(0));
	}

	/**
	 * Checks whether the given text boundary is immediately preceeded by
	 * a Strings.WHITE_SPACE character.
	 *
	 * Example:
	 *
	 * "foo [bar"        (true)
	 * "foo[ bar"        (false)
	 * "foo {<i>bar</i>" (true)
	 * "foo <i>{bar</i>" (false)
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {boolean}
	 */
	function isAfterWhiteSpace(boundary) {
		boundary = Boundaries.normalize(boundary);
		var node, offset;
		if (Boundaries.isTextBoundary(boundary)) {
			node = Boundaries.container(boundary);
			offset = Boundaries.offset(boundary) - 1;
			return Strings.WHITE_SPACE.test(node.data.charAt(offset));
		}
		node = Boundaries.nodeBefore(boundary);
		if (!node || !Dom.isTextNode(node)) {
			return false;
		}
		return Strings.WHITE_SPACE.test(node.data.substr(-1));
	}

	function isVisibleNodeBoundary(boundary) {
		var node = Boundaries.container(boundary);
		if (INVALID_RANGE_CONTAINERS[node.nodeName]) {
			return false;
		}
		if (isUnrendered(node)) {
			return false;
		}
		if (Boundaries.isAtEnd(boundary)) {
			var before = Boundaries.nodeBefore(boundary);
			return !before || !hasLinebreakingStyle(Traversing.prevWhile(before, isUnrendered));
		}
		return true;
	}

	function normalizeBoundary(boundary) {
		if (Boundaries.isNodeBoundary(boundary)) {
			while (!isVisibleNodeBoundary(boundary) || isUnrendered(Boundaries.nextNode(boundary))) {
				boundary = Boundaries.next(boundary);
			}
			return boundary;
		}
		if (Boundaries.isAtRawEnd(boundary)) {
			return boundary;
		}
		var offset = nextSignificantOffset(boundary);
		if (-1 === offset) {
			return Boundaries.nextRawBoundary(boundary);
		}
		if (offset === Boundaries.offset(boundary)) {
			return boundary;
		}
		return Boundaries.raw(Boundaries.container(boundary), offset);
	}

	/**
	 * Returns the next word boundary offset ahead of the given text boundary.
	 *
	 * Returns -1 if no word boundary is found.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {number}
	 */
	function nextWordBoundaryOffset(boundary) {
		var node   = Boundaries.container(boundary);
		var offset = Boundaries.offset(boundary);
		var text   = node.data.substr(offset);
		var index  = text.search(Strings.WORD_BOUNDARY);
		if (-1 === index) {
			return -1;
		}
		// Because text right after the boundary may have started with a word
		// boundary
		if (0 === index) {
			return offset + index + 1;
		}
		return offset + index;
	}

	/**
	 * Returns the next word boundary offset behind the given text boundary.
	 *
	 * Returns -1 if no word boundary is found.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {number}
	 */
	function prevWordBoundaryOffset(boundary) {
		var node   = Boundaries.container(boundary);
		var offset = Boundaries.offset(boundary);
		var text   = node.data.substr(0, offset);
		var index  = text.search(Strings.WORD_BOUNDARY_FROM_END);
		if (-1 === index) {
			return -1;
		}
		// Because text right before the boundary may have ended with a word
		// boundary
		if (offset === index + 1) {
			return index;
		}
		return index + 1;
	}

	/**
	 * Returns the next word boundary position.
	 *
	 * This will always be a position in front of a word or punctuation, but
	 * never in front of a space.
	 *
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function nextWordBoundary(boundary) {
		boundary = normalizeBoundary(boundary);
		if (Boundaries.isNodeBoundary(boundary)) {
			var node = Boundaries.nextNode(boundary);
			if (isVoidType(node)) {
				return normalizeBoundary(Boundaries.jumpOver(boundary));
			}
			if (hasLinebreakingStyle(node)) {
				return normalizeBoundary(Boundaries.next(boundary));
			}
			return nextWordBoundary(Boundaries.nextRawBoundary(boundary));
		}
		if (Boundaries.isAtRawEnd(boundary)) {
			return nextWordBoundary(Boundaries.nextRawBoundary(boundary));
		}
		var next;
		var offset = nextWordBoundaryOffset(boundary);
		if (-1 === offset) {
			next = Boundaries.nextRawBoundary(boundary);
			return isWordbreakingNode(Boundaries.nextNode(next)) ? next : nextWordBoundary(next);
		}
		next = Boundaries.raw(Boundaries.container(boundary), offset);
		next = normalizeBoundary(next);
		return isBeforeWhiteSpace(next) ? nextWordBoundary(next) : next;
	}

	/**
	 * Returns the previous word boundary position.
	 *
	 * This will always be a position in front of a word or punctuation, but
	 * never in front of a space.
	 *
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function prevWordBoundary(boundary) {
		var next;
		if (Boundaries.isNodeBoundary(boundary)) {
			var node = Boundaries.prevNode(boundary);
			if (isVoidType(node)) {
				return normalizeBoundary(Boundaries.fromNode(node));
			}
			if (hasLinebreakingStyle(node)) {
				return normalizeBoundary(Boundaries.prev(boundary));
			}
			next = Boundaries.prevRawBoundary(boundary);
			return isAfterWhiteSpace(next) ? normalizeBoundary(next) : prevWordBoundary(next);
		}
		if (Boundaries.isAtRawStart(boundary)) {
			return prevWordBoundary(Boundaries.prevRawBoundary(boundary));
		}
		var offset = prevWordBoundaryOffset(boundary);
		if (-1 === offset) {
			next = Boundaries.prevRawBoundary(boundary);
			return isWordbreakingNode(Boundaries.prevNode(next)) ? next : prevWordBoundary(next);
		}
		next = Boundaries.raw(Boundaries.container(boundary), offset);
		return isBeforeWhiteSpace(next) ? prevWordBoundary(next) : normalizeBoundary(next);
	}

	/**
	 * Moves the boundary backwards by a unit measure.
	 *
	 * The second parameter `unit` specifies the unit with which to move the
	 * boundary.  This value may be one of the following strings:
	 *
	 * "char" -- Move behind the next visible character.
	 *
	 * "word" -- Move behind the next word.
	 *
	 * It is the smallest semantic unit.  A word is a contigious sequence of
	 * characters terminated by a space or puncuation character or a
	 * word-breaker (in languages that do not use space to delimit word
	 * boundaries).
	 *
	 * "offset" -- Move behind the next visual offset.
	 *
	 * A visual offset is the smallest unit of consumed space.  This can be a
	 * line break, or a visible character.
	 *
	 * @param  {Boundary} boundary
	 * @param  {string=} unit Defaults to "offset"
	 * @return {Boundary}
	 */
	function prev(boundary, unit) {
		switch (unit) {
		case 'char':
			return prevCharacterBoundary(boundary);
		case 'word':
			return prevWordBoundary(boundary);
		default:
			return prevVisualBoundary(boundary);
		}
	}

	/**
	 * Moves the boundary forward by a unit measure.
	 *
	 * The second parameter `unit` specifies the unit with which to move the
	 * boundary.  This value may be one of the following strings:
	 *
	 * "char"   -- Move infront of the next visible character.
	 *
	 * "word"   -- Move infront of the next word.
	 *
	 * It is the smallest semantic unit.  A word is a contigious sequence of
	 * characters terminated by a space or puncuation character or a
	 * word-breaker (in languages that do not use space to delimit word
	 * boundaries).
	 *
	 * "offset" -- Move infront of the next visual offset.
	 *
	 * A visual offset is the smallest unit of consumed space.  This can be a
	 * line break, or a visible character.
	 *
	 * @param  {Boundary} boundary
	 * @param  {unit=}    unit Defaults to "offset"
	 * @return {Boundary}
	 */
	function next(boundary, unit) {
		switch (unit) {
		case 'char':
			return nextCharacterBoundary(boundary);
		case 'word':
			return nextWordBoundary(boundary);
		default:
			return nextVisualBoundary(boundary);
		}
	}

	/**
	 * Checks whether a boundary represents a position that at the apparent end
	 * of its container's content.
	 *
	 * Unlike Boundaries.isAtEnd(), this considers the boundary position with
	 * respect to how it is visually represented, rather than simply where it
	 * is in the DOM tree.
	 *
	 * @param  {Boundary} boundary
	 * @return {boolean}
	 */
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

	/**
	 * Checks whether a boundary represents a position that at the apparent
	 * start of its container's content.
	 *
	 * Unlike Boundaries.isAtStart(), this considers the boundary position with
	 * respect to how it is visually represented, rather than simply where it
	 * is in the DOM tree.
	 *
	 * @param  {Boundary} boundary
	 * @return {boolean}
	 */
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

	/**
	 * Like Boundaries.nextNode(), but that it considers whether a boundary is
	 * at the end position with respect to how the boundary is visual
	 * represented, rather than simply where it is in the DOM structure.
	 *
	 * @param  {Boundary} boundary
	 * @return {Node}
	 */
	function nextNode(boundary) {
		var node = Boundaries.nextNode(boundary);
		return isAtEnd(boundary) ? node.parentNode : node;
	}

	/**
	 * Like Boundaries.prevNode(), but that it considers whether a boundary is
	 * at the start position with respect to how the boundary is visual
	 * represented, rather than simply where it is in the DOM structure.
	 *
	 * @param  {Boundary} boundary
	 * @return {Node}
	 */
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
