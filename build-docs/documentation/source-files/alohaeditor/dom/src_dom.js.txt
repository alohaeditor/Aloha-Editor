/* dom.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */

/**
 * @doc module
 * @name dom
 * @description
 *
 * ## DOM Utilities
 *
 * This module houses utillities that are
 * used for DOM manipulation.
 *
 * Note, if you do not define the module using @doc module
 * and the @name with the module id, then this page won't exist!!
 */

define([
	'maps',
	'arrays',
	'strings',
	'browser',
	'functions',
	'misc'
], function Dom(
	maps,
	arrays,
	strings,
	browser,
	fn,
	misc
) {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('dom');
	}

	var ATTRIBUTE = /\s([^\/<>\s=]+)(?:=(?:"[^"]*"|'[^']*'|[^>\/\s]+))?/g;

	/**
	 * Numeric codes that represent the type of DOM interface node types.
	 *
	 * @type {object}
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
	 * @doc function
	 * @name aloha.dom:isTextNode
	 * @description
     *
	 * Returns `true` if `node` is a text node.
	 *
	 * Here is some example code:
	 * ```js
	 * for(var thing in window) {
	 *     if(typeof(window[thing]) === "string") {
	 *         ...
	 *     }
	 * }
	 * ```
	 * @param {DOMObject} node the DOM node
	 * @return {Boolean} `true` if `node` is a text node
	 */
	function isTextNode(node) {
		return Nodes.TEXT === node.nodeType;
	}

	/**
	 * @doc function
	 * @name aloha.dom:moveNextAll
	 * @description
	 *
	 * Like insertBefore, inserts firstChild into parent before refChild, except
	 * also inserts all the following siblings of firstChild.
	 *
	 * @param {DOMObject} parent given parent node
	 * @param {DOMObject} firstChild insert this node
	 * @param {DOMObject} refChild inserte before this node
	 */
	function moveNextAll(parent, firstChild, refChild) {
		while (firstChild) {
			var nextChild = firstChild.nextSibling;
			parent.insertBefore(firstChild, refChild);
			firstChild = nextChild;
		}
	}

	/**
	 * Used to serialize outerHTML of DOM elements in older (pre-HTML5) Gecko,
	 * Safari, and Opera browsers.
	 *
	 * Beware that XMLSerializer generates an XHTML string (<div class="team" />
	 * instead of <div class="team"></div>).  It is noted here:
	 * http://stackoverflow.com/questions/1700870/how-do-i-do-outerhtml-in-firefox
	 * that some browsers (like older versions of Firefox) have problems with
	 * XMLSerializer, and an alternative, albeit more expensive option, is
	 * described.
	 *
	 * @type {XMLSerializer|null}
	 */
	var Serializer = window.XMLSerializer && new window.XMLSerializer();

	/**
	 * @doc function
	 * @name aloha.dom:outerHtml
	 * @description
	 *
	 * Gets the serialized HTML that describes the given DOM element and its
	 * innerHTML.
	 *
	 * Polyfill for older versions of Gecko, Safari, and Opera browsers.
	 * @see https://bugzilla.mozilla.org/show_bug.cgi?id=92264 for background.
	 *
	 * @param {DOMObject} node given node
	 * @return {String} serialized HTML
	 */
	function outerHtml(node) {
		var html = node.outerHTML;
		if (misc.defined(html)) {
			return html;
		}
		try {
			return Serializer ? Serializer.serializeToString(node) : node.xml;
		} catch (e) {
			return node.xml;
		}
	}

	/**
	 * @doc function
	 * @name aloha.dom:attrNames
	 * @description
	 *
	 * Retrieves the names of all attributes from the given element.
	 *
	 * Correctly handles the case that IE7 and IE8 have approx 70-90
	 * default attributes on each and every element.
	 *
	 * This implementation does not iterate over the elem.attributes
	 * property since that is much slower on IE7 (even when
	 * checking the attrNode.specified property). Instead it parses the
	 * HTML of the element. For elements with few attributes the
	 * performance on IE7 is improved by an order of magnitued.
	 *
	 * On IE7, when you clone a <button disabled="disabled"/> or an
	 * <input checked="checked"/> element the boolean properties will
	 * not be set on the cloned node. We choose the speed optimization
	 * over correctness in this case. The dom-to-xhtml plugin has a
	 * workaround for this case.
	 *
	 * @param {DOMObject} elem given element
	 * @return {Array[String]}
	 *         List of attribute names.
	 */
	function attrNames(elem) {
		var names = [];
		var html = outerHtml(elem.cloneNode(false));
		var match;
		while (null != (match = ATTRIBUTE.exec(html))) {
			names.push(match[1]);
		}
		return names;
	}

	function supportsAttributes(node) {
		var type = node.nodeType;
		return !(
			!node
				|| type === Nodes.TEXT
					|| type === Nodes.COMMENT
						|| type === Nodes.ATTR
		);
	}

	/**
	 * @doc function
	 * @name aloha.dom:getAttr
	 * @description
	 *
	 * Get's the value of the given element's specified attribute.
	 *
	 * @param {DOMObject} elem given element
	 * @param {String} attr
	 *        Case insensitive attribute name to retrieve.
	 * @return {String?}
	 *         The value of the attribute or null if no value for it can be
	 *         determined.
	 */
	function getAttr(elem, attr) {
		return supportsAttributes(elem) ? elem.getAttribute(attr) : null;
	}

	/**
	 * @doc function
	 * @name aloha.dom:setAttr
	 * @description
	 *
	 * Set's the value of the given element's specified attribute.
	 *
	 * @param {DOMObject} elem given element
	 * @param {String} attr
	 *        Case insensitive attribute name to retrieve.
	 * @param {String}
	 *        The value to set into attribute `attr`.
	 */
	function setAttr(elem, attr, value) {
		if (value !== null && misc.defined(value) && supportsAttributes(elem)) {
			elem.setAttribute(attr, value);
		}
	}

	/**
	 * @doc function
	 * @name aloha.dom:removeAttr
	 * @description
	 *
	 * Removes the specified attribute from the given element.
	 *
	 * @param {DOMObject} elem given element
	 * @param {String} attr
	 *        Case insensitive attribute name to retrieve.
	 */
	function removeAttr(elem, attr) {
		if (supportsAttributes(elem)) {
			elem.removeAttribute(attr);
		}
	}

	/**
	 * @doc function
	 * @name aloha.dom:attrs
	 * @description
	 *
	 * Gets the attributes of the given element.
	 *
	 * See attrNames() for an edge case on IE7.
	 *
	 * @param {DOMObject} elem given element
	 *        An element to get the attributes for.
	 * @return {Array[String]}
	 *         An array containing [name, value] tuples for each attribute.
	 *         Attribute values will always be strings, but possibly empty
	 *         strings.
	 */
	function attrs(elem) {
		var as = [];
		var names = attrNames(elem);
		var i;
		var len;
		for (i = 0, len = names.length; i < len; i++) {
			var name = names[i];
			var value = getAttr(elem, name);
			if (null == value) {
				value = '';
			} else {
				value = value.toString();
			}
			as.push([name, value]);
		}
		return as;
	}

	/**
	 * @doc function
	 * @name aloha.dom:indexByClassHaveList
	 * @description
	 *
	 * Like indexByClass() but operates on a list of elements instead.  The
	 * given list may be a NodeList, HTMLCollection, or an array.
	 *
	 * @param {Array[DOMObject]} elems given node elements
	 * @param {Object} classMap given map
	 * @return {Object} selected elements
	 */
	function indexByClassHaveList(elems, classMap) {
		var index = {},
		    indexed,
		    classes,
		    elem,
		    cls,
		    len,
		    i,
		    j;
		for (i = 0, len = elems.length; i < len; i++) {
			elem = elems[i];
			if (elem.className) {
				classes = strings.words(elem.className);
				for (j = 0; j < classes.length; j++) {
					cls = classes[j];
					if (classMap[cls]) {
						indexed = index[cls];
						if (indexed) {
							indexed.push(elem);
						} else {
							index[cls] = [elem];
						}
					}
				}
			}
		}
		return index;
	}

	/**
	 * @doc function
	 * @name aloha.dom:getElementsByClassNames
	 * @description
	 *
	 * Returns a set of elements which have the given class names.
	 *
	 * @param {Array[String]} classes given class names
	 * @param {DOMObject=} context
	 *        The root element in which to do the search.
	 * @return {Array[DOMObject]}
	 *         A set of DOM elements.
	 */
	function getElementsByClassNames(classes, context) {
		context = context || document;
		var i;
		var j;
		var len;
		var found;
		var results = [];
		for (i = 0; i < classes.length; i++) {
			found = context.getElementsByClassName(classes[i]);
			len = found.length;
			for (j = 0; j < len; j++) {
				if (!arrays.contains(results, found[j])) {
					results.push(found[j]);
				}
			}
		}
		return results;
	}

	/**
	 * @doc function
	 * @name aloha.dom:indexByClass
	 * @description
	 *
	 * Indexes descendant elements based on the individual classes in
	 * the class attribute.
	 *
	 * Based on these observations;
	 *
	 * * $('.class1, .class2') takes twice as long as $('.class1') on IE7.
	 *
	 * * $('.class1, .class2') is fast on IE8 (approx the same as
	 *   $('.class'), no matter how many classes), but if the individual
	 *   elements in the result set should be handled differently, the
	 *   subsequent hasClass('.class1') and hasClass('.class2') calls
	 *   slow things down again.
	 *
	 * * DOM traversal with elem.firstChild elem.nextSibling is very
	 *   slow on IE7 compared to just iterating over
	 *   root.getElementsByTagName('*').
	 *
	 * * $('name.class') is much faster than just $('.class'), but as
	 *   soon as you need a single class in classMap that may be present
	 *   on any element, that optimization doesn't gain anything since
	 *   then you have to examine every element.
	 *
	 * This function will always take approx. the same amount of time
	 * (on IE7 approx. equivalent to a single call to $('.class')) no
	 * matter how many entries there are in classMap to index.
	 *
	 * This function only makes sense for multiple entries in
	 * classMap. For a single class lookup, $('.class') or
	 * $('name.class') is fine (even better in the latter case).
	 *
	 * @param {DOMObject} root
	 *        The root element to search for elements to index (will not be
	 *        included in search).
	 * @param {Object} classMap
	 *        A map from class name to boolean true.
	 * @return {Object}
	 *         A map from class name to an array of elements with that class.
	 *         Every entry in classMap for which elements have been found will
	 *         have a corresponding entry in the returned map.  Entries for
	 *         which no elements have been found, may or may not have an entry
	 *         in the returned map.
	 */
	function indexByClass(root, classMap) {
		return indexByClassHaveList(
			browser.ie7 ? root.getElementsByTagName('*')
			            : getElementsByClassNames(maps.keys(classMap), root),
			classMap
		);
	}

	/**
	 * @doc function
	 * @name aloha.dom:indexByName
	 * @description
	 *
	 * Indexes descendant elements based on elem.nodeName.
	 *
	 * Based on these observations:
	 *
	 * * On IE8, for moderate values of names.length, individual calls to
	 *   getElementsByTagName is just as fast as $root.find('name, name,
	 *   name, name').
	 *
	 * * On IE7, $root.find('name, name, name, name') is extemely slow
	 *   (can be an order of magnitude slower than individual calls to
	 *    getElementsByTagName, why is that?).
	 *
	 * * Although getElementsByTagName is very fast even on IE7, when
	 *   names.length > 7 an alternative implementation that iterates
	 *   over all tags and checks names from a hashmap (similar to how
	 *   indexByClass does it) may become interesting, but
	 *   names.length > 7 is unlikely.
	 *
	 * This function only makes sense if the given names array has many
	 * entries. For only one or two different names, calling $('name')
	 * or context.getElementsByTagName(name) directly is fine (but
	 * beware of $('name, name, ...') as explained above).
	 *
	 * The signature of this function differs from indexByClass by not
	 * taking a map but instead an array of names.
	 *
	 * @param {DOMObject} root
	 *        The root element to search for elements to index (will not be
	 *        included in search).
	 * @param {Array[String]} names
	 *        An array of element names to look for.
	 *        Names must be in all-uppercase (the same as elem.nodeName).
	 * @return {Object}
	 *         A map from element name to an array of elements with that name.
	 *         Names will be all-uppercase.
	 *         Arrays will be proper arrays, not NodeLists.  Every entry in
	 *         classMap for which elements have been found will have a
	 *         corresponding entry in the returned map. Entries for which no
	 *         elements have been found, may or may not have an entry in the
	 *         returned map.
	 */
	function indexByName(root, names) {
		var i,
		    index = {},
		    len;
		for (i = 0, len = names.length; i < len; i++) {
			var name = names[i];
			index[name] = Array.prototype.slice.apply(
				root.getElementsByTagName(name)
			);
		}
		return index;
	}

	/**
	 * @doc function
	 * @name aloha.dom:numChildren
	 * @description
	 *
	 * Calculates the number of child nodes contained in the given DOM element.
	 *
	 * elem.childNodes.length is unreliable because "IE up to 8 does not count
	 * empty text nodes." (http://www.quirksmode.org/dom/w3c_core.html)
	 *
	 * @param {DOMObject} elem given element
	 * @return {Number} Number of children contained in the given node.
	 */
	function numChildren(elem) {
		var count = 0;
		var child = elem.firstChild;
		while (child) {
			count += 1;
			child = child.nextSibling;
		}
		return count;
	}

	/**
	 * @doc function
	 * @name aloha.dom:nodeLength
	 * @description
	 *
	 * Determines the length of the given DOM node.
	 *
	 * @param {DOMObject} node given node
	 * @return {Number} Length of the given node.
	 */
	function nodeLength(node) {
		if (Nodes.ELEMENT === node.nodeType) {
			return numChildren(node);
		}
		if (Nodes.TEXT === node.nodeType) {
			return node.length;
		}
		return 0;
	}

	/**
	 * @doc function
	 * @name aloha.dom:nodeIndex
	 * @description
	 *
	 * Calculates the positional index of the given node inside of its parent
	 * element.
	 *
	 * @param {DOMObject} node given node
	 * @return {Number} The zero-based index of the given node's position.
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
	 * @doc function
	 * @name aloha.dom:isAtStart
	 * @description
	 *
	 * Whether or not the given node and offset describes a position before the
	 * first child node or character in its container.
	 *
	 * Will return true if the selection looks like this:
	 * <b>{foo</b>...
	 * of
	 * <b>[foo</b>...
	 *
	 * @param {DOMObject} node given node
	 * @param {Number} offset offset
	 * @return {Boolean} true if is at start
	 */
	function isAtStart(node, offset) {
		return (
			0 === offset
				&& (Nodes.TEXT !== node.nodeType || !node.previousSibling)
		);
	}

	/**
	 * @doc function
	 * @name aloha.dom:isAtEnd
	 * @description
	 *
	 * Whether or not the given node and offset describes a position after the
	 * last child node or character in its container.
	 *
	 * @param {DOMObject} node given node
	 * @param {Number} offset offset
	 * @return {Boolean} true if is at end
	 */
	function isAtEnd(node, offset) {
		return (
			Nodes.ELEMENT === node.nodeType
				&& offset >= nodeLength(node)
		) || (
			Nodes.TEXT === node.nodeType
				&& offset === node.length
					&& !node.nextSibling
		);
	}

	/**
	 * @doc function
	 * @name aloha.dom:nodeAtOffset
	 * @description
	 *
	 * @param {DOMObject} node if a text node, should have a parent node.
	 */
	function nodeAtOffset(node, offset) {
		if (Nodes.ELEMENT === node.nodeType && offset < nodeLength(node)) {
			node = node.childNodes[offset];
		} else if (Nodes.TEXT === node.nodeType && offset === node.length) {
			node = node.nextSibling || node.parentNode;
		}
		return node;
	}

	/**
	 * @doc function
	 * @name aloha.dom:wrap
	 * @description
	 *
	 * Wraps node `node` in given node `wrapper`.
	 *
	 * @param {DOMObject} node given node
	 * @param {DOMObject} wrapper given wrapper
	 */
	function wrap(node, wrapper) {
		node.parentNode.replaceChild(wrapper, node);
		wrapper.appendChild(node);
	}

	/**
	 * @doc function
	 * @name aloha.dom:insert
	 * @description
	 *
	 * Inserts node `node` before `ref`, unless `atEnd` is truthy, in which case
	 * `node` is inserted at the end of `ref` children nodes.
	 *
	 * @param {DOMObject} node given node
	 * @param {DOMObject} ref given node
	 * @param {Boolean} atEnd insert at the end of `ref` children nodes
	 */
	function insert(node, ref, atEnd) {
		if (atEnd) {
			ref.appendChild(node);
		} else {
			ref.parentNode.insertBefore(node, ref);
		}
	}

	/**
	 * @doc function
	 * @name aloha.dom:remove
	 * @description
	 *
	 * Detaches the given node.
	 *
	 * @param {DOMObjec} node given node
	 */
	function remove(node) {
		node.parentNode.removeChild(node);
	}

	/**
	 * @doc function
	 * @name aloha.dom:merge
	 * @description
	 *
	 * Merges all contents of `right` into `left` by appending them to the end
	 * of `left`, and then removing `right`.
	 *
	 * Will not merge since this could require ranges to be synchronized.
	 *
	 * @param {DOMObject} left given node
	 * @param {DOMObject} right given node
	 */
	function merge(left, right) {
		var next;
		while (left && right && (left.nodeName === right.nodeName)) {
			if (isTextNode(left)) {
				return;
			}
			next = right.firstChild;
			moveNextAll(left, next, null);
			remove(right);
			if (!next) {
				return;
			}
			right = next;
			left = right.previousSibling;
		}
	}

	/**
	 * @doc function
	 * @name aloha.dom:replaceShallow
	 * @description
	 *
	 * Replaces the given node with a new node while preserving the contents of
	 * the given node.
	 *
	 * This function facilitates re-wrapping of contents from one node to
	 * another.
	 *
	 * @param {DOMObject} node
	 *        The node to be removed.
	 * @param {DOMObject} withNode
	 *        The tag that will replace `node` and contain all of the original
	 *        node's content.
	 */
	function replaceShallow(node, withNode) {
		moveNextAll(withNode, node.firstChild, null);
		insert(withNode, node);
		remove(node);
	}

	/**
	 * @doc function
	 * @name aloha.dom:contains
	 * @description
	 *
	 * Returns `true` if node `b` is a descendant of node `a`, `false`
	 * otherwise.
	 *
	 * @see
	 * http://ejohn.org/blog/comparing-document-position/
	 * http://www.quirksmode.org/blog/archives/2006/01/contains_for_mo.html
	 *
	 * @param {DOMObject} a given node
	 * @param {DOMObject} b given node
	 * @return {Boolean} `true` if node `b` is a descendant of node `a`
	 */
	function contains(a, b) {
		return (Nodes.ELEMENT === a.nodeType
				? (a.contains
				   ? (a !== b
				      // Because IE returns false for elemNode.contains(textNode).
				      && (1 === b.nodeType
				          ? a.contains(b)
				          : (b.parentNode
				             && (a === b.parentNode || a.contains(b.parentNode)))))
				   : !!(a.compareDocumentPosition(b) & 16))
				: false);
	}

	/**
	 * Checks whether a node can be split at the given offset to yeild two
	 * nodes.
	 *
	 * @private
	 * @param {DOMObject} node given node
	 * @param {Number} offset offset
	 * @return {Boolean} true if is splitable
	 */
	function wouldSplitTextNode(node, offset) {
		return 0 < offset && offset < node.nodeValue.length;
	}

	/**
	 * @doc function
	 * @name aloha.dom:splitTextNode
	 * @description
	 *
	 * Splits the given text node at the given offset.
	 *
	 * @TODO: could be optimized with insertData() so only a single text node is
	 *        inserted instead of two.
	 *
	 * @param {DOMObject} node
	 *        DOM text node.
	 * @param {Number} offset
	 *        Number between 0 and the length of text of `node`.
	 * @return {DOMObject} node
	 */
	function splitTextNode(node, offset) {
		// Because node.splitText() is buggy on IE, split it manually.
		// http://www.quirksmode.org/dom/w3c_core.html
		if (!wouldSplitTextNode(node, offset)) {
			return node;
		}
		var parent = node.parentNode;
		var text = node.nodeValue;
		var before = document.createTextNode(text.substring(0, offset));
		var after = document.createTextNode(
			text.substring(offset, text.length)
		);
		parent.insertBefore(before, node);
		parent.insertBefore(after, node);
		parent.removeChild(node);
		return before;
	}

	/**
	 * Normalizes the boundary point represented by container and offset such
	 * that it will not point to the start or end of a text node which reduces
	 * the number of different states the range can be in, and thereby increases
	 * the the robusteness of the code written against it slightly.
	 *
	 * It should be noted that native ranges controlled by the browser's DOM
	 * implementation have the habit to change by themselves, so even if
	 * normalized this way the range could revert to an unnormalized state. See
	 * ranges.stableRange().
	 *
	 * @private
	 */
	function normalizeSetRange(setRange, range, container, offset) {
		if (Nodes.TEXT === container.nodeType && container.parentNode) {
			if (!offset) {
				offset = nodeIndex(container);
				container = container.parentNode;
			} else if (offset === container.length) {
				offset = nodeIndex(container) + 1;
				container = container.parentNode;
			}
		}
		setRange.call(range, container, offset);
	}

	/**
	 * Modifies the given range's start boundary and sets the range to the
	 * browser selection.
	 *
	 * @private
	 * @param {Range} range
	 *        Range objec to modify.
	 * @param {DOMObject} container
	 *        DOM element to set as the start container.
	 * @param {Number} offset
	 *        The offset into `container`.
	 */
	function setRangeStart(range, container, offset) {
		normalizeSetRange(range.setStart, range, container, offset);
	}

	/**
	 * Modifies the given range's end boundary and sets the range to the browser
	 * selection.
	 *
	 * @private
	 * @param {Range} range
	 *        Range objec to modify.
	 * @param {DOMObject} container
	 *        DOM element to set as the end container.
	 * @param {Number} offset
	 *        The offset into `container`.
	 */
	function setRangeEnd(range, container, offset) {
		normalizeSetRange(range.setEnd, range, container, offset);
	}

	function adjustRangeAfterSplit(container, offset, range, setRange,
	                               splitNode, splitOffset,
								   newNodeBeforeSplit) {
		if (container === splitNode) {
			if (offset <= splitOffset || !splitOffset) {
				container = newNodeBeforeSplit;
			} else {
				container = newNodeBeforeSplit.nextSibling;
				offset -= splitOffset;
			}
		} else if (container === newNodeBeforeSplit.parentNode) {
			var nidx = nodeIndex(newNodeBeforeSplit);
			if (offset > nidx) {
				offset += 1;
			}
		}
		setRange(range, container, offset);
	}

	function adjustBoundaryPointAfterJoin(container, offset, range, setRange,
	                                      node, nodeLen, sibling, siblingLen,
	                                      parentNode, nidx, prev) {
		if (container === node) {
			container = sibling;
			offset += prev ? siblingLen : 0;
		} else if (container === sibling) {
			offset += prev ? 0 : nodeLen;
		} else if (container === parentNode) {
			if (offset === nidx) {
				container = sibling;
				offset = prev ? siblingLen : 0;
			} else if (!prev && offset === nidx + 1) {
				container = sibling;
				offset = nodeLen;
			} else if (offset > nidx) {
				offset -= 1;
			}
		}
		setRange(range, container, offset);
	}

	function adjustBoundaryPointAfterRemove(container, offset, range, setRange,
	                                        node, parentNode, nidx) {
		if (container === node || contains(node, container)) {
			container = parentNode;
			offset = nidx;
		} else if (container === parentNode) {
			if (offset > nidx) {
				offset -= 1;
			}
		}
		setRange(range, container, offset);
	}

	/**
	 * @doc function
	 * @name aloha.dom:splitTextNodeAdjustRange
	 * @description
	 *
	 * Splits the given text node at the given offset and, if the given
	 * range happens to have start or end containers equal to the given
	 * text node, adjusts it such that start and end position will point
	 * at the same position in the new text nodes.
	 */
	function splitTextNodeAdjustRange(splitNode, splitOffset, range) {
		if (Nodes.TEXT !== splitNode.nodeType) {
			return;
		}
		// Because the range may change due to the DOM modification
		// (automatically by the browser).
		var sc = range.startContainer;
		var so = range.startOffset;
		var ec = range.endContainer;
		var eo = range.endOffset;
		if (wouldSplitTextNode(splitNode, splitOffset)) {
			var nodeBeforeSplit = splitTextNode(splitNode, splitOffset);
			adjustRangeAfterSplit(
				sc,
				so,
				range,
				setRangeStart,
				splitNode,
				splitOffset,
				nodeBeforeSplit
			);
			adjustRangeAfterSplit(
				ec,
				eo,
				range,
				setRangeEnd,
				splitNode,
				splitOffset,
				nodeBeforeSplit
			);
		}
	}

	/**
	 * @doc function
	 * @name aloha.dom:splitTextContainers
	 * @description
	 *
	 * Splits text containers in the given range.
	 *
	 * @param {Range} range given range
	 * @return {Range}
	 *         The given range, potentially adjusted.
	 */
	function splitTextContainers(range) {
		var sc = range.startContainer;
		var so = range.startOffset;
		splitTextNodeAdjustRange(sc, so, range);
		// Because the range may have been adjusted.
		var ec = range.endContainer;
		var eo = range.endOffset;
		splitTextNodeAdjustRange(ec, eo, range);
		return range;
	}

	function joinTextNodeOneWay(node, sibling, range, prev) {
		if (!sibling || Nodes.TEXT !== sibling.nodeType) {
			return node;
		}
		// Because the range may change due to the DOM modication (automatically
		// by the browser).
		var sc = range.startContainer;
		var so = range.startOffset;
		var ec = range.endContainer;
		var eo = range.endOffset;
		var parentNode = node.parentNode;
		var nidx = nodeIndex(node);
		var nodeLen = node.length;
		var siblingLen = sibling.length;
		sibling.insertData(prev ? siblingLen : 0, node.data);
		parentNode.removeChild(node);
		adjustBoundaryPointAfterJoin(
			sc,
			so,
			range,
			setRangeStart,
			node,
			nodeLen,
			sibling,
			siblingLen,
			parentNode,
			nidx,
			prev
		);
		adjustBoundaryPointAfterJoin(
			ec,
			eo,
			range,
			setRangeEnd,
			node,
			nodeLen,
			sibling,
			siblingLen,
			parentNode,
			nidx,
			prev
		);
		return sibling;
	}

	/**
	 * @doc function
	 * @name aloha.dom:joinTextNodeAdjustRange
	 * @description
	 *
	 * Joins the given node with its adjacent sibling.
	 *
	 * @param {DOMElement} A text node
	 * @param {Range} range given range
	 * @return {Range}
	 *         The given range, modified if necessary.
	 */
	function joinTextNodeAdjustRange(node, range) {
		if (Nodes.TEXT !== node.nodeType) {
			return range;
		}
		node = joinTextNodeOneWay(node, node.previousSibling, range, true);
		joinTextNodeOneWay(node, node.nextSibling, range, false);
		return range;
	}

	/**
	 * @doc function
	 * @name aloha.dom:removeShallow
	 * @description
	 *
	 * Removes the given node while keeping it's content intact.
	 *
	 * @param {DOMObject} node given node
	 */
	function removeShallow(node) {
		var parent = node.parentNode;
		moveNextAll(parent, node.firstChild, node);
		parent.removeChild(node);
	}

	/**
	 * @doc function
	 * @name aloha.dom:removePreservingRanges
	 * @description
	 *
	 * Removes the given node while maintaing the given ranges.
	 *
	 * @param {DOMObject} node given node
	 * @param {Array[Range]} ranges given ranges
	 */
	function removePreservingRanges(node, ranges) {
		var range;
		// Because the range may change due to the DOM modification
		// (automatically by the browser).
		var boundaries = [];
		var i;
		for (i = 0; i < ranges.length; i++) {
			range = ranges[i];
			boundaries.push(range);
			boundaries.push(range.startContainer);
			boundaries.push(range.startOffset);
			boundaries.push(range.endContainer);
			boundaries.push(range.endOffset);
		}
		var parentNode = node.parentNode;
		var nidx = nodeIndex(node);
		parentNode.removeChild(node);
		for (i = 0; i < boundaries.length; i += 5) {
			adjustBoundaryPointAfterRemove(
				boundaries[i + 1],
				boundaries[i + 2],
				boundaries[i],
				setRangeStart,
				node,
				parentNode,
				nidx
			);
			adjustBoundaryPointAfterRemove(
				boundaries[i + 3],
				boundaries[i + 4],
				boundaries[i],
				setRangeEnd,
				node,
				parentNode,
				nidx
			);
		}
	}

	/**
	 * @doc function
	 * @name aloha.dom:removePreservingRange
	 * @description
	 *
	 * Removes the given node while maintaing the given range.
	 *
	 * @param {DOMObject} node given node
	 * @param {Range} range given range
	 */
	function removePreservingRange(node, range) {
		removePreservingRanges(node, [range]);
	}

	function preservePointForShallowRemove(node, point) {
		if (point.node === node) {
			if (point.node.firstChild) {
				point.next();
			} else {
				point.skipNext();
			}
		}
	}

	function preserveBoundaries(node, points, preserveFn) {
		var i;
		for (i = 0; i < points.length; i++) {
			preserveFn(node, points[i]);
		}
	}

	/**
	 * @doc function
	 * @name aloha.dom:removeShallowPreservingBoundaries
	 * @description
	 *
	 * Does a shallow removal of the given node (see removeShallow()), while
	 * preserving the range boundary points.
	 *
	 * @param {DOMObject} node given node
	 * @param {Array[Cursor]} points given cursor
	 */
	function removeShallowPreservingBoundaries(node, points) {
		preserveBoundaries(node, points, preservePointForShallowRemove);
		removeShallow(node);
	}

	/**
	 * @doc function
	 * @name aloha.dom:cloneShallow
	 * @description
	 *
	 * Returns a shallow clone of the given node.
	 *
	 * @param {DOMObject} node given node
	 * @return {DOMObject}
	 *         Clone of `node`.
	 */
	function cloneShallow(node) {
		return node.cloneNode(false);
	}

	/**
	 * @doc function
	 * @name aloha.dom:setStyle
	 * @description
	 *
	 * Sets a style on the given element by modifying its style attribute.
	 */
	function setStyle(node, name, value) {
		name = strings.dashesToCamelCase(name);
		var styles = node.style;
		if (name in styles) {
			styles[name] = value;
		}
	}

	/**
	 * @doc function
	 * @name aloha.dom:getStyle
	 * @description
	 *
	 * Gets a style from the given element's style attribute.
	 * Note that this is different from the computed/inherited style.
	 *
	 * @param {DOMObject} elem
	 *        Should be an element node.
	 * @param {String} name
	 *        Style property name.
	 * @return {String|null}
	 *         Style value or null if none is found.
	 */
	function getStyle(node, name) {
		// Because IE7 needs dashesToCamelCase().
		name = strings.dashesToCamelCase(name);
		return node.nodeType === Nodes.ELEMENT ? node.style[name] : null;
	}

	/**
	 * @doc function
	 * @name aloha.dom:getComputedStyle
	 * @description
	 *
	 * Gets the computed/inherited style of the given node.
	 *
	 * @param {DOMObject} elem
	 *        Should be an element node.
	 * @param {String} name
	 *        Style property name.
	 * @return {String|null}
	 *         Computed style, or `null` if no such style is set.
	 */
	function getComputedStyle(elem, name) {
		var doc = elem.ownerDocument;
		if (doc && doc.defaultView && doc.defaultView.getComputedStyle) {
			var styles = doc.defaultView.getComputedStyle(elem, null);
			if (styles) {
				return styles[name] || styles.getPropertyValue(name);
			}
		}
		if (elem.currentStyle) {
			// Because IE7 needs dashesToCamelCase().
			name = strings.dashesToCamelCase(name);
			return elem.currentStyle[name];
		}
		return null;
	}

	/**
	 * @doc function
	 * @name aloha.dom:removeStyle
	 * @description
	 *
	 * Removes the given style property from the given DOM element.
	 *
	 * @param {DOMObject} elem given element
	 * @param {String} styleName style property
	 */
	function removeStyle(elem, styleName) {
		if (browser.hasRemoveProperty) {
			elem.style.removeProperty(styleName);
			if (strings.empty(getAttr(elem, 'style'))) {
				removeAttr(elem, 'style');
			}
		} else {
			// TODO: this is a hack for browsers that don't support
			//       removeProperty (ie < 9)and will not work correctly for all
			//       valid inputs, but it's the simplest thing I can come up
			//       with without implementing a full css parser.
			var style = getAttr(elem, 'style');
			if (null == style) {
				return;
			}
			// Because concatenating just any input into the regex might
			// be dangerous.
			if ((/[^\w\-]/).test(styleName)) {
				throw 'unrecognized style name ' + styleName;
			}
			var stripRegex = new RegExp(
				'(:?^|;)\\s*' + styleName + '\\s*:.*?(?=;|$)',
				'i'
			);
			style = style.replace(stripRegex, '');
			if (!strings.empty(style)) {
				setAttr(elem, 'style', style);
			} else {
				removeAttr(elem, 'style');
			}
		}
	}

	/**
	 * @doc function
	 * @name aloha.dom:hasAttrs
	 * @description
	 *
	 * Checks whether or not the given node contains one or more attributes.
	 *
	 * @param {DOMObject} node given node
	 * @return {Boolean} true if given node contains one or more attributes
	 */
	function hasAttrs(node) {
		return !attrs(node).map(arrays.second).every(strings.empty);
	}

	/**
	 * @doc function
	 * @name aloha.dom:offset
	 * @description
	 *
	 * Calculare the offset of the given node inside the document.
	 *
	 * @param {DOMObjec} node given node
	 * @return {Object} offset of the given node inside the document
	 */
	function offset(node) {
		if (!misc.defined(node.getBoundingClientRect)) {
			return {
				top: 0,
				left: 0
			};
		}
		var box = node.getBoundingClientRect();
		return {
			top  : box.top  + window.pageYOffset - document.body.clientTop,
			left : box.left + window.pageXOffset - document.body.clientLeft
		};
	}

	var WORD_BOUNDARY = /\S+/g;
	var WHITESPACES = /\s/;

	function addToList(list, element, index) {
		if (-1 === index) {
			list.push(element);
		}
		return list;
	}

	function removeFromList(list, element, index) {
		if (-1 < index) {
			list.splice(index, 1);
		}
		return list;
	}

	function changeClassNames(elem, value, change) {
		var names = (value || '').match(WORD_BOUNDARY) || [];
		var classes;
		if (elem.nodeType === Nodes.ELEMENT) {
			var className = elem.className.trim();
			classes = ('' === className) ? [] : className.split(WHITESPACES);
		} else {
			classes = [];
		}
		var i;
		var len = names.length;
		for (i = 0; i < len; i++) {
			classes = change(classes, names[i], classes.indexOf(names[i]));
		}
		elem.className = classes.join(' ');
		return elem;
	}

	/**
	 * @doc function
	 * @name aloha.dom:addClass
	 * @description
	 *
	 * Adds one or more class names from the give node.
	 *
	 * @param {DOMObject} node given node
	 * @param {Strings} value class name
	 * @return {DOMObject} modified node
	 */
	function addClass(node, value) {
		return changeClassNames(node, value, addToList);
	}

	/**
	 * @doc function
	 * @name aloha.dom:removeClass
	 * @description
	 *
	 * Remove one or more class names from the given node.
	 *
	 * @param {DOMObject} node given node
	 * @param {Strings} value class name
	 * @return {DOMObject} modified node
	 */
	function removeClass(node, value) {
		return changeClassNames(node, value, removeFromList);
	}

	/**
	 * @doc function
	 * @name aloha.dom:hasClass
	 * @description
	 *
	 * Checks whether the given node has the specified class.
	 *
	 * @param {DOMObject} node given node
	 * @param {String} value class name
	 * @return {Boolean} true if node has the specified class
	 */
	function hasClass(node, value) {
		return (
			node.nodeType === Nodes.ELEMENT
				&& node.className.trim().split(WHITESPACES).indexOf(value) >= 0
		);
	}

	/**
	 * @doc function
	 * @name aloha.dom:isEditingHost
	 * @description
	 *
	 * Checks whether the given node is content editable.  An editing host is a
	 * node that is either an Element with a contenteditable attribute set to
	 * the true state, or the Element child of a Document whose designMode is
	 * enabled.
	 *
	 *
	 * @param {DOMObject} node given node
	 * @return {Boolean}
	 *         True if `node` is content editable.
	 */
	function isEditingHost(node) {
		return !!(node
			&& node.nodeType === Nodes.ELEMENT
				&& ('true' === node.contentEditable
					|| (node.parentNode
						&& Nodes.DOCUMENT === node.parentNode.nodeType
							&& 'true' === node.parentNode.designMode
					)
				)
		);
	}

	/**
	 * @doc function
	 * @name aloha.dom:isEditable
	 * @description
	 *
	 * Checks whether the given element is editable.
	 *
	 * @param {DOMObject} node given node
	 * @return {Boolean} true if node is editable
	 */
	function isEditable(node) {
		return !!(node
			&& (node.nodeType !== Nodes.ELEMENT
				|| 'false' !== node.contentEditable)
					&& !isEditingHost(node)
						&& (isEditingHost(node.parentNode)
							|| isEditable(node.parentNode))
		);
	}

	/**
	 * @doc function
	 * @name aloha.dom:getEditingHost
	 * @description
	 *
	 * Checks whether the given element is an editing host.
	 *
	 * @param {DOMObject} node given node
	 * @return {Boolean} true if node is an editing host
	 */
	function getEditingHost(node) {
		if (isEditingHost(node)) {
			return node;
		}
		if (!isEditable(node)) {
			return null;
		}
		var ancestor = node.parentNode;
		while (ancestor && !isEditingHost(ancestor)) {
			ancestor = ancestor.parentNode;
		}
		return ancestor;
	}

	/**
	 * Functions for working with the DOM.
	 */
	var exports = {
		offset: offset,
		remove: remove,
		merge: merge,

		addClass: addClass,
		removeClass: removeClass,
		hasClass: hasClass,

		getElementsByClassNames: getElementsByClassNames,

		getAttr: getAttr,
		setAttr: setAttr,
		removeAttr: removeAttr,
		attrNames: attrNames,
		hasAttrs: hasAttrs,
		attrs: attrs,

		indexByClass: indexByClass,
		indexByName: indexByName,
		indexByClassHaveList: indexByClassHaveList,

		outerHtml: outerHtml,

		moveNextAll: moveNextAll,
		removeShallow: removeShallow,
		removeShallowPreservingBoundaries: removeShallowPreservingBoundaries,
		removePreservingRange: removePreservingRange,
		removePreservingRanges: removePreservingRanges,
		cloneShallow: cloneShallow,

		wrap: wrap,
		insert: insert,
		replaceShallow: replaceShallow,

		isAtEnd: isAtEnd,
		isAtStart: isAtStart,
		nodeIndex: nodeIndex,
		nodeLength: nodeLength,
		nodeAtOffset: nodeAtOffset,

		isTextNode: isTextNode,
		splitTextNode: splitTextNode,
		splitTextContainers: splitTextContainers,
		splitTextNodeAdjustRange: splitTextNodeAdjustRange,
		joinTextNodeAdjustRange: joinTextNodeAdjustRange,

		contains: contains,

		setStyle: setStyle,
		getStyle: getStyle,
		getComputedStyle: getComputedStyle,
		removeStyle: removeStyle,

		isEditable: isEditable,
		isEditingHost: isEditingHost,
		getEditingHost: getEditingHost,

		Nodes: Nodes
	};

	exports['offset'] = exports.offset;
	exports['remove'] = exports.remove;
	exports['merge'] = exports.merge;
	exports['addClass'] = exports.addClass;
	exports['removeClass'] = exports.removeClass;
	exports['hasClass'] = exports.hasClass;
	exports['getElementsByClassNames'] = exports.getElementsByClassNames;
	exports['getAttr'] = exports.getAttr;
	exports['setAttr'] = exports.setAttr;
	exports['removeAttr'] = exports.removeAttr;
	exports['attrNames'] = exports.attrNames;
	exports['hasAttrs'] = exports.hasAttrs;
	exports['attrs'] = exports.attrs;
	exports['indexByClass'] = exports.indexByClass;
	exports['indexByName'] = exports.indexByName;
	exports['indexByClassHaveList'] = exports.indexByClassHaveList;
	exports['outerHtml'] = exports.outerHtml;
	exports['moveNextAll'] = exports.moveNextAll;
	exports['removeShallow'] = exports.removeShallow;
	exports['removeShallowPreservingBoundaries'] = exports.removeShallowPreservingBoundaries;
	exports['removePreservingRange'] = exports.removePreservingRange;
	exports['removePreservingRanges'] = exports.removePreservingRanges;
	exports['cloneShallow'] = exports.cloneShallow;
	exports['wrap'] = exports.wrap;
	exports['insert'] = exports.insert;
	exports['replaceShallow'] = exports.replaceShallow;
	exports['isAtEnd'] = exports.isAtEnd;
	exports['isAtStart'] = exports.isAtStart;
	exports['nodeIndex'] = exports.nodeIndex;
	exports['nodeLength'] = exports.nodeLength;
	exports['nodeAtOffset'] = exports.nodeAtOffset;
	exports['isTextNode'] = exports.isTextNode;
	exports['splitTextNode'] = exports.splitTextNode;
	exports['splitTextContainers'] = exports.splitTextContainers;
	exports['splitTextNodeAdjustRange'] = exports.splitTextNodeAdjustRange;
	exports['joinTextNodeAdjustRange'] = exports.joinTextNodeAdjustRange;
	exports['contains'] = exports.contains;
	exports['setStyle'] = exports.setStyle;
	exports['getStyle'] = exports.getStyle;
	exports['getComputedStyle'] = exports.getComputedStyle;
	exports['removeStyle'] = exports.removeStyle;
	exports['isEditable'] = exports.isEditable;
	exports['isEditingHost'] = exports.isEditingHost;
	exports['getEditingHost'] = exports.getEditingHost;
	exports['Nodes'] = exports.Nodes;

	exports['Nodes']['ELEMENT'] = exports.Nodes.ELEMENT;
	exports['Nodes']['ATTR'] = exports.Nodes.ATTR;
	exports['Nodes']['TEXT'] = exports.Nodes.TEXT;
	exports['Nodes']['CDATA_SECTION'] = exports.Nodes.CDATA_SECTION;
	exports['Nodes']['ENTITY_REFERENCE'] = exports.Nodes.ENTITY_REFERENCE;
	exports['Nodes']['ENTITY'] = exports.Nodes.ENTITY;
	exports['Nodes']['PROCESSING_INSTRUCTION'] = exports.Nodes.PROCESSING_INSTRUCTION;
	exports['Nodes']['COMMENT'] = exports.Nodes.COMMENT;
	exports['Nodes']['DOCUMENT'] = exports.Nodes.DOCUMENT;
	exports['Nodes']['DOCUMENTTYPE'] = exports.Nodes.DOCUMENTTYPE;
	exports['Nodes']['DOCUMENT_FRAGMENT'] = exports.Nodes.DOCUMENT_FRAGMENT;
	exports['Nodes']['NOTATION'] = exports.Nodes.NOTATION;

	return exports;
});
