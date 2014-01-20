/**
 * transform/html.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'predicates',
	'arrays',
	'html',
	'paste/utils'
], function(
	Dom,
	Predicates,
	Arrays,
	Html,
	Utils
) {
	'use strict';

	/**
	 * These element's cannot be simply and still maintain a valid DOM
	 * structure.
	 *
	 * @param {<string, boolean>}
	 */
	var HAS_DEPENDENT_CHILDREN = {
		'TABLE' : true,
		'TBODY' : true,
		'TR'    : true,
		'OL'    : true,
		'UL'    : true,
		'DL'    : true,
		'MENU'  : true
	};

	function hasDependentChildren(node) {
		return HAS_DEPENDENT_CHILDREN[node.nodeName];
	}

	/**
	 * Extracts block elements from `elem` and inserts into them into `contentElement`.
	 *
	 * @param {Node}    elem
	 * @param {Element} contentElement
	 */
	function extractBlockElements(elem, contentElement) {
		if (hasDependentChildren(elem)) {
			return;
		}
		var insertRef = elem.nextSibling;
		var block = Utils.getFirstChildBlockElement(elem);
		var nextSibling = block;
		while (nextSibling) {
			block = nextSibling;
			nextSibling = block.nextSibling;
			contentElement.insertBefore(block, insertRef);
		}
	}

	/**
	 * Cleans `element`.
	 *
	 * @param {Element} element
	 */
	function cleanElement(element) {
		var anchors = Arrays.coerce(element.querySelectorAll('a'));
		var images = Arrays.coerce(element.querySelectorAll('img'));
		var lists = Arrays.coerce(element.querySelectorAll('ol,ul'));

		if (Html.isListContainer(element)) {
			lists.push(element);
		}

		if ('A' === element.nodeName) {
			anchors.push(element);
		}

		anchors.forEach(function (anchor) {
			var href = anchor.href;
			Dom.removeAttrs(anchor);
			anchor.href = href;
		});

		images.forEach(Utils.cleanImageElement);
		lists.forEach(Utils.cleanListElement);

		Dom.removeAttrs(element);

		Utils.walkDescendants(element, Dom.isElementNode, function(node) {
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

		var wrapper = Dom.wrapWith(element, 'p');
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
	 *
	 * This is not good! What about if we had "<span>foo<br>bar</span>"
	 *
	 * @param {!Element} contentElement
	 */
	function propLineBreaks(contentElement) {
		var brs = contentElement.querySelectorAll('br');
		Arrays.coerce(brs).forEach(function(elem) {
			Dom.wrapWith(elem, 'p');
		});
	}

	/**
	 * Replaces all divs by paragraphs.
	 * @param {Element} contentElement
	 */
	function replaceDivsWithParagraph(contentElement) {
		var divs = contentElement.querySelectorAll('div');
		Arrays.coerce(divs).forEach(function(elem) {
			Dom.wrapWith(elem, 'p');
			Dom.removeShallow(elem);
		});
	}

	/**
	 * Transforms `contentElement`.
	 * @param {Element} contentElement
	 */
	function normalize(contentElement) {
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
			} else if (Dom.isTextNode(nextElement) && !Dom.hasText(nextElement)) {
				nextElement = Dom.wrapWith(nextElement, 'p');
				lastElement = nextElement;
				nextElement = nextElement.nextSibling;
			} else {
				Dom.remove(nextElement);
				nextElement = lastElement || contentElement.firstChild;
			}
		}
	}

	/**
	 * Transforms markup to normalized HTML.
	 *
	 * @param  {string}   markup
	 * @param  {Document} doc
	 * @return {string}
	 */
	function transform(markup, doc) {
		var element = Html.parse(Utils.extractContent(markup), doc);
		normalize(element);
		return element.innerHTML;
	}

	return {
		transform        : transform,
		transformFromDOM : normalize
	};
});
