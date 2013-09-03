(function (aloha) {
	'use strict';

	var maps = aloha.maps;
	var tested = [];

    module('maps');

	test('isEmpty', function () {
		tested.push('isEmpty');
		equal(maps.isEmpty({}), true); 
	});

	test('fillTuples', function () {
		tested.push('fillTuples');
		var map = maps.fillTuples({
			zero: 0
		}, [
			['one',   1],
			['two',   2],
			['three', 3]
		]);
		equal(map.zero,  0);
		equal(map.one,   1);
		equal(map.two,   2);
		equal(map.three, 3);
	});

	test('fillKeys', function () {
		tested.push('fillKeys');
		var map = maps.fillKeys({
			one: false,
			two: false,
			three: false
		}, ['one', 'three'], true);
		equal(map.one, true);
		equal(map.two, false);
		equal(map.three, true);
	});

	test('keys', function () {
		tested.push('keys');
		equal(maps.keys({
			one: 1,
			two: 2,
			three: 3
		}).join(' '), 'one two three');
	});

	test('forEach', function () {
		tested.push('forEach');
		var keys = [];
		var values = [];
		maps.forEach({
			one: 1,
			two: 2,
			three: 3
		}, function (value, key, map) {
			values.push(value);
			keys.push(key);
		});
		equal(values.join(' '), '1 2 3');
		equal(keys.join(' '), 'one two three');
	});

	test('merge', function () {
		tested.push('merge');
		var map = maps.merge({
			one: 1,
			two: null
		}, {
			two: 2,
			three: 3
		});
		equal(map.one,   1);
		equal(map.two,   2);
		equal(map.three, 3);
	});

	testCoverage(test, tested, maps);
}(window.aloha));
