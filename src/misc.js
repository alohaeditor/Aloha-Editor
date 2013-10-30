/* misc.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * Contains miscellaneous utility functions that don't fit anywhere else.
 */
define([], function Misc() {
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
	 * @return {Boolean}
	 *         True of the value of the given object is not undefined.
	 */
	function defined(value) {
		return 'undefined' !== typeof value;
	}

	/**
	 * Computes the avarage of two numbers.
	 *
	 * @param {Number} a
	 * @param {Number} b
	 * @return {Number}
	 */
	function mean(a, b) {
		return a + ((b - a) / 2);
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

	var exports = {
		anyRx   : anyRx,
		defined : defined,
		mean    : mean,
		copy    : copy
	};

	exports['anyRx'] = exports.anyRx;
	exports['defined'] = exports.defined;
	exports['mean'] = exports.mean;
	exports['copy'] = exports.copy;

	return exports;
});
