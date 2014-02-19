/**
 * list-indent.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'boundaries',
	'dom',
	'content-to-list',
	'list-to-content',
	'list-selection',
	'list-util'
], function (
	Boundaries,
	Dom,
	ContentToList,
	ListToContent,
	ListSelection,
	ListUtil
) {
	'use strict';

	/**
	 * Creates a list element with `nodeName`.
	 * @param {string} nodeName
	 * @param {Document} doc
	 * @return {Element}
	 */
	function createList(nodeName, doc) {
		return doc.createElement(nodeName);
	}

	/**
	 * Checks if all elements in `array` are item list and belong
	 * to a unique list element.
	 * @param {Array.<Element> array
	 * @return {boolean}
	 */
	function isAllElementsSameList(array) {
		var listsVisited = [];
		for (var i = 0, len = array.length; i < len; i++) {
			if (!ListUtil.isItem(array[i])) {
				return false;
			}
			ListUtil.addElementToList(array[i].parentNode, listsVisited);
		}

		return listsVisited.length === 1;
	}


	/**
	 * Transforms the selection range to a list of type `nodeName`.
	 * @param {Range} range
	 * @param {string} nodeName
	 */
	function toListFromRange(range, nodeName) {
		var doc = range.commonAncestorContainer.ownerDocument;
		var newList = createList(nodeName, doc);

		var boundaries = Boundaries.fromRange(range);
		var elementsSelection = ListSelection.elementsFromBoundaries(boundaries);

		if (isAllElementsSameList(elementsSelection)) {
			var listSrc = elementsSelection[0].parentNode;

			ListUtil.moveToList(listSrc, newList);
		} else {
			ContentToList.toListFromRange(elementsSelection, newList);
		}
	}

	/**
	 * Transforms the selection range from a list element to paragraphs.
	 * @param range
	 */
	function toParagraphsFromRange(range) {
		var boundaries = Boundaries.fromRange(range);
		var elements = ListSelection.elementsFromBoundaries(boundaries);

		ListToContent.toParagraph(elements);
	}

	return {
		toListFromRange: toListFromRange,
		toParagraphsFromRange: toParagraphsFromRange
	};
});
