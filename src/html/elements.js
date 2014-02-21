/**
 * html/elements.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'html/styles',
	'dom/style',
	'dom/traversing',
	'dom/nodes',
	'dom',
	'predicates',
	'cursors',
	'strings'
], function HtmlElements(
	HtmlStyles,
	DomStyle,
	Traversing,
	Nodes,
	Dom,
	Predicates,
	Cursors,
	Strings
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
	 * These element's cannot be simply unwrapped because they have dependent
	 * children.
	 *
	 * @param {<string, boolean>}
	 */
	var GROUP_CONTAINERS = {
		'FIELDSET' : true,
		'OBJECT'   : true,
		'FIGURE'   : true,
		'AUDIO'    : true,
		'SELECT'   : true,
		'COLGROUP' : true,
		'HGROUP'   : true,
		'TABLE'    : true,
		'TBODY'    : true,
		'TR'       : true,
		'OL'       : true,
		'UL'       : true,
		'DL'       : true,
		'MENU'     : true
	};

	/**
	 * These element's cannot be simply unwrapped because they parents only
	 * allows these as their immediate child nodes.
	 *
	 * @param {<string, Array.<string>}
	 */
	var GROUPED_ELEMENTS = {
		'LI'    : ['OL', 'UL', 'DL'],
		'DT'    : ['DL'],
		'DD'    : ['DL'],
		'TBODY' : ['TABLE'],
		'TR'    : ['TABLE', 'TBODY'],
		'TH'    : ['TABLE', 'TBODY'],
		'TD'    : ['TR', 'TH']
	};

	function isGroupContainer(node) {
		return GROUP_CONTAINERS[node.nodeName];
	}

	function isGroupedElement(node) {
		return GROUPED_ELEMENTS[node.nodeName];
	}

	/**
	 * Checks if the given node is one of the 4 list item elements.
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function isListItems(node) {
		return LIST_ITEMS[node.nodeName];
	}

	/**
	 * Checks if the given node is one of the 4 list grouping containers.
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function isListContainer(node) {
		return LIST_CONTAINERS[node.nodeName];
	}

	/**
	 * Checks whether `node` is the TABLE element.
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function isTableContainer(node) {
		return node.nodeName === 'TABLE';
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
			cssWhiteSpace = DomStyle.getComputedStyle(node.parentNode, 'white-space');
			if (HtmlStyles.isWhiteSpacePreserveStyle(cssWhiteSpace)) {
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
					&& HtmlStyles.hasInlineStyle(point.node)
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
	 * @param  {Cursor} point
	 * @return {boolean} True if the cursor is moved
	 */
	function skipUnrenderedToEndOfLine(point) {
		var cursor = point.clone();
		cursor.nextWhile(isUnrenderedAtPoint);
		if (!HtmlStyles.hasLinebreakingStyle(cursor.node)) {
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
	 * @return {boolean} True if the cursor is moved
	 */
	function skipUnrenderedToStartOfLine(point) {
		var cursor = point.clone();
		cursor.prev();
		cursor.prevWhile(isUnrenderedAtPoint);
		if (!HtmlStyles.hasLinebreakingStyle(cursor.node)) {
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
				if (!HtmlStyles.hasLinebreakingStyle(cursor.node)) {
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
		return (node.previousSibling && Predicates.isBlockNode(node.previousSibling))
		    || (node.nextSibling && Predicates.isBlockNode(node.nextSibling));
	}

	/**
	 * Checks whether the given node is visually rendered according to HTML5
	 * specification.
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function isUnrendered(node) {
		if (!Predicates.isVoidNode(node)
				// Because empty list elements are rendered
				&& !LIST_ITEMS[node.nodeName]
				&& 0 === Nodes.nodeLength(node)) {
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
				&& HtmlStyles.hasLinebreakingStyle(node.parentNode)) {
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

			var inlineNode = Traversing.nextNonAncestor(node, false, function (node) {
				return Predicates.isInlineNode(node) && !isUnrendered(node);
			}, function (node) {
				return HtmlStyles.hasLinebreakingStyle(node) || Dom.isEditingHost(node);
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
	 * Parses the given markup string into a DOM tree inside of a detached div
	 * element.
	 *
	 * @param  {string}   html
	 * @param  {Document} doc
	 * @return {Element}
	 */
	function parse(html, doc) {
		var div = doc.createElement('div');
		div.innerHTML = html;
		return div;
	}

	return {
		parse                              : parse,
		isVoidType                         : isVoidType,
		isRendered                         : isRendered,
		isUnrendered                       : isUnrendered,
		isUnrenderedWhitespace             : isUnrenderedWhitespace,
		isListItems                        : isListItems,
		isListContainer                    : isListContainer,
		isTableContainer                   : isTableContainer,
		isGroupContainer                   : isGroupContainer,
		isGroupedElement                   : isGroupedElement,
		isUnrenderedWhitespaceNoBlockCheck : isUnrenderedWhitespaceNoBlockCheck
	};
});
