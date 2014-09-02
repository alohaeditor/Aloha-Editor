/**
 * mouse.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define(['boundaries'], function (Boundaries) {
	'use strict';

	/**
	 * Native mouse events.
	 *
	 * @private
	 * @type {Object.<string, boolean>}
	 */
	var EVENTS = {
		'mouseup'   : true,
		'mousedown' : true,
		'mousemove' : true,
		'dblclick'  : true,
		'dragstart' : true,
		'dragover'  : true,
		'dragend'   : true
	};

	/**
	 * Requires:
	 * 		type
	 * 		editor
	 * Provides:
	 *		target
	 *		boundaries
	 * Updates:
	 * 		editor.selection
	 *
	 * @param  {AlohaEvent} event
	 * @return {AlohaEVent}
	 */
	function handle(event) {
		var nativeEvent = event.nativeEvent;
		if (!nativeEvent) {
			return event;
		}
		event.target = nativeEvent.target;
		if ('mousedown' === event.type) {
			event.editor.selection.formatting = [];
			event.editor.selection.overrides = [];
		}
		if (event.boundaries || !event.target.ownerDocument) {
			return event;
		}
		if ('mousedown' === event.type || 'click' === event.type) {
			event.boundaries = Boundaries.fromPosition(
				nativeEvent.clientX,
				nativeEvent.clientY,
				event.target.ownerDocument
			);
		} else if ('mousemove' !== event.type) {
			event.boundaries = Boundaries.get(event.target.ownerDocument);
		}
		return event;
	}

	return {
		handle : handle,
		EVENTS : EVENTS
	};
});
