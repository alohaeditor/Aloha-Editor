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
	 * Conversion of font size number into point size unit of width values (em).
	 * Font size numbers range from 1 to 7.
	 *
	 * @const
	 * @private
	 * @type {Object<string, string>}
	 */
	var FONT_SIZES = {
		'1': '0.63em',
		'2': '0.82em',
		'3': '1em',
		'4': '1.13em',
		'5': '1.5em',
		'6': '2em',
		'7': '3em'
	};

	/**
	 * Unwraps or replaces the given font element while preserving the styles it
	 * effected.
	 *
	 * @private
	 * @param  {Element} font Must be a font element
	 * @return {Element}
	 */
	function normalizeFont(font) {
		var children = Dom.children(font);
		var color = Dom.getStyle(font, 'color')       || Dom.getAttr(font, 'color');
		var size  = Dom.getStyle(font, 'font-size')   || FONT_SIZES[Dom.getAttr(font, 'size')];
		var face  = Dom.getStyle(font, 'font-family') || Dom.getAttr(font, 'face');
		var child;
		if (1 === children.length && Dom.isElementNode(children[0])) {
			child = children[0];
		} else {
			child = font.ownerDocument.createElement('span');
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
	 * @todo implement this function
	 * @private
	 * @param  {Element} node
	 * @return {Element}
	 */
	function normalizeCenter(node) {
		return node;
	}

	/**
	 * Extracts width and height attributes from the given element, and applies
	 * them as styles instead.
	 *
	 * @private
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

	function generateWhitelist(whitelist, nodeName) {
		return (whitelist['*'] || []).concat(whitelist[nodeName] || []);
	}

	/**
	 * Removes all disallowed attributes from the given node.
	 *
	 * @private
	 * @param  {Editable} editable
	 * @param  {Node}     node
	 * @return {Node}
	 */
	function normalizeAttributes(allowedAttributes, node) {
		var permitted = generateWhitelist(allowedAttributes, node.nodeName);
		var attrs = Maps.keys(Dom.attrs(node));
		var allowed = Arrays.intersect(permitted, attrs);
		var disallowed = Arrays.difference(attrs, allowed);
		disallowed.forEach(Fn.partial(Dom.removeAttr, node));
	}

	/**
	 * Removes all disallowed styles from the given node.
	 *
	 * @private
	 * @param  {Editable} editable
	 * @param  {Node} node
	 */
	function normalizeStyles(allowedStyles, node) {
		var permitted = generateWhitelist(allowedStyles, node.nodeName);
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
	 * @private
	 * @param  {Node} node
	 * @return {Node|Fragment}
	 */
	function normalizeSpan(node) {
		if (Dom.hasAttrs(node)) {
			return node;
		}
		var fragment = node.ownerDocument.createDocumentFragment();
		Dom.move(Dom.children(node), fragment);
		return fragment;
	}

	/**
	 * Runs the appropriate cleaning processes on the given node based on its
	 * type. The returned node will not necessarily be of the same type as that
	 * of the given (eg: <font> => <span>).
	 *
	 * @private
	 * @param  {Editable} editable
	 * @param  {Node}     node
	 * @return {Array.<Node>}
	 */
	function clean(rules, node) {
		node = Dom.clone(node);
		if (Dom.isTextNode(node)) {
			return [node];
		}
		var cleaned;
		switch (node.nodeName) {
		case 'IMG':
			cleaned = normalizeImage(node);
			break;
		case 'FONT':
			cleaned = node;
			// Because <font> elements may be nested
			do {
				cleaned = normalizeFont(cleaned);
			} while ('FONT' === cleaned.nodeName);
			break;
		case 'CENTER':
			cleaned = normalizeCenter(node);
			break;
		default:
			cleaned = node;
		}
		if (Dom.isFragmentNode(cleaned)) {
			return [cleaned];
		}
		normalizeAttributes(rules.allowedAttributes, cleaned);
		normalizeStyles(rules.allowedStyles, cleaned);
		if ('SPAN' === cleaned.nodeName) {
			cleaned = normalizeSpan(cleaned);
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
	 * Transforms html markup to normalized HTML.
	 *
	 * @param  {string}   markup
	 * @param  {Document} document
	 * @param  {Object}   rules
	 * @return {string}
	 * @alias html
	 * @memberOf transform
	 */
	function transform(markup, doc, rules) {
		if (!rules) {
			rules = Utils.DEFAULT_RULES;
		}
		var fragment = doc.createDocumentFragment();
		Dom.move(Html.parse(Utils.extract(markup), doc), fragment);
		return Dom.outerHtml(Utils.normalize(rules, fragment, clean));
	}

	return {
		transform : transform
	};
});
