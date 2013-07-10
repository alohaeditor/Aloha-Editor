/* arrays.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define(['functions'], function ArrayUtilities(Fn) {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('Arrays');
	}

	/**
	 * Implements unique() using the browser's sort().
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
	 *         The given array, having been sorted.
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
	 * Shallowly compares two arrays.
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
	 * Returns true if the given xs contains the given x.
	 *
	 * @param {Array} xs
	 *        An array.
	 * @param {*} x
	 *        A value to search for in the given array.
	 * @return {Boolean}
	 *         True of argument `x` is contained in the given array.
	 */
	function contains(xs, x) {
		return -1 !== xs.indexOf(x);
	}

	/**
	 * Applies the given value to the given function unless the value is null,
	 * in which case just returns null.
	 *
	 * This is a utility function to be used with reduce().
	 *
	 * @param {*} value
	 *        The value with which to call `fn` with.
	 * @param {Function} fn
	 *        The function to be called with `value` as its only argument.
	 * @return {*}
	 *         The return value of `fn`.
	 */
	function applyNotNull(value, fn) {
		return value == null ? null : fn(value);
	}

	/**
	 * Returns true if the given predicate function returns true for at least
	 * one item in the given array.
	 *
	 * Emulates ECMAScript edition 5 Array.some.
	 *
	 * @param {Array} xs
	 *        An array to iterate over.
	 * @param {Function} pred
	 *        Predicate function to test for each element.
	 * @return {Boolean}
	 *         True if `pred` returns true when applied to at least one item in
	 *         `xs`.
	 */
	function some(xs, pred) {
		var i,
		    len;
		for (i = 0, len = xs.length; i < len; i++) {
			if (pred(xs[i])) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Returns true if the given predicate function returns true for all items
	 * in xs.
	 *
	 * Emulates ECMAScript edition 5 Array.every.
	 *
	 * @param {Array} xs
	 *        An array to iterate over.
	 * @param {Function} pred
	 *        Predicate function to test for each element.
	 * @return {Boolean}
	 */
	function every(xs, pred) {
		return !some(xs, Fn.complement(pred));
	}

	/**
	 * Returns all items in `xs` that are also contained in `zs`.
	 *
	 * @param {Array} xs
	 * @param {Array} zs
	 * @return {Boolean}
	 *          The set of elements in `xs` that are also contained in `zs`.
	 */
	function intersect(xs, zs) {
		return xs.filter(function (x) {
			return contains(zs, x);
		});
	}

	/**
	 * Returns the last item in xs or null.
	 *
	 * @param {Array} xs
	 * @return {*}
	 *         Last item in xs or null if the given array is empty.
	 */
	function last(xs) {
		return xs.length ? xs[xs.length - 1] : null;
	}

	/**
	 * Returns the second item in xs.
	 *
	 * @param {Array} xs
	 * @return {*}
	 */
	function second(xs) {
		return xs[1];
	}

	/**
	 * Emulates ECMAScript edition 5 Arrays.isArray() to check whether the given
	 * element is an array.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
	 * http://kangax.github.io/es5-compat-table/#Array.isArray
	 *
	 * @param {*} obj
	 * @return {Boolean}
	 *         True if the given object is array-like.
	 */
	var isArray = Array.isArray || function isArray(obj) {
		return (obj && '[object Array]' === Object.prototype.toString.call(obj)
			? true
			: false
		);
	};

	/**
	 * Functions for operating on arrays.
	 *
	 * API:
	 *
	 * Arrays.some()
	 * Arrays.every()
	 * Arrays.map()
	 * Arrays.contains()
	 * Arrays.equal()
	 * Arrays.applyNotNull()
	 * Arrays.sortUnique()
	 * Arrays.intersect()
	 * Arrays.second()
	 * Arrays.last()
	 */
	var exports = {
		some: some,
		every: every,
		contains: contains,
		equal: equal,
		applyNotNull: applyNotNull,
		sortUnique: sortUnique,
		intersect: intersect,
		second: second,
		last: last
	};

	return exports;
});
