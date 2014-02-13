/* image.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */

define([
	'boundaries',
	'dom',
	'image/image-selection',
	'paste',
	'ranges'
], function(
	Boundaries,
	Dom,
	ImageSelection,
	Paste,
	Ranges
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
	 */
	function insert(attributes, doc) {
		doc = doc || document;
		var range = Ranges.get(doc);
		if (range) {
			insertFromRange(range, attributes);
		}
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
	 */
	function setAttributes(attributes, doc) {
		doc = doc || document;
		var range = Ranges.get(doc);
		if (range) {
			setAttributesFromRange(range, attributes);
		}
	}

	return {
		insert: insert,
		insertFromRange: insertFromRange,
		setAttributesFromRange: setAttributesFromRange,
		setAttributes: setAttributes
	};
});