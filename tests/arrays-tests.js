(function (aloha) {
	'use strict';

	var Arrays = aloha.arrays;

    module('arrays');

	test('contains()', function () {
		var array = [1, 2, null, void 0];
		equal(true, Arrays.contains(array, 1));
		equal(false, Arrays.contains(array, 3));
		equal(true, Arrays.contains(array, void 0));
		equal(false, Arrays.contains(array, ''));
		equal(false, Arrays.contains(array, false));
		equal(true, Arrays.contains(array, null));
	});

	test('equal()', function () {
		equal(true, Arrays.equal([1, 2], [1, 2]));
		equal(false, Arrays.equal(['1', 2], [1, 2]));
		equal(false, Arrays.equal([1, 2], [2, 1]));
		equal(true, Arrays.equal([], []));
	});

	test('intersect()', function () {
		var intersection = Arrays.intersect([0, 1, 2, 3], [1, 3, 5]);
		equal(1, intersection[0]);
		equal(3, intersection[1]);
		intersection = Arrays.intersect([0, 1], [2, 3]);
		equal(0, intersection.length);
	});

	test('second()', function () {
		var intersection = Arrays.intersect([0, 1, 2, 3], [1, 3, 5]);
		equal(1, intersection[0]);
		equal(2, Arrays.second([1, 2]));
		equal(null, Arrays.second([1]));
	});

	test('last()', function () {
		equal(2, Arrays.last([1, 2]));
		equal(null, Arrays.last([]));
	});

	test('difference', function () {
		deepEqual(Arrays.difference([1, 2, 3, 6], [2, 3]), [1, 6]);
		deepEqual(Arrays.difference([1, 2, 3], [2, 3]), [1]);
	});

	test('coerce', function () {
		var array = ['a', 'b', 'c'];
		deepEqual(Arrays.coerce(array), array);
	});

	test('mapcat', function () {
		function multiplyBy2(number) {
			return number * 2;
		}
		deepEqual(Arrays.mapcat([1, 2, 3], multiplyBy2), [2, 4, 6]);
	});

	test('partition', function () {
		deepEqual(Arrays.partition([1, 2, 3, 4], 2), [[1, 2], [3, 4]]);
	});

	test('some', function () {
		function biggerThan9(number) {
			return number > 9;
		}
		equal(Arrays.some([1, 2, 10, 8], biggerThan9), 10);
	});

}(window.aloha));
