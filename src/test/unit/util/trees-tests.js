Aloha.require(['jquery', 'util/trees'], function($, Trees){
	'use strict';

	var tree = {
		tree: [
			{ array: [ 1, 2, 3 ], map: { "a": 4, "b": 5, "c": 6 } },
			[ { array: [ "d", "e", "f" ], "g": 7, "h": 8, "i": 9 } ]
		]
	};
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
			{ array: [ 11, 12, 13 ], map: { "a": 14, "b": 15, "c": 16 } },
			[ { array: [], "g": 17, "h": 18, "i": 19 } ]
		]
	};
	var postprunedTree = {
		tree: [
			{ array: [ 11, 12, 13 ], map: { "a": 14, "b": 15, "c": 16 } },
			[ { "g": 17, "h": 18, "i": 19 } ]
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
	test('prewalk, postwalk', function() {
		var premodifiedTree  = Trees.prewalk (tree, function(node){ return modifyNode(node, false); }, modifyLeaf);
		var postmodifiedTree = Trees.postwalk(tree, function(node){ return modifyNode(node, true ); }, modifyLeaf);
		deepEqual(premodifiedTree , modifiedTree);
		deepEqual(postmodifiedTree, modifiedTree);
	});

	test('preprune, postprune', function() {
		var prepruned  = Trees.preprune (tree, function(node){ return pruneCharsAndEmptyArrays(node, "def"); }, modifyLeaf);
		var postpruned = Trees.postprune(tree, function(node){ return pruneCharsAndEmptyArrays(node, "DEF"); }, modifyLeaf);
		deepEqual(prepruned, preprunedTree);
		deepEqual(postpruned, postprunedTree);
	});
});
