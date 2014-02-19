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
	'./utils'
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
	 * Unwraps or replaces the given font element while preserving the styles
	 * it effected.
	 *
	 * @param  {Element}  font Must be a font element
	 * @param  {Document} doc
	 * @return {Element}
	 */
	function normalizeFont(font, doc) {
		var children = Dom.children(font);
		var color = Dom.getStyle(font, 'color')      || Dom.getAttr(font, 'color');
		var size = Dom.getStyle(font, 'font-size')   || Dom.getAttr(font, 'font-size');
		var face = Dom.getStyle(font, 'font-family') || Dom.getAttr(font, 'font-family');
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
	 * @todo
	 * @param  {Element}  element
	 * @param  {Document} doc
	 * @return {Element}
	 */
	function normalizeCenter(doc, node) {
		return node;
	}

	/**
	 * Extracts width and height attributes from the given element, and applies
	 * them as styles instead.
	 *
	 * @param  {Element} img Must be an image
	 * @return {Element}
	 */
	function normalizeImage(img) {
		var width = Dom.getAttr(img, 'width');
		var height = Dom.getAttr(img, 'height');
		if (width) {
			Dom.setStyle(img, 'width', width);
		}
		if (height) {
			Dom.setStyle(img, 'height', height);
		}
		return img;
	}

	/**
	 * Removes all disallowed attributes from the given node.
	 *
	 * @param  {Node} node
	 * @return {Node}
	 */
	function normalizeAttributes(node) {
		var permitted = (Content.ATTRIBUTES_WHITELIST['*'] || []).concat(
			Content.ATTRIBUTES_WHITELIST[node.nodeName] || []
		);
		var attrs = Dom.attrNames(node);
		var allowed = Arrays.intersect(permitted, attrs);
		var disallowed = Arrays.difference(attrs, allowed);
		disallowed.forEach(Fn.partial(Dom.removeAttr, node));
	}

	/**
	 * Removes all disallowed styles from the given node.
	 *
	 * @param {Node} node
	 */
	function normalizeStyles(node) {
		var permitted = (Content.STYLES_WHITELIST['*'] || []).concat(
			Content.STYLES_WHITELIST[node.nodeName] || []
		);
		// Because '*' means that all styles are permitted
		if (Arrays.contains(permitted, '*')) {
			return;
		}
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
	 * Unwrap spans that have not attributes.
	 *
	 * @param  {Node}     node
	 * @param  {Document} doc
	 * @return {Node|Fragment}
	 */
	function normalizeSpan(node, doc) {
		if (Dom.hasAttrs(node)) {
			return node;
		}
		var fragment = doc.createDocumentFragment();
		Dom.move(Dom.children(node), fragment);
		return fragment;
	}

	/**
	 * Runs the appropriate cleaning processes on the given node based on its
	 * type.  The returned node will not necessarily be of the same type as
	 * that of the given (eg: <font> => <span>).
	 *
	 * @param  {Node}     node
	 * @param  {Document} doc
	 * @return {Array.<Node>}
	 */
	function clean(node, doc) {
		node = Dom.clone(node);

		if (Dom.isTextNode(node)) {
			return [node];
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

		if (Dom.isFragmentNode(cleaned)) {
			return [cleaned];
		}

		normalizeAttributes(cleaned);
		normalizeStyles(cleaned);

		if ('SPAN' === cleaned.nodeName) {
			cleaned = normalizeSpan(cleaned, doc);
		}

		var kids = Dom.children(cleaned);
		var i;
		for (i = 0; i < kids.length; i++) {
			if (!Content.allowsNesting(cleaned.nodeName, kids[i].nodeName)) {
				return kids;
			}
		}

		return [cleaned];
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
		var fragment = Utils.normalize(raw, doc, clean);
		return Dom.children(fragment)[0].innerHTML;
	}

	return {
		transform : transform
	};
});
