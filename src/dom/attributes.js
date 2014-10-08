/**
 * dom/attributes.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'maps',
	'strings',
	'functions'
], function (
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
	 * @memberOf dom
	 */
	function attrs(elem) {
		var attrsMap = {};
		var attributes = elem.attributes;
		for (var i = 0, len = attributes.length; i < len; i++) {
			var attr = attributes[i];
			if (typeof attr.specified === 'undefined' || attr.specified) {
				attrsMap[attr.name] = attr.value;
			}
		}
		return attrsMap;
	}

	/**
	 * This function is missing documentation.
	 * @TODO Complete documentation.
	 * @alias removeAttr
	 * @memberOf dom
	 */
	function remove(elem, name) {
		elem.removeAttribute(name);
	}

	/**
	 * Removes all attributes from `element`.
	 * @alias removeAttrs
	 * @memberOf dom
	 * @param {Element} element
	 */
	function removeAll(element) {
		Maps.keys(attrs(element)).forEach(Fn.partial(remove, element));
	}

	/**
	 * This function is missing documentation.
	 * @TODO Complete documentation.
	 * @alias setAttr
	 * @memberOf dom
	 */
	function set(elem, name, value) {
		if (null == value) {
			remove(elem, name);
		} else {
			elem.setAttribute(name, value);
		}
	}

	/**
	 * This function is missing documentation.
	 * @TODO Complete documentation.
	 * @alias getAttr
	 * @memberOf dom
	 */
	function get(elem, name) {
		return elem.getAttribute(name);
	}

	/**
	 * This function is missing documentation.
	 * @TODO Complete documentation.
	 * @alias getAttrNS
	 * @memberOf dom
	 */
	function getNS(elem, ns, name) {
		return elem.getAttributeNS(ns, name);
	}

	/**
	 * This function is missing documentation.
	 * @TODO Complete documentation.
	 * @alias removeAttrNS
	 * @memberOf dom
	 */
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
	 * @alias setAttrNS
	 * @memberOf dom
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
	 * @alias hasAttrs
	 * @param  {Node}    node
	 * @return {boolean}
	 * @memberOf dom
	 */
	function has(node) {
		return !Maps.vals(attrs(node)).every(Strings.isEmpty);
	}

	return {
		attrs     : attrs,
		get       : get,
		getNS     : getNS,
		has       : has,
		remove    : remove,
		removeAll : removeAll,
		removeNS  : removeNS,
		set       : set,
		setNS     : setNS
	};
});
