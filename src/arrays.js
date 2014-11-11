/**
 * arrays.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * @namespace arrays
 */
define(['functions'], function (Fn) {
	'use strict';

	/**
	 * Does a shallow compare of two arrays.
	 *
	 * @param {Array} a
	 *        An array to compare.
	 * @param {Array} b
	 *        A second array to compare with `a`.
	 * @param {function(*, *):number} equalFn
	 *        A custom comparison function that accepts two values a and b from
	 *        the given arrays and returns true or false for equal and not equal
	 *        respectively.
	 *
	 *        If no equalFn is provided, the algorithm will use the strict
	 *        equals operator.
	 * @return {boolean}
	 *         True if all items in a and b are equal, false if not.
	 * @memberOf arrays
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
	 * @return {boolean}
	 *         True of argument `x` is an element of the set `xs`.
	 * @memberOf arrays
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
	 * @memberOf arrays
	 */
	function intersect(xs, zs) {
		return xs.filter(function (x) {
			return contains(zs, x);
		});
	}

	/**
	 * Returns the relative difference of array `zs` in `xs`:
	 * All items in the array `xs` that are not contained in array `zs`.
	 *
	 * @param {Array} xs
	 * @param {Array} zs
	 * @return {Array}
	 *         The difference of the sets `xs` and `zs`.
	 * @memberOf arrays
	 */
	function difference(xs, zs) {
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
	 * @memberOf arrays
	 */
	function last(xs) {
		return xs.length ? xs[xs.length - 1] : null;
	}

	/**
	 * Coerces the given object (NodeList, arguments) to an array.
	 *
	 * This implementation works on modern browsers and IE >= 9. For IE
	 * < 9 a shim can be used, available here:
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
	 *
	 * @param arrayLikeObject {*}
	 * @return {Array.<*>}
	 * @memberOf arrays
	 */
	function coerce(arrayLikeObject) {
		return Array.prototype.slice.call(arrayLikeObject);
	}

	/**
	 * Like Array.prototype.map() except expects the given function to return
	 * arrays which will be concatenated together into the resulting array.
	 *
	 * Related to partition() in the sense that
	 * mapcat(partition(xs, n), identity) == xs.
	 *
	 * Don't use Array.prototype.concat.apply():
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply
	 * "The consequences of applying a function with too many arguments
	 * (think more than tens of thousands of arguments) vary across
	 * engines (JavaScriptCore has hard-coded argument limit of 65536),
	 * because the limit (indeed even the nature of any
	 * excessively-large-stack behavior) is unspecified. "
	 *
	 * @param xs {Array.<*>}
	 * @param fn {function(*):Array.<*>}
	 * @return {Array.<*>}
	 * @memberOf arrays
	 */
	function mapcat(xs, fn) {
		return xs.reduce(function(result, x) {
			return result.concat(fn(x));
		}, []);
	}

	/**
	 * Partitions the given array xs into an array of arrays where each
	 * nested array is a subsequence of xs of length n.
	 *
	 * See mapcat().
	 *
	 * @param xs {Array.<*>}
	 * @param n {number}
	 * @return {Array.<Array.<*>>}
	 * @memberOf arrays
	 */
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

	/**
	 * Similar to some(), except that it returns an index into the given array
	 * for the first element for which `pred` returns true.
	 *
	 * If none return true, -1 is returned.
	 *
	 * @param {Array.<*>}           xs
	 * @param {function(*):boolean} pred
	 * @return {*}
	 * @memberOf arrays
	 */
	function someIndex(xs, pred) {
		var result = -1;
		xs.some(function (x, i) {
			if (pred(x)) {
				result = i;
				return true;
			}
		});
		return result;
	}

	/**
	 * Similar to 
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some
	 * Except, instead of returning true, returns the first value in the array
	 * for which the `pred` returns true.
	 *
	 * @param  {Array.<*>}           xs
	 * @param  {function(*):boolean} pred
	 * @return {*} One of xs
	 * @memberOf arrays
	 */
	function some(xs, pred) {
		var index = someIndex(xs, pred);
		return -1 === index ? null : xs[index];
	}

	/**
	 * Splits the list into two parts using the given predicate.
	 *
	 * The first element will be the "prefix," containing all elements of `list` before
	 * the element that returns true for the predicate.
	 *
	 * The second element is equal to dropWhile(list).
	 *
	 * @param  {Array<*>}            list
	 * @param  {function(*):boolean} predicate
	 * @return {Array<Array<*>>}     The prefix and suffix of `list`
	 * @memberOf arrays
	 */
	function split(xs, predicate) {
		var end = someIndex(xs, predicate);
		end = -1 === end ? xs.length : end;
		return [xs.slice(0, end), xs.slice(end)];
	}

	/**
	 * Creates a new array that contains a unique list of entries
	 * created from the old array. Example:
	 * [1, 2, 2, 3, 2, 4] => [1, 2, 3, 4]
	 *
	 * @param  {Array.<*>} arr
	 * @return {Array.<*>}
	 * @memberOf arrays
	 */
	function unique(arr) {
		var set = [];
		arr.forEach(function (entry) {
			if (set.indexOf(entry) === -1) {
				set.push(entry);
			}
		});
		return set;
	}

	/**
	 * This function is missing documentation.
	 * @TODO Complete documentation.
	 * @memberOf arrays
	 */
	function refill(arrays) {
		var receivers = coerce(arguments).slice(1);
		for (var i = 0; i < arrays.length; i++) {
			if (!arrays[i] || !receivers[i]) {
				return;
			}
			receivers[i].length = 0;
			Array.prototype.splice.apply(receivers[i], [0, 0].concat(arrays[i]));
		}
	}

	/**
	 * Returns true if the given value is an array.
	 * @memberOf arrays
	 */
	function is(obj) {
		return (Object.prototype.toString.call(obj) === '[object Array]');
	}

	return {
		contains   : contains,
		difference : difference,
		equal      : equal,
		intersect  : intersect,
		is         : is,
		last       : last,
		coerce     : coerce,
		mapcat     : mapcat,
		partition  : partition,
		some       : some,
		someIndex  : someIndex,
		split      : split,
		unique     : unique,
		refill     : refill
	};
});
