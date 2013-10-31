/* dragdrop.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * @reference
 * http://www.whatwg.org/specs/web-apps/current-work/#dnd
 * https://developer.mozilla.org/en-US/docs/Drag_and_drop_events
 */
define([], function DragDrop() {
	'use strict';

	function handle(event) {
		var native = event.native;
		if (!native) {
			return event;
		}
		return event;
	}

	var exports = {
		handle : handle
	};

	exports['handle'] = exports.handle;

	return exports;
});
