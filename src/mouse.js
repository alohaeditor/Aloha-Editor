/* mouse.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'misc',
	'maps'
], function Mouse(
	Dom,
	Misc,
	Maps
) {
	'use strict';

	var CODES = {
		'left'   : 1,
		'middle' : 2,
		'right'  : 3
	};

	function mousedown(event, dragging) {
		dragging.startX = event.native.pageX;
		dragging.startY = event.native.pageY;
		dragging.state = 'down';
		Maps.forEach(event.editor.editables, function (editable) {
			editable.overrides = [];
		});
		return dragging;
	}

	function mousemove(event, dragging) {
		dragging.state = ('down' === dragging.state || 'dragging' === dragging.state)
					   ? 'dragging'
					   : 'move';
		if ('dragging' === dragging.state && 'dragging' !== event.old.dragging.state) {
			console.warn('prevent');
			Dom.disableSelection(event.target.ownerDocument.body);
		}
		return dragging;
	}

	function mouseup(event, dragging) {
		dragging.state = 'up';
		if ('dragging' === event.old.dragging.state) {
			console.warn('allow');
			Dom.enableSelection(event.target.ownerDocument.body);
		}
		return dragging;
	}

	function handle(event) {
		var dragging = (event.old && Misc.copy(event.old.dragging)) || {};
		dragging.x = event.native.pageX;
		dragging.y = event.native.pageY;
		event.target = event.native.target;
		switch (event.native.type) {
		case 'mousedown':
			event.dragging = mousedown(event, dragging);
			break;
		case 'mouseup':
			event.dragging = mouseup(event, dragging);
			break;
		case 'mousemove':
			event.dragging = mousemove(event, dragging);
			break;
		default:
			event.dragging = {};
		}
	}

	var exports = {
		CODES  : CODES,
		handle : handle
	};

	exports['CODES'] = exports.CODES;
	exports['handle'] = exports.handle;

	return exports;
});
