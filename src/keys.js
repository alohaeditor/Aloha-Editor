/**
 * keys.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * @see:
 * https://lists.webkit.org/pipermail/webkit-dev/2007-December/002992.html
 *
 * @todo:
 * consider https://github.com/nostrademons/keycode.js/blob/master/keycode.js
 */
define(['strings', 'ranges'], function (Strings, Ranges) {
	'use strict';

	/**
	 * A map of key names to their keycode.
	 *
	 * @type {object<string, number>}
	 */
	var CODES = {
		'alt'       : 18,
		'backspace' : 8,
		'capslock'  : 20,
		'ctrl'      : 17,
		'delete'    : 46,
		'enter'     : 13,
		'escape'    : 27,
		'f1'        : 112,
		'f12'       : 123,
		'shift'     : 16,
		'space'     : 32,
		'tab'       : 9,
		'undo'      : 90,
		'bold'      : 66,
		'italic'    : 73,
		'underline' : 85,
		'left'      : 37,
		'up'        : 38,
		'right'     : 39,
		'down'      : 40,
		'selectAll' : 65,
		'pageUp'    : 33,
		'pageDown'  : 34
	};

	/**
	 * Arrow keys
	 *
	 * @type {object<number, string>}
	 */
	var ARROWS = {
		37 : 'left',
		38 : 'up',
		39 : 'right',
		40 : 'down'
	};

	/**
	 * Returns a string of all meta keys for the given event.
	 *
	 * @private
	 * @param  {Event} event
	 * @return {string}
	 */
	function metaKeys(event) {
		var meta = [];
		if (event.altKey && (CODES['alt'] !== event.which)) {
			meta.push('alt');
		}
		if (event.ctrlKey && (CODES['ctrl'] !== event.which)) {
			meta.push('ctrl');
		}
		if (event.metaKey) {
			meta.push('meta');
		}
		if (event.shiftKey && (CODES['shift'] !== event.which)) {
			meta.push('shift');
		}
		return meta.join('+');
	}

	var EVENTS = {
		'keyup'    : true,
		'keydown'  : true,
		'keypress' : true
	};

	/**
	 * Requires:
	 *		type
	 * Provides:
	 * 		meta
	 * 		keycode
	 */
	function handle(event) {
		if (event.nativeEvent) {
			event.meta = metaKeys(event.nativeEvent);
			if (EVENTS[event.type]) {
				event.keycode = event.nativeEvent.which;
				if (!event.range) {
					event.range = Ranges.get((
						event.nativeEvent.target || event.nativeEvent.srcElement
					).ownerDocument);
				}
			}
		}
		return event;
	}

	return {
		CODES  : CODES,
		EVENTS : EVENTS,
		ARROWS : ARROWS,
		handle : handle
	};
});
