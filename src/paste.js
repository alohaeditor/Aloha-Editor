/**
 * paste.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'editing',
	'events',
	'boundaries',
	'dom',
	'html',
	'mutation',
	'paste-transform-html',
	'ms-word-transform',
	'paste-transform-plaintext',
	'paste-utils',
	'ranges'
], function(
	Editing,
	Events,
	Boundaries,
	Dom,
	Html,
	Mutation,
	PasteTransform,
    WordTransform,
    PasteTransformPlainText,
    PasteUtils,
    Ranges
) {
	'use strict';

	/**
	 * Check if `event` is a Paste Event.
	 * @param {Event} event
	 * @return {boolean}
	 */
	function isPasteEvent(event) {
		return (event && (event.type === 'paste' || event.clipboardData !== undefined)) ? true : false;
	}

	/**
	 * Gets paste content depending on type content.
	 * @param {!Event} event
	 * @param {string} type
	 * @return {string}
	 */
	function getPasteContent(event, type) {
		return event.clipboardData.getData(type);
	}

	/**
	 * Gets html paste content.
	 * @param {!Event} event
	 * @return {string}
	 */
	function getHtmlPasteContent(event) {
		return getPasteContent(event, 'text/html');
	}

	/**
	 * Gets plain text paste content.
	 * @param {!Event} event
	 * @return {string}
	 */
	function getPlainTextPasteContent(event) {
		return getPasteContent(event, 'text/plain');
	}


	/**
	 * Gets the reference node where paste should be inserted.
	 * @return {Node}
	 */
	function getReferenceNode(range) {
		var startElement = range.startContainer;

		while (!Html.hasBlockStyle(startElement)) {
			startElement = startElement.parentNode;
		}

		return startElement.nextSibling;
	}

	/**
	 * Sets the selection after `node`.
	 * @param {Node} node
	 * @return {Range}
	 */
	function setSelectionAfter(node) {
		var range = Ranges.get();

		range.setStartAfter(node);
		range.setEndAfter(node);

		return range;
	}

	/**
	 * Creates document fragment from a string `content`.
	 * @param {string} content
	 * @param {!Document} doc
	 * @return {DocumentFragment}
	 */
	function createDocumentFragment(content, doc) {

		var contentElement = doc.createElement('div');
		contentElement.innerHTML = content;

		var fragment = doc.createDocumentFragment();

		while (contentElement.firstChild) {
			fragment.appendChild(contentElement.firstChild);
		}

		return fragment;
	}

	/**
	 * Gets first parent which has block style.
	 * @param {Element} element
	 * @return {Element}
	 */
	function getFirstParentBlockElement(element) {
		var parentNode = element;
		while (!Html.hasBlockStyle(parentNode)) {
			parentNode = parentNode.parentNode;
		}
		return parentNode;
	}


	/**
	 * Inserts document fragment into the DOM, updating the range selection.
	 * @param {DocumentFragment} fragment
	 */
	function insertIntoDom(fragment, context) {
		var firstChild = fragment.firstChild;
		var lastChild = fragment.lastChild;
		var needSplitText = fragment.childNodes.length >= 2;

		var range = Ranges.get();
		Editing.delete(range, context);

		if (Html.isListNode(firstChild) || Html.isTableNode(firstChild)) {
			needSplitText = true;
		} else {
			range.insertNode(firstChild);
			range = setSelectionAfter(firstChild);

			if (!Html.isListNode(firstChild) && !Html.isTableNode(firstChild)) {
				Dom.removeShallow(firstChild);
			}
		}

		var reference = getReferenceNode(range);
		if (needSplitText) {
			Editing.split(range);
			reference = getFirstParentBlockElement(Ranges.get().startContainer);
		}

		if (fragment.childNodes.length) {
			reference.parentNode.insertBefore(fragment, reference);
			setSelectionAfter(lastChild);
		}
	}

	/**
	 * Scrolls to the range.
	 */
	function scrollToRange(doc) {
		var position = Dom.offset(getFirstParentBlockElement(Ranges.get().startContainer));
		var win = Dom.windowFromDocument(doc);

		var adjust = (win.innerHeight - (win.innerHeight / 5));
		win.scrollTo(position.left, position.top - adjust);
	}

	/**
	 * Handles and processes paste events.
	 * @param {AlohaEvent} alohaEvent
	 * @return {AlohaEvent}
	 */
	function handle(alohaEvent) {
		var nativeEvent = alohaEvent.nativeEvent;

		if (isPasteEvent(nativeEvent)) {
			var doc = alohaEvent.document;
			var content;

			Events.stopPropagationAndPreventDefault(nativeEvent);

			if (PasteUtils.isHtmlPasteEvent(nativeEvent)) {
				content = getHtmlPasteContent(nativeEvent);

				if (WordTransform.isMSWordContent(content, doc)) {
					content = WordTransform.transform(content, doc);
				} else {
					content = PasteTransform.transform(content, doc);
				}
			} else if (PasteUtils.isPlainTextPasteEvent(nativeEvent)) {
				content = getPlainTextPasteContent(nativeEvent);
				content = PasteTransformPlainText.transform(content, doc);
			}

			insertIntoDom(
				createDocumentFragment(content, doc),
				alohaEvent.editable
			);

			scrollToRange(doc);
		}

		return alohaEvent;
	}

	return {
		handle: handle
	};
});