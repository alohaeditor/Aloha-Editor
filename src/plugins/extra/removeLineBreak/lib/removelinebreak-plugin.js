/*global window: true define: true */
/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define([
	'aloha/plugin',
	'util/html'
], function (
	Plugin,
	Html
) {
	'use strict';

	return Plugin.create('removelinebreak', {

		/**
		 * Make the given jQuery object (representing an editable) clean for saving
		 * Find all quotes and remove editing objects
		 * @param obj jQuery object to make clean
		 * @return void
		 */
		makeClean: function (obj) {
			Html.removeUselessLineBreaks(obj[0]);
			obj.children().each(function (child) {
				Html.removeUselessLineBreaks(child);
			});
		}

	});

});
