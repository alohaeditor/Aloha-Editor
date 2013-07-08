/* arrays.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define(['functions'], function ArrayUtilities(Fn) {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('Aloha.Range');
	}

	/**
	 * Implements unique() using the browser's sort().
	 *
	 * @param {Array} a
	 *		The array to sort and strip of duplicate values.
	 *		Warning: this array will be modified in-place.
	 * @param {Function(*, *):Number} compFn
	 *		A custom comparison function that accepts two values a and
	 *		b from the given array and returns -1, 0, 1 depending on
	 *		whether a < b, a == b, a > b respectively.
	 *
	 *		If no compFn is provided, the algorithm will use the
	 *		browsers default sort behaviour and loose comparison to
	 *		detect duplicates.
	 * @return {Array}
	 *		The given array, sorted.
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
	 *		An array to compare.
	 * @param {Array} b
	 *		A second array to compare with `a`.
	 * @param {Function(*, *):Number} equalFn
	 *		A custom comparison function that accepts two values a and
	 *		b from the given arrays and returns true or false for
	 *		equal and not equal respectively.
	 *
	 *		If no equalFn is provided, the algorithm will use the strict
	 *		equals operator.
	 * @return {Boolean}
	 *		True if all items in a and b are equal, false if not.
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
	 * Emulates ECMAScript edition 5 Arrays.map()
	 * See https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/map
	 * And http://es5.github.com/#x15.4.4.19
	 * It's not exactly according to standard, but it does what one expects.
	 *
	 * @param {Array} a
	 *		An array.
	 *
	 * @param {Function} fn
	 * @return {Array}
	 *		A copy of the given array where each item mapped in relation to fn.
	 */
	function map(a, fn) {
		var i, len, result = [];
		for (i = 0, len = a.length; i < len; i++) {
			result.push(fn(a[i]));
		}
		return result;
	}

	function mapNative(a, fn) {
		// Call map directly on the object instead of going through
		// Array.prototype.map. This avoids the problem that we may get
		// passed an array-like object (NodeList) which may cause an
		// error if the implementation of Array.prototype.map can only
		// deal with arrays (Array.prototype.map may be native or
		// provided by a javscript framework).
		return a.map(fn);
	}

	/**
	 * Returns a new array that contains all values in the given a for
	 * which `pred` returns true.
	 *
	 * @param {Array} a
	 *		An array.
	 * @param {Function:Boolean} pred
	 *		Predicate function with which to filter the given array.
	 * @return {Array}
	 *		A subset of the given array.
	 */
	function filter(a, pred) {
		var i,
		    len,
		    value,
		    result = [];
		for (i = 0, len = a.length; i < len; i++) {
			value = a[i];
			if (pred(value)) {
				result.push(value);
			}
		}
		return result;
	}

	/**
	 * Finds a value in the given array.
	 * Strict comparison is used to find the value.
	 * Returns the index of the first occurrence of the given value in
	 * the given a, or -1 if a contains no such value.
	 *
	 * @param {Array} a
	 *		An array.
	 * @param {*} value
	 *		The value to search for in the give array.
	 * @return {Number}
	 *		The first index in the given array which contains the given value.
	 *		If the value is not found inside the array, -1 is returned.
	 */
	function indexOf(a, value) {
		var i,
		    len;
		for (i = 0, len = a.length; i < len; i++) {
			if (value === a[i]) {
				return i;
			}
		}
		return -1;
	}

	/**
	 * Reduces an array of values to a single value.
	 *
	 * For example:
	 * Arrays.reduce([2, 3, 4], 1, function (a, b) { return a + b; });
	 * returns the result of (((1 + 2) + 3) + 4)
	 *
	 * Emulates ECMAScript edition 5 Array.reduce.
	 *
	 * @param {Array} a
	 *		An array of values.
	 * @param {*} init
	 *		An initial value.
	 * @param {Function} fn
	 *		A function that takes two values and returns the reduction of both.
	 */
	function reduce(a, init, fn) {
		var i,
		    len;
		for (i = 0, len = a.length; i < len; i++) {
			init = fn(init, a[i]);
		}
		return init;
	}

	/**
	 * Returns true if the given xs contains the given x.
	 *
	 * @param {Array} xs
	 *		An array.
	 * @param {*} x
	 *		A value to search for in the given array.
	 * @return {Boolean}
	 *		True of argument `x` is contained in the given array.
	 */
	function contains(xs, x) {
		return -1 !== indexOf(xs, x);
	}

	/**
	 * Applies the given value to the given function unless the value is null,
	 * in which case just returns null.
	 *
	 * This is a utility function to be used with reduce().
	 *
	 * @param {*} value
	 *		The value with which to call `fn` with.
	 * @param {Function} fn
	 *		The function to be called with `value` as its only argument.
	 * @return
	 *		The return value of `fn`.
	 */
	function applyNotNull(value, fn) {
		return value == null ? null : fn(value);
	}

	/**
	 * For each item in xs, call cb(item, index, xs).
	 *
	 * Emulates ECMAScript edition 5 Array.forEach.
	 *
	 * @param {Array} xs
	 *		An array to iterate over.
	 * @param {Function} cb
	 *		Callback function to execute for each element in `xs`.
	 */
	function forEach(xs, cb) {
		var i,
		    len;
		for (i = 0, len = xs.length; i < len; i++) {
			cb(xs[i], i, xs);
		}
	}

	/**
	 * Returns true if the given predicate function returns true for at
	 * least one item.
	 *
	 * Emulates ECMAScript edition 5 Array.some.
	 *
	 * @param {Array} xs
	 *		An array to iterate over.
	 * @param {Function} pred
	 *		Predicate function to test for each element.
	 * @return {Boolean}
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
	 * Returns true if the given predicate function returns true for all
	 * items in xs.
	 *
	 * Emulates ECMAScript edition 5 Array.every.
	 *
	 * @param {Array} xs
	 *		An array to iterate over.
	 * @param {Function} pred
	 *		Predicate function to test for each element.
	 * @return {Boolean}
	 */
	function every(xs, pred) {
		return !some(xs, Fn.complement(pred));
	}

	/**
	 * Returns all items in xs that are also contained in zs.
	 *
	 * @param {Array} xs
	 * @param {Array} zs
	 * @return {Boolean}
	 *		The set of elements in `xs` that are also contained in `zs`.
	 */
	function intersect(xs, zs) {
		return filter(xs, function (x) {
			return contains(zs, x);
		});
	}

	/**
	 * Returns the last item in xs or null.
	 *
	 * @param {Array} xs
	 * @return {*}
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
	 * @return {Boolean} True if the given object is array-like.
	 */
	var isArray = Array.isArray || function isArray(obj) {
		return (obj && '[object Array]' === Object.prototype.toString.call(obj)
			? true
			: false
		);
	};

	return {
		filter: filter,
		indexOf: indexOf,
		reduce: reduce,
		forEach: forEach,
		some: some,
		every: every,
		map: Array.prototype.map ? mapNative : map,
		contains: contains,
		equal: equal,
		applyNotNull: applyNotNull,
		sortUnique: sortUnique,
		intersect: intersect,
		second: second,
		last: last,
		isArray: isArray
	};
});
