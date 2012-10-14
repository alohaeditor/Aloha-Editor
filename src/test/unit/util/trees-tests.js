Aloha.require(['jquery', 'util/trees'], function($, Trees){
	'use strict';

	var tree = {
		tree: [
			{ array: [ 1, 2, 3 ], map: { "a": 4, "b": 5, "c": 6 } },
			[ { array: [ "d", "e", "f" ], "g": 7, "h": 8, "i": 9 } ]
		]
	};
	var leaves = [
		1, 2, 3, 4, 5, 6, "d", "e", "f", 7, 8, 9
	];
	var modifiedTree = {
		tree: [
			{ array: [ 11, 12, 13, "@" ], map: { "a": 14, "b": 15, "c": 16, "%": "%" }, "%": "%" },
			[ { array: [ "D", "E", "F", "@" ], "g": 17, "h": 18, "i": 19, "%": "%" }, "@" ],
			"@"
		],
		"%": "%"
	};
	var preprunedTree = {
		tree: [
			{ array: [ 1, 2, 3 ], map: { "a": 4, "b": 5, "c": 6 } },
			[ { array: [], "g": 7, "h": 8, "i": 9 } ]
		]
	};
	var postprunedTree = {
		tree: [
			{ array: [ 1, 2, 3 ], map: { "a": 4, "b": 5, "c": 6 } },
			[ { "g": 7, "h": 8, "i": 9 } ]
		]
	};

	function modifyLeaf(leaf) {
		return 'string' === $.type(leaf) ? leaf.toUpperCase() : leaf + 10;
	}

	function isModifiedLeaf(leaf) {
		return "DEF".indexOf(leaf) != -1 || leaf > 10;
	}

	function isLeaf(node) {
		return 'string' === $.type(node) || 'number' === $.type(node);
	}

	function modifyNode(node, requireModifiedLeaves) {
		if (isLeaf(node)) {
			if (requireModifiedLeaves !== isModifiedLeaf(node)) {
				return 200;
			}
			return node;
		}
		if ('array' === $.type(node)) {
			if (isLeaf(node[0]) && requireModifiedLeaves !== isModifiedLeaf(node[0])) {
				return 100;
			}
			return node.concat("@");
		}
		if ('object' === $.type(node)) {
			for (var key in node) {
				if (node.hasOwnProperty(key)) {
					if (isLeaf(node[key]) && requireModifiedLeaves !== isModifiedLeaf(node[key])) {
						return 100;
					}
					return $.extend({"%": "%"}, node);
				}
			}
			return 300;
		}
		return null;
	}

	function pruneCharsAndEmptyArrays(node, chars){
		if (isLeaf(node)) {
			return chars.indexOf(node) != -1;
		} else if('array' === $.type(node)) {
			return !node.length;
		} else {
			return false;
		}
	}

	module('Trees');

	test('clone', function () {
		var cloneA = Trees.clone(tree);
		var cloneB = Trees.clone(tree);
		deepEqual(cloneA, tree);
		deepEqual(cloneB, tree);
		ok(cloneA !== cloneB && cloneA !== tree && cloneB !== tree);
	});

	test('flatten', function () {
		var result = Trees.flatten(tree);
		result.sort();
		var sortedLeaves = leaves.slice();
		sortedLeaves.sort();
		deepEqual(result, sortedLeaves);
	});

	test('prewalk, postwalk', function () {
		var premodifiedTree  = Trees.prewalk (tree, function (node){
			node = modifyNode(node, false);
			if (isLeaf(node)) {
				node = modifyLeaf(node);
			}
			return node;
		});
		var postmodifiedTree = Trees.postwalk(tree, function (node){
			if (isLeaf(node)) {
				node = modifyLeaf(node);
			}
			return modifyNode(node, true );
		});
		deepEqual(premodifiedTree , modifiedTree);
		deepEqual(postmodifiedTree, modifiedTree);
	});

	test('preprune, postprune', function () {
		var prepruned  = Trees.preprune (tree, function (node){
			return pruneCharsAndEmptyArrays(node, "def");
		});
		var postpruned = Trees.postprune(tree, function (node){
			return pruneCharsAndEmptyArrays(node, "def");
		});
		deepEqual(prepruned, preprunedTree);
		deepEqual(postpruned, postprunedTree);
	});

	test('simple prewalk inplace, postwalk inplace', function () {
		var tree = {a:"a", b:"b", c:"c"};
		var expected = {a:"Xa", b:"Xb", c:"Xc"};
		var inputA = Trees.clone(tree);
		var inputB = Trees.clone(tree);
		var resultA = Trees.prewalk (inputA, function (node) {
			if (typeof node === 'string') {
				node = 'X' + node;
			}
			return node;
		}, true);
		var resultB = Trees.postwalk(inputB, function (node) {
			if (typeof node === 'string') {
				node = 'X' + node;
			}
			return node;
		}, true);
		deepEqual(resultA, inputA);
		deepEqual(resultA, expected);
		deepEqual(resultB, inputB);
		deepEqual(resultB, expected);
	});

	test('more complex prewalk inplace, postwalk inplace', function () {
		var tree = {a: [{one: "one", two: "two"},
						{three: "three", four: "four"}],
					b: {alpha: ["beta", ["gamma"]],
						delta:"delta"}};
		var expected = {a: [{one: "Zone", two: "Ztwo", X: "ZXX"},
							{three: "Zthree", four: "Zfour", X: "ZXX"},
						    "ZXX"],
						b: {alpha: ["Zbeta", ["Zgamma", "ZXX"], "ZXX"],
							delta: "Zdelta",
						    X: "ZXX"},
					    X: "ZXX"};

		var inputA = Trees.clone(tree);
		var resultA = Trees.prewalk(inputA, function (node) {
			if ($.type(node) === 'array') {
				node.push("XX");
			} else if ($.type(node) === 'object') {
				node.X = "XX";
			} else {
				node =  "Z" + node;
			}
			return node;
		}, true);
		deepEqual(resultA, expected);
		deepEqual(resultA, inputA);
	});

	test('prepruneNode, postpruneNode', function () {
		var tree = $('<div><span><b><i></i></b></span></div>')[0];
		var expected = $('<div><span></span></div>')[0].outerHTML;
		var result;
		result = Trees.prepruneDom(tree, function (node) {
			return node.nodeName === 'B';
		});
		equal(result.outerHTML, expected);
		notEqual(result.outerHTML, tree.outerHTML);
		result = Trees.postpruneDom(tree, function (node) {
			return node.nodeName === 'B';
		});
		equal(result.outerHTML, expected);
		notEqual(result.outerHTML, tree.outerHTML);
	});

	test('prewalkDom inplace, postwalkDom inplace', function () {
		var tree = $('<div><span><b><i></i></b><p><b></b></p><div><i></i></div></span></div>')[0];
		var expected = $('<div><span><b>'
						 + '<i><span>X</span></i>'
						 + '<span>X</span>'
						 + '</b>'
						 + '<p>'
						 + '<b><span>X</span></b>'
						 + '<span>X</span>'
						 + '</p>'
						 + '<div><i><span>X</span></i><span>X</span></div>'
						 + '<span>X</span></span><span>X</span></div>')[0];

		var inputA = tree.cloneNode(true);
		var descendedIntoModifiedNode = 0;
		var resultA = Trees.prewalkDom(inputA, function (node) {
			if ($('<span>X</span>')[0].outerHTML !== node.outerHTML) {
				$(node).append('<span>X</span>');
			} else {
				descendedIntoModifiedNode += 1;
			}
			return node;
		}, true);

		var inputB = tree.cloneNode(true);
		var resultB = Trees.postwalkDom(inputB, function (node) {
			$(node).append('<span>X</span>');
			return node;
		}, true);

		equal(descendedIntoModifiedNode, 8);
		equal(resultA.outerHTML, expected.outerHTML);
		equal(resultB.outerHTML, expected.outerHTML);
		equal(resultA.outerHTML, inputA.outerHTML);
		equal(resultB.outerHTML, inputB.outerHTML);
	});
});
