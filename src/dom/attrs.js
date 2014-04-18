/**
 * dom/attrs.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'arrays',
	'maps',
	'strings',
	'functions'
], /** @exports DomAttributes */ function DomAttributes(
	Arrays,
	Maps,
	Strings,
	Fn
) {
	'use strict';

	/**
	 * Gets the attributes of the given element.
	 *
	 * Correctly handles the case that IE7 and IE8 have approx 70-90
	 * default attributes on each and every element.
	 *
	 * Attribute values will always be strings, but possibly empty Strings.
	 *
	 * @param  {Element}        elem
	 * @return {Map.<string,string>}
	 */
	function attrs(elem) {
		var attrs = {};
		var attributes = elem.attributes;
		for (var i = 0, len = attributes.length; i < len; i++) {
			var attr = attributes[i];
			if (typeof attr.specified === "undefined" || attr.specified) {
				attrs[attr.name] = attr.value;
			}
		}
		return attrs;
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
		Maps.keys(attrs(element)).forEach(Fn.partial(remove, element));
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
	 * Checks whether or not the given node contains one or more
	 * attributes non-empty attributes.
	 *
	 * @param  {Node}    node
	 * @return {boolean}
	 */
	function has(node) {
		return !Maps.vals(attrs(node)).every(Strings.isEmpty);
	}

	return {
		attrs     : attrs,
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
