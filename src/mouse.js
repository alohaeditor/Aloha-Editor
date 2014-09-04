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
	 * Updates event.editor.selection
	 *
	 * @param  {AlohaEvent} event
	 * @return {AlohaEVent}
	 */
	function handleMouse(event) {
		if ('mousedown' === event.type) {
			event.editor.selection.formatting = [];
			event.editor.selection.overrides = [];
		}
		return event;
	}

	return {
		handleMouse : handleMouse,
		EVENTS      : EVENTS
	};
});
