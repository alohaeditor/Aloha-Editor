(function (aloha) {
	'use strict';

	var Trees = aloha.trees;
	var Maps = aloha.maps;

	module('trees');

	var tree = {
		one: [{two: 'three', four: 5}, 'six'],
		seven: 8
	};
	var treeInc = {
		one: [{two: 'four', four: 6, three: 'four', five: 6}, 'seven', 'twelvethousand'],
		seven: 9,
		two: [{two: 'four', four: 6, three: 'four', five: 6}, 'seven', 'twelvethousand'],
		eight: 9
	};

	function incTree(node) {
		if ('three' === node) {
			return 'four';
		}
		if ('six' === node) {
			return 'seven';
		}
		if (5 === node) {
			return 6;
		}
		if (8 === node) {
			return 9;
		}
		if (Array.isArray(node)) {
			node.push('twelvethousand');
		} else {
			Maps.forEach(node, function (value, key) {
				if ('one' === key) {
					node['two'] = Trees.clone(value);
				}
				if ('two' === key) {
					node['three'] = Trees.clone(value);
				}
				if ('four' === key) {
					node['five'] = Trees.clone(value);
				}
				if ('seven' === key) {
					node['eight'] = Trees.clone(value);
				}
			});
		}
		return node;
	}

	test('prewalk', function () {
		var result = Trees.prewalk(tree, incTree);
		deepEqual(result, treeInc);
	});

	test('postwalk', function () {
		var result = Trees.postwalk(tree, incTree);
		deepEqual(result, treeInc);
	});
}(aloha));
