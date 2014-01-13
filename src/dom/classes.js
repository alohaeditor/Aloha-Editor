/**
 * dom/classes.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom/nodes',
	'maps',
	'arrays',
	'strings',
	'browsers'
], function DomClasses(
	Nodes,
	Maps,
	Arrays,
	Strings,
	Browsers
) {
	'use strict';

	/**
	 * Like indexByClass() but operates on a list of elements instead.
	 *
	 * The given list can be a NodeList, HTMLCollection, or an array.
	 *
	 * @private
	 * @param  {Array.<Element>} elems
	 * @param  {Object.<string, boolean>} classMap
	 * @return {Object.<string, Array.<Element>>}
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
	 * @private
	 * @param  {Array.<string>}  classes
	 * @param  {Element=}        context Root element in which to do the search
	 * @return {Array.<Element>}
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
	 *   subsequent has('.class1') and has('.class2') calls
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
	 * @param {Element} root
	 *        The root element to search for elements to index (will not be
	 *        included in search).
	 * @param {Object.<string, boolean>} classMap
	 *        A map from class name to boolean true.
	 * @return {Object.<string, Array.<Element>>}
	 *         A map from class name to an array of elements with that class.
	 *         Every entry in classMap for which elements have been found will
	 *         have a corresponding entry in the returned map.  Entries for
	 *         which no elements have been found, may or may not have an entry
	 *         in the returned map.
	 */
	function indexByClass(root, classMap) {
		return indexByClassHaveList(
			Browsers.ie7 ? root.getElementsByTagName('*')
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
	 * @param {Element} root
	 *        The root element to search for elements to index (will not be
	 *        included in search).
	 * @param {Array.<string>} names
	 *        An array of element names to look for.
	 *        Names must be in all-uppercase (the same as elem.nodeName).
	 * @return {Object.<string, Array.<Element>>}
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
		if (Nodes.isElementNode(elem)) {
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
	 * @param {Element} elem
	 * @param {string}  value
	 */
	function add(elem, value) {
		changeClassNames(elem, value, addToList);
	}

	/**
	 * Remove one or more class names from the given node.
	 *
	 * @param {Element} elem
	 * @param {string}  value
	 */
	function remove(elem, value) {
		changeClassNames(elem, value, removeFromList);
	}

	/**
	 * Checks whether the given node has the specified class.
	 *
	 * @param  {Node}    node
	 * @param  {string}  value
	 * @return {boolean}
	 */
	function has(node, value) {
		return Nodes.isElementNode(node)
		    && node.className.trim().split(WHITESPACES).indexOf(value) >= 0;
	}

	return {
		has    : has,
		add    : add,
		remove : remove
	};
});
