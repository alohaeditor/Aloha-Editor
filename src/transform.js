/**
 * transform.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor ● JavaScript Content Editing Library
 * Copyright (c) 2010-2015 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * @namespace transform
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
		html : Html.transform,
		plain : Plain.transform,
		msword : MSWord.transform
	};
});
