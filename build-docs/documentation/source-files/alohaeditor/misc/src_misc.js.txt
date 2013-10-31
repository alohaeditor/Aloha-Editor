/* misc.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * Contains miscellaneous utility functions that don't fit anywhere else.
 */

/**
 * @doc module
 * @name misc
 * @description
 *
 * ## Misc Utilities
 *
 * This module houses misc utilities.
 *
 */

define([], function Misc() {
	'use strict';

	/**
	 * @doc function
	 * @name aloha.misc:anyRx
	 * @description
	 *
	 * Returns true if any regex in the given rxs array tests true
	 * against str.
	 */
	function anyRx(rxs, str) {
		var i,
		    len;
		for (i = 0, len = rxs.length; i < len; i++) {
			if (rxs[i].test(str)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * @doc function
	 * @name aloha.misc:defined
	 * @description
	 *
	 * Returns true if obj is defined.
	 */
	function defined(obj) {
		return 'undefined' !== typeof obj;
	}

	var exports = {
		anyRx: anyRx,
		defined: defined
	};

	exports['anyRx'] = exports.anyRx;
	exports['defined'] = exports.defined;

	return exports;
});
