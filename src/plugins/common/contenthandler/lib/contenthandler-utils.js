/*!
* Aloha Editor
* Author & Copyright (c) 2012-2013 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*
* @overview
* Utility functions for content handling.
*/
define([
	'jquery',
	'util/html'
], function (
	$,
	Html
) {
	'use strict';

	/**
	 * Checks whether the markup describes a paragraph that is propped by
	 * a <br> tag but is otherwise empty.
	 *
	 * Will return true for:
	 *
	 * <p id="foo"><br class="bar" /></p>
	 *
	 * as well as:
	 *
	 * <p><br></p>
	 *
	 * @param {string} html Markup
	 * @return {boolean} True if html describes a propped paragraph.
	 */
	function isProppedParagraph(html) {
		var trimmed = $.trim(html);
		if (!trimmed) {
			return false;
		}
		var $node = $('<div>' + trimmed + '</div>');
		var node = $node[0];
		var $brs = $node.find('br');
		var containsSingleP = node.firstChild === node.lastChild
		                   && 'P' === node.firstChild.nodeName;

		if (containsSingleP && $brs.length === 1) {
			var kids = node.firstChild.childNodes;
			var i;
			var len;

			for (i = 0, len = kids.length; i < len; i++) {
				if (Html.isRenderedNode(kids[i]) && kids[i].nodeName !== 'BR') {
					return false;
				}
			}

			return true;
		}
		return false;
	}

	function wrapContent(content) {
		if (typeof content === 'string') {
			return $('<div>' + content + '</div>');
		}
		if (content instanceof $) {
			return $('<div>').append(content);
		}
		return null;
	}

	return {
		wrapContent: wrapContent,
		isProppedParagraph: isProppedParagraph
	};
});
