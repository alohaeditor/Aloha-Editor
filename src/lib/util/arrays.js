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
     *        whether a < b, a == b, a > b respectively. If no compFn
     *        is provided, the algorithm will use the browsers default
     *        sort behaviour and loose comparison to detect duplicates.
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

	function equal(a, b, compFn) {
		var i = 0, len = a.length;
		if (len !== b.length) {
			return false;
		}
		if (compFn) {
			for (; i < len; i++) {
				if (0 !== compFn(a[i], b[i])) {
					return false;
				}
			}
		} else {
			for (; i < len; i++) {
				// Is it a good idea to use loosely typed comparison to
				// be consistent with sortUnique?
				if (a[i] != b[i]) {
					return false;
				}
			}
		}
		return true;
	}

	function equalSets(a, b, compFn) {
		var i, len;
		a = a.slice();
		b = b.slice();
		sortUnique(a, compFn);
		sortUnique(b, compFn);
		return equal(a, b, compFn);
	}

	function assert(x) {
		if (!x) {
			throw "error";
		}
	}

	/* Tests
	assert(equalSets([1, "x", 2, "9", "2", 9], ["9", 2, "x", "2", 1]));
	assert(equalSets([], []));
	assert(!equalSets([1, "x", 2, "2"], [1, "x", 2, "2", 9]));
	assert(!equalSets([0], []));
	assert(equal([1, 2, 3], [1, 2, 3]));
	assert(equal([], []));
	assert(!equal([1, 3, 2], [1, 2, 3]));
	*/

	return {
		'sortUnique': sortUnique,
		'equalSets': equalSets,
		'equal': equal
	};
});
