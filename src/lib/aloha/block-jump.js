/* block-jump.js is part of the Aloha Editor project http://aloha-editor.org
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
/**
 * Implements some logic related to moving the cursor keys across blocks.
 * 
 * In the following example
 *
 * "some text<span class="aloha-block ..." contenteditable="false" ...>...</span>[]some text"
 *
 * when one moves the cursor indicated by "[]" to the left, the entire
 * non-contenteditable block is skipped. The same for moving the cursor
 * right across the block.
 *
 * TODO: actually, the block shouldn't be skipped, it should be
 *       selected/highlighted first.
 * TODO: this file currently doesn't contain all the code to implement
 *       block jumping. Some of it is currently implemented in markup.js.
 */
define([
	'aloha/core',
	'jquery',
	'aloha/console'
], function (
	Aloha,
	$,
	console
) {
	'use strict';

	var zeroWidthNode = null;

	/**
	 * Replaces the text in given text with the given text.
	 *
	 * @param node
	 *        A text node attached to the DOM.
	 * @param text
	 *        A string that is to replace the text of the given text node.
	 */
	function replaceMergeTextNode(node, text) {
		node.deleteData(0, node.length);
		if ('' !== text) {
			if (node.nextSibling && 3 === node.nextSibling.nodeType) {
				node.nextSibling.insertData(0, text);
			} else if (node.previousSibling && 3 === node.previousSibling.nodeType) {
				node.previousSibling.insertData(node.previousSibling.length, text);
			} else {
				node.insertData(0, text);
			}
		}
		// We don't remove the node immediately to avoid intefering with a
		// caller's range object that may have a start or end containers
		// equal to this node. Removing it in a timeout may still interfere
		// with the selection, but that was not a problem during testing.
		setTimeout(function () {
			if (0 === node.length) {
				$(node).remove();
			}
		}, 0);
	}

	/**
	 * Removes a previously inserted zero width text node.
	 * See insertZeroWidthTextNodeFix().
	 */
	function removeZeroWidthTextNodeFix() {
		if (!zeroWidthNode) {
			return;
		}
		// We want to only replace a single zero-width character to avoid
		// interfering with the other zero-width whitespace hack that makes
		// empty lines visible in IE7.
		var text = zeroWidthNode.nodeValue.replace(/\u200b/, '');
		if (text === zeroWidthNode.nodeValue) {
			console.warn('Expected to remove the zero width text node fix, but couldn\'t find it');
		}
		replaceMergeTextNode(zeroWidthNode, text);
		zeroWidthNode = null;
	}

	/**
	 * Inserts a zero width text node before or after a block.
	 *
	 * There is a problem where some browsers can't select the boundary
	 * between some contenteditable content and non-contenteditable
	 * content. For example, if in the example at the top of the file
	 * the selection were one step to the right "...</span>s[]ome..."
	 * and the left cursor key were pressed, then the selection would
	 * just disappear or be stuck between the span and the text node.
	 *
	 * To work around this problem a zero width text node is inserted
	 * before or after a block.
	 *
	 * The inserted zero width text node will be removed automatically
	 * when it isn't necessary any more (on selection change or on
	 * editable.getContents()).
	 *
	 * TODO: In retrospect, a better alternative may be to simply wrap
	 *       every inlin-block with an editable span.
	 * @param block
	 *        The DOM element for a block before or after which the zero
	 *        width text node will be inserted.
	 * @param isGoingLeft
	 *        True if the zero width text node is to be inserted after
	 *        the block element, or false if the zero width text node is
	 *        to be inserted before the block element.
	 * @return
	 *        The text node that was inserted.
	 */
	function insertZeroWidthTextNodeFix(block, isGoingLeft) {
		removeZeroWidthTextNodeFix();
		zeroWidthNode = document.createTextNode("\u200b");
		if (isGoingLeft) {
			$(block).after(zeroWidthNode);
		} else {
			$(block).before(zeroWidthNode);
		}
		Aloha.bind('aloha-selection-changed', function (event) {
			removeZeroWidthTextNodeFix();
			Aloha.unbind(event);
		});
		return zeroWidthNode;
	}

	return {
		removeZeroWidthTextNodeFix: removeZeroWidthTextNodeFix,
		insertZeroWidthTextNodeFix: insertZeroWidthTextNodeFix
	};
});
