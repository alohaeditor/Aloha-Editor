define(['jquery'], function ($) {
	'use strict';

	/**
	 * Splits a string into individual words.
	 *
	 * Words are non-empty sequences of non-space characaters.
	 */
	function words(str) {
		// Trim because "  x  ".split(/\s/) -> ["", "x", ""] (Chrome)
		var list = $.trim(str).split(/[\r\n\t\s]+/);

		// "".split(/\s/) -> [""] (Chrome)
		// To catche the above case, we compare list[0] against the
		// empty string, even when list.length == 0, but we don't care
		// since there are no index out of bounds exceptions in js and
		// we save a condition.
		return list[0] === "" ? [] : list;
	}

	/**
	 * Converst a dashes form into camel cased form.
	 *
	 * For example 'data-my-attr' becomes 'dataMyAttr'.
	 *
	 * @param {string} s
	 *        Should be all lowercase and should not begin with a dash
	 */
	function dashesToCamelCase(s) {
		return s.replace(/[-]([a-z])/gi, function (all, upper) {
			return upper.toUpperCase();
		});
	}

	/**
	 * Converts a camel cased form into dashes form.
	 *
	 * For example
	 * 'dataMyAttr' becomes 'data-my-attr',
	 * 'dataAB'     becomes 'data-a-b'.
	 *
	 * @param {string} s
	 *        Should begin with a lowercase letter and should not contain dashes.
	 */
	function camelCaseToDashes(s) {
		return s.replace(/[A-Z]/g, function (match) {
			return '-' + match.toLowerCase();
		});
	}

	return {
		'words': words,
		'dashesToCamelCase': dashesToCamelCase,
		'camelCaseToDashes': camelCaseToDashes
	};
});
