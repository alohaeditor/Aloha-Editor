/* html.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
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
define([
	'util/dom2',
	'util/maps',
	'util/arrays'
], function (
	Dom,
	Maps,
	Arrays
) {
	'use strict';

	var inlineFormattableMap = {
		'A': true,
		'B': true,
		'EM': true,
		'FONT': true,
		'I': true,
		'S': true,
		'SPAN': true,
		'STRIKE': true,
		'STRONG': true,
		'SUB': true,
		'SUP': true,
		'U': true
	};

	// Is this list complete? What about HTML5 semantic tags?
	var BLOCK_TAGNAMES = [
		'blockquote',
		'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
		'p',
		'pre'
	];

	/**
	 * Map containing lowercase and uppercase tagnames of block element as keys
	 * mapped against true.
	 *
	 * @type {object<string, boolean>}
	 */
	var blocksTagnameMap = {};
	Maps.fillKeys(blocksTagnameMap, BLOCK_TAGNAMES, true);
	Maps.fillKeys(blocksTagnameMap, Arrays.map(BLOCK_TAGNAMES, function (str) {
		return str.toUpperCase();
	}), true);

	function isBlock(node) {
		return blocksTagnameMap[node.nodeName];
	}

	function isIgnorableWhitespace(node) {
		// TODO
		return 3 === node.nodeType && !node.length;
	}

	function isInlineFormattable(node) {
		return inlineFormattableMap[node.nodeName];
	}

	/**
	 * Checks whether the given element is a block that contains a "propping"
	 * <br> element.
	 *
	 * A propping <br> is one which is inserted into block element to ensure
	 * that the otherwise empty element will be rendered visibly.
	 *
	 * @param {HTMLElement} node
	 * @return {boolean} True if node contains a propping <br>
	 */
	function isProppedBlock(node) {
		if (!blocksTagnameMap[node.nodeName]) {
			return false;
		}
		var found = false;
		var kids = node.children;
		var len = kids.length;
		var i;
		for (i = 0; i < len; i++) {
			if (!found && 'br' === kids[i].nodeName.toLowerCase()) {
				found = true;
			} else if (!isIgnorableWhitespace(kids[i])) {
				return false;
			}
		}
		return found;
	}

	return {
		BLOCK_TAGNAMES: BLOCK_TAGNAMES,
		isBlock: isBlock,
		isIgnorableWhitespace: isIgnorableWhitespace,
		isInlineFormattable: isInlineFormattable,
		isProppedBlock: isProppedBlock
	};
});
