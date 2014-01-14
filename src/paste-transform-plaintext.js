/**
 * paste-transform-plaintext.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'html'
], function(
	Html
) {
	'use strict';

	/**
	 * Transforms plain text content into well formed element.
	 * @param {string} content
	 * @param {Document} doc
	 * @return {string}
	 */
	function transform(content, doc) {


		var breakLineRegExp = /\n/g;
		var result = doc.createElement('div');
		var paragraph;
		var lastIndex, startIndex = 0;

		// We need to add a line break to the end so we can parse the last line.
		content += '\n';

		while (breakLineRegExp.exec(content) != null) {
			paragraph = doc.createElement('p');
			lastIndex = breakLineRegExp.lastIndex - 1;
			var matchString = content.substr(startIndex, lastIndex - startIndex);

			if (matchString.trim().length === 0) {
				Html.prop(paragraph);
			} else {
				paragraph.innerHTML = matchString;
			}
			startIndex = lastIndex + 1;
			result.appendChild(paragraph);
		}

		return result.innerHTML;
	}

	return {
		transform: transform
	};
});