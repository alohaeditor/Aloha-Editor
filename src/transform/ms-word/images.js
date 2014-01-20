/* transform/ms-word/images.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom/attrs',
	'arrays'
], function (
	Attrs,
    Arrays
) {
	'use strict';

	/**
	 * Removes the src attribute from the given image element and renders it
	 * below the image.
	 *
	 * @private
	 * @param {Element} img
	 */
	function processImage(img) {
		var src = img.ownerDocument.createTextNode(Attrs.get(img, 'src'));
		img.parentNode.insertBefore(src, img.nextSibling);
		Attrs.remove(img, 'src');
		Attrs.remove(img, 'v:shapes');
	}

	/**
	 * Processes all images in `element`, and renders the source attribute
	 * below the image.
	 *
	 * @param {Element} element
	 */
	function transform(element) {
		Arrays.coerce(element.querySelectorAll('img')).forEach(processImage);
	}

	return {
		transform: transform
	};
});
