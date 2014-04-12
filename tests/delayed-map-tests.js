(function (aloha) {
	'use strict';

	var DelayedMap = aloha.DelayedMap;
	var Maps   = aloha.maps;
	var Fn     = aloha.fn;
	var values = [{one: 'one'}, 'two', 3];

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

}(window.aloha));
