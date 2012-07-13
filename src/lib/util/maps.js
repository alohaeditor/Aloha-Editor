define([], function(){
	'use strict';
 
	function fillKeys(map, keys, value) {
		var i = keys.length;
		while (i--) {
			map[keys[i]] = value;
		}
		return map;
	}

	function fillTuples(map, a, fn) {
		var i = a.length,
		    tuple;
		if (fn) {
			while (i--) {
				tuple = fn(a[i]);
				map[tuple[0]] = tuple[1];
			}
		} else {
			while (i--) {
				tuple = a[i];
				map[tuple[0]] = tuple[1];
			}
		}
		return map;
	}

	return {
		fillTuples: fillTuples,
		fillKeys: fillKeys
	};
});
