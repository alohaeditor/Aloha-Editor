/**
 * paste-transform.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'predicates',
	'arrays',
	'html',
	'paste-utils',
	'traversing'
], function(
	Dom,
	Predicates,
	Arrays,
	Html,
	PasteUtils,
	Traversing
) {
	'use strict';


	/**
	 * Transform `content` to Element
	 * @param {string} content
	 * @param {Document} doc
	 * @return {Element}
	 */
	function transformToDOMElement(content, doc) {
		var element = doc.createElement('div');
		element.innerHTML = content;
		return element;
	}

	/**
	 * Extracts block elements from `elem` and
	 * inserts into `contentElement`.
	 *
	 * @param {!Node} elem
	 * @param {!Element} contentElement
	 */
	function extractBlockElements(elem, contentElement) {
		if (Html.isListNode(elem) || Html.isTableNode(elem)) {
			return;
		}
		var insertRef = elem.nextSibling;
		var block = PasteUtils.getFirstChildBlockElement(elem);
		var nextSibling = block;

		while (nextSibling) {
			block = nextSibling;
			nextSibling = block.nextSibling;
			contentElement.insertBefore(block, insertRef);
		}
	}

	/**
	 * Cleans `element`.
	 * @param {!Node} element
	 */
	function cleanElement(element) {
		var anchorElements = element.querySelectorAll('a');
		var imgElements = element.querySelectorAll('img');
		var href;
		var i, len;

		for (i = 0, len = anchorElements.length; i < len; i++) {
			href = anchorElements[i].href;
			Dom.removeAttrs(anchorElements[i]);
			anchorElements[i].href = href;
		}

		for (i = 0, len = imgElements.length; i < len; i++) {
			PasteUtils.cleanImageElement(imgElements[i]);
		}

		Dom.removeAttrs(element);

		Traversing.walkDescendants(element, Dom.isElementNode, function(node) {
			var nodeName = node.nodeName;
			if (nodeName !== 'A' && nodeName !== 'IMG' && node.attributes != null) {
				Dom.removeAttrs(node);
			}
			if (nodeName === 'SPAN' || nodeName === 'FONT' || (nodeName !== 'IMG' && nodeName !== 'BR' && Predicates.isVoidNode(node))) {
				Dom.removeShallow(node);
			} else if (nodeName === 'P') {
				if (Dom.nodeLength(node) === 1 && node.firstChild.nodeName === 'P') {
					Dom.removeShallow(node);
				}
			}
		});
	}

	/**
	 * If `element` is not a block node, creates a <p> element and
	 * insert all sequential inline nodes. Otherwise returns the `element`.
	 * @param {!Node} element
	 * @return {Element}
	 */
	function createCorrectElement(element) {
		if (Predicates.isBlockNode(element)) {
			return element;
		}

		var wrapper = Dom.wrapWithNodeName(element, 'p');

		var nextSibling = wrapper.nextSibling;
		var aux;

		while (nextSibling && (Predicates.isInlineNode(nextSibling) || Dom.isTextNode(nextSibling))) {
			aux = nextSibling.nextSibling;
			wrapper.appendChild(nextSibling);
			nextSibling = aux;
		}
		return wrapper;
	}

	/**
	 * Checks if `element` is a line break.
	 * @param {!Node} element
	 * @return {boolean}
	 */
	function isLineBreak(element) {
		return element.firstElementChild && element.firstElementChild.nodeName === 'BR';
	}

	/**
	 * Finds all <br> tags and wrap them inside a paragraph.
	 * @param {!Element} contentElement
	 */
	function propLineBreaks(contentElement) {
		var brs = contentElement.querySelectorAll('br');

		Arrays.coerce(brs).forEach(function(elem) {
			Dom.wrapWithNodeName(elem, 'p');
		});
	}

	/**
	 * Replaces all divs by paragraphs.
	 * @param {Element} contentElement
	 */
	function replaceDivsWithParagraph(contentElement) {
		var divs = contentElement.querySelectorAll('div');

		Arrays.coerce(divs).forEach(function(elem) {
			Dom.wrapWithNodeName(elem, 'p');
			Dom.removeShallow(elem);
		});
	}

	/**
	 * Transforms `content` to a valid HTML string.
	 * @param {string} content
	 * @param {!Document} doc
	 * @return {Element}
	 */
	function transform(content, doc) {
		var contentElement;



		content = PasteUtils.extractBodyContent(content);
		contentElement = transformToDOMElement(content, doc);

		propLineBreaks(contentElement);
		replaceDivsWithParagraph(contentElement);

		var nextElement = contentElement.firstChild;
		var lastElement = null;

		while (nextElement) {
			if (Dom.isElementNode(nextElement)) {
				nextElement = createCorrectElement(nextElement);
				cleanElement(nextElement);
				extractBlockElements(nextElement, contentElement);
				if (Html.isUnrendered(nextElement) && !isLineBreak(nextElement)) {
					Dom.remove(nextElement);
					nextElement = lastElement || contentElement.firstChild;
				} else {
					lastElement = nextElement;
					nextElement = nextElement.nextSibling;
				}
			} else if (Dom.isTextNode(nextElement) && !PasteUtils.hasText(nextElement)) {
				nextElement = Dom.wrapWithNodeName(nextElement, 'p');
				lastElement = nextElement;
				nextElement = nextElement.nextSibling;
			} else {
				Dom.remove(nextElement);
				nextElement = lastElement || contentElement.firstChild;
			}
		}

		return contentElement.innerHTML;
	}

	return {
		transform: transform
	};
});