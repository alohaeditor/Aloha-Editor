/**
 * transform/plain.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([], function() {
	'use strict';

	/**
	 * Transforms plain text into visually comparable HTML.
	 *
	 * @param  {string}   text
	 * @param  {Document} doc
	 * @return {string}
	 */
	function transform(text, doc) {
		var markup = text.split(/\n/).reduce(function (paragraphs, snippet) {
			return paragraphs.concat('<p>', snippet.trim() || '<br>', '</p>');
		}, []);
		return markup.join('');
	}

	return {
		transform: transform
	};
});
