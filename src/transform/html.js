/**
 * transform/html.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'arrays',
	'maps',
	'functions',
	'html',
	'content',
	'utils'
], function (
	Dom,
	Arrays,
	Maps,
	Fn,
	Html,
	Content,
	Utils
) {
	'use strict';

	/**
	 * Strategy:
	 * 1) Harvest from each, their color, face, and size attribute.
	 * 2) Determine if the font node is wrapping a single element as it's only
	 *    child.
	 *		- If it does, then apply these styles into that element, giving the
	 *		  child's styles preference. Then unwrap the font node.
	 *		- If the font node is not wrapping a single element, but several,
	 *		  then convert the font node into a span.
	 *
	 * @param  {Element}  element
	 * @param  {Document} doc
	 * @return {Element}
	 */
	function normalizeFont(element, doc) {
		var children = Dom.children(element);
		var color = Dom.getStyle(element, 'color')      || Dom.getAttr(element, 'color');
		var size = Dom.getStyle(element, 'font-size')   || Dom.getAttr(element, 'font-size');
		var face = Dom.getStyle(element, 'font-family') || Dom.getAttr(element, 'font-family');
		var child;
		if (1 === children.length && Dom.isElementNode(children[0])) {
			child = children[0];
		} else {
			child = doc.createElement('span');
			Dom.move(children, child);
		}
		if (color) {
			Dom.setStyle(child, 'color', color);
		}
		if (size) {
			Dom.setStyle(child, 'font-size', size);
		}
		if (face) {
			Dom.setStyle(child, 'font-family', face);
		}
		return child;
	}

	/**
	 * Strategy:
	 * 1) Check if the parent of the center allows for paragraph children.
	 *    - If it doesn't, split the element down to the first ancestor that
	 *      does allow for a paragraph, then insert the center at the split.
	 * 2) replace the center node with a paragraph
	 * 3) add alignment styling to new paragraph
	 *
	 * @param  {Element}  element
	 * @param  {Document} doc
	 * @return {Element}
	 */
	function normalizeCenter(element, doc) {
		return element;
	}

	/**
	 * Extracts width and height attributes from the given element, and applies
	 * them as styles instead.
	 *
	 * @param  {Element} element
	 * @return {Element}
	 */
	function normalizeImage(element) {
		var width = Dom.getAttr(element, 'width');
		var height = Dom.getAttr(element, 'height');
		if (width) {
			Dom.setStyle(element, 'width', width);
		}
		if (height) {
			Dom.setStyle(element, 'height', height);
		}
		return element;
	}

	/**
	 * Remove all disallowed attributes from the given node.
	 *
	 * @param  {Node} node
	 * @return {Node}
	 */
	function normalizeAttributes(node) {
		var permitted = Content.ATTRIBUTES_WHITELIST['*'].concat(
			Content.ATTRIBUTES_WHITELIST[node.nodeName] || []
		);
		var attrs = Dom.attrNames(node);
		var allowed = Arrays.intersect(permitted, attrs);
		var disallowed = Arrays.difference(attrs, allowed);
		disallowed.forEach(Fn.partial(Dom.removeAttr, node));
	}

	/**
	 * Remove all disallowed styles from the given node.
	 *
	 * @param {Node} node
	 */
	function normalizeStyles(node) {
		var permitted = Content.STYLES_WHITELIST['*'].concat(
			Content.STYLES_WHITELIST[node.nodeName] || []
		);
		var styles = permitted.reduce(function (map, name) {
			map[name] = Dom.getStyle(node, name);
			return map;
		}, {});
		Dom.removeAttr(node, 'style');
		Maps.forEach(styles, function (value, key) {
			if (value) {
				Dom.setStyle(node, key, value);
			}
		});
	}

	/**
	 * Runs the appropriate cleaning processes on the given node based on its
	 * type.  The returned node will not necessarily be of the same type as
	 * that of the given (eg: <font> => <span>).
	 *
	 * @param  {Node}     node
	 * @param  {Document} doc
	 * @return {Node}     May be a document fragment
	 */
	function clean(node, doc) {
		node = Dom.clone(node);

		if (Dom.isTextNode(node)) {
			return node;
		}

		var cleaned;

		switch (node.nodeName) {
		case 'IMG':
			cleaned = normalizeImage(node, doc);
			break;
		case 'FONT':
			cleaned = node;
			// Because <font> elements may be nested
			do {
				cleaned = normalizeFont(cleaned, doc);
			} while ('FONT' === cleaned.nodeName);
			break;
		case 'CENTER':
			cleaned = normalizeCenter(node, doc);
			break;
		default:
			cleaned = node;
		}

		normalizeAttributes(cleaned);
		normalizeStyles(cleaned);

		// Because span elements without any attributeshave no visible effect
		if ('SPAN' === cleaned.nodeName || 'A' === cleaned.nodeName) {
			var attrs = Dom.attrNames(cleaned);
			if (0 === attrs.length) {
				var fragment = document.createDocumentFragment();
				Dom.move(Dom.children(cleaned), fragment);
				cleaned = fragment;
			}
		}

		return cleaned;
	}

	/**
	 * Transforms markup to normalized HTML.
	 *
	 * @param  {string}   markup
	 * @param  {Document} doc
	 * @return {string}
	 */
	function transform(markup, doc) {
		var raw = Html.parse(Utils.extract(markup), doc);
		return (Utils.normalize(raw, doc, clean) || raw).innerHTML;
	}

	return {
		clean     : clean,
		transform : transform
	};
});
