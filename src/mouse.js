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

	function handle(event) {
		var dragging = (event.old && Misc.copy(event.old.dragging)) || {};
		var native = event.native;
		dragging.x = native.pageX;
		dragging.y = native.pageY;
		event.target = native.target;
		switch (native.type) {
		case 'mousedown':
			dragging.startX = native.pageX;
			dragging.startY = native.pageY;
			dragging.state = 'down';
			Maps.forEach(event.editor.editables, function (editable) {
				editable.overrides = [];
			});
			break;
		case 'mouseup':
			dragging.state = 'up';
			break;
		case 'mousemove':
			dragging.state = ('down' === dragging.state || 'dragging' === dragging.state)
			               ? 'dragging'
			               : 'move';
			break;
		default:
			dragging = {};
		}
		event.dragging = dragging;
	}

	var exports = {
		CODES  : CODES,
		handle : handle
	};

	exports['CODES'] = exports.CODES;
	exports['handle'] = exports.handle;

	return exports;
});
