/**
 * list.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'boundaries',
	'dom',
	'list/content-to-list',
	'list/list-to-content',
	'list/list-selection',
	'list/list-util',
	'list/list-range',
	'ranges'
], function (
	Boundaries,
	Dom,
	ContentToList,
    ListToContent,
    ListSelection,
    ListUtil,
    ListRange,
    Ranges
) {
	'use strict';

	var ORDERED_LIST_TAG = 'OL';
	var UNORDERED_LIST_TAG = 'UL';


	/**
	 * Transforms `range` selection to ordered list.
	 * @param {Range} range
	 */
	function toOrderedListFromRange(range) {
		ListRange.toListFromRange(range, ORDERED_LIST_TAG);
	}

	/**
	 * Transforms `range` selection to unordered list.
	 * @param {Range} range
	 */
	function toUnorderedListFromRange(range) {
		ListRange.toListFromRange(range, UNORDERED_LIST_TAG);
	}

	/**
	 * Transforms `range` selection to paragraph.
	 * @param {Range} range
	 */
	function toParagraphsFromRange(range) {
		ListRange.toParagraphsFromRange(range);
	}

	/**
	 * Executes `fn` with range as parameter.
	 * @param {function} fn
	 * @param {Document} doc
	 */
	function addRangeParameter(fn, doc) {
		doc = doc || document;
		var range = Ranges.get(doc);
		fn(range);
	}

	/**
	 * Transforms to ordered list.
	 * @param {Document} doc.
	 */
	function toOrderedList(doc) {
		addRangeParameter(toOrderedListFromRange, doc);
	}

	/**
	 * Transforms to unordered list.
	 * @param {Document} doc.
	 */
	function toUnorderedList(doc) {
		addRangeParameter(toUnorderedListFromRange, doc);
	}

	/**
	 * Transforms to paragraphs.
	 * @param {Document} doc.
	 */
	function toParagraphs(doc) {
		addRangeParameter(toParagraphsFromRange, doc);
	}

	return {
		toOrderedListFromRange: toOrderedListFromRange,
		toUnorderedListFromRange: toUnorderedListFromRange,
		toParagraphsFromRange: toParagraphsFromRange,

		toOrderedList: toOrderedList,
		toUnorderedList: toUnorderedList,
		toParagraph: toParagraphs
	};
});
