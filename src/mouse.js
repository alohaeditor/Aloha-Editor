/* mouse.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define(['maps'], function Mouse(Maps) {
	'use strict';

	function handle(alohaEvent) {
		var event = alohaEvent.nativeEvent;
		if (event && 'mousedown' === event.type) {
			Maps.forEach(alohaEvent.editor.editables, function (editable) {
				editable.overrides = [];
			});
			alohaEvent.target = event.target;
		}
		return alohaEvent;
	}

	return {
		handle : handle
	};
});
