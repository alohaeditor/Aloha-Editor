/**
 * mouse.js is part of Aloha Editor project http://www.alohaeditor.org
 *
 * Aloha Editor ● JavaScript Content Editing Library
 * Copyright (c) 2010-2015 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://www.alohaeditor.org/contributing.html
 * @namespace mouse
 */
define(['boundaries'], function (Boundaries) {
	'use strict';

	/**
	 * Native mouse events.
	 *
	 * @type {Object.<string, boolean>}
	 * @memberOf mouse
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
	 * Updates selection
	 *
	 * @param  {AlohaEvent} event
	 * @return {AlohaEVent}
	 * @memberOf mouse
	 */
	function middleware(event) {
		if ('mousedown' === event.type) {
			event.selection.formatting = [];
			event.selection.overrides = [];
		}
		return event;
	}

	return {
		middleware : middleware,
		EVENTS     : EVENTS
	};
});
