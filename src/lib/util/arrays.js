define([],function(){
	'use strict'

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
    function sortUnique(a, compFn){
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
				// to avoid sortUnique( [6, "6", 6] ) => [6, "6", 6]
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
		var i = 0, len = a.length;
		if (len !== b.length) {
			return false;
		}
		if (equalFn) {
			for (; i < len; i++) {
				if (!equalFn(a[i], b[i])) {
					return false;
				}
			}
		} else {
			for (; i < len; i++) {
				if (a[i] !== b[i]) {
					return false;
				}
			}
		}
		return true;
	}

	// TODO use native ecma5 function if available
	function filter(a, fn) {
		var result = [], i, len, item;
		for (i = 0, len = a.length; i < len; i++) {
			item = a[i];
			if (fn(item)) {
				result.push(item);
			}
		}
		return result;
	}

	return {
		sortUnique: sortUnique,
		equal: equal,
		filter: filter
	};
});
