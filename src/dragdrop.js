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
	'ranges',
	'caret'
], function DragDrop(
	Ranges,
	Carets
) {
	'use strict';

	var DATA_TYPES = {
		'html'  : 'text/html',
		'plain' : 'text/plain'
	};

	function data(event, type) {
		return event.dataTransfer.getData(DATA_TYPES[type || 'plain'] || type);
	}

	function rangeFromEvent(event) {
		return Ranges.createFromPoint(event.clientX, event.clientY);
	}

	// https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer
	function drop(event) {
		var native = event.native;
		native.preventDefault();
		var srcRange = Ranges.get();
		var dstRange = DragDrop.range(native);
		var data = DragDrop.data(native, 'html');
		Editing.delete(srcRange);
	}

	function mousemove(event) {
		var range = rangeFromEvent(event.native);
		if (range) {
			var box = Carets.getBox(range);
			console.clear();
			console.warn(aloha.boundarymarkers.hint(range));
		}
	}

	var handlers = {
		//'mousemove' : mousemove
	};

	function handle(event) {
		if (handlers[event.type]) {
			handlers[event.type](event);
		}
	}

	var exports = {
		data   : data,
		range  : rangeFromEvent,
		handle : handle
	};

	exports['handle'] = exports.handle;

	return exports;
});
