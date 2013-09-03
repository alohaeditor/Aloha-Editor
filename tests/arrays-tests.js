(function (aloha) {
	'use strict';

	var arrays = aloha.arrays;
	var tested = [];

    module('arrays');

    test('sortUnique(): loose compare', function () {
        var unique = arrays.sortUnique([6, 3, 6, 3, '6', 3, '9', 9, 3, 2, 1]);
        // Either numeric or string values for '6' and '9' may be chosen
		var i;
        for (i = 0; i < unique.length; i++) {
            unique[i] = parseInt(unique[i], 10);
        }
        deepEqual(unique, [1, 2, 3, 6, 9]);
    });

    test('sortUnique(): strict comparison', function () {
        var unique = arrays.sortUnique([6, 3, '6', 3, 6, 3, '9', 9, 3, 2, 1], function (a, b) {
            return typeof a < typeof b ? -1
                : (typeof a > typeof b ? 1
                    : (a < b ? -1 : (a > b ? 1 : 0)));
        });
        deepEqual(unique, [1, 2, 3, 6, 9, '6', '9']);
    });

    test('sortUnique(): comparator', function () {
        var unique = arrays.sortUnique([7, 6, 9, 6, 9, 8], function (a, b) {
            // Pretend 6 and 9 is equal
            if (a === 9) {
                a = 6;
            }
            if (b === 9) {
                b = 6;
            }
            return a < b ? -1 : (a === b ? 0 : +1);
        });
        deepEqual(unique, [6, 7, 8]);
    });

	tested.push('sortUnique');

	test('contains()', function () {
		tested.push('contains');
		var array = [1, 2, null, void 0];
		equal(true, arrays.contains(array, 1));
		equal(false, arrays.contains(array, 3));
		equal(true, arrays.contains(array, void 0));
		equal(false, arrays.contains(array, ''));
		equal(false, arrays.contains(array, false));
		equal(true, arrays.contains(array, null));
	});

	test('equal()', function () {
		tested.push('equal');
		equal(true, arrays.equal([1, 2], [1, 2]));
		equal(false, arrays.equal(['1', 2], [1, 2]));
		equal(false, arrays.equal([1, 2], [2, 1]));
		equal(true, arrays.equal([], []));
	});

	test('intersect()', function () {
		tested.push('intersect');
		var intersection = arrays.intersect([0, 1, 2, 3], [1, 3, 5])
		equal(1, intersection[0]);
		equal(3, intersection[1]);
		intersection = arrays.intersect([0, 1], [2, 3]);
		equal(0, intersection.length);
	});

	test('second()', function () {
		tested.push('second');
		var intersection = arrays.intersect([0, 1, 2, 3], [1, 3, 5])
		equal(1, intersection[0]);
		equal(2, arrays.second([1,2]));
		equal(null, arrays.second([1]));
	});

	test('last()', function () {
		tested.push('last');
		equal(2, arrays.last([1,2]));
		equal(null, arrays.last([]));
	});

	testCoverage(test, tested, arrays);
}(window.aloha));
