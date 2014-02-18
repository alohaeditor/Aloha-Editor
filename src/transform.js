/**
 * transform.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'transform/html',
	'transform/plain',
	'transform/ms-word'
], function (
	Html,
	Plain,
	MSWord
) {
	'use strict';

	/**
	 * Transformation functions, mapped to their corresponding mime-subtype.
	 */
	return {
		html   : Html.transform,
		plain  : Plain.transform,
		msword : MSWord.transform
	};
});
