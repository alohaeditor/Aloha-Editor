/* dom.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'jquery',
	'functions',
	'maps',
	'arrays',
	'strings',
	'browser'
], function DomUtilities(
	$,
	Fn,
	Maps,
	Arrays,
	Strings,
	Browser
) {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('Dom');
	}

	var ATTRIBUTE = /\s([^\/<>\s=]+)(?:=(?:"[^"]*"|'[^']*'|[^>\/\s]+))?/g;

	/**
	 * Like insertBefore, inserts firstChild into parent before
	 * refChild, except also inserts all the following siblings of
	 * firstChild.
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
	 * Gets the serialized HTML that describes the given DOM element and its
	 * innerHTML.
	 *
	 * Polyfill for older versions of Gecko, Safari, and Opera browsers.
	 * @see https://bugzilla.mozilla.org/show_bug.cgi?id=92264 for background.
	 *
	 * @param {DOMObject} node
	 * @return {String}
	 */
	function outerHtml(node) {
		var html = node.outerHTML;
		if (typeof html !== 'undefined') {
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
	 * @param elem
	 *        An element to get the attributes for.
	 * @return
	 *        An array containing [name, value] tuples for each attribute.
	 *        Attribute values will always be strings, but possibly empty strings.
	 */
	function attrs(elem) {
		var as = [];
		var names = attrNames(elem);
		var i;
		var len;
		for (i = 0, len = names.length; i < len; i++) {
			var name = names[i];
			var value = $.attr(elem, name);
			if (null == value) {
				value = "";
			} else {
				value = value.toString();
			}
			as.push([name, value]);
		}
		return as;
	}

	/**
	 * Like indexByClass() but operates on a list of elements instead.
	 * The given list may be a NodeList, HTMLCollection, or an array.
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
	 * @param root
	 *        The root element to search for elements to index
	 *        (will not be included in search).
	 * @param classMap
	 *        A map from class name to boolean true.
	 * @return
	 *        A map from class name to an array of elements with that class.
	 *        Every entry in classMap for which elements have been found
	 *        will have a corresponding entry in the returned
	 *        map. Entries for which no elements have been found, may or
	 *        may not have an entry in the returned map.
	 */
	function indexByClass(root, classMap) {
		var elems;
		if (Browser.ie7) {
			elems = root.getElementsByTagName('*');
		} else {
			// Optimize for browsers that support querySelectorAll/getElementsByClassName.
			// On IE8 for example, if there is a relatively high
			// elems/resultSet ratio, performance can improve by a factor of 2.
			elems = $(root).find('.' + Maps.keys(classMap).join(',.'));
		}
		return indexByClassHaveList(elems, classMap);
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
	 * @param root
	 *        The root element to search for elements to index
	 *        (will not be included in search).
	 * @param names
	 *        An array of element names to look for.
	 *        Names must be in all-uppercase (the same as elem.nodeName).
	 * @return
	 *        A map from element name to an array of elements with that name.
	 *        Names will be all-uppercase.
	 *        Arrays will be proper arrays, not NodeLists.
	 *        Every entry in classMap for which elements have been found
	 *        will have a corresponding entry in the returned
	 *        map. Entries for which no elements have been found, may or
	 *        may not have an entry in the returned map.
	 */
	function indexByName(root, names) {
		var i,
		    index = {},
		    len;
		for (i = 0, len = names.length; i < len; i++) {
			var name = names[i];
			index[name] = $.makeArray(root.getElementsByTagName(name));
		}
		return index;
	}

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
	 * Calculates the number of child nodes contained in the given DOM element.
	 *
	 * elem.childNodes.length is unreliable because "IE up to 8 does not count
	 * empty text nodes." (http://www.quirksmode.org/dom/w3c_core.html)
	 *
	 * @param {DOMObject} elem
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
	 * Determines the length of the given DOM node.
	 *
	 * @param {DOMObject} node
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
	 * Calculates the positional index of the given node inside of its parent
	 * element.
	 *
	 * @param {DOMObject} node
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
	 * Whether or not the given node and offset describes a position after the
	 * last child node or character in its container.
	 *
	 * @param {DOMObject} node
	 * @param {Number} offset
	 * @return {Boolean}
	 */
	function isAtEnd(node, offset) {
		return (Nodes.ELEMENT === node.nodeType
				&& offset >= nodeLength(node))
			|| (Nodes.TEXT === node.nodeType
				&& offset === node.length
				&& !node.nextSibling);
	}

	/**
	 * @param node if a text node, should have a parent node.
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
	 * Wraps node `node` in given node `wrapper`.
	 *
	 * @param {DOMObject} node
	 * @param {DOMObject} wrapper
	 */
	function wrap(node, wrapper) {
		node.parentNode.replaceChild(wrapper, node);
		wrapper.appendChild(node);
	}

	/**
	 * Inserts node `node` before `ref`, unless `atEnd` is truthy, in which case
	 * `node` is inserted at the end of `ref` children nodes.
	 *
	 * @param {DOMObject} node
	 * @param {DOMObject} ref
	 * @param {Boolean} atEnd
	 */
	function insert(node, ref, atEnd) {
		if (atEnd) {
			ref.appendChild(node);
		} else {
			ref.parentNode.insertBefore(node, ref);
		}
	}

	/**
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
	 * Returns `true` if node `b` is a descendant of node `a`, `false`
	 * otherwise.
	 *
	 * @see
	 * http://ejohn.org/blog/comparing-document-position/
	 * http://www.quirksmode.org/blog/archives/2006/01/contains_for_mo.html
	 *
	 * @param {DOMObject} a
	 * @param {DOMObject} b
	 * @return {Boolean}
	 */
	function contains(a, b) {
		return (Nodes.ELEMENT === a.nodeType
				? (a.contains
				   ? a != b && a.contains(b)
				   : !!(a.compareDocumentPosition(b) & 16))
				: false);
	}

	/**
	 * Returns `true` if `node` is a text node.
	 *
	 * @param {DOMObject} node
	 * @return {Boolean}
	 */
	function isTextNode(node) {
		return Nodes.TEXT === node.nodeType;
	}

	/**
	 * Splits the given text node at the given offset, and returns the first of
	 * the two text nodes that were inserted to replace the given node in the
	 * DOM.
	 *
	 * @TODO: could be optimized with insertData() so only a single text node is
	 *        inserted instead of two.
	 *
	 * @param {DOMObject} node
	 *        DOM text node.
	 * @param {Number} offset
	 *        Number between 0 and the length of text of `node`.
	 * @return {DOMObject}
	 */
	function splitTextNode(node, offset) {
		// Because node.splitText() is buggy on IE, split it manually.
		// http://www.quirksmode.org/dom/w3c_core.html
		var parent = node.parentNode;
		var text = node.nodeValue;
		if (0 === offset || offset >= text.length) {
			return node;
		}
		var before = document.createTextNode(text.substring(0, offset));
		var after = document.createTextNode(text.substring(offset, text.length));
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
	 * stableRange().
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

	function adjustRangeAfterSplit(container, offset, range, setRange, splitNode, splitOffset, newNodeBeforeSplit) {
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

	function adjustBoundaryPointAfterJoin(container, offset, range, setRange, node, nodeLen, sibling, siblingLen, parentNode, nidx, prev) {
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

	function adjustBoundaryPointAfterRemove(container, offset, range, setRange, node, parentNode, nidx) {
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
		var newNodeBeforeSplit = splitTextNode(splitNode, splitOffset);
		if (newNodeBeforeSplit) {
			adjustRangeAfterSplit(sc, so, range, setRangeStart, splitNode, splitOffset, newNodeBeforeSplit);
			adjustRangeAfterSplit(ec, eo, range, setRangeEnd, splitNode, splitOffset, newNodeBeforeSplit);
		}
	}

	/**
	 * Splits text containers in the given range.
	 *
	 * @param {Range} range
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
		// Because the range may change due to the DOM modication
		// (automatically by the browser).
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
		adjustBoundaryPointAfterJoin(sc, so, range, setRangeStart, node, nodeLen, sibling, siblingLen, parentNode, nidx, prev);
		adjustBoundaryPointAfterJoin(ec, eo, range, setRangeEnd, node, nodeLen, sibling, siblingLen, parentNode, nidx, prev);
		return sibling;
	}

	/**
	 * Joins the given node with its adjacent sibling.
	 *
	 * @param {DOMElement} A text node
	 * @param {Range} range
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
	 * @private
	 */
	function remove(node) {
		node.parentNode.removeChild(node);
	}

	/**
	 * Removes the given node while keeping it's content intact.
	 *
	 * @param {DOMObject} node
	 */
	function removeShallow(node) {
		var parent = node.parentNode;
		moveNextAll(parent, node.firstChild, node);
		parent.removeChild(node);
	}

	/**
	 * Removes the given node while maintaing the given ranges.
	 *
	 * @param {DOMObject} node
	 * @param {Array[Range]} ranges
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
	 * Removes the given node while maintaing the given range.
	 *
	 * @param {DOMObject} node
	 * @param {Range} range
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
	 * @param {DOMObject} node
	 * @param {Array[Cursor]} points
	 */
	function removeShallowPreservingBoundaries(node, points) {
		preserveBoundaries(node, points, preservePointForShallowRemove);
		removeShallow(node);
	}

	/**
	 * Returns a shallow clone of the given node.
	 *
	 * @param {DOMObject} node
	 * @return {DOMObject}
	 *         Clone of `node`.
	 */
	function cloneShallow(node) {
		return node.cloneNode(false);
	}

	/**
	 * Sets a style on the given element by modifying its style attribute.
	 */
	function setStyle(node, name, value) {
		// Because only the empty string removes a style.
		$(node).css(name, value);
	}

	/**
	 * Gets a style from the given element's style attribute.
	 * Note that this is different from the computed/inherited style.
	 */
	function getStyle(node, name) {
		// Because IE7 needs dashesToCamelCase().
		name = Strings.dashesToCamelCase(name);
		return node.nodeType === Nodes.ELEMENT ? node.style[name] : null;
	}

	/**
	 * Gets the computed/inherited style of the given node.
	 * @param node should be an element node.
	 */
	function getComputedStyle(node, name) {
		if (node.currentStyle) {
			// Because IE7 needs dashesToCamelCase().
			name = Strings.dashesToCamelCase(name);
			return node.currentStyle[name];
		}
		var doc = node.ownerDocument;
		if (doc.defaultView && doc.defaultView.getComputedStyle) {
			var styles = doc.defaultView.getComputedStyle(node, null);
			if (styles) {
				return styles[name] || styles.getPropertyValue(name);
			}
		}
		return null;
	}

	/**
	 * Removes the given style property from the given DOM element.
	 *
	 * @param {DOMObject} elem
	 * @param {String} styleName
	 */
	function removeStyle(elem, styleName) {
		var $elem = $(elem);
		if (Browser.hasRemoveProperty) {
			elem.style.removeProperty(styleName);
			if (Strings.empty($elem.attr('style'))) {
				$elem.removeAttr('style');
			}
		} else {
			// TODO: this is a hack for browsers that don't support
			//       removeProperty (ie < 9)and will not work correctly
			//       for all valid inputs, but it's the simplest thing I
			//       can come up with without implementing a full css
			//       parser.
			var style = $elem.attr('style');
			if (null == style) {
				return;
			}
			// Because concatenating just any input into the regex might
			// be dangerous.
			if ((/[^\w\-]/).test(styleName)) {
				throw "unrecognized style name " + styleName;
			}
			var stripRegex = new RegExp('(:?^|;)\\s*' + styleName + '\\s*:.*?(?=;|$)', 'i');
			style = style.replace(stripRegex, '');
			if (!Strings.empty(style)) {
				$elem.attr('style', style);
			} else {
				$elem.removeAttr('style');
			}
		}
	}

	/**
	 * Checks whether or not the given node contains one or more attributes.
	 *
	 * @param {DOMObject} node
	 * @param {Boolean}
	 */
	function hasAttrs(node) {
		return !Arrays.every(attrs(node).map(Arrays.second), Strings.empty);
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
		var classes = (elem.nodeType === Nodes.ELEMENT)
		            ? elem.className.trim().split(WHITESPACES)
		            : [];
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
	 * @param {DOMObject} node
	 * @param {Strings} value
	 * @return {DOMObject}
	 */
	function addClass(node, value) {
		return changeClassNames(node, value, addToList);
	}

	/**
	 * Remove one or more class names from the given node.
	 *
	 * @param {DOMObject} node
	 * @param {Strings} value
	 * @return {DOMObject}
	 */
	function removeClass(node, value) {
		return changeClassNames(node, value, removeFromList);
	}

	/**
	 * Function for working with the DOM.
	 */
	var exports = {
		addClass: addClass,
		removeClass: removeClass,
		removeStyle: removeStyle,
		moveNextAll: moveNextAll,
		attrNames: attrNames,
		attrs: attrs,
		indexByClass: indexByClass,
		indexByName: indexByName,
		indexByClassHaveList: indexByClassHaveList,
		outerHtml: outerHtml,
		removeShallow: removeShallow,
		removeShallowPreservingBoundaries: removeShallowPreservingBoundaries,
		removePreservingRange: removePreservingRange,
		removePreservingRanges: removePreservingRanges,
		wrap: wrap,
		insert: insert,
		replaceShallow: replaceShallow,
		nodeAtOffset: nodeAtOffset,
		isAtEnd: isAtEnd,
		isTextNode: isTextNode,
		nodeIndex: nodeIndex,
		splitTextNode: splitTextNode,
		splitTextContainers: splitTextContainers,
		splitTextNodeAdjustRange: splitTextNodeAdjustRange,
		joinTextNodeAdjustRange: joinTextNodeAdjustRange,
		contains: contains,
		cloneShallow: cloneShallow,
		setStyle: setStyle,
		getStyle: getStyle,
		getComputedStyle: getComputedStyle,
		hasAttrs: hasAttrs,
		nodeLength: nodeLength,
		Nodes: Nodes
	};

	return exports;
});
