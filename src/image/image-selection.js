/* image.js is part of Aloha Editor project http://www.alohaeditor.org
 *
 * Aloha Editor ● JavaScript Content Editing Library
 * Copyright (c) 2010-2015 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://www.alohaeditor.org/docs/contributing.html
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
	 * @param {Array.<Boundary>} boundaries
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
