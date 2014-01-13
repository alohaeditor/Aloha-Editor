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
	'dom/nodes',
	'dom/style',
	'dom/mutation',
	'dom',
	'mutation',
	'predicates',
	'arrays',
	'cursors',
	'content',
	'browsers',
	'boundaries',
	'dom/traversing',
	'overrides',
	'functions',
	'strings',
	'assert'
], function Html(
	Nodes,
	Style,
	DomMutation,
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
	 * @type {Object.<string, boolean>}
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
	 * @type {Object.<string, boolean>}
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
	 * @type {Object.<string, boolean>}
	 */
	var LIST_ITEMS = {
		'LI' : true,
		'DT' : true,
		'DD' : true
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
	 * @private
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
	 * Returns the previous node to the given node that is not one of it's
	 * ancestors.
	 *
	 * @param  {Node} node
	 * @return {Node}
	 */
	function prevNonAncestor(node, match, until) {
		return Traversing.nextNonAncestor(node, true, match, until || Dom.isEditingHost);
	}

	/**
	 * Returns the next node to the given node that is not one of it's
	 * ancestors.
	 *
	 * @param  {Node} node
	 * @return {Node}
	 */
	function nextNonAncestor(node, match, until) {
		return Traversing.nextNonAncestor(node, false, match, until || Dom.isEditingHost);
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
		if (!Nodes.isTextNode(node)) {
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
			cssWhiteSpace = Style.getComputedStyle(node.parentNode, 'white-space');
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
	 *
	 * @private
	 */
	function isUnrenderedAtPoint(point) {
		return (isUnrenderedWhitespaceNoBlockCheck(point.node)
				|| (Nodes.isElementNode(point.node)
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
	 * @private
	 * @param {Cursor} point
	 * @return {boolean}
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
	 * @private
	 * @param {Cursor} point
	 * @return {boolean}
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
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function isUnrenderedWhitespace(node) {
		if (!isUnrenderedWhitespaceNoBlockCheck(node)) {
			return false;
		}
		return skipUnrenderedToEndOfLine(Cursors.cursor(node, false))
		    || skipUnrenderedToStartOfLine(Cursors.cursor(node, false));
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
	 * @param  {String} styleName
	 * @return {boolean}
	 */
	function isStyleInherited(styleName) {
		return !notInheritedStyles[styleName];
	}

	/**
	 * Returns true if node is either the first or last child of its parent.
	 *
	 * @private
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function isTerminalNode(node) {
		var parent = node.parentNode;
		return parent
		    && (node === parent.firstChild || node === parent.lastChild);
	}

	/**
	 * Checks whether the given node is next to a block level element.
	 *
	 * @private
	 * @param  {Node} node
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
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function isUnrendered(node) {
		if (!node) {
			return true;
		}

		if (!Predicates.isVoidNode(node) && 0 === Nodes.nodeLength(node)) {
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
				&& 'BR' === node.nodeName
				&& isTerminalNode(node)
				&& hasLinebreakingStyle(node.parentNode)) {
			if (node.nextSibling && 'BR' === node.nextSibling.nodeName) {
				return true;
			}
			if (node.previousSibling && 'BR' === node.previousSibling.nodeName) {
				return true;
			}
			if (node.nextSibling && Traversing.nextWhile(node.nextSibling, isUnrendered)) {
				return true;
			}
			if (node.previousSibling && Traversing.prevWhile(node.previousSibling, isUnrendered)) {
				return true;
			}
			return false;
		}

		if (!maybeUnrenderedNode) {
			return false;
		}

		if (isTerminalNode(node)) {
			if (!Nodes.isTextNode(node)) {
				return false;
			}

			var inlineNode = nextNonAncestor(node, function (node) {
				return Predicates.isInlineNode(node) && isRendered(node);
			}, function (node) {
				return hasLinebreakingStyle(node) || Dom.isEditingHost(node);
			});

			return !inlineNode;
		}

		return isAdjacentToBlock(node)
		    || skipUnrenderedToEndOfLine(Cursors.create(node, false))
		    || skipUnrenderedToStartOfLine(Cursors.create(node, false));
	}

	/**
	 * Returns true of the given node is rendered.
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function isRendered(node) {
		return !isUnrendered(node);
	}

	/**
	 * Determine whether the boundary `left` is visually adjacent to `right`.
	 *
	 * @private
	 * @param  {Boundary} left
	 * @param  {Boundary} right
	 * @return {boolean}
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
				var node = Nodes.nodeAtOffset(
					Boundaries.container(pos),
					Boundaries.offset(pos) - 1
				);
				if ((Nodes.isTextNode(node) || Predicates.isVoidNode(node)) && isRendered(node)) {
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
	 * @return {boolean}
	 */
	function hasRenderedContent(node) {
		return Nodes.isTextNode(node)
		     ? !isUnrenderedWhitespaceNoBlockCheck(node)
		     : isRendered(Traversing.nextWhile(node.firstChild, isUnrendered));
	}

	/**
	 * Get the first ancestor element that is editable, beginning at the given
	 * node and climbing up through the ancestors tree.
	 *
	 * @private
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function getContentEditableElement(node) {
		return Traversing.upWhile(node, Fn.complement(Dom.isContentEditable));
	}

	/**
	 * "Props up" the given element if needed.
	 *
	 * The HTML specification specifies that empty block-level elements be not
	 * rendered.  This becomes a problem if an editing operation results in one
	 * of these elements being emptied of all its child nodes.  If this were to
	 * happen, standard conformant browsers will no longer render that empty
	 * block element even though it will remain in the document.  Because the
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
		if (!Predicates.isBlockNode(elem) || (Browsers.msie && closestEditable(elem))) {
			return;
		}
		if (!elem.firstChild || !Traversing.nextWhile(elem.firstChild, isUnrenderedWhitespace)) {
			DomMutation.insert(document.createElement('br'), elem, true);
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
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function suitableTransferTarget(node) {
		return !Predicates.isVoidNode(node)
		    && !Nodes.isTextNode(node)
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
		if (Nodes.isTextNode(ref)) {
			ref = ref.parentNode;
		}
		return function insert(node, out_inserted) {
			if (ref === node) {
				return out_inserted(true);
			}
			if (ref.nodeName === node.nodeName) {
				DomMutation.merge(ref, node);
				return out_inserted(true);
			}
			var parent = atEnd ? ref : ref.parentNode;
			if (Content.allowsNesting(parent.nodeName, node.nodeName)) {
				DomMutation.insert(node, ref, atEnd);
				DomMutation.merge(node.previousSibling, node);
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

	/* @obsolete */
	function findAncestor(node, match, until) {
		until = until || Fn.returnFalse;
		if (until(node)) {
			return null;
		}
		do {
			node = node.parentNode;
			if (!node || until(node)) {
				return null;
			}
			if (match(node)) {
				return node;
			}
		} while (node);
		return null;
	}

	/**
	 * Finds a suitable container in which to move nodes that are to the right
	 * of `breaker` when removing a visual line break.
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
	 * @private
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
	function removeBreak(above, below, context) {
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
			Traversing.climbUntil(below[0], DomMutation.remove, isVisible);
			return;
		}

		var right = Boundaries.nextNode(below);
		var parent = right.parentNode;

		if (0 === Nodes.nodeLength(right)) {
			context.overrides = context.overrides.concat(Overrides.harvest(right));
			DomMutation.remove(right);
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
			Traversing.climbUntil(parent, DomMutation.remove, isVisible);
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

	/**
	 * Checks whether that the given node is a line breaking node.
	 *
	 * @private
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function isBreakingContainer(node) {
		return !Predicates.isVoidNode(node)
		    && (hasLinebreakingStyle(node) || Dom.isEditingHost(node));
	}

	/**
	 * Checks whether the given node is an unrendered text node.
	 *
	 * @private
	 * @param {Node} node
	 * @return {boolean}
	 */
	function isUnrenderedTextNode(node) {
		return Nodes.isTextNode(node) && isUnrendered(node);
	}

	/**
	 * Wraps `ref` into `wrapper` element.
	 *
	 * @private
	 * @param {Node} node
	 * @param {Element} wrapper
	 */
	function wrapWithBreakingNode(ref, wrapper, context) {
		var first = Traversing.prevWhile(ref, function (node) {
			return node.previousSibling && hasInlineStyle(node.previousSibling);
		});
		if (first) {
			DomMutation.wrap(first, wrapper);
			DomMutation.moveSiblingsAfter(first.nextSibling, first, function (node) {
				return node === ref;
			});
			DomMutation.insert(ref, wrapper, true);
		} else {
			DomMutation.wrap(ref, wrapper);
		}
	}

	/**
	 * Checks whether or not the given BR element is significant or not.
	 *
	 * @private
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

	/**
	 * Inserts a breaking node behind the given boundary.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
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
	 * Returns the "forward position".  This is the deepest node that is
	 * visually adjacent to the newly created line.
	 *
	 * @param  {Boundary} boundary
	 * @param  {Object} context
	 * @return {?Boundary}
	 */
	function insertBreak(boundary, context) {
		var start = Boundaries.nextNode(boundary);

		// Because any nodes which are entirely after the boundary position
		// don't need to be copied but can be completely moved: "}<b>"
		var movable = Boundaries.isAtEnd(boundary) ? null : start;

		// Because if the boundary is right before a breaking container, The
		// the default new breaking element should be inserted right before it.
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
			DomMutation.insert(heirarchy || copy, parent, true);
			if (next) {
				DomMutation.moveSiblingsInto(next, parent);
			}
			heirarchy = parent;
		}

		if (!heirarchy) {
			heirarchy = anchor.cloneNode(false);
		}

		DomMutation.insertAfter(heirarchy, anchor);
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
			nodesToRemove.forEach(DomMutation.remove);
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
	 * @private
	 * @param  {Boundary} boundary Text boundary
	 * @return {boolean}
	 */
	function areNextWhiteSpacesSignificant(boundary) {
		var textnode = Boundaries.container(boundary);
		var offset = Boundaries.offset(boundary);

		if (textnode.data.substr(0, offset).search(WSP_FROM_END) > -1) {
			// Because we have preceeding whitespaces behind the given boundary
			// see rule #6
			return false;
		}

		if (0 === offset) {
			return !!prevNonAncestor(textnode, function (node) {
				return Predicates.isInlineNode(node) && isRendered(node);
			}, function (node) {
				return hasLinebreakingStyle(node) || Dom.isEditingHost(node);
			});
		}
		if (0 !== textnode.data.substr(offset).search(WSP_FROM_END)) {
			return true;
		}
		return !!nextNonAncestor(textnode, function (node) {
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

		// "" ==> return -1
		//
		// " "  or "  " or "   " ==> return 1
		//  .       ..      ...
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

		offset = (spaces < 2) ? offset : offset - spaces + 1;

		if (0 === offset) {
			return 0;
		}

		var raw = Boundaries.raw(textnode, offset - 1);
		var isAtWhiteSpace = !NOT_WSP.test(text.charAt(offset - 1));
		var isAtVisibleChar = !isAtWhiteSpace || areNextWhiteSpacesSignificant(raw);

		return isAtVisibleChar ? offset : prevSignificantOffset(raw);
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
	 * Returns the boundary of the next visible character.
	 *
	 * All insignificant characters (including "zero-width" characters are
	 * ignored).
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {?Boundary}
	 */
	function nextCharacterBoundary(boundary) {
		if (Boundaries.isNodeBoundary(boundary)) {
			return null;
		}
		var offset = nextSignificantOffset(boundary);
		if (-1 === offset) {
			return null;
		}
		return Boundaries.create(Boundaries.container(boundary), offset + 1);
	}

	/**
	 * Returns the boundary of the previous visible character from the given
	 * position in the document.
	 *
	 * All insignificant characters (including "zero-width" characters are
	 * ignored).
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {?Boundary}
	 */
	function prevCharacterBoundary(boundary) {
		if (Boundaries.isNodeBoundary(boundary)) {
			return null;
		}
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
	 * because the boundary position right in front of a B element's start tag
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
		return !(Nodes.isTextNode(node) || isVoidType(node)) || isUnrendered(node);
	}

	/**
	 * Steps from one node boundary to the next until we reach a node that we
	 * cannot step into or out of without causing the visual position of
	 * `boundary` to change.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @param  {function(Boundary):Node} nextNode
	 * @param  {function(Boundary):Boundary} nextBoundary
	 * @return {Object}
	 */
	function nextVisiblePosition(boundary, nextNode, nextBoundary) {
		var crossedVisualBreak = false;
		var node;
		while (boundary) {
			node = nextNode(boundary);

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

			do {
				boundary = nextBoundary(boundary);
			} while (isUnrendered(Boundaries.container(boundary)));
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
	 * @private
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
	 * @private
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
	 * @private
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
			return prevVisualBoundary(Boundaries.raw(node, Nodes.nodeLength(node)));
		}
	};

	/**
	 * Steps to the next visual boundary ahead of the given boundary.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function nextVisualBoundary(boundary) {
		return stepVisualBoundary(boundary, forwardSteps);
	}

	/**
	 * Steps to the next visual boundary behind of the given boundary.
	 *
	 * @private
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
	 * Moves a boundary over any insignificant positions.
	 *
	 * Insignificant boundary positions are those where the boundary is
	 * immediately before unrenderd content.  Since such content is unrendered,
	 * the boundary is rendered as though it is after the insignificant
	 * content.  This function simply moves the boundary forward so that the
	 * given boundary is infact where it seems to be visually.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function skipInsignificantPositions(boundary) {
		var next = boundary;

		if (Boundaries.isTextBoundary(next)) {
			var offset = nextSignificantOffset(next);

			// Because there may be no visible characters following the node
			// boundary in its container.
			//
			// "foo| "</p> or "foo| "" bar"
			//      .              .  .
			if (-1 === offset) {
				return skipInsignificantPositions(Boundaries.next(next));
			}

			// "|foo"
			if (Boundaries.offset(next) === offset) {
				return next;
			}

			// "foo | bar"
			//       .
			next = Boundaries.create(Boundaries.container(next), offset);
			return skipInsignificantPositions(next);
		}

		var node = Boundaries.nextNode(next);

		// |"foo" or <p>|" foo"
		//                .
		if (Nodes.isTextNode(node)) {
			return skipInsignificantPositions(Boundaries.nextRawBoundary(next));
		}

		while (!Dom.isEditingHost(node) && isUnrendered(node)) {
			next = Boundaries.next(next);
			node = Boundaries.nextNode(next);
		}

		if (hasLinebreakingStyle(node)) {
			return next;
		}

		return next;
	}

	function skipPrevInsignificantPositions(boundary) {
		var next = boundary;

		if (Boundaries.isTextBoundary(next)) {
			var offset = prevSignificantOffset(next);

			// Because there may be no visible characters following the node
			// boundary in its container.
			//
			// <p>" |foo"</p>
			//     .
			if (-1 === offset) {
				var after = Boundaries.prev(next);
				//     ,-----+-- equal
				//     |     |
				//     v     v
				// "foo "</p> </div>..
				//     .     .
				while (equals(after, next)) {
					// Because linebreaks are significant positions
					if (hasLinebreakingStyle(Boundaries.prevNode(after))) {
						break;
					}
					after = Boundaries.prev(after);
				}
				return skipPrevInsignificantPositions(after);
			}

			// "foo|"
			if (Boundaries.offset(next) === offset) {
				return next;
			}

			// "foo | bar"
			//       .
			next = Boundaries.create(Boundaries.container(next), offset);
			return skipPrevInsignificantPositions(next);
		}

		var node = Boundaries.prevNode(next);

		// <b>"foo"|</b>
		if (Nodes.isTextNode(node)) {
			return skipPrevInsignificantPositions(Boundaries.prevRawBoundary(next));
		}

		while (!Dom.isEditingHost(node) && isUnrendered(node)) {
			next = Boundaries.prev(next);
			node = Boundaries.prevNode(next);
		}

		return next;
	}

	/**
	 * Checks whether the left boundary is at the same visual position as the
	 * right boundary.
	 *
	 * @private
	 * @param  {Boundary} left
	 * @param  {Boundary} right
	 * @retufn {boolean}
	 */
	function equals(left, right) {
		var node, consumesOffset;

		left = skipInsignificantPositions(Boundaries.normalize(left));
		right = skipInsignificantPositions(Boundaries.normalize(right));

		while (left && !Boundaries.equals(left, right)) {
			node = Boundaries.nextNode(left);
			consumesOffset = isVoidType(node) || hasLinebreakingStyle(node) || Nodes.isTextNode(node);

			if (consumesOffset && isRendered(node)) {
				return false;
			}

			left = skipInsignificantPositions(Boundaries.next(left));
		}

		return true;
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
		return index + 1;
	}

	/**
	 * Returns the next word boundary position.
	 *
	 * This will always be a position in front of a word or punctuation, but
	 * never in front of a space.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function nextWordBoundary(boundary) {
		var node, next;

		if (Boundaries.isNodeBoundary(boundary)) {
			node = Boundaries.nextNode(boundary);
			next = Boundaries.nextRawBoundary(boundary);

			//         .---- node ----.
			//         |              |
			//         v              v
			// "foo"|</p> or "foo"|<input>
			if (isWordbreakingNode(node)) {
				return boundary;
			}

			return nextWordBoundary(next);
		}

		var offset = nextWordBoundaryOffset(boundary);

		// Because there may be no word boundary ahead of `offset` in the
		// boundary's container, we need to step out of the text node to
		// continue looking forward.
		//
		// "fo|o" or "foo|"
		if (-1 === offset) {
			next = Boundaries.next(boundary);
			node = Boundaries.nextNode(next);

			//         .---- node ----.
			//         |              |
			//         v              v
			// "foo"|</p> or "foo"|<input>
			if (isWordbreakingNode(node)) {
				return next;
			}

			return nextWordBoundary(next);
		}

		if (offset === Boundaries.offset(boundary)) {
			return boundary;
		}

		return Boundaries.raw(Boundaries.container(boundary), offset);
	}

	/**
	 * Returns the previous word boundary position.
	 *
	 * This will always be a position in front of a word or punctuation, but
	 * never in front of a space.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function prevWordBoundary(boundary) {
		var node, prev;

		if (Boundaries.isNodeBoundary(boundary)) {
			node = Boundaries.prevNode(boundary);
			prev = Boundaries.prevRawBoundary(boundary);

			//         .---- node ----.
			//         |              |
			//         v              v
			// "foo"|</p> or "foo"|<input>
			if (isWordbreakingNode(node)) {
				return boundary;
			}

			return prevWordBoundary(prev);
		}

		var offset = prevWordBoundaryOffset(boundary);

		// Because there may be no word boundary behind of `offset` in the
		// boundary's container, we need to step out of the text node to
		// continue looking backward.
		//
		// "fo|o" or "foo|"
		if (-1 === offset) {
			prev = Boundaries.prev(boundary);
			node = Boundaries.prevNode(prev);

			//         .---- node ----.
			//         |              |
			//         v              v
			// "foo"|</p> or "foo"|<input>
			if (isWordbreakingNode(node)) {
				return prev;
			}

			return prevWordBoundary(prev);
		}

		if (offset === Boundaries.offset(boundary)) {
			return boundary;
		}

		return Boundaries.raw(Boundaries.container(boundary), offset);
	}

	/**
	 * Moves the boundary forward by a unit measure.
	 *
	 * The second parameter `unit` specifies the unit with which to move the
	 * boundary.  This value may be one of the following strings:
	 *
	 * "char" -- Move in front of the next visible character.
	 *
	 * "word" -- Move in front of the next word.
	 *
	 *		A word is the smallest semantic unit.  It is a contigious sequence
	 *		of visible characters terminated by a space or puncuation character
	 *		or a word-breaker (in languages that do not use space to delimit
	 *		word boundaries).
	 *
	 * "offset" -- Move in front of the next visual offset.
	 *
	 *		A visual offset is the smallest unit of consumed space.  This can
	 *		be a line break, or a visible character.
	 *
	 * "node" -- Move in front of the next visible node.
	 *
	 * @param  {Boundary} boundary
	 * @param  {unit=}    unit Defaults to "offset"
	 * @return {Boundary}
	 */
	function next(boundary, unit) {
		var unitBoundary = boundary = skipInsignificantPositions(boundary);
		switch (unit) {
		case 'char':
			unitBoundary = nextCharacterBoundary(boundary);
			break;
		case 'word':
			unitBoundary = nextWordBoundary(boundary);
			// "| foo" or |</p>
			if (equals(boundary, unitBoundary)) {
				unitBoundary = nextVisualBoundary(boundary);
			}
			break;
		default:
			unitBoundary = nextVisualBoundary(boundary);
			break;
		}
		return skipInsignificantPositions(unitBoundary);
	}

	/**
	 * Moves the boundary backwards by a unit measure.
	 *
	 * The second parameter `unit` specifies the unit with which to move the
	 * boundary.  This value may be one of the following strings:
	 *
	 * "char" -- Move behind the previous visible character.
	 *
	 * "word" -- Move behind the previous word.
	 *
	 *		A word is the smallest semantic unit.  It is a contigious sequence
	 *		of visible characters terminated by a space or puncuation character
	 *		or a word-breaker (in languages that do not use space to delimit
	 *		word boundaries).
	 *
	 * "offset" -- Move behind the previous visual offset.
	 *
	 *		A visual offset is the smallest unit of consumed space.  This can
	 *		be a line break, or a visible character.
	 *
	 * @param  {Boundary} boundary
	 * @param  {string=}  unit Defaults to "offset"
	 * @return {Boundary}
	 */
	function prev(boundary, unit) {
		boundary = skipPrevInsignificantPositions(boundary);
		var unitBoundary;
		switch (unit) {
		case 'char':
			unitBoundary = prevCharacterBoundary(boundary);
			break;
		case 'word':
			unitBoundary = prevWordBoundary(boundary);
			// "foo |" or <p>|
			if (equals(boundary, unitBoundary)) {
				unitBoundary = prevVisualBoundary(boundary);
			}
			break;
		default:
			unitBoundary = prevVisualBoundary(boundary);
			break;
		}
		return skipPrevInsignificantPositions(unitBoundary);
	}

	/**
	 * Checks whether a boundary represents a position that at the apparent end
	 * of its container's content.
	 *
	 * Unlike Boundaries.isAtEnd(), it considers the boundary position with
	 * respect to how it is visually represented, rather than simply where it
	 * is in the DOM tree.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {boolean}
	 */
	function isAtEnd(boundary) {
		if (Boundaries.isAtEnd(boundary)) {
			// |</p>
			return true;
		}
		if (Boundaries.isTextBoundary(boundary)) {
			// "fo|o" or "foo| "
			return !NOT_WSP.test(Boundaries.container(boundary).data.substr(Boundaries.offset(boundary)));
		}
		var node = Boundaries.nodeAfter(boundary);
		var next = Traversing.nextWhile(node, isUnrendered);
		// foo|<br></p> or foo|<i>bar</i>
		return !next || next === node;
	}

	/**
	 * Checks whether a boundary represents a position that at the apparent
	 * start of its container's content.
	 *
	 * Unlike Boundaries.isAtStart(), it considers the boundary position with
	 * respect to how it is visually represented, rather than simply where it
	 * is in the DOM tree.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {boolean}
	 */
	function isAtStart(boundary) {
		if (Boundaries.isAtStart(boundary)) {
			return true;
		}
		if (Boundaries.isTextBoundary(boundary)) {
			return !NOT_WSP.test(Boundaries.container(boundary).data.substr(0, Boundaries.offset(boundary)));
		}
		var node = Boundaries.nodeBefore(boundary);
		var next = Traversing.prevWhile(node, isUnrendered);
		return !next || next === node;
	}

	/**
	 * Like Boundaries.nextNode(), except that it considers whether a boundary
	 * is at the end position with respect to how the boundary is visual
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
	 * Like Boundaries.prevNode(), except that it considers whether a boundary
	 * is at the start position with respect to how the boundary is visual
	 * represented, rather than simply where it is in the DOM structure.
	 *
	 * @param  {Boundary} boundary
	 * @return {Node}
	 */
	function prevNode(boundary) {
		var node = Boundaries.prevNode(boundary);
		return isAtStart(boundary) ? node.parentNode : node;
	}

	/**
	 * Checks if `node` is a list.
	 * @param {Node} node
	 * @return {boolean}
	 */
	function isListNode(node) {
		return node.nodeName === 'UL' || node.nodeName === 'OL' || node.nodeName === 'DD';
	}

	/**
	 * Checks if `node` is a Table.
	 * @param {Node} node
	 * @return {boolean}
	 */
	function isTableNode(node) {
		return node.nodeName === 'TABLE';
	}

	return {
		isRendered                : isRendered,
		isUnrendered              : isUnrendered,
		isUnrenderedWhitespace    : isUnrenderedWhitespace,

		isStyleInherited          : isStyleInherited,
		isWhiteSpacePreserveStyle : isWhiteSpacePreserveStyle,

		hasBlockStyle             : hasBlockStyle,
		hasInlineStyle            : hasInlineStyle,
		hasLinebreakingStyle      : hasLinebreakingStyle,

		insertLineBreak           : insertLineBreak,
		insertBreak               : insertBreak,
		removeBreak               : removeBreak,

		prop                      : prop,

		prev                      : prev,
		next                      : next,

		prevNode                  : prevNode,
		nextNode                  : nextNode,

		prevSignificantOffset     : prevSignificantOffset,
		nextSignificantOffset     : nextSignificantOffset,

		isListNode                : isListNode,
		isTableNode               : isTableNode
	};
});
