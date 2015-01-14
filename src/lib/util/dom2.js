/* dom2.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2012 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 * 
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 * 
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
 */
define([
	'aloha/core',
	'jquery',
	'util/functions',
	'util/maps',
	'util/arrays',
	'util/strings',
	'util/browser',
	'util/dom',
	'util/range'
], function (
	Aloha,
	$,
	Fn,
	Maps,
	Arrays,
	Strings,
	Browser,
	Dom1,
	RangeObject
) {
	'use strict';

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
	 * @param {HTMLElement} node DOM Element.
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
		var visited = {};
		var names = attrNames(elem);
		var i;
		var len;
		for (i = 0, len = names.length; i < len; i++) {
			var name = names[i];
			var value = $.attr(elem, name);
			//IE9 Fix, "lang" value not in attributes
			if (name === "lang") {
				if (elem.lang) {
					value = elem.lang;
				}
			}
			if (null == value) {
				value = "";
			} else {
				value = value.toString();
			}
			//filter duplicates. IE 10 doesn't take care of duplicates
			if (!visited.hasOwnProperty(name)) {
				as.push([name, value]);
				visited[name] = true;
			}
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

	function nodeIndex(node) {
		var ret = 0;
		while (node.previousSibling) {
			ret++;
			node = node.previousSibling;
		}
		return ret;
	}

	/**
	 * Can't use elem.childNodes.length because
	 * http://www.quirksmode.org/dom/w3c_core.html
	 * "IE up to 8 does not count empty text nodes."
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

	function nodeLength(node) {
		if (1 === node.nodeType) {
			return numChildren(node);
		}
		if (3 === node.nodeType) {
			return node.length;
		}
		return 0;
	}

	function isAtEnd(node, offset) {
		return (1 === node.nodeType
				&& offset >= numChildren(node))
			|| (3 === node.nodeType
				&& offset === node.length
				&& !node.nextSibling);
	}

	/**
	 * @param node if a text node, should have a parent node.
	 */
	function nodeAtOffset(node, offset) {
		if (1 === node.nodeType && offset < numChildren(node)) {
			node = node.childNodes[offset];
		} else if (3 === node.nodeType && offset === node.length) {
			node = node.nextSibling || node.parentNode;
		}
		return node;
	}

	function removeShallow(node) {
		var parent = node.parentNode;
		moveNextAll(parent, node.firstChild, node);
		parent.removeChild(node);
	}

	/**
	 * Removes `node`.
	 * @param {Node} node
	 */
	function remove(node) {
		var parent = node.parentNode;
		if (parent) {
			parent.removeChild(node);
		}
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

	function Cursor(node, atEnd) {
		this.node = node;
		this.atEnd = atEnd;
	}

	/**
	 * A cursor has the added utility over other iteration methods of
	 * iterating over the end position of an element. The start and end
	 * positions of an element are immediately before the element and
	 * immediately after the last child respectively. All node positions
	 * except end positions can be identified just by a node. To
	 * distinguish between element start and end positions, the
	 * additional atEnd boolean is necessary.
	 */
	function cursor(node, atEnd) {
		return new Cursor(node, atEnd);
	}

	Cursor.prototype.next = function () {
		var node = this.node;
		var next;
		if (this.atEnd || 1 !== node.nodeType) {
			next = node.nextSibling;
			if (next) {
				this.atEnd = false;
			} else {
				next = node.parentNode;
				if (!next) {
					return false;
				}
				this.atEnd = true;
			}
			this.node = next;
		} else {
			next = node.firstChild;
			if (next) {
				this.node = next;
			} else {
				this.atEnd = true;
			}
		}
		return true;
	};

	Cursor.prototype.prev = function () {
		var node = this.node;
		var prev;
		if (this.atEnd) {
			prev = node.lastChild;
			if (prev) {
				this.node = prev;
			} else {
				this.atEnd = false;
			}
		} else {
			prev = node.previousSibling;
			if (prev) {
				if (1 === node.nodeType) {
					this.atEnd = true;
				}
			} else {
				prev = node.parentNode;
				if (!prev) {
					return false;
				}
			}
			this.node = prev;
		}
		return true;
	};

	Cursor.prototype.equals = function (cursor) {
		return cursor.node === this.node && cursor.atEnd === this.atEnd;
	};

	Cursor.prototype.clone = function (cursor) {
		return cursor(cursor.node, cursor.atEnd);
	};

	Cursor.prototype.insert = function (node) {
		return insert(node, this.node, this.atEnd);
	};

	/**
	 * @param offset if node is a text node, the offset will be ignored.
	 * @param node if a text node, should have a parent node.
	 */
	function cursorFromBoundaryPoint(node, offset) {
		return cursor(nodeAtOffset(node, offset), isAtEnd(node, offset));
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

	function next(node, until, arg) {
		while (node && !until(node, arg)) {
			node = node.nextSibling;
		}
		return node;
	}

	function parent(node, until, arg) {
		while (node && !until(node, arg)) {
			node = node.parentNode;
		}
		return node;
	}

	function isTextNode(node) {
		return 3 === node.nodeType;
	}

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

	function adjustRangeAfterSplit(range, container, offset, setProp, splitNode, newNodeBeforeSplit) {
		if (container !== splitNode) {
			return;
		}
		var newNodeLength = newNodeBeforeSplit.length;
		if (offset === 0) {
			container = newNodeBeforeSplit.parentNode;
			offset = nodeIndex(newNodeBeforeSplit);
		} else if (offset < newNodeLength) {
			container = newNodeBeforeSplit;
		} else if (offset === newNodeLength) {
			container = newNodeBeforeSplit.parentNode;
			offset = nodeIndex(newNodeBeforeSplit) + 1;
		} else {// offset > newNodeLength
			var newNodeAfterSplit = newNodeBeforeSplit.nextSibling;
			container = newNodeAfterSplit;
			offset -= newNodeLength;
		}
		range[setProp].call(range, container, offset);
	}

	/**
	 * Splits the given text node at the given offset and, if the given
	 * range happens to have start or end containers equal to the given
	 * text node, adjusts it such that start and end position will point
	 * at the same position in the new text nodes.
	 *
	 * It is guaranteed that an adjusted boundary point will not point
	 * to the end of a text node. Instead, it will point to the next
	 * node. This guarantee often happens to be useful.
	 *
	 * If splitNode is not a text node, does nothing.
	 */
	function splitTextNodeAdjustRange(splitNode, splitOffset, range) {
		if (3 !== splitNode.nodeType) {
			return;
		}
		var sc = range.startContainer;
		var so = range.startOffset;
		var ec = range.endContainer;
		var eo = range.endOffset;
		var newNodeBeforeSplit = splitTextNode(splitNode, splitOffset);
		adjustRangeAfterSplit(range, sc, so, 'setStart', splitNode, newNodeBeforeSplit);
		adjustRangeAfterSplit(range, ec, eo, 'setEnd', splitNode, newNodeBeforeSplit);
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
		if (1 === node.nodeType) {
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

	function StableRange(range) {
		if (!range) {
			return;
		}
		this.startContainer = range.startContainer;
		this.startOffset = range.startOffset;
		this.endContainer = range.endContainer;
		this.endOffset = range.endOffset;
		this.commonAncestorContainer = range.commonAncestorContainer;
		this.collapsed = range.collapsed;
	}

	StableRange.prototype.update = function () {
		if (!this.startContainer || !this.endContainer) {
			return;
		}
		this.collapsed = (this.startContainer === this.endContainer
						  && this.startOffset === this.endOffset);
		var start = childAndParentsUntil(this.startContainer, Fn.returnFalse);
		var end   = childAndParentsUntil(this.endContainer, Fn.returnFalse);
		this.commonAncestorContainer = Arrays.intersect(start, end)[0];
	};

	StableRange.prototype.setStart = function (sc, so) {
		this.startContainer = sc;
		this.startOffset = so;
		this.update();
	};

	StableRange.prototype.setEnd = function (ec, eo) {
		this.endContainer = ec;
		this.endOffset = eo;
		this.update();
	};

	function setRangeStartFromCursor(range, cursor) {
		if (cursor.atEnd) {
			range.setStart(cursor.node, numChildren(cursor.node));
		} else {
			range.setStart(cursor.node.parentNode, nodeIndex(cursor.node));
		}
	}

	function setRangeEndFromCursor(range, cursor) {
		if (cursor.atEnd) {
			range.setEnd(cursor.node, numChildren(cursor.node));
		} else {
			range.setEnd(cursor.node.parentNode, nodeIndex(cursor.node));
		}
	}

	function setRangeFromRef(range, ref) {
		range.setStart(ref.startContainer, ref.startOffset);
		range.setEnd(ref.endContainer, ref.endOffset);
	}

	/**
	 * A native range is live, which means that modifying the DOM may
	 * mutate the range. Also, using setStart/setEnd may not set the
	 * properties correctly (the browser may perform its own
	 * normalization of boundary points). The behaviour of a native
	 * range is very erratic and should be converted to a stable range
	 * as the first thing in any algorithm.
	 */
	function stableRange(range) {
		return new StableRange(range);
	}

	/**
	 * The dom cursor passed to ignoreLeft and ignoreRight does not
	 * traverse positions inside text nodes. The exact rules for when
	 * text node containers are passed are as follows: If the left
	 * boundary point is inside a text node, trimming will start before
	 * it. If the right boundary point is inside a text node, trimming
	 * will start after it.
	 */
	function trimRange(range, ignoreLeft, ignoreRight) {
		if (range.collapsed) {
			return;
		}
		var start = cursorFromBoundaryPoint(range.startContainer, range.startOffset);
		var end = cursorFromBoundaryPoint(range.endContainer, range.endOffset);
		var setStart = false;
		while (!start.equals(end) && ignoreLeft(start) && start.next()) {
			setStart = true;
		}
		ignoreRight = ignoreRight || ignoreLeft;
		var setEnd = false;
		// Because if the right boundary points is inside a text node,
		// trimming starts after it.
		if (3 === range.endContainer.nodeType
			    && range.endOffset > 0
			    // Because the cursor already normalizes
			    // endOffset == endContainer.length to the node next after it.
			    && range.endOffset < range.endContainer.length
			    && end.next()) {
			if (ignoreRight(end)) {
				end.prev();
			}
		}
		while (!end.equals(start) && ignoreRight(end) && end.prev()) {
			setEnd = true;
		}
		if (setStart) {
			setRangeStartFromCursor(range, start);
		}
		if (setEnd) {
			setRangeEndFromCursor(range, end);
		}
	}

	function trimRangeClosingOpening(range, ignoreLeft, ignoreRight) {
		ignoreRight = ignoreRight || ignoreLeft;
		trimRange(range, function (cursor) {
			return cursor.atEnd || ignoreLeft(cursor.node);
		}, function (cursor) {
			var prev = cursor.atEnd ? cursor.node.lastChild : cursor.node.previousSibling;
			return !prev || ignoreRight(prev);
		});
	}

	function areRangesEq(a, b) {
		return a.startContainer === b.startContainer
			&& a.startOffset    === b.startOffset
			&& a.endContainer   === b.endContainer
			&& a.endOffset      === b.endOffset;
	}

	function insertSelectText(text, range) {
		// Because empty text nodes are generally not nice and even
		// cause problems with IE8 (elem.childNodes).
		if (!text.length) {
			return;
		}
		splitTextNodeAdjustRange(range.startContainer, range.startOffset, range);
		var node = nodeAtOffset(range.startContainer, range.startOffset);
		var atEnd = isAtEnd(range.startContainer, range.startOffset);
		// Because if the node following the insert position is already
		// a text node we can just reuse it.
		if (!atEnd && 3 === node.nodeType) {
			node.insertData(0, text);
			range.setStart(node, 0);
			range.setEnd(node, text.length);
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
		if (prev && 3 === prev.nodeType) {
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

	function collapseToEnd(range) {
		range.setStart(range.endContainer, range.endOffset);
	}

	function rangeFromRangeObject(alohaRange) {
		var range = Aloha.createRange();
		range.setStart(alohaRange.startContainer, alohaRange.startOffset);
		range.setEnd(alohaRange.endContainer, alohaRange.endOffset);
		return range;
	}

	function extendToWord(range) {
		var rangeObject = new RangeObject(range);
		Dom1.extendToWord(rangeObject);
		setRangeFromRef(range, rangeObject);
	}

	function cloneShallow(node) {
		return node.cloneNode(false);
	}

	/**
	 * Sets a style on the given element by modifying it's style attribute.
	 */
	function setStyle(node, name, value) {
		// Because only the empty string removes a style.
		$(node).css(name, null == value ? '' : value);
	}

	/**
	 * Gets a style from the given element's style attribute.
	 * Note that this is different from the computed/inherited style.
	 */
	function getStyle(node, name) {
		// Because IE7 needs dashesToCamelCase().
		name = Strings.dashesToCamelCase(name);
		return node.nodeType === 1 ? node.style[name] : null;
	}

	/**
	 * Gets the computed/inherited style of the given node.
	 * @param node may be a text node.
	 */
	function getComputedStyle(node, name) {
		if (node.currentStyle) {
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
	 * Given a node, will return node that succeeds it in the document order.
	 *
	 * For example, if this function is called recursively, starting from the
	 * text node "one" in the below DOM tree:
	 *
	 *	"one"
	 *	<b>
	 *		"two"
	 *		<u>
	 *			<i>
	 *				"three"
	 *			</i>
	 *		</u>
	 *		"four"
	 *	</b>
	 *	"five"
	 *
	 * forward() will return nodes in the following order:
	 *
	 * <b>...</b>, "two", <u>...</u>, <i>...</i>, "three", "four", "five"
	 *
	 * @param {DOMObject} node
	 * @return {DOMObject}
	 *         The succeeding node or null if the given node has no previous
	 *         siblings and no parent.
	 */
	function forward(node) {
		if (node.firstChild) {
			return node.firstChild;
		}
		var next = node;
		while (next && !next.nextSibling) {
			next = next.parentNode;
		}
		return next && next.nextSibling;
	}

	/**
	 * Given a node, will return node that preceeds it in the document order.
	 *
	 * For example, if this function is called recursively, starting from the
	 * text node "five" in the below DOM tree:
	 *
	 *	"one"
	 *	<b>
	 *		"two"
	 *		<u>
	 *			<i>
	 *				"three"
	 *			</i>
	 *		</u>
	 *		"four"
	 *	</b>
	 *	"five"
	 *
	 * backward() will return nodes in the following order:
	 *
	 * "four", "three", <i>...</i>, <u>...</u>, "two", <b>...</b>, "one"
	 *
	 * @param {DOMObject} node
	 * @return {DOMObject}
	 *         The preceeding node or null if the given node has no previous
	 *         siblings and no parent.
	 */
	function backward(node) {
		var prev = node.previousSibling;
		while (prev && prev.lastChild) {
			prev = prev.lastChild;
		}
		return prev || node.parentNode;
	}

	/**
	 * Starting from the given node, and moving forwards through the DOM tree,
	 * searches for a node which returns `true` when applied to the predicate
	 * `match()`.
	 *
	 * @param {DOMObject} node
	 * @param {Function(DOMObject):Boolean} match
	 * @param {Function(DOMObject):Boolean} until
	 * @return {DOMObject}
	 */
	function findForward(node, match, until) {
		while (node && !until(node)) {
			if (match(node)) {
				return node;
			}
			node = forward(node);
		}
		return null;
	}

	/**
	 * Starting from the given node, and moving backwards through the DOM tree,
	 * searches for a node which returns `true` when applied to the predicate
	 * `match()`.
	 *
	 * @param {DOMObject} node
	 * @param {Function(DOMObject):Boolean} match
	 * @param {Function(DOMObject):Boolean} until
	 * @return {DOMObject}
	 */
	function findBackward(node, match, until) {
		while (node && !until(node)) {
			if (match(node)) {
				return node;
			}
			node = backward(node);
		}
		return null;
	}

	return {
		backward: backward,
		forward: forward,
		findForward: findForward,
		findBackward: findBackward,
		moveNextAll: moveNextAll,
		attrNames: attrNames,
		attrs: attrs,
		indexByClass: indexByClass,
		indexByName: indexByName,
		indexByClassHaveList: indexByClassHaveList,
		outerHtml: outerHtml,
		removeShallow: removeShallow,
		remove: remove,
		wrap: wrap,
		insert: insert,
		cursor: cursor,
		cursorFromBoundaryPoint: cursorFromBoundaryPoint,
		nodeAtOffset: nodeAtOffset,
		isAtEnd: isAtEnd,
		parentsUntil: parentsUntil,
		parentsUntilIncl: parentsUntilIncl,
		childAndParentsUntil: childAndParentsUntil,
		childAndParentsUntilIncl: childAndParentsUntilIncl,
		childAndParentsUntilNode: childAndParentsUntilNode,
		childAndParentsUntilInclNode: childAndParentsUntilInclNode,
		next: next,
		parent: parent,
		isTextNode: isTextNode,
		nodeIndex: nodeIndex,
		splitTextNode: splitTextNode,
		splitTextContainers: splitTextContainers,
		walk: walk,
		walkRec: walkRec,
		walkUntil: walkUntil,
		walkUntilNode: walkUntilNode,
		stableRange: stableRange,
		trimRange: trimRange,
		trimRangeClosingOpening: trimRangeClosingOpening,
		setRangeFromRef: setRangeFromRef,
		setRangeStartFromCursor: setRangeStartFromCursor,
		setRangeEndFromCursor: setRangeEndFromCursor,
		splitTextNodeAdjustRange: splitTextNodeAdjustRange,
		insertSelectText: insertSelectText,
		areRangesEq: areRangesEq,
		collapseToEnd: collapseToEnd,
		extendToWord: extendToWord,
		rangeFromRangeObject: rangeFromRangeObject,
		cloneShallow: cloneShallow,
		setStyle: setStyle,
		getStyle: getStyle,
		getComputedStyle: getComputedStyle,
		nodeLength: nodeLength
	};
});
