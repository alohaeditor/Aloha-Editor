/**
 * color-formatting.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'ranges',
	'colors',
	'editing',
	'boundaries'
], function (
	Dom,
	Ranges,
	Colors,
	Editing,
	Boundaries
) {
	'use strict';

	/**
	 * Gets the style of the start container of the given range.
	 *
	 * @private
	 * @param  {Range}  range
	 * @param  {string} property
	 * @return {string}
	 */
	function getStyle(range, property) {
		var node = Dom.nodeAtOffset(range.startContainer, range.startOffset);
		return Dom.getComputedStyle(
			Dom.isTextNode(node) ? node.parentNode : node,
			property
		);
	}

	/**
	 * Gets the text color at the given range.
	 *
	 * @param  {Range}  range
	 * @return {string} Style color string
	 */
	function getTextColor(range) {
		return getStyle(range, 'color');
	}

	var isStyleEqual = { isStyleEqual: function (a, b) {
		return (!a || !b) ? (a === b) : Colors.equals(a, b);
	}};

	/**
	 * Sets the text color at the given range.
	 *
	 * @param {Range}  range
	 * @param {string} color
	 */
	function setTextColor(range, color) {
		var boundaries = Boundaries.fromRange(range);
		Editing.style('color', color, boundaries[0], boundaries[1], isStyleEqual);
	}

	/**
	 * Removes the text color at the given range.
	 *
	 * @param {Range} range
	 */
	function unsetTextColor(range) {
		var editable = Ranges.nearestEditingHost(range);
		if (editable) {
			setTextColor(range, Dom.getComputedStyle(editable, 'color'));
		}
	}

	/**
	 * Gets the background color at the given range.
	 *
	 * @param  {Range}  range
	 * @return {string} Style color string
	 */
	function getBackgroundColor(range) {
		return getStyle(range, 'background-color');
	}

	/**
	 * Sets the background color at the given range.
	 *
	 * @param {Range}  range
	 * @param {string} color
	 */
	function setBackgroundColor(range, color) {
		var boundaries = Boundaries.fromRange(range);
		Editing.style('background-color', color, boundaries[0], boundaries[1], isStyleEqual);
	}

	/**
	 * Removes the background color at the given range.
	 *
	 * @param {Range} range
	 */
	function unsetBackgroundColor(range) {
		var editable = Ranges.nearestEditingHost(range);
		if (editable) {
			setBackgroundColor(range, Dom.getComputedStyle(editable, 'background-color'));
		}
	}

	return {
		getTextColor         : getTextColor,
		setTextColor         : setTextColor,
		unsetTextColor       : unsetTextColor,
		getBackgroundColor   : getBackgroundColor,
		setBackgroundColor   : setBackgroundColor,
		unsetBackgroundColor : unsetBackgroundColor
	};
});
