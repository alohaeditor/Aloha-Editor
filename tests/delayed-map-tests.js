(function (aloha, require, test, equal) {
	'use strict';

	var Fn   = aloha.fn;
	var Maps = aloha.maps;
	var DelayedMap; require('../src/delayed-map', function (Module) { DelayedMap = Module; });

    module('delayed-map');

	var sourceOpts = {
		get: function (source, name, default_) {
			return (source.hasOwnProperty(name)
			        ? source[name]
			        : default_);
		},
		has: function (source, name) {
			return source.hasOwnProperty(name);
		},
		keys: function (source) {
			return Maps.keys(source);
		},
		realize: function (source) {
			return source;
		}
	};

	var source = {'one': 1, 'two': 2};

	test('get', function () {
		var map = DelayedMap(sourceOpts, source);
		equal(map.get('one'), 1);
		equal(map.get('two'), 2);
		equal(map.get('three', 'default'), 'default');
		ok(Fn.isNou(map.get('three')));
	});

	test('has', function () {
		var map = DelayedMap(sourceOpts, source);
		ok(map.has('one'));
		ok(map.has('two'));
		ok(!map.has('three'));
	});

	test('keys', function () {
		var map = DelayedMap(sourceOpts, source);
		var keys = map.keys();
		equal(keys.length, 2);
		ok(-1 !== keys.indexOf('one'));
		ok(-1 !== keys.indexOf('two'));
	});

	test('realize', function () {
		var map = DelayedMap(sourceOpts, source);
		equal(map.realize(), source);
	});

	test('merge', function () {
		var sourceB = {'three': 3, 'four': 4};
		var sourceC = {'five': 5, 'six': 6};
		var map = DelayedMap(sourceOpts, source);
		deepEqual(map.mergeObject(sourceB).realize(),
		          Maps.merge(source, sourceB));
		equal(map.mergeObject(sourceB).get('one'), 1);
		equal(map.mergeObject(sourceB).get('three'), 3);
		ok(Fn.isNou(map.mergeObject(sourceB).get('five')));
		deepEqual(map.mergeObject(sourceB).mergeObject(sourceC).realize(),
		          Maps.merge(source, sourceB, sourceC));
		// Ensure, after merging twice, the map is still referring to
		// the first map and sourceB and sourceC were merged non-lazily
		// to avoid a memory leak.
		var mergedTwice = map.mergeObject(sourceB, true).mergeObject(sourceC, true);
		equal(mergedTwice._map_source.map, map);
		equal(mergedTwice._map_source.obj['four'], 4);
		equal(mergedTwice._map_source.obj['five'], 5);
	});

}(window.aloha, window.require, window.test, window.equal));
