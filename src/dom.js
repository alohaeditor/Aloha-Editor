/* dom.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'maps',
	'arrays',
	'strings',
	'browsers',
	'functions',
	'misc'
], function Dom(
	Maps,
	Arrays,
	Strings,
	Browsers,
	Fn,
	Misc
) {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('dom');
	}

	var ATTRIBUTE = /\s([^\/<>\s=]+)(?:=(?:"[^"]*"|'[^']*'|[^>\/\s]+))?/g;

	/**
	 * Numeric codes that represent the type of DOM interface node types.
	 *
	 * @type {!Object.<string, number>}
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
	 * Calculates the number of child nodes contained in the given DOM element.
	 *
	 * NB elem.childNodes.length is unreliable because "IE up to 8 does not count
	 * empty text nodes." (http://www.quirksmode.org/dom/w3c_core.html)
	 *
	 * @param {!Element} elem
	 * @return {number} Number of children contained in the given node.
	 */
	function numChildren(elem) {
		return elem.childNodes.length;
	}

	function children(elem) {
		return Arrays.coerce(elem.childNodes);
	}

	/**
	 * Get the nth (zero based) child of the given element.
	 * 
	 * NB elem.childNodes.length is unreliable because "IE up to 8 does not count
	 * empty text nodes." (http://www.quirksmode.org/dom/w3c_core.html)
	 *
	 * @param {!Element} elem
	 * @param {number} The offset of the child to return.
	 * @return {!Element} The child at the given offset.
	 */
	function nthChild(elem, offset) {
		return elem.childNodes[offset];
	}

	/**
	 * Calculates the positional index of the given node inside of its parent
	 * element.
	 *
	 * @param {!Node} node
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
	 * Determines the length of the given DOM node.
	 *
	 * @param {!Node} node
	 * @return {number} Length of the given node.
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
	 * Returns `true` if `node` is a text node.
	 *
	 * @param {!Node} node
	 * @return {boolean}
	 */
	function isTextNode(node) {
		return Nodes.TEXT === node.nodeType;
	}

	function isEmptyTextNode(node) {
		return isTextNode(node) && !nodeLength(node);
	}

	/**
	 * Like insertBefore, inserts firstChild into parent before refChild, except
	 * also inserts all the following siblings of firstChild.
	 *
	 * @param {!Element} parent
	 * @param {!Node} firstChild
	 * @param {!Node} refChild
	 */
	function moveNextAll(parent, firstChild, refChild) {
		while (firstChild) {
			var nextChild = firstChild.nextSibling;
			parent.insertBefore(firstChild, refChild);
			firstChild = nextChild;
		}
	}

	/**
	 * Moves the given node, and all subsequent nextSiblings until `until` for
	 * any of these sibling, into the end of `container`.
	 *
	 * @param {Element} node
	 * @param {Element} container
	 * @param {!Function(Element):boolean} container
	 * @return {!Element}
	 *         The node that caused any further moving to abort.
	 */
	function moveSiblingsInto(node, container, until) {
		var next;
		until = until || Fn.returnFalse;
		while (node && node !== container && !until(node)) {
			next = node.nextSibling;
			insert(node, container, true);
			node = next;
		}
		return node;
	}

	/**
	 * Moves the given node, and all subsequent nextSiblings until `until` for
	 * any of these sibling, after `ref`.
	 *
	 * @param {Element} node
	 * @param {Element} ref
	 * @param {!Function(Element):boolean} container
	 * @return {!Element}
	 *         The node that caused any further moving to abort.
	 */
	function moveSiblingsAfter(node, ref, until) {
		var next;
		until = until || Fn.returnFalse;
		while (node && node !== ref && !until(node)) {
			next = node.nextSibling;
			insertAfter(node, ref);
			// Because endless loop detected.
			if (next === ref) {
				return null;
			}
			ref = node;
			node = next;
		}
		return node;
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
	 * @type {XMLSerializer}
	 */
	var Serializer = window.XMLSerializer && new window.XMLSerializer();

	/**
	 * Gets the serialized HTML that describes the given DOM element and its
	 * innerHtml.
	 *
	 * Polyfill for older versions of Gecko, Safari, and Opera browsers.
	 * @see https://bugzilla.mozilla.org/show_bug.cgi?id=92264 for background.
	 *
	 * @param {!Node} node
	 * @return {string}
	 */
	function outerHtml(node) {
		var html = node.outerHTML;
		if (Misc.defined(html)) {
			return html;
		}
		try {
			return Serializer ? Serializer.serializeToString(node) : node.xml;
		} catch (e) {
			return node.xml;
		}
	}

	/**
	 * Retrieves the names of all attributes from the given elmenet.
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
	 * @param {!Element} elem
	 * @return {!Array.<string>} List of attribute names.
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

	/**
	 * Gets the attributes of the given element.
	 *
	 * See attrNames() for an edge case on IE7.
	 *
	 * @param {!Element} elem
	 *        An element to get the attributes for.
	 * @return {!Array.<string>}
	 *         An array containing [name, value] tuples for each attribute.
	 *         Attribute values will always be strings, but possibly empty
	 *         Strings.
	 */
	function attrs(elem) {
		var as = [];
		var names = attrNames(elem);
		var i;
		var len;
		for (i = 0, len = names.length; i < len; i++) {
			var name = names[i];
			var value = elem.getAttribute(name);
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
	 * Like indexByClass() but operates on a list of elements instead.  The
	 * given list may be a NodeList, HTMLCollection, or an array.
	 *
	 * @param {!Array.<!Element>} elems
	 * @param {!Object.<string, boolean>} classMap
	 * @return {!Object.<string, !Array.<!Element>>}
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
				classes = Strings.words(elem.className);
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
	 * Returns a set of elements which have the given class names.
	 *
	 * @param {!Array.<string>} classes
	 * @param {Node=} context
	 *        The root element in which to do the search.
	 * @return {!Array.<!Node>}
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
				if (!Arrays.contains(results, found[j])) {
					results.push(found[j]);
				}
			}
		}
		return results;
	}

	/**
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
	 * @param {!Element} root
	 *        The root element to search for elements to index (will not be
	 *        included in search).
	 * @param {!Object.<string, boolean>} classMap
	 *        A map from class name to boolean true.
	 * @return {!Object.<string, !Array.<!Element>>}
	 *         A map from class name to an array of elements with that class.
	 *         Every entry in classMap for which elements have been found will
	 *         have a corresponding entry in the returned map.  Entries for
	 *         which no elements have been found, may or may not have an entry
	 *         in the returned map.
	 */
	function indexByClass(root, classMap) {
		return indexByClassHaveList(
			Browser.ie7 ? root.getElementsByTagName('*')
			            : getElementsByClassNames(Maps.keys(classMap), root),
			classMap
		);
	}

	/**
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
	 * @param {!Element} root
	 *        The root element to search for elements to index (will not be
	 *        included in search).
	 * @param {!Array.<string>} names
	 *        An array of element names to look for.
	 *        Names must be in all-uppercase (the same as elem.nodeName).
	 * @return {!Object.<string, !Array.<!Element>>}
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
	 * Whether or not the given node and offset describes a position before the
	 * first child node or character in its container.
	 *
	 * Will return true if the selection looks like this:
	 * <b>{foo</b>...
	 * or
	 * <b>[foo</b>...
	 *
	 * @param {!Node} node
	 * @param {number} offset
	 * @return {boolean}
	 */
	function isAtStart(node, offset) {
		return (
			0 === offset
				&& (Nodes.TEXT !== node.nodeType || !node.previousSibling)
		);
	}

	/**
	 * Whether or not the given node and offset describes a position after the
	 * last child node or character in its container.
	 *
	 * @param {!Node} node
	 * @param {number} offset
	 * @return {boolean}
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
	 * @param node if a text node, should have a parent node.
	 */
	function nodeAtOffset(node, offset) {
		if (Nodes.ELEMENT === node.nodeType && offset < nodeLength(node)) {
			node = nthChild(node, offset);
		} else if (Nodes.TEXT === node.nodeType && offset === node.length) {
			node = node.nextSibling || node.parentNode;
		}
		return node;
	}

	/**
	 * Normalizes the boundary point represented by container and offset
	 * such that it will not point to the start or end of a text node
	 * which reduces the number of different states the boundary can be
	 * in, and thereby increases the the robusteness of the code written
	 * against it slightly.
	 *
	 * It should be noted that native ranges controlled by the browser's
	 * DOM implementation have the habit to change by themselves, so
	 * even if normalized this way the range could revert to an
	 * unnormalized state. See StableRange().
	 */
	function normalizeBoundary(boundary) {
		var container = boundary[0];
		if (isTextNode(container)) {
			var parent = container.parentNode;
			var offset = boundary[1];
			if (!offset && parent) {
				boundary = [parent, nodeIndex(container)];
			} else if (offset >= nodeLength(container) && parent) {
				boundary = [parent, nodeIndex(container) + 1];
			}
		}
		return boundary;
	}

	/**
	 * Wraps node `node` in given node `wrapper`.
	 *
	 * @param {!Node} node
	 * @param {!Element} wrapper
	 */
	function wrap(node, wrapper) {
		node.parentNode.replaceChild(wrapper, node);
		wrapper.appendChild(node);
	}

	/**
	 * Inserts node `node` before `ref`, unless `atEnd` is truthy, in which case
	 * `node` is inserted at the end of `ref` children nodes.
	 *
	 * @param {!Node} node
	 * @param {!Node} ref
	 * @param {boolean} atEnd
	 */
	function insert(node, ref, atEnd) {
		if (atEnd) {
			ref.appendChild(node);
		} else {
			ref.parentNode.insertBefore(node, ref);
		}
	}

	function insertAfter(node, ref) {
		insert(node, ref.nextSibling || ref.parentNode, !ref.nextSibling);
	}

	/**
	 * Detaches the given node.
	 *
	 * @param {!Node} node
	 */
	function remove(node) {
		node.parentNode.removeChild(node);
	}

	/**
	 * Merges all contents of `right` into `left` by appending them to the end
	 * of `left`, and then removing `right`.
	 *
	 * Will not merge text nodes since this requires ranges to be synchronized.
	 *
	 * @param {!Node} left
	 * @param {!Node} right
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
	 * Replaces the given element while preserving its contents in the
	 * replacement.
	 *
	 * This function facilitates re-wrapping of contents from one
	 * element to another.
	 *
	 * @param {!Element} elem
	 *        The element to be removed.
	 * @param {!Element} replacement
	 *        The replacement for `elem` which will receive all of the
	 *        given element's Content.
	 */
	function replaceShallow(elem, replacement) {
		moveNextAll(replacement, elem.firstChild, null);
		insert(replacement, elem);
		remove(elem);
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
	 * @param {!Node} a
	 * @param {!Node} b
	 * @return {boolean}
	 */
	function contains(a, b) {
		return (Nodes.ELEMENT === a.nodeType
				? (a.compareDocumentPosition
				   ? !!(a.compareDocumentPosition(b) & 16)
				   : (a !== b
				      // Because IE returns false for elemNode.contains(textNode).
				      && (1 === b.nodeType
				          ? a.contains(b)
				          : (b.parentNode
				             && (a === b.parentNode || a.contains(b.parentNode))))))
		        : false);
	}

	function followedBy(a, b) {
		return !!(a.compareDocumentPosition(b) & 4);
	}

	/**
	 * Checks whether a node can be split at the given offset to yeild two
	 * nodes.
	 *
	 * @private
	 * @param {!Node} node
	 * @param {number} offset
	 * @return {boolean}
	 */
	function wouldSplitTextNode(node, offset) {
		return 0 < offset && offset < node.nodeValue.length;
	}

	/**
	 * Splits the given text node at the given offset.
	 *
	 * @TODO: could be optimized with insertData() so only a single text node is
	 *        inserted instead of two.
	 *
	 * @param {!Node} node
	 *        DOM text node.
	 * @param {number} offset
	 *        Number between 0 and the length of text of `node`.
	 * @return {!Node}
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

	function adjustBoundaryAfterSplit(boundary, splitNode, splitOffset,
	                                  newNodeBeforeSplit) {
		var container = boundary[0];
		var offset = boundary[1];
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
		return [container, offset];
	}

	function adjustBoundaryAfterJoin(boundary, node, nodeLen, sibling,
	                                 siblingLen, parentNode, nidx, prev) {
		var container = boundary[0];
		var offset = boundary[1];
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
		return [container, offset];
	}

	function adjustBoundaryAfterRemove(boundary, node, parentNode, nidx) {
		var container = boundary[0];
		var offset = boundary[1];
		if (container === node || contains(node, container)) {
			container = parentNode;
			offset = nidx;
		} else if (container === parentNode) {
			if (offset > nidx) {
				offset -= 1;
			}
		}
		return [container, offset];
	}

	function adjustBoundaryAfterInsert(boundary, insertContainer, insertOff, len, insertBefore) {
		var container = boundary[0];
		var offset = boundary[1];
		if (insertContainer === container && (insertBefore ? offset >= insertOff : offset > insertOff)) {
			boundary = [container, offset + len];
		}
		return boundary;
	}

	function adjustBoundaryAfterTextInsert(boundary, node, off, len, insertBefore) {
		boundary = normalizeBoundary(boundary);
		var container = boundary[0];
		var offset = boundary[1];
		// Because we must adjust boundaries adjacent to the insert
		// correctly, even if they are not inside the text node but
		// between nodes, we must move them in temporarily and normalize
		// again afterwards.
		if (!isTextNode(container)) {
			var next = offset < numChildren(container) ? nthChild(container, offset) : null;
			var prev = offset > 0 ? nthChild(container, offset - 1) : null;
			if (next === node) {
				boundary = [next, 0];
			} else if (prev === node) {
				boundary = [prev, nodeLength(prev)];
			}
		}
		return normalizeBoundary(adjustBoundaryAfterInsert(boundary, node, off, len, insertBefore));
	}

	function adjustBoundaryAfterNodeInsert(boundary, node, insertBefore) {
		boundary = normalizeBoundary(boundary);
		return adjustBoundaryAfterInsert(boundary, node.parentNode, nodeIndex(node), 1, insertBefore);
	}

	function nodeAtBoundary(boundary) {
		return nodeAtOffset(boundary[0], boundary[1]);
	}

	function isBoundaryAtEnd(boundary) {
		return isAtEnd(boundary[0], boundary[1]);
	}

	function startBoundary(range) {
		return [range.startContainer, range.startOffset];
	}

	function endBoundary(range) {
		return [range.endContainer, range.endOffset];
	}

	/**
	 * Sets the given range's start boundary.
	 *
	 * @param {!Range} range Range objec to modify.
	 */
	function setRangeStartFromBoundary(range, boundary) {
		boundary = normalizeBoundary(boundary);
		range.setStart(boundary[0], boundary[1]);
	}

	/**
	 * Sets the given range's end boundary.
	 *
	 * @param {!Range} range Range objec to modify.
	 */
	function setRangeEndFromBoundary(range, boundary) {
		boundary = normalizeBoundary(boundary);
		range.setEnd(boundary[0], boundary[1]);
	}

	function setRangeFromBoundaries(range, startBoundary, endBoundary) {
		setRangeStartFromBoundary(range, startBoundary);
		setRangeEndFromBoundary(range, endBoundary);
	}

	function boundariesFromRange(range) {
		return [startBoundary(range), endBoundary(range)];
	}

	function boundariesFromRanges(ranges) {
		// Because we don't want to check it every time we need to
		// preserve some ranges, we accept null values here.
		ranges = ranges || [];
		return Arrays.mapcat(ranges, boundariesFromRange);
	}

	function adjustBoundaries(fn, boundaries) {
		var args = Array.prototype.slice.call(arguments, 2);
		return boundaries.map(function (boundary) {
			return fn.apply(null, [boundary].concat(args));
		});
	}

	function setRangesFromBoundaries(ranges, boundaries) {
		Arrays.partition(boundaries, 2).forEach(function (boundaries, i) {
			setRangeFromBoundaries(ranges[i], boundaries[0], boundaries[1]);
		});
	}

	/**
	 * Splits the given text node at the given offset and, if the given
	 * range happens to have start or end containers equal to the given
	 * text node, adjusts it such that start and end position will point
	 * at the same position in the new text nodes.
	 */
	function splitBoundary(boundary, ranges) {
		var splitNode = boundary[0];
		var splitOffset = boundary[1];
		if (isTextNode(splitNode) && wouldSplitTextNode(splitNode, splitOffset)) {
			var boundaries = boundariesFromRanges(ranges);
			boundaries.push(boundary);
			var nodeBeforeSplit = splitTextNode(splitNode, splitOffset);
			var adjusted = adjustBoundaries(
				adjustBoundaryAfterSplit,
				boundaries,
				splitNode,
				splitOffset,
				nodeBeforeSplit
			);
			boundary = adjusted.pop();
			setRangesFromBoundaries(ranges, adjusted);
		}
		return boundary;
	}

	/**
	 * Splits text containers in the given range.
	 *
	 * @param {!Range} range
	 * @return {!Range}
	 *         The given range, potentially adjusted.
	 */
	function splitTextContainers(range) {
		splitBoundary(startBoundary(range), [range]);
		splitBoundary(endBoundary(range), [range]);
	}

	function joinTextNodeOneWay(node, sibling, ranges, prev) {
		if (!sibling || Nodes.TEXT !== sibling.nodeType) {
			return node;
		}
		var boundaries = boundariesFromRanges(ranges);
		var parentNode = node.parentNode;
		var nidx = nodeIndex(node);
		var nodeLen = node.length;
		var siblingLen = sibling.length;
		sibling.insertData(prev ? siblingLen : 0, node.data);
		parentNode.removeChild(node);
		boundaries = adjustBoundaries(
			adjustBoundaryAfterJoin,
			boundaries,
			node,
			nodeLen,
			sibling,
			siblingLen,
			parentNode,
			nidx,
			prev
		);
		setRangesFromBoundaries(ranges, boundaries);
		return sibling;
	}

	function joinTextNode(node, ranges) {
		if (Nodes.TEXT !== node.nodeType) {
			return;
		}
		node = joinTextNodeOneWay(node, node.previousSibling, ranges, true);
		joinTextNodeOneWay(node, node.nextSibling, ranges, false);
	}

	/**
	 * Joins the given node with its adjacent sibling.
	 *
	 * @param {!Node} A text node
	 * @param {!Range} range
	 * @return {!Range} The given range, modified if necessary.
	 */
	function joinTextNodeAdjustRange(node, range) {
		joinTextNode(node, [range]);
	}

	function adjustRangesAfterTextInsert(node, off, len, insertBefore, boundaries, ranges) {
		boundaries.push([node, off]);
		boundaries = adjustBoundaries(adjustBoundaryAfterTextInsert, boundaries, node, off, len, insertBefore);
		var boundary = boundaries.pop();
		setRangesFromBoundaries(ranges, boundaries);
		return boundary;
	}

	function adjustRangesAfterNodeInsert(node, insertBefore, boundaries, ranges) {
		boundaries.push([node.parentNode, nodeIndex(node)]);
		boundaries = adjustBoundaries(adjustBoundaryAfterNodeInsert, boundaries, node, insertBefore);
		var boundary = boundaries.pop();
		setRangesFromBoundaries(ranges, boundaries);
		return boundary;
	}

	function insertTextAtBoundary(text, boundary, insertBefore, ranges) {
		var boundaries = boundariesFromRanges(ranges);
		// Because empty text nodes are generally not nice and even cause
		// problems with IE8 (elem.childNodes).
		if (!text.length) {
			return boundary;
		}
		var container = boundary[0];
		var offset = boundary[1];
		if (isTextNode(container) && offset < nodeLength(container)) {
			container.insertData(offset, text);
			return adjustRangesAfterTextInsert(container, offset, text.length, insertBefore, boundaries, ranges);
		}
		var node = nodeAtOffset(container, offset);
		var atEnd = isAtEnd(container, offset);
		// Because if the node following the insert position is already a text
		// node we can just reuse it.
		if (isTextNode(node)) {
			node.insertData(0, text);
			return adjustRangesAfterTextInsert(node, 0, text.length, insertBefore, boundaries, ranges);
		}
		// Because if the node preceding the insert position is already a text
		// node we can just reuse it.
		var prev = atEnd ? node.lastChild : node.previousSibling;
		if (prev && isTextNode(prev)) {
			var off = nodeLength(prev);
			prev.insertData(off, text);
			return adjustRangesAfterTextInsert(prev, off, text.length, insertBefore, boundaries, ranges);
		}
		// Because if we can't reuse any text nodes, we have to insert a new
		// one.
		var textNode = document.createTextNode(text);
		insert(textNode, node, atEnd);
		return adjustRangesAfterNodeInsert(textNode, insertBefore, boundaries, ranges)
	}

	function insertNodeAtBoundary(node, boundary, insertBefore, ranges) {
		var boundaries = boundariesFromRanges(ranges);
		boundary = splitBoundary(boundary, ranges);
		var ref = nodeAtBoundary(boundary);
		var atEnd = isBoundaryAtEnd(boundary);
		insert(node, ref, atEnd);
		return adjustRangesAfterNodeInsert(node, insertBefore, boundaries, ranges);
	}

	/**
	 * Removes the given node while keeping it's content intact.
	 *
	 * @param {!Node} node
	 */
	function removeShallow(node) {
		var parent = node.parentNode;
		moveNextAll(parent, node.firstChild, node);
		parent.removeChild(node);
	}

	/**
	 * Removes the given node while maintaing the given Ranges.
	 *
	 * @param {!Node} node
	 * @param {!Array.<!Range>} ranges
	 */
	function removePreservingRanges(node, ranges) {
		var range;
		// Because the range may change due to the DOM modification
		// (automatically by the browser).
		var boundaries = boundariesFromRanges(ranges);
		var parentNode = node.parentNode;
		var nidx = nodeIndex(node);
		parentNode.removeChild(node);
		var adjusted = adjustBoundaries(
			adjustBoundaryAfterRemove,
			boundaries,
			node,
			parentNode,
			nidx
		);
		setRangesFromBoundaries(ranges, adjusted);
	}

	/**
	 * Removes the given node while maintaing the given range.
	 *
	 * @param {!Node} node
	 * @param {!Range} range
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
	 * Does a shallow removal of the given node (see removeShallow()), while
	 * preserving the range boundary points.
	 *
	 * @param {!Node} node
	 * @param {!Array.<!Cursor>} points
	 */
	function removeShallowPreservingBoundaries(node, points) {
		preserveBoundaries(node, points, preservePointForShallowRemove);
		removeShallow(node);
	}

	/**
	 * Returns a shallow clone of the given node.
	 *
	 * @param {!Node} node
	 * @return {!Node} a clone of the given node.
	 */
	function cloneShallow(node) {
		return node.cloneNode(false);
	}

	/**
	 * Returns a deep clone of the given node.
	 *
	 * @param {!Node} node
	 * @return {!Node} a clone of the given node.
	 */
	function clone(node) {
		return node.cloneNode(true);
	}

	/**
	 * Sets a style on the given element by modifying its style attribute.
	 */
	function setStyle(node, name, value) {
		name = Strings.dashesToCamelCase(name);
		var styles = node.style;
		if (name in styles) {
			styles[name] = value;
		}
	}

	/**
	 * Gets a style from the given element's style attribute.
	 * Note that this is different from the computed/inherited style.
	 *
	 * @param {!Element} elem
	 *        Should be an element node.
	 * @param {string} name
	 *        Style property name.
	 * @return {?string}
	 *         Style value or null if none is found.
	 */
	function getStyle(node, name) {
		// Because IE7 needs dashesToCamelCase().
		name = Strings.dashesToCamelCase(name);
		return node.nodeType === Nodes.ELEMENT ? node.style[name] : null;
	}

	function getComputedStyles(elem, names) {
		var props = {};
		var doc = elem.ownerDocument;
		if (doc && doc.defaultView && doc.defaultView.getComputedStyle) {
			var styles = doc.defaultView.getComputedStyle(elem, null);
			if (styles) {
				names.forEach(function (name) {
					props[name] = styles[name] || styles.getPropertyValue(name);
				});
			}
		} else if (elem.currentStyle) {
			names.forEach(function (name) {
				props[name] = elem.currentStyle[name];
			});
		}
		return props;
	}

	/**
	 * Gets the computed/inherited style of the given node.
	 *
	 * @param {!Element} elem
	 *        Should be an element node.
	 * @param {string} name
	 *        Style property name.
	 * @return {?string}
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
			name = Strings.dashesToCamelCase(name);
			return elem.currentStyle[name];
		}
		return null;
	}

	/**
	 * Removes the given style property from the given DOM element.
	 *
	 * @param {!Element} elem
	 * @param {string} styleName
	 */
	function removeStyle(elem, styleName) {
		if (Browser.hasRemoveProperty) {
			elem.style.removeProperty(styleName);
			if (Strings.empty(elem.getAttribute('style'))) {
				elem.removeAttribute('style');
			}
		} else {
			// TODO: this is a hack for browsers that don't support
			//       removeProperty (ie < 9)and will not work correctly for all
			//       valid inputs, but it's the simplest thing I can come up
			//       with without implementing a full css parser.
			var style = elem.getAttribute('style');
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
			if (!Strings.empty(style)) {
				setAttr(elem, 'style', style);
			} else {
				removeAttr(elem, 'style');
			}
		}
	}

	function removeAttr(elem, name) {
		elem.removeAttribute(name);
	}

	function setAttr(elem, name, value) {
		if (null == value) {
			removeAttr(elem, name);
		} else {
			elem.setAttribute(name, value);
		}
	}

	function getAttr(elem, name) {
		return elem.getAttribute(name);
	}

	function getAttrNS(elem, ns, name) {
		return elem.getAttributeNS(ns, name);
	}

	function removeAttrNS(elem, ns, name) {
		// TODO is removeAttributeNS(null, ...) the same as removeAttribute(...)?
		if (null != ns) {
			elem.removeAttributeNS(ns, name);
		} else {
			removeAttr(elem, name);
		}
	}

	/**
	 * NB: Internet Explorer supports the setAttributeNS method from
	 * version 9, but only for HTML documents, not for XML documents.
	 */
	function setAttrNS(elem, ns, name, value) {
		// TODO is setAttributeNS(null, ...) the same as setAttribute(...)?
		if (null != ns) {
			elem.setAttributeNS(ns, name, value);
		} else {
			setAttr(elem, name, value);
		}
	}

	/**
	 * Checks whether or not the given node contains one or more attributes.
	 *
	 * @param {!Node} node
	 * @param {boolean}
	 */
	function hasAttrs(node) {
		return !attrs(node).map(Arrays.second).every(Strings.empty);
	}

	/**
	 * Calculate the offset of the given node inside the document.
	 *
	 * @param {!Node} node
	 * @return {!Object.<string, number>}
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
	 * Adds one or more class names from the give node.
	 *
	 * @param {!Element} elem
	 * @param {string} value
	 */
	function addClass(elem, value) {
		changeClassNames(elem, value, addToList);
	}

	/**
	 * Remove one or more class names from the given node.
	 *
	 * @param {!Element} elem
	 * @param {string} value
	 */
	function removeClass(elem, value) {
		changeClassNames(elem, value, removeFromList);
	}

	/**
	 * Checks whether the given node has the specified class.
	 *
	 * @param {!Node} node
	 * @param {string} value
	 * @return {boolean}
	 */
	function hasClass(node, value) {
		return (
			node.nodeType === Nodes.ELEMENT
				&& node.className.trim().split(WHITESPACES).indexOf(value) >= 0
		);
	}

	/**
	 * Checks whether the given node is content editable.  An editing host is a
	 * node that is either an Element with a contenteditable attribute set to
	 * the true state, or the Element child of a Document whose designMode is
	 * enabled.
	 *
	 * @param {!Node} node
	 * @return {boolean} True if `node` is content editable.
	 */
	function isEditingHost(node) {
		if (node.nodeType !== Nodes.ELEMENT) {
			return false;
		}
		if ('true' === node.getAttribute('contentEditable')) {
			return true;
		}
		if (hasClass(node, 'aloha-editable')) {
			return true;
		}
		var parent = node.parentNode;
		return parent
		    && (parent.nodeType === Nodes.DOCUMENT
		        && 'true' === parent.designMode);
	}

	/**
	 * Checks whether the given element is editable.
	 *
	 * @param {!Node} node
	 * @return {boolean}
	 */
	function isEditable(node) {
		 if (!node.nodeType === Nodes.ELEMENT) {
			 return false;
		 }
		 if ('true' === node.contentEditable) {
			return true;
		 }
		 if (hasClass(node, 'aloha-block')) {
			return false;
		 }
		 var parent = node.parentNode;
		 while (parent) {
			 if (hasClass(parent, 'aloha-editable')) {
				return true;
			 }
			 parent = parent.parentNode;
		 }
		 return false;
	}

	/**
	 * Checks whether the given element is an editing host.
	 *
	 * @param {!Node} node
	 * @return {boolean}
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

	var parser = document.createElement('DIV');

	function parseNode(html) {
		parser.innerHTML = html;
		var node = parser.firstChild;
		parser.removeChild(node);
		return node;
	}

	function stringify(node) {
		return Serializer.serializeToString(node);
	}

	function isNode(node) {
		var str = Object.prototype.toString.call(node);
		// TODO: is this really the best way to do it?
		return (/^\[object (Text|Comment|HTML\w*Element)\]$/).test(str);
	}

	function parseReviver(key, value) {
		if (value && value['type'] === 'Node') {
			var str = value['value'];
			if (null != str) {
				value = parseNode(str);
			}
		}
		return value;
	}

	function stringifyReplacer(key, value) {
		if (value && isNode(value)) {
			value = {
				'type': 'Node',
				'value': stringify(value)
			};
		}
		return value;
	}

	var expandoIdCnt = 0;
	var expandoIdProp = '!aloha-expando-node-id';

	function ensureExpandoId(node) {
		return node[expandoIdProp] = node[expandoIdProp] || ++expandoIdCnt;
	}

	function isEqualNode(node, otherNode) {
		return node.isEqualNode(otherNode);
	}

	function enableSelection(elem) {
		elem.removeAttribute('unselectable', 'on');
		setStyle(elem, Browsers.VENDOR_PREFIX + '-user-select', 'all');
		elem.onselectstart = null;
	}

	function disableSelection(elem) {
		elem.removeAttribute('unselectable', 'on');
		setStyle(elem, Browsers.VENDOR_PREFIX + '-user-select', 'none');
		elem.onselectstart = Fn.returnFalse;
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

		attrNames: attrNames,
		hasAttrs: hasAttrs,
		attrs: attrs,
		setAttr: setAttr,
		setAttrNS: setAttrNS,
		getAttr: getAttr,
		getAttrNS: getAttrNS,
		removeAttr: removeAttr,
		removeAttrNS: removeAttrNS,

		indexByClass: indexByClass,
		indexByName: indexByName,
		indexByClassHaveList: indexByClassHaveList,

		outerHtml: outerHtml,

		moveNextAll: moveNextAll,
		moveSiblingsInto: moveSiblingsInto,
		moveSiblingsAfter: moveSiblingsAfter,

		removeShallow: removeShallow,
		removeShallowPreservingBoundaries: removeShallowPreservingBoundaries,
		removePreservingRange: removePreservingRange,
		removePreservingRanges: removePreservingRanges,
		cloneShallow: cloneShallow,
		clone: clone,

		wrap: wrap,
		insert: insert,
		insertAfter: insertAfter,
		replaceShallow: replaceShallow,

		isAtEnd: isAtEnd,
		isAtStart: isAtStart,
		children: children,
		nthChild: nthChild,
		nodeIndex: nodeIndex,
		nodeLength: nodeLength,
		nodeAtOffset: nodeAtOffset,
		nodeAtBoundary: nodeAtBoundary,
		normalizeBoundary: normalizeBoundary,
		isBoundaryAtEnd: isBoundaryAtEnd,
		startBoundary: startBoundary,
		endBoundary: endBoundary,
		insertTextAtBoundary: insertTextAtBoundary,
		insertNodeAtBoundary: insertNodeAtBoundary,

		normalizedNthChild: normalizedNthChild,
		normalizedNodeIndex: normalizedNodeIndex,
		realFromNormalizedIndex: realFromNormalizedIndex,
		normalizedNumChildren: normalizedNumChildren,

		isTextNode: isTextNode,
		isEmptyTextNode: isEmptyTextNode,
		isEqualNode: isEqualNode,
		splitTextNode: splitTextNode,
		splitTextContainers: splitTextContainers,
		joinTextNodeAdjustRange: joinTextNodeAdjustRange,
		joinTextNode: joinTextNode,
		splitBoundary: splitBoundary,

		contains: contains,
		followedBy: followedBy,

		setStyle: setStyle,
		getStyle: getStyle,
		getComputedStyle: getComputedStyle,
		getComputedStyles: getComputedStyles,
		removeStyle: removeStyle,

		isEditable: isEditable,
		isEditingHost: isEditingHost,
		getEditingHost: getEditingHost,

		stringify: stringify,
		stringifyReplacer: stringifyReplacer,
		parseReviver: parseReviver,
		Nodes: Nodes,

		ensureExpandoId: ensureExpandoId,
		setRangeFromBoundaries: setRangeFromBoundaries,

		enableSelection: enableSelection,
		disableSelection : disableSelection
	};

	exports['offset'] = exports.offset;
	exports['remove'] = exports.remove;
	exports['merge'] = exports.merge;
	exports['addClass'] = exports.addClass;
	exports['removeClass'] = exports.removeClass;
	exports['hasClass'] = exports.hasClass;
	exports['getElementsByClassNames'] = exports.getElementsByClassNames;
	exports['attrNames'] = exports.attrNames;
	exports['hasAttrs'] = exports.hasAttrs;
	exports['setAttr'] = exports.setAttr;
	exports['removeAttr'] = exports.removeAttr;
	exports['setAttrNS'] = exports.setAttrNS;
	exports['removeAttrNS'] = exports.removeAttrNS;
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
	exports['clone'] = exports.clone;
	exports['wrap'] = exports.wrap;
	exports['insert'] = exports.insert;
	exports['replaceShallow'] = exports.replaceShallow;
	exports['isAtEnd'] = exports.isAtEnd;
	exports['isAtStart'] = exports.isAtStart;
	exports['nthChild'] = exports.nthChild;
	exports['children'] = exports.children;
	exports['nodeIndex'] = exports.nodeIndex;
	exports['nodeLength'] = exports.nodeLength;
	exports['nodeAtOffset'] = exports.nodeAtOffset;
	exports['nodeAtBoundary'] = exports.nodeAtBoundary;
	exports['startBoundary'] = exports.startBoundary;
	exports['endBoundary'] = exports.endBoundary;
	exports['insertTextAtBoundary'] = exports.insertTextAtBoundary;
	exports['insertNodeAtBoundary'] = exports.insertNodeAtBoundary;
	exports['isTextNode'] = exports.isTextNode;
	exports['isEmptyTextNode'] = exports.isEmptyTextNode;
	exports['splitTextNode'] = exports.splitTextNode;
	exports['splitTextContainers'] = exports.splitTextContainers;
	exports['joinTextNodeAdjustRange'] = exports.joinTextNodeAdjustRange;
	exports['joinTextNode'] = exports.joinTextNode;
	exports['splitBoundary'] = exports.splitBoundary;
	exports['contains'] = exports.contains;
	exports['followedBy'] = exports.followedBy;
	exports['setStyle'] = exports.setStyle;
	exports['getStyle'] = exports.getStyle;
	exports['getComputedStyle'] = exports.getComputedStyle;
	exports['removeStyle'] = exports.removeStyle;
	exports['isEditable'] = exports.isEditable;
	exports['isEditingHost'] = exports.isEditingHost;
	exports['getEditingHost'] = exports.getEditingHost;
	exports['stringify'] = exports.stringify;
	exports['stringifyReplacer'] = exports.stringifyReplacer;
	exports['parseReviver'] = exports.parseReviver;
	exports['Nodes'] = exports.Nodes;
	exports['ensureExpandoId'] = exports.ensureExpandoId;

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
