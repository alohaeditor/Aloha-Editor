/**
 * misc.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * Contains miscellaneous utility functions that don't fit anywhere else.
 */
define([], function () {
	'use strict';

	/**
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
	 * Checks whether the given value is defined.
	 * @param {*} value
	 *        An object of any type
	 * @return {boolean}
	 *         True of the value of the given object is not undefined.
	 */
	function defined(value) {
		return 'undefined' !== typeof value;
	}

	function copy(obj) {
		if (!obj) {
			return obj;
		}
		var prop;
		var copied = {};
		for (prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				copied[prop] = obj[prop];
			}
		}
		return copied;
	}

	return {
		anyRx   : anyRx,
		defined : defined,
		copy    : copy
	};
});
