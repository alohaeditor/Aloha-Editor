/**
 * mouse.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([], function () {
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

	function handle(alohaEvent) {
		var event = alohaEvent.nativeEvent;
		if (event && 'mousedown' === event.type) {
			alohaEvent.editor.selectionContext.formatting = [];
			alohaEvent.editor.selectionContext.overrides = [];
			alohaEvent.target = event.target;
		}
		return alohaEvent;
	}

	return {
		handle : handle,
		EVENTS : EVENTS
	};
});
