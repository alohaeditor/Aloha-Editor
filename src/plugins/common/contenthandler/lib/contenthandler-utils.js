/*global define: true */

/*!
* Aloha Editor
* Author & Copyright (c) 2012 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*
* @overview
* Utility functions for content handling.
*/

define(['jquery'], function ($) {
	'use strict';

	function wrapContent(content) {
		if (typeof content === 'string') {
			return $('<div>' + content + '</div>');
		}
		if (content instanceof $) {
			return $('<div>').append(content);
		}
		return null;
	}

	return {
		wrapContent: wrapContent
	};
});
