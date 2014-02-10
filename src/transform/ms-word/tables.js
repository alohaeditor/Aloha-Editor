/**
 * transform/ms-word/tables.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define(['dom'], function (Dom) {
	'use strict';

	/**
	 * Converts all TD elements into TH elements in the given list of nodes.
	 *
	 * @private
	 * @param  {Array.<Node>} nodes
	 * @pram   {Document}     doc
	 * @return {Array.<Node>}
	 */
	function createTableHeadings(nodes, doc) {
		var list = [];
		nodes.forEach(function (node) {
			if ('TD' === node.nodeName) {
				var children = Dom.children(node);
				node = doc.createElement('th');
				Dom.copy(children, node);
			}
			return list.push(node);
		});
		return list;
	}

	/**
	 * Matches MS-WORD styling that demarks table header rows.
	 *
	 * @private
	 * @type {RegExp}
	 */
	var HEADER_ROW_INDEX = /mso-yfti-irow:\-1;/;

	function isTableHeading(node) {
		return 'TR' === node.nodeName
		    && HEADER_ROW_INDEX.test(Dom.getAttr(node, 'style'));
	}

	/**
	 * Normalizes tables in the given DOM structure.
	 *
	 * @param  {node}     element
	 * @param  {Document} doc
	 * @return {Element} A normalized copy of `element`
	 */
	function transform(element, doc) {
		var children = Dom.children(element);
		var processed = [];
		var node;
		var tds;
		var i;
		for (i = 0; i < children.length; i++) {
			node = transform(children[i], doc);
			if (isTableHeading(node)) {
				node = Dom.clone(node);
				tds = Dom.children(node);
				tds.forEach(Dom.remove);
				Dom.move(createTableHeadings(tds, doc), node);
			}
			processed.push(node);
		}
		var clone = Dom.clone(element, false);
		Dom.move(processed, clone);
		return clone;
	}

	return {
		transform: transform
	};
});
