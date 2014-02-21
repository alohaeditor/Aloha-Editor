/**
 * dom/nodes.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'arrays',
	'misc'
], function DomNodes(
	Arrays,
	Misc
) {
	'use strict';

	/**
	 * Numeric codes that represent the type of DOM interface node types.
	 *
	 * @type {Object.<string, number>}
	 * @enum {number}
	 */
	var Nodes = {
		ELEMENT: 1,
		ATTR: 2,
		TEXT: 3,
		CDATA_SECTION: 4,
		ENTITY_REFERENCE: 5,
		ENTITY: 6,
		PROCESSING_INSTRUCTION: 7,
		COMMENT: 8,
		DOCUMENT: 9,
		DOCUMENTTYPE: 10,
		DOCUMENT_FRAGMENT: 11,
		NOTATION: 12
	};

	/**
	 * Returns `true` if `node` is a text node.
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function isTextNode(node) {
		return Nodes.TEXT === node.nodeType;
	}

	/**
	 * Checks whether the given node is an Element.
	 *
	 * @param {Node} node
	 * @return {boolean}
	 */
	function isElementNode(node) {
		return Nodes.ELEMENT === node.nodeType;
	}

	/**
	 * Checks whether the given node is an document fragment element.
	 *
	 * @param   {Node} node
	 * @returns {boolean}
	 */
	function isFragmentNode(node) {
		return Nodes.DOCUMENT_FRAGMENT === node.nodeType;
	}

	/**
	 * Calculates the number of child nodes contained in the given DOM element.
	 *
	 * NB elem.childNodes.length is unreliable because "IE up to 8 does not count
	 * empty text nodes." (http://www.quirksmode.org/dom/w3c_core.html)
	 *
	 * @param  {Element} elem
	 * @return {number} Number of children contained in the given node.
	 */
	function numChildren(elem) {
		return elem.childNodes.length;
	}

	/**
	 * Returns a non-live array of all child nodes belonging to `elem`.
	 *
	 * @param  {Element} elem
	 * @return {Array.<Node>}
	 */
	function children(elem) {
		return Arrays.coerce(elem.childNodes);
	}

	/**
	 * Calculates the positional index of the given node inside of its parent
	 * element.
	 *
	 * @param  {Node} node
	 * @return {number} The zero-based index of the given node's position.
	 */
	function nodeIndex(node) {
		var index = -1;
		while (node) {
			node = node.previousSibling;
			index++;
		}
		return index;
	}

	/**
	 * Determines the length of the given DOM node.
	 *
	 * @param  {Node} node
	 * @return {number} Length of the given node.
	 */
	function nodeLength(node) {
		if (isElementNode(node) || isFragmentNode(node)) {
			return numChildren(node);
		}
		if (isTextNode(node)) {
			return node.length;
		}
		return 0;
	}

	/**
	 * Checks is `element` has children
	 * @param  {Element} element
	 * @return {boolean}
	 */
	function hasChildren(element) {
		return numChildren(element) > 0;
	}

	/**
	 * Get the nth (zero based) child of the given element.
	 * 
	 * NB elem.childNodes.length is unreliable because "IE up to 8 does not count
	 * empty text nodes." (http://www.quirksmode.org/dom/w3c_core.html)
	 *
	 * @param  {Element} elem
	 * @param  {number}  offset Offset of the child to return.
	 * @return {Element} The child node at the given offset.
	 */
	function nthChild(elem, offset) {
		return elem.childNodes[offset];
	}

	/**
	 * @param node if a text node, should have a parent node.
	 */
	function nodeAtOffset(node, offset) {
		if (isElementNode(node) && offset < nodeLength(node)) {
			node = nthChild(node, offset);
		} else if (isTextNode(node) && offset === node.length) {
			node = node.nextSibling || node.parentNode;
		}
		return node;
	}

	/**
	 * Checks whether the given node is an empty text node, conveniently.
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function isEmptyTextNode(node) {
		return isTextNode(node) && 0 === nodeLength(node);
	}

	/**
	 * Checks is `node1` is the same as `node2`.
	 * @param {Node} node1
	 * @param {Node} node2
	 * @returns {boolean}
	 */
	function isSameNode(node1, node2) {
		return node1 === node2;
	}

	function translateNodeIndex(elem, normalizedIndex, realIndex) {
		var index = 0;
		var currNormalizedIndex = 0;
		var child = elem.firstChild;
		for (;;) {
			if (currNormalizedIndex >= normalizedIndex) {
				return index;
			}
			if (index >= realIndex) {
				return currNormalizedIndex;
			}
			if (!child) {
				break;
			}
			if (isTextNode(child)) {
				var nonEmptyRealIndex = -1;
				while (child && isTextNode(child)) {
					if (!isEmptyTextNode(child)) {
						nonEmptyRealIndex = index;
					}
					child = child.nextSibling;
					index += 1;
				}
				if (-1 !== nonEmptyRealIndex) {
					if (nonEmptyRealIndex >= realIndex) {
						return currNormalizedIndex;
					}
					currNormalizedIndex += 1;
				}
			} else {
				child = child.nextSibling;
				index += 1;
				currNormalizedIndex += 1;
			}
		}
		throw Error();
	}

	function realFromNormalizedIndex(elem, normalizedIndex) {
		return translateNodeIndex(elem, normalizedIndex, Number.POSITIVE_INFINITY);
	}

	function normalizedFromRealIndex(elem, realIndex) {
		return translateNodeIndex(elem, Number.POSITIVE_INFINITY, realIndex);
	}

	function normalizedNumChildren(elem) {
		return normalizedFromRealIndex(elem, numChildren(elem));
	}

	function normalizedNodeIndex(node) {
		return normalizedFromRealIndex(node.parentNode, nodeIndex(node));
	}

	function normalizedNthChild(elem, normalizedIndex) {
		return nthChild(elem, realFromNormalizedIndex(elem, normalizedIndex));
	}

	/**
	 * Returns `true` if node `b` is a descendant of node `a`, `false`
	 * otherwise.
	 *
	 * @see
	 * http://ejohn.org/blog/comparing-document-position/
	 * http://www.quirksmode.org/blog/archives/2006/01/contains_for_mo.html
	 *
	 * TODO: Contains seems to be problematic on Safari, is this an issue for us?
	 *       Should we just use compareDocumentPosition() since we only need IE > 9 anyway?
	 * https://code.google.com/p/google-web-toolkit/issues/detail?id=1218
	 *
	 * @param  {Node} a
	 * @param  {Node} b
	 * @return {boolean}
	 */
	function contains(a, b) {
		return (isElementNode(a)
				? (a.compareDocumentPosition
				   ? !!(a.compareDocumentPosition(b) & 16)
				   : (a !== b
				      // Because IE returns false for elemNode.contains(textNode).
				      && (isElementNode(b)
				          ? a.contains(b)
				          : (b.parentNode
				             && (a === b.parentNode || a.contains(b.parentNode))))))
		        : false);
	}

	/**
	 * Checks whether node `other` comes after `node` in the document order.
	 *
	 * @fixme rename to follows()
	 * @param  {Node} node
	 * @param  {Node} other
	 * @return {boolean}
	 */
	function followedBy(node, other) {
		return !!(node.compareDocumentPosition(other) & 4);
	}

	/**
	 * Calculates the offset of the given node inside the document.
	 *
	 * @param  {Node} node
	 * @return {Object.<string, number>}
	 */
	function offset(node) {
		if (!Misc.defined(node.getBoundingClientRect)) {
			return {
				top: 0,
				left: 0
			};
		}
		var box = node.getBoundingClientRect();
		return {
			top  : box.top  + window.pageYOffset - node.ownerDocument.body.clientTop,
			left : box.left + window.pageXOffset - node.ownerDocument.body.clientLeft
		};
	}

	/**
	 * Gets the textContent from a node.
	 *
	 * @param  {Node} node
	 * @return {string}
	 */
	function text(node) {
		return node.textContent;
	}

	/**
	 * Checks the givne element has any textContent.
	 *
	 * @param  {Element} element
	 * @return {boolean}
	 */
	function hasText(element) {
		return text(element).trim().length > 0;
	}

	/**
	 * Checks whether two nodes are equal.
	 *
	 * @param  {Node} node
	 * @param  {Node} other
	 * @return {boolean}
	 */
	function equals(node, other) {
		return node.isEqualNode(other);
	}

	/**
	 * Returns a deep clone of the given node.
	 *
	 * @param  {Node}    node
	 * @param  {boolean} deeply Whether or not to do a deep clone
	 * @return {Node}
	 */
	function clone(node, deeply) {
		return node.cloneNode(('boolean' === typeof deeply) ? deeply : true);
	}

	/**
	 * Returns a shallow clone of the given node.
	 *
	 * @param  {Node} node
	 * @return {Node}
	 */
	function cloneShallow(node) {
		return node.cloneNode(false);
	}

	function fragmentHtml(fragment) {
		var div = fragment.ownerDocument.createElement('div');
		div.appendChild(fragment);
		return div.innerHTML;
	}

	return {
		Nodes : Nodes,
		offset : offset,
		children : children,

		nodeAtOffset : nodeAtOffset,
		nthChild     : nthChild,
		numChildren  : numChildren,
		nodeIndex    : nodeIndex,
		nodeLength   : nodeLength,
		hasChildren  : hasChildren,

		normalizedNthChild      : normalizedNthChild,
		normalizedNodeIndex     : normalizedNodeIndex,
		realFromNormalizedIndex : realFromNormalizedIndex,
		normalizedNumChildren   : normalizedNumChildren,

		isTextNode      : isTextNode,
		isElementNode   : isElementNode,
		isFragmentNode  : isFragmentNode,
		isEmptyTextNode : isEmptyTextNode,
		isSameNode      : isSameNode,

		text : text,
		hasText : hasText,

		equals     : equals,
		contains   : contains,
		followedBy : followedBy,

		clone        : clone,
		cloneShallow : cloneShallow,

		fragmentHtml : fragmentHtml
	};
});
