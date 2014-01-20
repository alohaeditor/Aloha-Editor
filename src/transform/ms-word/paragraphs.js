/* transform/ms-word/paragraphs.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'transform/ms-word/utils',
	'predicates',
	'dom/mutation'
], function (
	Utils,
    Predicates,
    Mutation
) {
	'use strict';

	/**
	 * Wraps sequential spans into a paragraph element.
	 *
	 * @param {Element} element
	 */
	function wrapSequentialSpans(element) {
		var spansSameParagraph = [];
		do {
			spansSameParagraph.push(element);
			element = element.nextSibling;
		} while (element && element.nodeName === 'SPAN');

		Utils.wrapChildNodes(spansSameParagraph, 'p');
	}

	/**
	 * Transforms to paragraph elements.
	 *
	 * @param {Element} element
	 */
	function transform(element) {
		var child,
		    prev = null;

		child = element.firstChild;
		while (child) {
			if (child.nodeName === 'DIV') {
				Mutation.removeShallow(child);

				child = prev ||  element.firstChild;
			} else if (Predicates.isInlineNode(child) && Utils.hasText(child)) {
				wrapSequentialSpans(child);

				child = prev ||  element.firstChild;
			} else if (child.nodeName === 'BR' || child.nodeName === 'HR') {
				Utils.removeAllAttributes(child);
				Mutation.wrapWith(child, 'p');

				child = prev ||  element.firstChild;
			} else {
				if (child.nodeName === 'P') {
					Utils.cleanElement(child);
				}
				prev = child;
				child = child.nextSibling;
			}
		}
	}

	return {
		transform: transform
	};
});
