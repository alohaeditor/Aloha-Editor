/* genericcontenthandler.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2015 Gentics Software GmbH, Vienna, Austria.
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
	'jquery',
	'aloha/core',
	'aloha/contenthandlermanager',
	'contenthandler/contenthandler-utils',
	'util/functions',
	'util/html',
	'util/arrays'

], function (
	$,
	Aloha,
	ContentHandlerManager,
	Utils,
	Functions,
	Html,
	Arrays
) {
	'use strict';

	var NOT_ALOHA_BLOCK_FILTER = ':not(.aloha-block)';



	/**
	 * Remove empty inline text semantic elements
	 *
	 * @param {jQuery.<HTMLElement>} $content Element container to sanitize
	 */
	function removeEmptyTextLevelSemanticElements ($content) {
		// Iterate over all none aloha block children
		$content.children(NOT_ALOHA_BLOCK_FILTER).each(function (i, element) {
			var childNodes = element.childNodes;
			var i;
			var childNodesLength;
			var childNode;

			for (i = 0, childNodesLength = childNodes.length; i < childNodesLength; i++) {
				childNode = childNodes[i];

				// Check if node is an empty inline text semantic element
				if (childNode
						&& childNode.nodeType === window.document.ELEMENT_NODE
						&& $.inArray(childNode.nodeName.toLowerCase(),
								Html.TEXT_LEVEL_SEMANTIC_ELEMENTS) !== -1
						&& childNode.childNodes) {
					element.removeChild(childNode);
				}
			}
		});
	}

	return ContentHandlerManager.createHandler({
		handleContent: function handleBlockLevelContent(content, options) {
			if (!options) {
				return content;
			}
			var $content = Utils.wrapContent(content);
			if (!$content) {
				return content;
			}

			switch (options.command) {
			case 'initEditable':
			case 'getContents':
				// Remove all empty inline text elements
				removeEmptyTextLevelSemanticElements($content);
				break;
			}
			return $content.html();
		}
	});
});
