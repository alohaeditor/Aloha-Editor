/* arrays.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define(['functions'], function Arrays(Fn) {
	'use strict';

	/**
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
		equalFn = equalFn || Fn.strictEquals;
		for (i = 0; i < len; i++) {
			if (!equalFn(a[i], b[i])) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Returns true if the given Array `xs` contains the value `x`.
	 *
	 * @param {Array} xs
	 * @param {*} x
	 *        A value to search for in the given array.
	 * @return {Boolean}
	 *         True of argument `x` is an element of the set `xs`.
	 */
	function contains(xs, x) {
		return -1 !== xs.indexOf(x);
	}

	/**
	 * Returns all items in the array `xs` that are also contained in array
	 * `zs`.
	 *
	 * @param {Array} xs
	 * @param {Array} zs
	 * @return {Array}
	 *         The intersection of the sets `xs` and `zs`.
	 */
	function intersect(xs, zs) {
		return xs.filter(function (x) {
			return contains(zs, x);
		});
	}
	/**
	 * Returns the relative complement of array `zs` in `xs`:
	 * All items in the array `xs` that are not contained in array `zs`.
	 *
	 * @param {Array} xs
	 * @param {Array} zs
	 * @return {Array}
	 *         The intersection of the sets `xs` and `zs`.
	 */
	function complement(xs, zs) {
		return xs.filter(function (x) {
			return !contains(zs, x);
		});
	}

	/**
	 * Returns the last item in the given Array.
	 *
	 * @param {Array} xs
	 * @return {*}
	 *         Last item in xs, or null if the given array is empty.
	 */
	function last(xs) {
		return xs.length ? xs[xs.length - 1] : null;
	}

	/**
	 * Returns the second item in the given array.
	 *
	 * @param {Array} xs
	 * @return {*}
	 */
	function second(xs) {
		return xs[1];
	}

	/**
	 * Coerces the given object (NodeList, arguments) to an array.
	 *
	 * This implementation works on modern browsers and IE >= 9. For IE
	 * < 9 a shim can be used, available here:
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
	 */
	function coerce(arrayLikeObject) {
		return Array.prototype.slice.call(arrayLikeObject, 0);
	}

	function mapcat(xs, fn) {
		return Array.prototype.concat.apply([], xs.map(fn));
	}

	function partition(xs, n) {
		return xs.reduce(function (result, x) {
			var l = last(result);
			if (l && l.length < n) {
				l.push(x);
			} else {
				result.push([x]);
			}
			return result;
		}, []);
	}

	function some(xs, pred, emptyResult) {
		var result = emptyResult;
		xs.some(function (x) {
			result = pred(x);
			return result;
		});
		return result;
	}

	/**
	 * Functions for operating on arrays.
	 *
	 * arrays.contains()
	 * arrays.equal()
	 * arrays.intersect()
	 * arrays.second()
	 * arrays.last()
	 */
	var exports = {
		contains: contains,
		complement: complement,
		equal: equal,
		intersect: intersect,
		second: second,
		last: last,
		coerce: coerce,
		mapcat: mapcat,
		partition: partition,
		some: some
	};

	exports['contains'] = exports.contains;
	exports['complement'] = exports.complement;
	exports['equal'] = exports.equal;
	exports['intersect'] = exports.intersect;
	exports['second'] = exports.second;
	exports['last'] = exports.last;
	exports['coerce'] = exports.coerce;
	exports['mapcat'] = exports.mapcat;
	exports['partition'] = exports.partition;

	return exports;
});
