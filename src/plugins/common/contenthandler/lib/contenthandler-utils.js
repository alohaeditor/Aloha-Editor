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
		var div = $('<div>' + trimmed + '</div>')[0];
		var first = div.firstChild;
		var containsSingleP = first === div.lastChild && 'P' === first.nodeName;
		if (!containsSingleP) {
			return false;
		}
		var $visible = $(first.childNodes).filter(function (i, node) {
			return Html.isRenderedNode(node);
		});
		return $visible.length === 1 && $visible[0].nodeName === 'BR';
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
