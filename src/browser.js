/* browser.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 */
define(['jquery'], function BrowserUtilities($) {
	'use strict';
	var testElem = document.createElement('div');
	return {
		ie7: $.browser.msie && parseInt($.browser.version, 10) < 8,
		ie: $.browser.msie,
		hasRemoveProperty: !!testElem.style.removeProperty
	};
});
