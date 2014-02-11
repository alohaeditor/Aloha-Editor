/* image.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */

define([
	'boundaries'
], function(
	Boundaries
) {
	'use strict';

	/**
	 * Checks if `node` is an ImageElement.
	 * @param {Node} node
	 * @returns {boolean}
	 */
	function isImage(node) {
		return node.nodeName === 'IMG';
	}

	/**
	 * Retrieves elements from `boundaries`.
	 * @param {[Boundary, Boundary]} boundaries
	 * @return {Array.<Element>}
	 */
	function imagesFromBoundaries(boundaries) {
		var elements = [];

		var node = Boundaries.nextNode(boundaries[0]);
		var lastElement = Boundaries.prevNode(boundaries[1]);
		var boundary = boundaries[0];

		while (node && (node !== lastElement)) {
			if (isImage(node)) {
				elements.push(node);
			}

			boundary = Boundaries.next(boundary);
			node = Boundaries.container(boundary);
		}

		if (isImage(lastElement)) {
			elements.push(lastElement);
		}

		return elements;
	}


	return {
		imagesFromBoundaries: imagesFromBoundaries
	};
});