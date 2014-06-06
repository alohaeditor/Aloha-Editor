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
