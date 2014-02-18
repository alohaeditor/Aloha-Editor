/**
 * transform/utils.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'functions',
	'html',
	'arrays',
	'content',
	'predicates'
], function (
	Dom,
	Fn,
	Html,
	Arrays,
	Content,
	Predicates
) {
	'use strict';

	var DEFAULT_BLOCK_ELEMENT = 'p';

	var blacklist = Content.NODES_BLACKLIST.reduce(function (map, item) {
		map[item] = true;
		return map;
	}, {});

	function isBlacklisted(node) {
		return blacklist[node.nodeName];
	}

	/**
	 * Given a list of nodes, will wrap consecutive nodes that return true for
	 * `pred` into a `wrapper` nodes.
	 *
	 * @param  {Arrays.<Nodes>}         nodes
	 * @param  {Document}               doc
	 * @param  {function(Node):boolean} pred
	 * @param  {string}                 wrapper
	 * @return {Array.<Nodes>}
	 */
	function wrapSublists(nodes, doc, pred, wrapper) {
		var elements = [];
		var wrapplings;
		var l = nodes.length;
		var i;
		for (i = 0; i < l; i++) {
			wrapplings = [];
			while (i < l && pred(nodes[i])) {
				wrapplings.push(nodes[i]);
				i++;
			}
			if (wrapplings.length > 0) {
				elements.push(doc.createElement(wrapper));
				Dom.move(wrapplings, Arrays.last(elements));
			}
			if (i < l) {
				elements.push(nodes[i]);
			}
		}
		return elements;
	}

	/**
	 * Reduces the given list of nodes into a list of cleaned nodes.
	 *
	 * @private
	 * @param  {Array.<Node>}                nodes
	 * @param  {Document}                    doc
	 * @param  {function(Node):Array.<Node>} clean
	 * @param  {function():Node}             normalize
	 * @return {Array.<Node>}
	 */
	function cleanNodes(nodes, doc, clean, normalize) {
		var allowed = nodes.filter(Fn.complement(isBlacklisted));
		var rendered = allowed.filter(Html.isRendered);
		return rendered.reduce(function (nodes, node) {
			clean(node, doc).forEach(function (node) {
				nodes = nodes.concat(normalize(node, doc, clean));
			});
			return nodes;
		}, []);
	}

	/**
	 * Recursively cleans the given node and it's children according to the
	 * given clean function.
	 *
	 * @private
	 * @param  {Node}                        node
	 * @param  {Document}                    doc
	 * @param  {function(Node):Array.<Node>} clean
	 * @return {Array.<Node>}
	 */
	function cleanNode(node, doc, clean) {
		var nodes = clean(node, doc);
		var processed = nodes.reduce(function (nodes, node) {
			var children = cleanNodes(Dom.children(node), doc, clean, cleanNode);
			if ('DIV' === node.nodeName) {
				children = wrapSublists(
					children,
					doc,
					Predicates.isInlineNode,
					DEFAULT_BLOCK_ELEMENT
				);
			}
			return nodes.concat(children);
		}, []);
		if (1 === nodes.length) {
			var copy = Dom.cloneShallow(node);
			Dom.move(processed, copy);
			return [copy];
		}
		return processed;
	}

	/**
	 * Normalizes the given node tree.
	 *
	 * @param  {Element}             element
	 * @param  {Document}            doc
	 * @param  {function(Node):Node} clean
	 * @return {Element|Fragment}
	 */
	function normalize(element, doc, clean) {
		var cleaned = cleanNode(element, doc, clean);
		if (1 === cleaned.length) {
			return cleaned[0];
		}
		var fragment = doc.createDocumentFragment();
		Dom.move(cleaned, fragment);
		return fragment;
	}

	/**
	 * Extracts body content if the content is an HTML page. Otherwise it
	 * returns the content itself.
	 *
	 * @fixme
	 * What if `content` contains a comment like this:
	 * <html><!-- <body>gotcha!</body> --><title>woops</title><body>hello, world!</body></html>
	 *
	 * @param  {string} content
	 * @return {string}
	 */
	function extract(markup) {
		markup = markup.replace(/\n/g, ' ');
		markup = markup.replace(/<iframe.*?<\/iframe>/g, '');
		var start = /<body.*?>/i.exec(markup);
		var end = /<\/body.*?>/i.exec(markup);
		if (start && end) {
			var index = markup.indexOf(start[0]) + start[0].length;
			var lastIndex = markup.indexOf(end[0]);
			return markup.slice(index, lastIndex);
		}
		return markup;
	}

	return {
		normalize : normalize,
		extract   : extract
	};
});
