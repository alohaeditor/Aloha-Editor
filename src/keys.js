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
define([
	'ranges',
	'strings',
	'editables',
	'boundaries'
], function Keys(
	Ranges,
	Strings,
	Editables,
	Boundaries
) {
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

	/**
	 * Whether or not the given event represents a text input.
	 *
	 * @reference
	 * https://lists.webkit.org/pipermail/webkit-dev/2007-December/002992.html
	 *
	 * @param {Event} event Native event object
	 * @return {Boolean}
	 */
	function isTextInput(event) {
		return 'keypress' === event.type && !event.altKey && !event.ctrlKey
		    && !Strings.isControlCharacter(String.fromCharCode(event.which));
	}

	function metaKeys(event) {
		var meta = [];
		if (event.ctrlKey && (CODES.ctrl  !== event.which)) {
			meta.push('ctrl');
		}
		if (event.altKey && (CODES.alt   !== event.which)) {
			meta.push('alt');
		}
		if (event.shiftKey && (CODES.shift !== event.which)) {
			meta.push('shift');
		}
		return meta.join('+');
	}

	function handle(event) {
		var native = event.native;
		if (!native) {
			return event;
		}
		var range = (native instanceof KeyboardEvent) ? Ranges.get() : null;
		if (range) {
			event.range = range;
			var editable = Editables.fromBoundary(
				event.editor,
				Boundaries.start(range)
			);
			if (editable) {
				event.editable = editable;
			}
		}
		event['type'] = native.type;
		event['which'] = native.which;
		event['meta'] = metaKeys(native);
		event['isTextInput'] = isTextInput(native);
		event['chr'] = String.fromCharCode(native.which);
		return event;
	}

	var exports = {
		handle : handle,
		ARROWS : ARROWS,
		CODES  : CODES
	};

	exports['handle'] = exports.handle;
	exports['ARROWS'] = exports.ARROWS;
	exports['CODES']  = exports.CODES;

	return exports;
});
