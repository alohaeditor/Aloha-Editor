/* arrays.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */

/**
 * @doc module
 * @name arrays
 * @description
 *
 * ## Array Utilities
 *
 * This module houses utilities that are
 * used for Array manipulation.
 *
 */
define([], function Arrays() {
	'use strict';

	/**
	 * @doc function
	 * @name aloha.arrays:sortUnique
	 * @description
	 *
	 * Implements unique() using native sort().
	 *
	 * @param {Array} a
	 *        The array to sort and strip of duplicate values.
	 *        Warning: this array will be modified in-place.
	 * @param {Function(*, *):Number} compFn
	 *        A custom comparison function that accepts two values a and
	 *        b from the given array and returns -1, 0, 1 depending on
	 *        whether a < b, a == b, a > b respectively.
	 *
	 *        If no compFn is provided, the algorithm will use the browsers
	 *        default sort behaviour and loose comparison to detect duplicates.
	 * @return {Array}
	 *         The given array, sorted and with duplicates removed.
	 */
	function sortUnique(a, compFn) {
		var i;
		if (compFn) {
			a.sort(compFn);
			for (i = 1; i < a.length; i++) {
				if (0 === compFn(a[i], a[i - 1])) {
					a.splice(i--, 1);
				}
			}
		} else {
			a.sort();
			for (i = 1; i < a.length; i++) {
				// Use loosely typed comparsion if no compFn is given
				// to avoid sortUnique([6, "6", 6]) => [6, "6", 6]
				if (a[i] == a[i - 1]) {
					a.splice(i--, 1);
				}
			}
		}
		return a;
	}

	/**
	 * @doc function
	 * @name aloha.arrays:equal
	 * @description
	 *
	 * Does a shallow compare of two arrays.
	 *
	 * @param {Array} a
	 *        An array to compare.
	 * @param {Array} b
	 *        A second array to compare with `a`.
	 * @param {Function(*, *):Number} equalFn
	 *        A custom comparison function that accepts two values a and b from
	 *        the given arrays and returns true or false for equal and not equal
	 *        respectively.
	 *
	 *        If no equalFn is provided, the algorithm will use the strict
	 *        equals operator.
	 * @return {Boolean}
	 *         True if all items in a and b are equal, false if not.
	 */
	function equal(a, b, equalFn) {
		var i,
			len = a.length;
		if (len !== b.length) {
			return false;
		}
		if (equalFn) {
			for (i = 0; i < len; i++) {
				if (!equalFn(a[i], b[i])) {
					return false;
				}
			}
		} else {
			for (i = 0; i < len; i++) {
				if (a[i] !== b[i]) {
					return false;
				}
			}
		}
		return true;
	}

	/**
	 * @doc function
	 * @name aloha.arrays:contains
	 * @description
	 *
	 * Returns true if the given Array `xs` contains the value `x`.
	 *
	 * @param {Array} xs DOM nodes
	 * @param {*} x
	 *        A value to search for in the given array.
	 * @return {Boolean}
	 *         True of argument `x` is an element of the set `xs`.
	 */
	function contains(xs, x) {
		return -1 !== xs.indexOf(x);
	}

	/**
	 * @doc function
	 * @name aloha.arrays:intersect
	 * @description
	 *
	 * Returns all items in the array `xs` that are also contained in array
	 * `zs`.
	 *
	 * @param {Array} xs DOM nodes
	 * @param {Array} zs DOM nodes
	 * @return {Array}
	 *         The intersection of the sets `xs` and `zs`.
	 */
	function intersect(xs, zs) {
		return xs.filter(function (x) {
			return contains(zs, x);
		});
	}

	/**
	 * @doc function
	 * @name aloha.arrays:last
	 * @description
	 *
	 * Returns the last item in the given Array.
	 *
	 * @param {Array} xs DOM nodes
	 * @return {*}
	 *         Last item in xs, or null if the given array is empty.
	 */
	function last(xs) {
		return xs.length ? xs[xs.length - 1] : null;
	}

	/**
	 * @doc function
	 * @name aloha.arrays:second
	 * @description
	 *
	 * Returns the second item in the given array.
	 *
	 * @param {Array} xs DOM nodes
	 * @return {*}
	 *          Second item in xs, or null if the given array is empty.
	 */
	function second(xs) {
		return xs[1];
	}

	/**
	 * Functions for operating on arrays.
	 *
	 * arrays.contains()
	 * arrays.equal()
	 * arrays.sortUnique()
	 * arrays.intersect()
	 * arrays.second()
	 * arrays.last()
	 */
	var exports = {
		contains: contains,
		equal: equal,
		sortUnique: sortUnique,
		intersect: intersect,
		second: second,
		last: last
	};

	exports['contains'] = exports.contains;
	exports['equal'] = exports.equal;
	exports['sortUnique'] = exports.sortUnique;
	exports['intersect'] = exports.intersect;
	exports['second'] = exports.second;
	exports['last'] = exports.last;

	return exports;
});
