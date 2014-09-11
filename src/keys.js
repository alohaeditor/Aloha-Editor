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
define([
	'maps',
	'strings',
	'boundaries'
], function (
	Maps,
	Strings,
	Boundaries
) {
	'use strict';

	var CODE_KEY = {
		18 : 'alt',
		8  : 'backspace',
		20 : 'capslock',
		17 : 'ctrl',
		91 : 'cmd',
		46 : 'delete',
		13 : 'enter',
		27 : 'escape',
		12 : 'f1',
		23 : 'f12',
		16 : 'shift',
		32 : 'space',
		9  : 'tab',
		90 : 'undo',
		66 : 'bold',
		73 : 'italic',
		85 : 'underline',
		37 : 'left',
		38 : 'up',
		39 : 'right',
		40 : 'down',
		65 : 'selectAll',
		33 : 'pageUp',
		34 : 'pageDown'
	};

	/**
	 * A map of key names to their keycode.
	 *
	 * @type {object<string, number>}
	 */
	var CODES = {};
	Maps.forEach(CODE_KEY, function (current, index) {
		CODES[current] = index;
	});

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
	 * Provides meta, keycode
	 */
	function handleKeys(event) {
		var keys = parseKeys(event.nativeEvent);
		event.meta = keys.meta;
		event.keycode = keys.keycode;
		return event;
	}

	/**
	 * Parse keys for a browser event. Will return
	 * an object as follows
	 *
	 * {
	 *     meta    : 'cmd+shift', // active meta keys
	 *     keycode : 32, // currently active keycode
	 *     key     : 'space', // associated key
	 *     char    : '' // corresponding lowercase character for that key
	 * }
	 *
	 * @param  {!BrowserEvent} event
	 * @return {Object.<string, *>}
	 */
	function parseKeys(event) {
		return {
			meta    : metaKeys(event),
			keycode : event.which,
			key     : CODE_KEY[event.which],
			char    : String.fromCharCode(event.which).toLowerCase()
		};
	}

	/**
	 * Will go through the shortcutHandlers object to
	 * find a shortcutHandler that matches the pressed
	 * meta keys along with the provided keycode.
	 * The shortcutHandler array must be structured
	 * as follows:
	 *
	 * // add a shortcut handler for meta+esc on keydown
	 * shortcutHandlers = {
	 *     'meta+escape'  : function () {},
	 *     'meta+shift+b' : function () {}
	 * }
	 *
	 * The order of meta keys in the shortcutHandlers array
	 * MUST be in alphabetical order, as provided by
	 * @see Keys.parsekeys
	 *
	 * @param  {!string}  meta
	 * @param  {!integer} keycode
	 * @param  {!Object}  shortcutHandlers
	 * @return {*} null if no handler could be found
	 */
	function shortcutHandler(meta, keycode, shortcutHandlers) {
		// special keys stop at code 31 according to http://www.asciitable.com/
		var key = keycode < 32
		        ? CODE_KEY[keycode] || keycode
		        : String.fromCharCode(keycode).toLowerCase();
		var lookupKey = meta ? meta + '+' + key : key;
		return shortcutHandlers[lookupKey] ? shortcutHandlers[lookupKey] : null;
	}

	return {
		CODES           : CODES,
		EVENTS          : EVENTS,
		ARROWS          : ARROWS,
		handleKeys      : handleKeys,
		shortcutHandler : shortcutHandler,
		parseKeys       : parseKeys
	};
});
