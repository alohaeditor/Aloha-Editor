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
define([
	'ranges'
], function DragDrop(
	Ranges
) {
	'use strict';

	var DATA_TYPES = {
		'html'  : 'text/html',
		'plain' : 'text/plain'
	};

	function data(event, type) {
		return event.dataTransfer.getData(DATA_TYPES[type || 'plain'] || type);
	}

	function range(event) {
		return Ranges.createFromPoint(event.clientX, event.clientY);
	}

	function handle(event) {
		var native = event.native;
		if (!native) {
			return event;
		}
		return event;
	}

	var exports = {
		data   : data,
		range  : range,
		handle : handle
	};

	exports['handle'] = exports.handle;

	return exports;
});
