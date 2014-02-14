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
	'content'
], function (
	Dom,
	Fn,
	Html,
	Content
) {
	'use strict';

	var blacklist = Content.NODES_BLACKLIST.reduce(function (map, item) {
		map[item] = true;
		return map;
	}, {});

	function isBlacklisted(node) {
		return blacklist[node.nodeName];
	}

	function normalize(element, doc, clean) {
		element = clean(element, doc);
		var children = Dom.children(element);
		var allowed = children.filter(Fn.complement(isBlacklisted));
		var rendered = allowed.filter(Html.isRendered);
		var cleaned = rendered.reduce(function (nodes, node) {
			var copy = clean(node, doc);
			if (copy) {
				copy = normalize(copy, doc, clean);
			}
			return copy ? nodes.concat(copy) : nodes;
		}, []);
		var copy = element.cloneNode(false);
		Dom.move(cleaned, copy);
		return copy;
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
