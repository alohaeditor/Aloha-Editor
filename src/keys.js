/* keys.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * @reference:
 * https://lists.webkit.org/pipermail/webkit-dev/2007-December/002992.html
 *
 * @todo:
 * consider https://github.com/nostrademons/keycode.js/blob/master/keycode.js
 */
define([], function Keys() {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('keys');
	}

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
		'left'      : 37,
		'up'        : 38,
		'right'     : 39,
		'down'      : 40
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

	var exports = {
		ARROWS : ARROWS,
		CODES  : CODES
	};

	exports['ARROWS'] = exports.ARROWS;
	exports['CODES']  = exports.CODES;

	return exports;
});
