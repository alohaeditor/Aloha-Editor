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

	return {
		'sortUnique': sortUnique,
		'equal': equal
	};
});
