/**
 * dom/styles.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom/nodes',
	'dom/attrs',
	'strings'
], /** @exports DomStyles */ function DomStyles(
	Nodes,
	Attrs,
	Strings
) {
	'use strict';

	/**
	 * Sets a style on the given element by modifying its style attribute.
	 *
	 * @param  {Element} elem
	 * @param  {string}  name  Style property
	 * @return {string}  value Style property value
	 */
	function set(elem, name, value) {
		name = Strings.dashesToCamelCase(name);
		var styles = elem.style;
		if (name in styles) {
			// @ignore jslint warning
			styles[name] = value;
		}
	}

	/**
	 * Gets a style from the given element's style attribute.
	 * Note that this is different from the computed/inherited style.
	 *
	 * @param  {Element} elem
	 * @param  {string}  name Style property
	 * @return {?string} Style value or null if none is found
	 */
	function get(elem, name) {
		// Because IE7 needs dashesToCamelCase().
		name = Strings.dashesToCamelCase(name);
		return elem.style[name];
	}

	/**
	 * Gets a style from the given element's style attribute.
	 * Note that this is different from the computed/inherited style.
	 *
	 * The return value will be an object of computed style values mapped
	 * agains their name.
	 *
	 * @param  {Element}                 elem
	 * @param  {Array.<string>}          names
	 * @return {Object.<string, string>}
	 */
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
	 * @param  {Element} elem
	 * @param  {string}  name Style property name.
	 * @return {?string} Computed style, or `null` if no such style is set
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
	 * The style attribute is removed completely if it is left empty
	 * after removing the style.
	 *
	 * @param {Element} elem
	 * @param {string}  styleName
	 */
	function remove(elem, styleName) {
		elem.style.removeProperty(styleName);
		if (Strings.isEmpty(elem.getAttribute('style'))) {
			elem.removeAttribute('style');
		}
	}

	return {
		set               : set,
		get               : get,
		remove            : remove,
		getComputedStyle  : getComputedStyle,
		getComputedStyles : getComputedStyles
	};
});
