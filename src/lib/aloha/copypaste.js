/* copypaste.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2012 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 *
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
 */
/**
 * @overview:
 * Various utility functions that are useful when working with selections, and
 * ranges for copy/paste functionality.
 */
define('aloha/copypaste', [
	'jquery',
	'aloha/core'
], function (
	$,
	Aloha
) {
	'use strict';

	/**
	 * Retrieve the editable host in which the given range is contained.
	 *
	 * @param {WrappedRange} range
	 * @return {jQuery.<HTMLElement>|null} The editable host element, null if
	 *                                     non can be determinded from the given
	 *                                     range.
	 */
	function getEditableAt(range) {
		if (!range || !range.commonAncestorContainer) {
			return null;
		}
		var $container = $(range.commonAncestorContainer);
		return $container.length ? Aloha.getEditableHost($container) : null;
	}

	/**
	 * Retrieves the current range.
	 *
	 * @return {WrappedRange|null} Range at current selection or null of non
	 *                             exists.
	 */
	function getRange() {
		var selection = Aloha.getSelection();
		return selection.getRangeCount() ? selection.getRangeAt(0) : null;
	}

	/**
	 * Set the selection to the given range
	 *
	 * @param {object} range An object that must container the following
	 *                       essential range properties: ~ startContainer
	 *                                                   ~ endContainer
	 *                                                   ~ startOffset
	 *                                                   ~ endOffset
	 */
	function setSelectionAt(range) {
		var newRange = Aloha.createRange();
		var selection = Aloha.getSelection();
		newRange.setStart(range.startContainer, range.startOffset);
		newRange.setEnd(range.endContainer, range.endOffset);
		selection.removeAllRanges();
		selection.addRange(newRange);
	}

	/**
	 * Creates a selection that encompasses the contents of the given element.
	 *
	 * @param {HTMLElement} element Editable DOM element.
	 */
	function selectAllOf(element) {
		setSelectionAt({
			startContainer: element,
			endContainer: element,
			startOffset: 0,
			endOffset: element.childNodes ? element.childNodes.length
		                                  : element.length
		});
		$(element).focus();
	}

	return {
		getEditableAt: getEditableAt,
		getRange: getRange,
		selectAllOf: selectAllOf,
		setSelectionAt: setSelectionAt
	};
});
