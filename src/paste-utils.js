/**
 * paste-utils.js is part of Aloha Editor project http://aloha-editor.org
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
	 * @const
	 * @type {string}
	 */
	var WHITE_SPACE = ' ';
	/**
	 * @const
	 * @type {string}
	 */
	var EMPTY_SPACE = '';

	/**
	 * Checks the content type of `event`.
	 * @param {!Event} event
	 * @param {string} type
	 * @return {boolean}
	 */
	function checkTypePasteEvent(event, type) {
		return event.clipboardData.types.indexOf(type) !== -1;
	}

	/**
	 * Checks if paste content is HTML.
	 * @param {!Event} event
	 * @return {boolean}
	 */
	function isHtmlPasteEvent(event) {
		return checkTypePasteEvent(event, 'text/html');
	}

	/**
	 * Checks if paste content is plain text.
	 * @param {!Event} event
	 * @return {boolean}
	 */
	function isPlainTextPasteEvent(event) {
		return checkTypePasteEvent(event, 'text/plain');
	}


	/**
	 * Checks if `node` has text.
	 * @param {Element} node
	 * @return {boolean}
	 */
	function hasText(node) {
		return !Dom.getTextContent(node).trim().length;
	}

	/**
	 * Extracts body content if the content is an HTML page. Otherwise
	 * it returns the content itself.
	 * @param {string} content
	 * @return {string}
	 */
	function extractBodyContent(content) {
		var match,
			matchEnd,
			index,
			lastIndex;

		content = content.replace(/\n/g, WHITE_SPACE);
		content = content.replace(/<iframe.*?<\/iframe>/g, EMPTY_SPACE);

		match = /<body.*?>/i.exec(content);
		matchEnd = /<\/body.*?>/i.exec(content);

		if (match && matchEnd) {
			index = content.indexOf(match[0]) + match[0].length;
			lastIndex = content.indexOf(matchEnd[0]);
			content = content.slice(index, lastIndex);
		}

		return content;
	}

	/**
	 * Gets the first block child
	 * @param {!Element} element
	 *
	 * @return {Node|null}
	 */
	function getFirstChildBlockElement(element) {
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
	}

	/**
	 * Cleans list element.
	 * @param {!Element} list
	 */
	function cleanListElement(list) {
		Dom.children(list).forEach(function (item) {
			if (item.nodeName !== 'LI' && !Html.isListNode(item)) {
				Dom.wrapWithNodeName(item, 'li');
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
	 * Executes function 'callBackFn' when the function condition 'conditionFn' is true.
	 *
	 * @param {Element} element
	 * @param {function(Element):boolean} conditionFn
	 * @param {function(Element)} callBackFn
	 */
	function walkDescendants(element, conditionFn, callBackFn) {
		var childNodes = element.childNodes,
			child;

		for (var i = 0, len = childNodes.length; i < len; i++) {
			child = childNodes[i];
			if (child) {
				if (conditionFn(child)){
					callBackFn(child);
					// check if the child has changed
					// the size of the children nodes can change
					if (child !== childNodes[i]) {
						i--;
						len = element.childNodes.length;
					}
				}
				if (Dom.isElementNode(child)) {
					walkDescendants(child, conditionFn,  callBackFn);
				}
			}
		}
	}



	return {
		getFirstChildBlockElement : getFirstChildBlockElement,
		hasText                   : hasText,
		extractBodyContent        : extractBodyContent,
		cleanImageElement         : cleanImageElement,
		cleanListElement          : cleanListElement,
		isHtmlPasteEvent          : isHtmlPasteEvent,
		isPlainTextPasteEvent     : isPlainTextPasteEvent,
		walkDescendants           : walkDescendants
	};
});