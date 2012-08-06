define(['jquery'],function($){
	'use strict';

	/**
	 * Splits a string into individual words.
	 *
	 * Words are any sequences of non-space characaters.
	 */
	function words(str) {
		// "  x  ".split(/\s/) -> ["", "x", ""] (Chrome)
		var list = $.trim(str).split(/[\r\n\t\s]+/);
		// "".split(/\s/) -> [""] (Chrome)
		return (list.length && list[0] === "") ? [] : list;
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
