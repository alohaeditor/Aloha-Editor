/* ms-word-transform-table.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'ms-word-transform-utils',
	'dom'
], function (
	WordContentParserUtils,
    Dom
) {
	'use strict';

	/**
	 * Removes colgroup element from `table`.
	 *
	 * @param {Element} table
	 */
	function removeColgroup(table) {
		var colgroups = table.querySelectorAll('colgroup');
		for (var i = 0, len = colgroups.length; i < len; i++) {
			table.removeChild(colgroups[i]);
		}
	}

	/**
	 * Cleans a list of paragraphs.
	 *
	 * @param {Array.<Element>} paragraphs
	 */
	function cleanParagraphs(paragraphs) {
		for (var i = 0, len = paragraphs.length; i < len; i++) {
			WordContentParserUtils.cleanElement(paragraphs[i]);
		}
	}

	/**
	 * Transforms `table`.
	 *
	 * @param {Element} table Table to transform
	 */
	function transformTable(table) {
		var tds = table.querySelectorAll('td'),
		    childNodes;

		for (var i = 0, len = tds.length; i < len; i++) {
			cleanParagraphs(tds[i].querySelectorAll('p'));
			childNodes = tds[i].childNodes;
			if (childNodes.length == 1 && childNodes[0].nodeName === 'P') {
				Dom.removeShallow(childNodes[0]);
			}
		}
	}

	/**
	 * Transforms tables.
	 *
	 * @param {Element} element
	 */
	function transform(element) {
		var tables = element.querySelectorAll('table'),
		    tableElements = element.querySelectorAll('table,td,th,tr'),
			i,
			len;

		for (i = 0, len = tableElements.length; i < len; i++) {
			WordContentParserUtils.removeAllAttributes(tableElements[i]);
		}

		for (i = 0, len = tables.length; i < len; i++) {
			removeColgroup(tables[i]);
			transformTable(tables[i]);
		}
	}

	return {
		transform: transform
	};
});