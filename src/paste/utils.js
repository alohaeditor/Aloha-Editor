/**
 * paste/utils.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'predicates',
	'arrays',
	'html'
], function(
	Dom,
    Predicates,
    Arrays,
    Html
) {
	'use strict';

	/**
	 * Checks the content type of `event`.
	 *
	 * @param  {Event}  event
	 * @param  {string} type
	 * @return {boolean}
	 */
	function checkTypePasteEvent(event, type) {
		return event.clipboardData.types.indexOf(type) !== -1;
	}

	/**
	 * Checks if paste content is HTML.
	 *
	 * @param  {Event} event
	 * @return {boolean}
	 */
	function isHtmlPasteEvent(event) {
		return checkTypePasteEvent(event, 'text/html');
	}

	/**
	 * Checks if paste content is plain text.
	 *
	 * @param  {Event} event
	 * @return {boolean}
	 */
	function isPlainTextPasteEvent(event) {
		return checkTypePasteEvent(event, 'text/plain');
	}

	/**
	 * Extracts body content if the content is an HTML page. Otherwise it
	 * returns the content itself.
	 *
	 * FixMe
	 * What if `content` contains a comment like this:
	 * <html><!-- <body>gotcha!</body> --><title>woops</title><body>hello, world!</body></html>
	 *
	 * @param  {string} content
	 * @return {string}
	 */
	function extractContent(markup) {
		markup = markup.replace(/\n/g, ' ');
		markup = markup.replace(/<iframe.*?<\/iframe>/g, '');

		var matchStart = /<body.*?>/i.exec(markup);
		var matchEnd = /<\/body.*?>/i.exec(markup);

		if (matchStart && matchEnd) {
			var index = markup.indexOf(matchStart[0]) + matchStart[0].length;
			var lastIndex = markup.indexOf(matchEnd[0]);
			return markup.slice(index, lastIndex);
		}

		return markup;
	}

	/**
	 * Gets the first block child
	 *
	 * @param  {Element} element
	 * @return {?Node}
	 */
	function getFirstChildBlockElement(element) {
		return Dom.findForward(element, Html.hasBlockStyle, Dom.isEditingHost);

		/*
		var nextSibling = element.firstChild;
		var block;
		while (nextSibling) {
			if (Html.hasBlockStyle(nextSibling)) {
				return nextSibling;
			}
			if ((block = getFirstChildBlockElement(nextSibling)) != null) {
				return block;
			}
			nextSibling = nextSibling.nextSibling;
		}
		return null;
		*/
	}

	/**
	 * Cleans list element.
	 *
	 * @param {Element} list
	 */
	function cleanListElement(list) {
		Dom.children(list).forEach(function (item) {
			if (item.nodeName !== 'LI' && !Html.isListContainer(item)) {
				Dom.wrapWith(item, 'li');
			}
		});
	}

	/**
	 * Cleans image element.
	 * @param {!Element} imgElement
	 */
	function cleanImageElement(imgElement) {
		var src = imgElement.src;
		var height = imgElement.height;
		var width = imgElement.width;

		Dom.removeAttrs(imgElement);

		imgElement.src = src;
		imgElement.height = height;
		imgElement.width = width;
	}

	/**
	 * Walks the decendents of the given element, calling the callback function
	 * when `pred` return true.
	 *
	 * @param {Element} element
	 * @param {function(Element):boolean} pred
	 * @param {function(Element)} callback
	 */
	function walkDescendants(element, pred, callback) {
		var childNodes = Dom.children(element);
		var child;

		for (var i = 0, len = childNodes.length; i < len; i++) {
			child = childNodes[i];
			if (child) {
				if (pred(child)){
					callback(child);
					// check if the child has changed
					// the size of the children nodes can change
					if (child !== childNodes[i]) {
						i--;
						len = element.childNodes.length;
					}
				}
				if (Dom.isElementNode(child)) {
					walkDescendants(child, pred,  callback);
				}
			}
		}
	}

	return {
		getFirstChildBlockElement : getFirstChildBlockElement,
		extractContent            : extractContent,
		cleanImageElement         : cleanImageElement,
		cleanListElement          : cleanListElement,
		isHtmlPasteEvent          : isHtmlPasteEvent,
		isPlainTextPasteEvent     : isPlainTextPasteEvent,
		walkDescendants           : walkDescendants
	};
});
