(function (aloha) {
	'use strict';

	var arrays = aloha.arrays;
	var tested = [];

    module('arrays');

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
