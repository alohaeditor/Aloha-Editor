/* arrays.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2012 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 * 
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 * 
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
 */
define([], function () {
	'use strict';

	/**
	 * Implements unique() using the browser's sort().
	 *
	 * @param a
	 *        The array to sort and strip of duplicate values.
	 *        Warning: this array will be modified in-place.
	 * @param compFn
	 *        A custom comparison function that accepts two values a and
	 *        b from the given array and returns -1, 0, 1 depending on
	 *        whether a < b, a == b, a > b respectively.
	 *
	 *        If no compFn is provided, the algorithm will use the
	 *        browsers default sort behaviour and loose comparison to
	 *        detect duplicates.
	 * @return
	 *        The given array.
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
	 * Shallow comparison of two arrays.
	 *
	 * @param a, b
	 *        The arrays to compare.
	 * @param equalFn
	 *        A custom comparison function that accepts two values a and
	 *        b from the given arrays and returns true or false for
	 *        equal and not equal respectively.
	 *
	 *        If no equalFn is provided, the algorithm will use the strict
	 *        equals operator.
	 * @return
	 *        True if all items in a and b are equal, false if not.
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
	 * ECMAScript map replacement
	 * See https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/map
	 * And http://es5.github.com/#x15.4.4.19
	 * It's not exactly according to standard, but it does exactly what one expects.
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
	 * which pred returns true.
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
	 * Emulates ECMA5 Array.reduce.
	 *
	 * @param a
	 *        An array of values.
	 * @param init
	 *        An initial value.
	 * @param fn
	 *        A function that takes two values and returns the reduction
	 *        of both.
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
	 */
	function contains(xs, x) {
		return -1 !== indexOf(xs, x);
	}

	/**
	 * Applies the given value to the given function unless the value is
	 * null, in which case just returns null.
	 *
	 * This is a utility function to be used with reduce().
	 */
	function applyNotNull(value, fn) {
		return value == null ? null : fn(value);
	}

	/**
	 * Emulates ECMA5 Array.forEach.
	 */
	function forEach(xs, cb) {
		var i,
		    len;
		for (i = 0, len = xs.length; i < len; i++) {
			cb(xs[i], i, xs);
		}
	}

	/**
	 * Returns all items in xs that are also contained in zs.
	 */
	function intersect(xs, zs) {
		return filter(xs, function (x) {
			return contains(zs, x);
		});
	}

	return {
		filter: filter,
		indexOf: indexOf,
		reduce: reduce,
		forEach: forEach,
		map: Array.prototype.map ? mapNative : map,
		contains: contains,
		equal: equal,
		applyNotNull: applyNotNull,
		sortUnique: sortUnique,
		intersect: intersect
	};
});
