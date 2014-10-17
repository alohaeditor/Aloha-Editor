/**
 * dom/nodes.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'misc',
	'arrays'
], function (
	Misc,
	Arrays
) {
	'use strict';

	/**
	 * Numeric codes that represent the type of DOM interface node types.
	 *
	 * @type {Object.<string, number>}
	 * @enum {number}
	 * @memberOf dom
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
	 * @memberOf dom
	 */
	function isTextNode(node) {
		return Nodes.TEXT === node.nodeType;
	}

	/**
	 * Checks whether the given node is an Element.
	 *
	 * @param {Node} node
	 * @return {boolean}
	 * @memberOf dom
	 */
	function isElementNode(node) {
		return Nodes.ELEMENT === node.nodeType;
	}

	/**
	 * Checks whether the given node is an document fragment element.
	 *
	 * @param   {Node} node
	 * @returns {boolean}
	 * @memberOf dom
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
	 * @memberOf dom
	 */
	function numChildren(elem) {
		return elem.childNodes.length;
	}

	/**
	 * Returns a non-live array of all child nodes belonging to `elem`.
	 *
	 * @param  {Element} elem
	 * @return {Array.<Node>}
	 * @memberOf dom
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
	 * @memberOf dom
	 */
	function nodeIndex(node) {
	    var i = 0;
	    while ((node = node.previousSibling)) {
	        i++;
	    }
	    return i;
	}

	/**
	 * Determines the length of the given DOM node.
	 *
	 * @param  {Node} node
	 * @return {number} Length of the given node.
	 * @memberOf dom
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
	 * @memberOf dom
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
	 * @memberOf dom
	 */
	function nthChild(elem, offset) {
		return elem.childNodes[offset];
	}

	/**
	 * This function is missing documentation.
	 * @TODO Complete documentation.
	 *
	 * @param node if a text node, should have a parent node.
	 * @memberOf dom
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
	 * @memberOf dom
	 */
	function isEmptyTextNode(node) {
		return isTextNode(node) && 0 === nodeLength(node);
	}

	/**
	 * Checks is `node1` is the same as `node2`.
	 * @param {Node} node1
	 * @param {Node} node2
	 * @returns {boolean}
	 * @memberOf dom
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

	/**
	 * This function is missing documentation.
	 * @TODO Complete documentation.
	 *
	 * @memberOf dom
	 */
	function realFromNormalizedIndex(elem, normalizedIndex) {
		return translateNodeIndex(elem, normalizedIndex, Number.POSITIVE_INFINITY);
	}

	function normalizedFromRealIndex(elem, realIndex) {
		return translateNodeIndex(elem, Number.POSITIVE_INFINITY, realIndex);
	}

	/**
	 * This function is missing documentation.
	 * @TODO Complete documentation.
	 *
	 * @memberOf dom
	 */
	function normalizedNumChildren(elem) {
		return normalizedFromRealIndex(elem, numChildren(elem));
	}

	/**
	 * This function is missing documentation.
	 * @TODO Complete documentation.
	 *
	 * @memberOf dom
	 */
	function normalizedNodeIndex(node) {
		return normalizedFromRealIndex(node.parentNode, nodeIndex(node));
	}

	/**
	 * This function is missing documentation.
	 * @TODO Complete documentation.
	 *
	 * @memberOf dom
	 */
	function normalizedNthChild(elem, normalizedIndex) {
		return nthChild(elem, realFromNormalizedIndex(elem, normalizedIndex));
	}

	/**
	 * Returns `true` if node `b` is a descendant of node `a`, `false`
	 * otherwise.
	 *
	 * @see http://ejohn.org/blog/comparing-document-position/
	 * @see http://www.quirksmode.org/blog/archives/2006/01/contains_for_mo.html
	 *
	 * @TODO Contains seems to be problematic on Safari, is this an issue for us?
	 * Should we just use compareDocumentPosition() since we only need IE > 9 anyway?
	 * https://code.google.com/p/google-web-toolkit/issues/detail?id=1218
	 *
	 * @param  {Node} a
	 * @param  {Node} b
	 * @return {boolean}
	 * @memberOf dom
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
	 * @memberOf dom
	 */
	function followedBy(node, other) {
		return !!(node.compareDocumentPosition(other) & 4);
	}

	/**
	 * Calculates the offset of the given node inside the document.
	 *
	 * @param  {Node} node
	 * @return {Object.<string, number>}
	 * @memberOf dom
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
	 * @memberOf dom
	 */
	function text(node) {
		return node.textContent;
	}

	/**
	 * Checks the givne element has any textContent.
	 *
	 * @param  {Element} element
	 * @return {boolean}
	 * @memberOf dom
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
	 * @memberOf dom
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
	 * @memberOf dom
	 */
	function clone(node, deeply) {
		return node.cloneNode(('boolean' === typeof deeply) ? deeply : true);
	}

	/**
	 * Returns a shallow clone of the given node.
	 *
	 * @param  {Node} node
	 * @return {Node}
	 * @memberOf dom
	 */
	function cloneShallow(node) {
		return node.cloneNode(false);
	}

	/**
	 * Retrieve the HTML of the entire given node.
	 * This is equivalent as outerHTML for element nodes.
	 * This function is an alternative for outerHTML with for document
	 * fragments.
	 *
	 * @param  {Node}
	 * @return {string}
	 * @memberOf dom
	 */
	function outerHtml(node) {
		var div = node.ownerDocument.createElement('div');
		// Because if node is a document fragment, appending it will cause it to
		// be emptied of its child nodes
		div.appendChild(node.cloneNode(true));
		return div.innerHTML;
	}

	return {
		Nodes    : Nodes,
		offset   : offset,
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

		text    : text,
		hasText : hasText,

		equals     : equals,
		contains   : contains,
		followedBy : followedBy,

		clone        : clone,
		cloneShallow : cloneShallow,

		outerHtml    : outerHtml
	};
});
