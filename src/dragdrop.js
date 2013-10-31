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
define(['misc'], function DragDrop(Misc) {
	'use strict';

	function mousedown(event) {
		var dragging = event.dragging;
		dragging.startX = event.native.pageX;
		dragging.startY = event.native.pageY;
		dragging.state = 'down';
	}

	function mouseup(event) {
		event.dragging.state = 'up';
	}

	function mousemove(event) {
		var dragging = event.dragging;
		dragging.state = ('down' === dragging.state || 'dragging' === dragging.state)
		               ? 'dragging'
		               : 'move';
	}

	var handlers = {
		'mouseup'   : mouseup,
		'mousedown' : mousedown,
		'mousemove' : mousemove
	};

	function handle(event) {
		var native = event.native;
		if (native && handlers[event.type]) {
			event.dragging = (event.previousState
			              && Misc.copy(event.previousState.dragging))
			              || {};
			event.dragging.x = native.pageX;
			event.dragging.y = native.pageY;
			handlers[event.type](event);
		} else {
			event.dragging = {};
		}
		return event;
	}

	var exports = {
		handle : handle
	};

	exports['handle'] = exports.handle;

	return exports;
});
