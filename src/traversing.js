/**
 * traversing.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define(['html'], /** @exports Traversing */ function (Html) {
	'use strict';

	return {
		next : Html.next,
		prev : Html.prev
	};
});
