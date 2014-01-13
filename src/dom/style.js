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
	'strings',
	'browsers'
], function DomStyles(
	Nodes,
	Attrs,
	Strings,
	Browsers
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
		return Nodes.isElementNode(elem) ? elem.style[name] : null;
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
	 * @param {Element} elem
	 * @param {string}  styleName
	 */
	function remove(elem, styleName) {
		if (Browsers.hasRemoveProperty) {
			elem.style.removeProperty(styleName);
			if (Strings.isEmpty(elem.getAttribute('style'))) {
				elem.removeAttribute('style');
			}
			return;
		}
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
		if (!Strings.isEmpty(style)) {
			Attrs.set(elem, 'style', style);
		} else {
			Attrs.remove(elem, 'style');
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
