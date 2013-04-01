/* keys.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 *
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
 */
define(['jquery'], function ($) {
	'use strict';

	var KEYCODE_TOKEN_MAP = (function () {
		var map = {};
		$.each({
			8  : 'backspace',
			9  : 'tab',
			13 : 'enter',
			16 : 'shift control alt',
			20 : 'capslock',
			27 : 'escape',
			32 : 'space',
			33 : 'pageup',
			34 : 'pagedown',
			37 : 'left up right down',
			45 : 'insert',
			46 : 'delete',
			48 : '0 1 2 3 4 5 6 7 8 9',
			65 : 'a b c d e f g h i j k l m n o p q r s t u v w x y z',
			112: 'f1 f2 f3 f4 f5 f6 f7 f8 f9 f10 f11 f12 f13 f14 f15'
		}, function (key, tokens) {
			var start = parseInt(key, 10);
			$.each(tokens.split(' '), function (i, token) {
				map[start + i] = token;
			});
		});
		return map;
	}());

	function getTokenByKeyCode(keyCode) {
		return KEYCODE_TOKEN_MAP[keyCode];
	}

	return {
		getToken: getTokenByKeyCode,
		keyCodeTokenMap: $.extend({}, KEYCODE_TOKEN_MAP)
	};
});
