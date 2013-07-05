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
		eval(uate)('Aloha.Dom');
	}

	var spacesRx = /\s+/;
	var attrRegex = /\s([^\/<>\s=]+)(?:=(?:"[^"]*"|'[^']*'|[^>\/\s]+))?/g;

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
		while (null != (match = attrRegex.exec(html))) {
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
	 * Node types.
	 *
	 * @type {object}
	 */
	var Nodes = {
		ELEMENT_NODE: 1,
		TEXT_NODE: 3,
		DOCUMENT_ELEMENT: 9
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
		if (Nodes.ELEMENT_NODE === node.nodeType) {
			return numChildren(node);
		}
		if (Nodes.TEXT_NODE === node.nodeType) {
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

	function isAtEnd(node, offset) {
		return (Nodes.ELEMENT_NODE === node.nodeType
				&& offset >= nodeLength(node))
			|| (Nodes.TEXT_NODE === node.nodeType
				&& offset === node.length
				&& !node.nextSibling);
	}

	/**
	 * @param node if a text node, should have a parent node.
	 */
	function nodeAtOffset(node, offset) {
		if (Nodes.ELEMENT_NODE === node.nodeType && offset < nodeLength(node)) {
			node = node.childNodes[offset];
		} else if (Nodes.TEXT_NODE === node.nodeType && offset === node.length) {
			node = node.nextSibling || node.parentNode;
		}
		return node;
	}

	function remove(node) {
		node.parentNode.removeChild(node);
	}

	function removeShallow(node) {
		var parent = node.parentNode;
		moveNextAll(parent, node.firstChild, node);
		parent.removeChild(node);
	}

	function wrap(node, wrapper) {
		node.parentNode.replaceChild(wrapper, node);
		wrapper.appendChild(node);
	}

	function insert(node, ref, atEnd) {
		if (atEnd) {
			ref.appendChild(node);
		} else {
			ref.parentNode.insertBefore(node, ref);
		}
	}

	function replaceShallow(node, withNode) {
		moveNextAll(withNode, node.firstChild, null);
		insert(withNode, node);
		remove(node);
	}

	function parentsUntil(node, pred) {
		var parents = [];
		var parent = node.parentNode;
		while (parent && !pred(parent)) {
			parents.push(parent);
			parent = parent.parentNode;
		}
		return parents;
	}

	function parentsUntilIncl(node, pred) {
		var parents = parentsUntil(node, pred);
		var topmost = parents.length ? parents[parents.length - 1] : node;
		if (topmost.parentNode) {
			parents.push(topmost.parentNode);
		}
		return parents;
	}

	function childAndParentsUntil(node, pred) {
		if (pred(node)) {
			return [];
		}
		var parents = parentsUntil(node, pred);
		parents.unshift(node);
		return parents;
	}

	function childAndParentsUntilIncl(node, pred) {
		if (pred(node)) {
			return [node];
		}
		var parents = parentsUntilIncl(node, pred);
		parents.unshift(node);
		return parents;
	}

	function childAndParentsUntilNode(node, untilNode) {
		return childAndParentsUntil(node, function (nextNode) {
			return nextNode === untilNode;
		});
	}

	function childAndParentsUntilInclNode(node, untilInclNode) {
		return childAndParentsUntilIncl(node, function (nextNode) {
			return nextNode === untilInclNode;
		});
	}

	function nextWhile(node, cond, arg) {
		while (node && cond(node, arg)) {
			node = node.nextSibling;
		}
		return node;
	}

	function prevWhile(node, cond, arg) {
		while (node && cond(node, arg)) {
			node = node.prevSibling;
		}
		return node;
	}

	/**
	 * Returns true if b is a descendant of a, false otherwise.
	 *
	 * http://ejohn.org/blog/comparing-document-position/
	 * http://www.quirksmode.org/blog/archives/2006/01/contains_for_mo.html
	 */
	function contains(a, b) {
		return (Nodes.ELEMENT_NODE === a.nodeType
				? (a.contains
				   ? a != b && a.contains(b)
				   : !!(a.compareDocumentPosition(b) & 16))
				: false);
	}

	function isTextNode(node) {
		return Nodes.TEXT_NODE === node.nodeType;
	}

	/**
	 * Splits the given text node at the given offset, and returns the
	 * first of the two text nodes that were inserted to replace the
	 * given node in the DOM.
	 * TODO: could be optimized with insertData() so only a single text
	 * node is inserted instead of two.
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
	 * Normalizes the boundary point represented by container and offset
	 * such that it will not point to the start or end of a text node
	 * which reduces the number of different states the range can be in,
	 * and thereby increases the the robusteness of the code written
	 * against it slightly.
	 *
	 * It should be noted that native ranges controlled by the browser's
	 * DOM implementation have the habit to change by themselves, so
	 * even if normalized this way the range could revert to an
	 * unnormalized state. See stableRange().
	 */
	function normalizeSetRange(setRange, range, container, offset) {
		if (Nodes.TEXT_NODE === container.nodeType && container.parentNode) {
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

	function setRangeStart(range, container, offset) {
		normalizeSetRange(range.setStart, range, container, offset);
	}

	function setRangeEnd(range, container, offset) {
		normalizeSetRange(range.setEnd, range, container, offset);
	}

	function walkUntil(node, fn, until, arg) {
		while (node && !until(node, arg)) {
			var next = node.nextSibling;
			fn(node, arg);
			node = next;
		}
	}

	function walk(node, fn, arg) {
		walkUntil(node, fn, Fn.returnFalse, arg);
	}

	/**
	 * Depth-first postwalk of the given DOM node.
	 */
	function walkRec(node, fn, arg) {
		if (Nodes.ELEMENT_NODE === node.nodeType) {
			walk(node.firstChild, function (node) {
				walkRec(node, fn, arg);
			});
		}
		fn(node, arg);
	}

	function walkUntilNode(node, fn, untilNode, arg) {
		walkUntil(node, fn, function (nextNode) {
			return nextNode === untilNode;
		}, arg);
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
		if (Nodes.TEXT_NODE !== splitNode.nodeType) {
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

	function splitTextContainers(range) {
		var sc = range.startContainer;
		var so = range.startOffset;
		splitTextNodeAdjustRange(sc, so, range);
		// Because the range may have been adjusted.
		var ec = range.endContainer;
		var eo = range.endOffset;
		splitTextNodeAdjustRange(ec, eo, range);
	}

	function joinTextNodeOneWay(node, sibling, range, prev) {
		if (!sibling || Nodes.TEXT_NODE !== sibling.nodeType) {
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

	function joinTextNodeAdjustRange(node, range) {
		if (Nodes.TEXT_NODE !== node.nodeType) {
			return;
		}
		node = joinTextNodeOneWay(node, node.previousSibling, range, true);
		joinTextNodeOneWay(node, node.nextSibling, range, false);
	}

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
			adjustBoundaryPointAfterRemove(boundaries[i + 1], boundaries[i + 2], boundaries[i], setRangeStart, node, parentNode, nidx);
			adjustBoundaryPointAfterRemove(boundaries[i + 3], boundaries[i + 4], boundaries[i], setRangeEnd, node, parentNode, nidx);
		}
	}

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

	function removeShallowPreservingBoundaries(node, points) {
		preserveBoundaries(node, points, preservePointForShallowRemove);
		removeShallow(node);
	}

	function insertSelectText(text, range) {
		// Because empty text nodes are generally not nice and even
		// cause problems with IE8 (elem.childNodes).
		if (!text.length) {
			return;
		}
		var node = nodeAtOffset(range.startContainer, range.startOffset);
		var atEnd = isAtEnd(range.startContainer, range.startOffset);
		// Because if the node following the insert position is already
		// a text node we can just reuse it.
		if (!atEnd && Nodes.TEXT_NODE === node.nodeType) {
			var offset = (Nodes.TEXT_NODE === range.startContainer.nodeType ? range.startOffset : 0);
			node.insertData(offset, text);
			range.setStart(node, offset);
			range.setEnd(node, offset + text.length);
			return;
		}
		// Because if the node preceding the insert position is already
		// a text node we can just reuse it.
		var prev;
		if (!atEnd) {
			prev = node.previousSibling;
		} else {
			prev = node.lastChild;
		}
		if (prev && Nodes.TEXT_NODE === prev.nodeType) {
			prev.insertData(prev.length, text);
			range.setStart(prev, prev.length - text.length);
			range.setEnd(prev, prev.length);
			return;
		}
		// Because if we can't reuse any text nodes, we have to insert a
		// new one.
		var textNode = document.createTextNode(text);
		insert(textNode, node, atEnd);
		range.setStart(textNode, 0);
		range.setEnd(textNode, textNode.length);
	}

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
		return node.nodeType === Nodes.ELEMENT_NODE ? node.style[name] : null;
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

	function hasAttrs(node) {
		return !Arrays.every(Arrays.map(attrs(node), Arrays.second),
							 Strings.empty);
	}

	/**
	 * Map of tag names which represent element that do not imply a word
	 * boundary.
	 *
	 * eg: <b>bar</b>camp where there is no word boundary in "barcamp".
	 *
	 * In HTML5 parlance, these would be many of those elements that fall in the
	 * category of "Text Level Semantics":
	 * http://www.w3.org/TR/html5/text-level-semantics.html
	 *
	 * @type {object<String>, Boolean}
	 */
	var IN_WORD_TAGS = {
		A       : true,
		ABBR    : true,
		B       : true,
		CITE    : true,
		CODE    : true,
		DEL     : true,
		EM      : true,
		I       : true,
		INS     : true,
		S       : true,
		SMALL   : true,
		SPAN    : true,
		STRONG  : true,
		SUB     : true,
		SUP     : true,
		U       : true,
		'#text' : true
	};

	var WORD_CHARACTERS = [
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

	var WORD_BOUNDARY = new RegExp('[^' + WORD_CHARACTERS + ']');

	var WORD_BOUNDARY_FROM_END = new RegExp(
		'[^' + WORD_CHARACTERS + '][' + WORD_CHARACTERS + ']*$'
	);

	/**
	 * Looks backwards in the node tree for the nearest word boundary position.
	 *
	 * @param {DOMObject} node
	 * @param {Number} offset
	 * @return position Information about the nearst found word boundary.
	 * @return position.node
	 * @return position.offset
	 */
	function findWordBoundaryBehind(node, offset) {
		if (Nodes.TEXT_NODE === node.nodeType) {
			var boundary = node.data.substr(0, offset)
			                   .search(WORD_BOUNDARY_FROM_END);
			return (
				-1 === boundary
					? findWordBoundaryBehind(node.parentNode, nodeIndex(node))
					: {
						node: node,
						offset: boundary + 1
					}
			);
		}
		if (Nodes.ELEMENT_NODE === node.nodeType) {
			if (offset > 0) {
				var child = node.childNodes[offset - 1];
				return (
					IN_WORD_TAGS[child.nodeName]
						? findWordBoundaryBehind(child, nodeLength(child))
						: {
							node: node,
							offset: offset
						}
				);
			}
			return findWordBoundaryBehind(node.parentNode, nodeIndex(node));
		}
		return {
			node: node,
			offset: offset
		};
	}

	function findWordBoundaryAhead(node, offset) {
		if (Nodes.TEXT_NODE === node.nodeType) {
			var boundary = node.data.substr(offset).search(WORD_BOUNDARY);
			return (
				-1 === boundary
					? findWordBoundaryAhead(
						node.parentNode,
						nodeIndex(node) + 1
					)
					: {
						node: node,
						offset: offset + boundary
					}
			);
		}
		if (Nodes.ELEMENT_NODE === node.nodeType) {
			if (offset < nodeLength(node)) {
				return (
					IN_WORD_TAGS[node.childNodes[offset].nodeName]
						? findWordBoundaryAhead(node.childNodes[offset], 0)
						: {
							node: node,
							offset: offset
						}
				);
			}
			return findWordBoundaryAhead(
				node.parentNode,
				nodeIndex(node) + 1
			);
		}
		return {
			node: node,
			offset: offset
		};
	}

	function findNodeBackwards(node, match) {
		if (!node) {
			return null;
		}
		if (match(node)) {
			return node;
		}
		var next = node.lastChild
		        || node.previousSibling
		        || (
		            node.parentNode
		         // && !isEditingHost(node.parentNode)
		            && node.parentNode.previousSibling
		        );
		return next ? findNodeBackwards(next, match) : null;
	}

	return {
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
		parentsUntil: parentsUntil,
		parentsUntilIncl: parentsUntilIncl,
		childAndParentsUntil: childAndParentsUntil,
		childAndParentsUntilIncl: childAndParentsUntilIncl,
		childAndParentsUntilNode: childAndParentsUntilNode,
		childAndParentsUntilInclNode: childAndParentsUntilInclNode,
		isTextNode: isTextNode,
		nodeIndex: nodeIndex,
		splitTextNode: splitTextNode,
		splitTextContainers: splitTextContainers,
		joinTextNodeAdjustRange: joinTextNodeAdjustRange,
		nextWhile: nextWhile,
		contains: contains,
		walk: walk,
		walkRec: walkRec,
		walkUntil: walkUntil,
		walkUntilNode: walkUntilNode,
		splitTextNodeAdjustRange: splitTextNodeAdjustRange,
		insertSelectText: insertSelectText,
		cloneShallow: cloneShallow,
		setStyle: setStyle,
		getStyle: getStyle,
		getComputedStyle: getComputedStyle,
		hasAttrs: hasAttrs,
		nodeLength: nodeLength,
		Nodes: Nodes,
		findNodeBackwards: findNodeBackwards,
		findWordBoundaryAhead: findWordBoundaryAhead,
		findWordBoundaryBehind: findWordBoundaryBehind
	};
});
