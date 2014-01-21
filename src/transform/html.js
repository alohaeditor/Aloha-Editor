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
	 */
	function normalizeFont(doc, node) {
		var children = Dom.children(node);
		var color = Dom.getStyle(node, 'color')       || Dom.getAttr(node, 'color');
		var size  = Dom.getStyle(node, 'font-size')   || Dom.getAttr(node, 'font-size');
		var face  = Dom.getStyle(node, 'font-family') || Dom.getAttr(node, 'font-family');
		var child;

		if (1 === children.length && Dom.isElementNode(children[0])) {
			Dom.removeShallow(node);
			child = children[0];
		} else {
			child = doc.createElement('span')
			Dom.replaceShallow(node, child);
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
	 */
	function normalizeCenter(doc, node) {
		return node;
	}

	/**
	 * Extracts width and height attributes and applies them as styles instead.
	 */
	function normalizeImage(doc, node) {
		var width = Dom.getAttr(node, 'width');
		var height = Dom.getAttr(node, 'height');
		if (width) {
			Dom.setStyle(node, 'width', width);
		}
		if (height) {
			Dom.setStyle(node, 'height', height);
		}
		return node;
	}

	var blacklist = Content.NODES_BLACKLIST.reduce(function (map, item) {
		map[item] = true;
		return map;
	}, {});

	function isBlacklisted(node) {
		return blacklist[node.nodeName];
	}

	/**
	 * Remove all disallowed attributes from the given node.
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
	 * Unwrap spans that have not attributes
	 */
	function normalizeSpan(doc, node) {
		return Dom.hasAttrs(node) ? node : null;
	}

	function clean(doc, node) {
		if (Dom.isTextNode(node)) {
			return node;
		}

		var cleaned;

		switch (node.nodeName) {
		case 'IMG':
			cleaned = normalizeImage(doc, node);
			break;
		case 'FONT':
			cleaned = normalizeFont(doc, node);
			break;
		case 'CENTER':
			cleaned = normalizeCenter(doc, node);
		break;
		default:
			cleaned = node;
		}

		normalizeAttributes(cleaned);
		normalizeStyles(cleaned);

		if ('SPAN' === cleaned.nodeName) {
			cleaned = normalizeSpan(doc, cleaned);
		}

		return cleaned;
	}

	function normalize(element, doc) {
		element = clean(doc, element);
		var children = Dom.children(element);
		var allowed = children.filter(Fn.complement(isBlacklisted));
		var rendered = allowed.filter(Html.isRendered);
		var cleaned = rendered.reduce(function (nodes, node) {
			var copy = clean(doc, node);
			if (copy) {
				copy = normalize(copy, doc);
			}
			return copy ? nodes.concat(copy) : nodes;
		}, []);
		var copy = element.cloneNode(false);
		Dom.move(cleaned, copy);
		return copy;
	}

	/**
	 * Transforms markup to normalized HTML.
	 *
	 * @param  {string}   markup
	 * @param  {Document} doc
	 * @return {string}
	 */
	function transform(markup, doc) {
		var content = Html.parse(Utils.extractContent(markup), doc);
		return normalize(content, doc).innerHTML;
	}

	return {
		transform : transform
	};
});
