/* ms-word-transform-image.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'arrays'
], function (
	Dom,
    Arrays
) {
	'use strict';

	/**
	 * Processes all images in `element`, and renders the source attribute below the image.
	 *
	 * @param {Element} element
	 */
	function transform(element) {
		Arrays.coerce(element.querySelectorAll('img')).forEach(function(img) {
			Dom.removeAttr(img, 'v:shapes');
			img.parentNode.insertBefore(img.ownerDocument.createTextNode(Dom.getAttr(img, 'src')), img.nextSibling);
			Dom.removeAttr(img, 'src');
		});
	}

	return {
		transform: transform
	};
});