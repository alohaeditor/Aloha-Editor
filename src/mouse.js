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
	 *		range
	 * Updates:
	 * 		editor.selectionContext
	 *
	 * @param  {AlohaEvent} event
	 * @return {AlohaEVent}
	 */
	function handle(event) {
		var nativeEvent = event.nativeEvent;
		if (!nativeEvent) {
			return event;
		}
		event.target = nativeEvent.target || nativeEvent.srcElement;
		if ('mousedown' === event.type) {
			event.editor.selectionContext.formatting = [];
			event.editor.selectionContext.overrides = [];
		}
		if (event.range || !event.target.ownerDocument) {
			return event;
		}
		var boundaries;
		if ('mousedown' === event.type || 'click' === event.type) {
			boundaries = Boundaries.fromPosition(
				nativeEvent.clientX,
				nativeEvent.clientY,
				event.target.ownerDocument
			);
		} else if ('mousemove' !== event.type) {
			boundaries = Boundaries.get(event.target.ownerDocument);
		}
		if (boundaries) {
			event.range = Boundaries.range(boundaries[0], boundaries[1]);
		}
		return event;
	}

	return {
		handle : handle,
		EVENTS : EVENTS
	};
});
