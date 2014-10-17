/** image.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * @namespace images
 */

define([
	'boundaries',
	'dom',
	'image/image-selection',
	'paste'
], function (
	Boundaries,
	Dom,
	ImageSelection,
	Paste
) {
	'use strict';

	/**
	 * Sets `attributes` in `image`, overwritten the existing ones.
	 * @param {ImageElement} image
	 * @param {Array.<Object.<string, string>>} attributes
	 */
	function setImageAttributes(image, attributes) {
		Object.keys(attributes).forEach(function (item) {
			Dom.setAttr(image, item, attributes[item]);
		});
	}

	/**
	 * Creates Image element.
	 * @param {Array.<Object.<string, string>>} attributes
	 * @param doc
	 * @return {ImageElement}
	 */
	function createImage (attributes, doc) {
		var image = doc.createElement('img');

		setImageAttributes(image, attributes);

		return image;
	}

	/**
	 * Inserts a new image with `attributes` in `range`.
	 * @param {Range} range
	 * @param {Array.<Object.<string, string>> attributes Attributes
	 *        for the new image
	 */
	function insertFromRange(range, attributes) {
		var doc = range.commonAncestorContainer.ownerDocument;
		var image = createImage(attributes, doc);
		var paragraph = doc.createElement('p');

		paragraph.appendChild(image);

		var docFragment = doc.createDocumentFragment();
		docFragment.appendChild(paragraph);

		Paste.insertIntoDomFromRange(range, docFragment, {}, doc);
	}

	/**
	 * Inserts image with `attributes` in the actual selection.
	 * @param {Array.<Object.<string, string>>} attributes Attributes
	 *        for the new image
	 * @param {Document} doc
	 * @memberOf images
	 */
	function insert(attributes, doc) {
		var boundaries = Boundaries.get(doc);
		if (!boundaries) {
			return;
		}
		insertFromRange(
			Boundaries.range(boundaries[0], boundaries[1]),
			attributes
		);
	}

	/**
	 * Sets `attributes` to all images in `range`.
	 * @param {Range} range
	 * @param {Array.<Object.<string, string>>} attributes
	 */
	function setAttributesFromRange(range, attributes) {
		var boundaries = Boundaries.fromRange(range);

		var images = ImageSelection.imagesFromBoundaries(boundaries);

		images.forEach(function (img) {
			setImageAttributes(img, attributes);
		});
	}

	/**
	 * Set `attributes` to all images in the actual selection.
	 * @param {Array.<Object.<string, string>>} attributes
	 * @param {Document} doc
	 * @memberOf images
	 */
	function setAttributes(attributes, doc) {
		var boundaries = Boundaries.get(doc);
		if (!boundaries) {
			return;
		}
		setAttributesFromRange(
			Boundaries.range(boundaries[0], boundaries[1]),
			attributes
		);
	}

	return {
		insert: insert,
		insertFromRange: insertFromRange,
		setAttributesFromRange: setAttributesFromRange,
		setAttributes: setAttributes
	};
});
