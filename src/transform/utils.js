/**
 * transform/utils.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'predicates',
	'arrays',
	'html',
	'functions',
	'content'
], function (
	Dom,
    Predicates,
    Arrays,
    Html,
	Fn,
	Content
) {
	'use strict';

	/**
	 * @private
	 */
	var blacklist = Content.NODES_BLACKLIST.reduce(function (map, item) {
		map[item] = true;
		return map;
	}, {});

	/**
	 * @private
	 */
	function isBlacklisted(node) {
		return blacklist[node.nodeName];
	}

	/**
	 * Returns a normalized copy of the `element` DOM structure.
	 * If the result of processing `element` results in there being no visible
	 * nodes in the resulting DOM structure, then null is returned.
	 *
	 * @param  {Element}  element
	 * @param  {Document} doc
	 * @return {?Element} May be a document fragment. May be null.
	 */
	function normalize(element, doc, clean) {
		var cleaned = clean(element, doc);
		if (Html.isUnrendered(cleaned)) {
			return null;
		}
		var children = Dom.children(cleaned);
		var allowed = children.filter(Fn.complement(isBlacklisted));
		var rendered = allowed.filter(Html.isRendered);
		var processed = rendered.reduce(function (nodes, node) {
			var copy = normalize(node, doc, clean);
			return copy ? nodes.concat(copy) : nodes;
		}, []);
		var copy = cleaned.cloneNode(false);
		if (Dom.isTextNode(copy)) {
			return copy;
		}
		Dom.move(processed, copy);
		return copy;
	}

	/**
	 * Extracts body content if the content is an HTML page. Otherwise it
	 * returns the content itself.
	 *
	 * FixMe
	 * What if `content` contains a comment like this:
	 * <html><!-- <body>gotcha!</body> --><title>woops</title><body>hello, world!</body></html>
	 *
	 * @param  {String} content
	 * @return {String}
	 */
	function extract(markup) {
		markup = markup.replace(/\n/g, ' ');
		markup = markup.replace(/<iframe.*?<\/iframe>/g, '');

		var matchStart = /<body.*?>/i.exec(markup);
		var matchEnd = /<\/body.*?>/i.exec(markup);

		if (matchStart && matchEnd) {
			var index = markup.indexOf(matchStart[0]) + matchStart[0].length;
			var lastIndex = markup.indexOf(matchEnd[0]);
			return markup.slice(index, lastIndex);
		}

		return markup;
	}

	/**
	 * Gets the first block child
	 *
	 * @param  {Element} element
	 * @return {?Node}
	 */
	function getFirstChildBlockElement(element) {
		return Dom.findForward(element, Html.hasBlockStyle, Dom.isEditingHost);

		/*
		var nextSibling = element.firstChild;
		var block;
		while (nextSibling) {
			if (Html.hasBlockStyle(nextSibling)) {
				return nextSibling;
			}
			if ((block = getFirstChildBlockElement(nextSibling)) != null) {
				return block;
			}
			nextSibling = nextSibling.nextSibling;
		}
		return null;
		*/
	}

	/**
	 * Cleans list element.
	 *
	 * @param {Element} list
	 */
	function cleanListElement(list) {
		Dom.children(list).forEach(function (item) {
			if (item.nodeName !== 'LI' && !Html.isListContainer(item)) {
				Dom.wrapWith(item, 'li');
			}
		});
	}

	/**
	 * Cleans image element.
	 * @param {!Element} imgElement
	 */
	function cleanImageElement(imgElement) {
		var src = imgElement.src;
		var height = imgElement.height;
		var width = imgElement.width;

		Dom.removeAttrs(imgElement);

		imgElement.src = src;
		imgElement.height = height;
		imgElement.width = width;
	}

	/**
	 * Walks the decendents of the given element, calling the callback function
	 * when `pred` return true.
	 *
	 * @param {Element} element
	 * @param {function(Element):boolean} pred
	 * @param {function(Element)} callback
	 */
	function walkDescendants(element, pred, callback) {
		var childNodes = Dom.children(element);
		var child;

		for (var i = 0, len = childNodes.length; i < len; i++) {
			child = childNodes[i];
			if (child) {
				if (pred(child)){
					callback(child);
					// check if the child has changed
					// the size of the children nodes can change
					if (child !== childNodes[i]) {
						i--;
						len = element.childNodes.length;
					}
				}
				if (Dom.isElementNode(child)) {
					walkDescendants(child, pred,  callback);
				}
			}
		}
	}

	/**
	 * Creates a rewrapped copy of `element`.
	 *
	 * An element based on `nodeName`, and copies the content of the
	 * given element into it.
	 *
	 * @param  {Element}  element
	 * @param  {String}   nodeName
	 * @param  {Document} doc
	 * @return {Element}
	 */
	function rewrap(element, nodeName, doc) {
		var node = doc.createElement(nodeName);
		Dom.move(Dom.children(Dom.clone(element)), node);
		return node;
	}

	return {
		normalize : normalize,
		extract   : extract,
		rewrap    : rewrap,

		getFirstChildBlockElement : getFirstChildBlockElement,
		cleanImageElement         : cleanImageElement,
		cleanListElement          : cleanListElement,
		walkDescendants           : walkDescendants
	};
});
