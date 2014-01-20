/**
 * dom/attrs.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'arrays',
	'strings',
	'functions'
], function DomAttributes(
	Arrays,
	Strings,
	Fn
) {
	'use strict';

	var ATTRIBUTE = /\s([^\/<>\s=]+)(?:=(?:"[^"]*"|'[^']*'|[^>\/\s]+))?/g;

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
	 * @param  {Element}        elem
	 * @return {Array.<string>} List of attribute names
	 */
	function attrNames(elem) {
		var names = [];
		var html = elem.cloneNode(false).outerHTML;
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
	 * Returns an array containing [name, value] tuples for each attribute.
	 * Attribute values will always be strings, but possibly empty Strings.
	 *
	 * @param  {Element}        elem
	 * @return {Array.<string>}
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

	function remove(elem, name) {
		elem.removeAttribute(name);
	}

	/**
	 * Removes all attributes from `element`.
	 *
	 * @param {Element} element
	 */
	function removeAll(element) {
		attrNames(element).forEach(Fn.partial(remove, element));
	}

	function set(elem, name, value) {
		if (null == value) {
			remove(elem, name);
		} else {
			elem.setAttribute(name, value);
		}
	}

	function get(elem, name) {
		return elem.getAttribute(name);
	}

	function getNS(elem, ns, name) {
		return elem.getAttributeNS(ns, name);
	}

	function removeNS(elem, ns, name) {
		// TODO is removeAttributeNS(null, ...) the same as removeAttribute(...)?
		if (null != ns) {
			elem.removeAttributeNS(ns, name);
		} else {
			remove(elem, name);
		}
	}

	/**
	 * NB: Internet Explorer supports the setAttributeNS method from
	 * version 9, but only for HTML documents, not for XML documents.
	 *
	 * @param {Element} elem
	 * @param {string}  ns
	 * @param {string}  name
	 * @param {string}  value
	 */
	function setNS(elem, ns, name, value) {
		// TODO is setAttributeNS(null, ...) the same as setAttribute(...)?
		if (null != ns) {
			elem.setAttributeNS(ns, name, value);
		} else {
			set(elem, name, value);
		}
	}

	/**
	 * Checks whether or not the given node contains one or more attributes.
	 *
	 * @param  {Node}    node
	 * @return {boolean}
	 */
	function has(node) {
		return !attrs(node).map(Arrays.second).every(Strings.isEmpty);
	}

	return {
		attrs     : attrs,
		attrNames : attrNames,
		has       : has,
		set       : set,
		setNS     : setNS,
		get       : get,
		getNS     : getNS,
		remove    : remove,
		removeNS  : removeNS,
		removeAll : removeAll,
	};
});
