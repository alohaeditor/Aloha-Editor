/* html.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2012 Gentics Software GmbH, Vienna, Austria.
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
define(['util/dom2'], function (Dom) {
	'use strict';

	var nonBlockDisplayValuesMap = {
		"inline": true,
		"inline-block": true,
		"inline-table": true,
		"none": true
	};

	var blockTypeNodes = {
		'P': true,
		'H1': true,
		'H2': true,
		'H3': true,
		'H4': true,
		'H5': true,
		'H6': true,
		'OL': true,
		'UL': true,
		'PRE': true,
		'ADDRESS': true,
		'BLOCKQUOTE': true,
		'DL': true,
		'DIV': true,
		'fieldset': true,
		'FORM': true,
		'HR': true,
		'NOSCRIPT': true,
		'TABLE': true
	};

	/**
	 * From engine.js
	 * "A block node is either an Element whose "display" property does not have
	 * resolved value "inline" or "inline-block" or "inline-table" or "none", or a
	 * Document, or a DocumentFragment."
	 * Note that this function depends on style inheritance which only
	 * works if the given node is attached to the document.
	 */
	function hasBlockStyle(node) {
		return node && ((node.nodeType == 1 && !nonBlockDisplayValuesMap[Dom.getComputedStyle(node, 'display')])
						|| node.nodeType == 9
						|| node.nodeType == 11);
	}

	/**
	 * From engine.js:
	 * "An inline node is a node that is not a block node."
	 * Note that this function depends on style inheritance which only
	 * works if the given node is attached to the document.
	 */
	function hasInlineStyle(node) {
		return !hasBlockStyle(node);
	}

	/**
	 * From engine.js:
	 * "An editing host is a node that is either an Element with a contenteditable
	 * attribute set to the true state, or the Element child of a Document whose
	 * designMode is enabled."
	 * The check for design mode was removed because we only care about
	 * contenteditable in Aloha.
	 */
	function isEditingHost(node) {
		return 1 === node.nodeType && "true" === node.contentEditable;
	}

	/**
	 * Similar to hasBlockStyle() except relies on the nodeName of the
	 * given node which works for attached as well as and detached
	 * nodes.
	 */
	function isBlockType(node) {
		return blockTypeNodes[node.nodeName];
	}

	/**
	 * isInlineType() is similar to hasInlineStyle()
	 * in the same sense as
	 * isBlockType() is similar to hasBlockStyle()
	 */
	function isInlineType(node) {
		return !isBlockType(node);
	}

	function isIgnorableWhitespace(node) {
		return 3 === node.nodeType && !node.length;
	}

	return {
		isIgnorableWhitespace: isIgnorableWhitespace,
		hasBlockStyle: hasBlockStyle,
		hasInlineStyle: hasInlineStyle,
		isBlockType: isBlockType,
		isInlineType: isInlineType,
		isEditingHost: isEditingHost
	};
});
