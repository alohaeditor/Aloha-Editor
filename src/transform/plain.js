/**
 * transform/plain.js is part of Aloha Editor project http://www.alohaeditor.org
 *
 * Aloha Editor ● JavaScript Content Editing Library
 * Copyright (c) 2010-2015 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://www.alohaeditor.org/docs/contributing.html
 */
define([], function () {
	'use strict';

	/**
	 * Transforms plain text into visually comparable HTML.
	 *
	 * @param  {string} text
	 * @return {string}
	 * @alias plain
	 * @memberOf transform
	 */
	function transform(text) {
		var markup = text.split(/\n/).reduce(function (paragraphs, snippet) {
			return paragraphs.concat('<p>', snippet.trim() || '<br>', '</p>');
		}, []);
		return markup.join('');
	}

	return {
		transform: transform
	};
});
