(function (aloha) {
	'use strict';

	var Arrays = aloha.arrays;
	var tested = [];

    module('arrays');

	test('contains()', function () {
		tested.push('contains');
		var array = [1, 2, null, void 0];
		equal(true, Arrays.contains(array, 1));
		equal(false, Arrays.contains(array, 3));
		equal(true, Arrays.contains(array, void 0));
		equal(false, Arrays.contains(array, ''));
		equal(false, Arrays.contains(array, false));
		equal(true, Arrays.contains(array, null));
	});

	test('equal()', function () {
		tested.push('equal');
		equal(true, Arrays.equal([1, 2], [1, 2]));
		equal(false, Arrays.equal(['1', 2], [1, 2]));
		equal(false, Arrays.equal([1, 2], [2, 1]));
		equal(true, Arrays.equal([], []));
	});

	test('intersect()', function () {
		tested.push('intersect');
		var intersection = Arrays.intersect([0, 1, 2, 3], [1, 3, 5]);
		equal(1, intersection[0]);
		equal(3, intersection[1]);
		intersection = Arrays.intersect([0, 1], [2, 3]);
		equal(0, intersection.length);
	});

	test('second()', function () {
		tested.push('second');
		var intersection = Arrays.intersect([0, 1, 2, 3], [1, 3, 5]);
		equal(1, intersection[0]);
		equal(2, Arrays.second([1,2]));
		equal(null, Arrays.second([1]));
	});

	test('last()', function () {
		tested.push('last');
		equal(2, Arrays.last([1,2]));
		equal(null, Arrays.last([]));
	});

	test('difference', function() {
		tested.push('difference');
		deepEqual(Arrays.difference([1,2,3,6], [2,3]), [1,6]);
		deepEqual(Arrays.difference([1,2,3], [2,3]), [1]);
	});

	test('coerce', function() {
		tested.push('coerce');
		var array = ['a', 'b', 'c'];
		deepEqual(Arrays.coerce(array), array);
	});

	test('mapcat', function() {
		tested.push('mapcat');
		function multiplyBy2(number) {
			return number * 2;
		}
		deepEqual(Arrays.mapcat([1,2,3], multiplyBy2), [2,4,6]);
	});

	test('partition', function() {
		tested.push('partition');
		deepEqual(Arrays.partition([1,2,3,4], 2),[[1,2],[3,4]]);
	});

	test('some', function() {
		tested.push('some');
		function biggerThan9(number) {
			return number > 9;
		}
		equal(Arrays.some([1,2,10,8], biggerThan9), 10);
	});

	//testCoverage(test, tested, Arrays);

}(window.aloha));
