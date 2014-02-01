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
	 * A map of default black listed node names.
	 *
	 * @private
	 * @type {Object.<String, Boolean>}
	 */
	var blacklist = Content.NODES_BLACKLIST.reduce(function (map, item) {
		map[item] = true;
		return map;
	}, {});

	/**
	 * Checks whether the given node is black listed.
	 *
	 * @private
	 * @param  {Node} node
	 * @return {Boolean}
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
	 * @return {?Element} May be a document fragment or null
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
		var copy = Dom.clone(cleaned, false);
		if (Dom.isTextNode(copy)) {
			return copy;
		}
		Dom.move(processed, copy);
		return copy;
	}

	/**
	 * Extracts body content if the content is an HTML page.  Otherwise it
	 * returns the content itself.
	 *
	 * @fixme
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

	return {
		normalize : normalize,
		extract   : extract
	};
});
