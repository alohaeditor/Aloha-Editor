/**
 * link.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'link/link-selection',
	'link/link-remove',
	'link/link-util',
	'ranges'
], function(
	Dom,
	LinkSelection,
	LinkRemove,
	LinkUtil,
	Ranges
) {
	'use strict';

	/**
	 * Creates a link in the actual selection.
	 * @param {string} href
	 * @param {Document} doc
	 */
	function createLink(href, doc) {
		createLinkFromRange(href, Ranges.get(), doc);
	}

	/**
	 * Checks if the range is valid for create a link.
	 * @param {Range} range
	 * @returns {boolean}
	 */
	function isValidRangeForCreateLink(range) {
		return !range.collapsed && (!range.textContent || range.textContent.trim().length === 0);
	}

	/**
	 * Creates a link in the selection in the range. If there is no selection,
	 * the link will no be created.
	 * @param {string} href
	 * @param {Range} range
	 * @param {Document} doc
	 */
	function createLinkFromRange(href, range, doc) {
		if (!isValidRangeForCreateLink(range)) {
			return;
		}

		var anchors = LinkSelection.createAnchorsInRange(range, doc);

		anchors.forEach(function(anchor) {
			Dom.setAttr(anchor, "href", href);
		});
	}

	/**
	 * Removes links from selection.
	 * @param {Document} doc
	 */
	function removeLink(doc) {
		removeLinkFromRange(Ranges.get(), doc);
	}

	/**
	 * Removes links from `range`.
	 * @param {Range} range
	 * @param {Document} doc
	 */
	function removeLinkFromRange(range, doc) {
		LinkRemove.removeLinkFromRange(range, doc);
	}


	return {
		createLink: createLink,
		createLinkFromRange: createLinkFromRange,

		removeLink: removeLink,
		removeLinkFromRange: removeLinkFromRange
	};
});
