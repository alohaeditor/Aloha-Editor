(function (aloha) {
	'use strict';

	var traversing = aloha.traversing;
	var ranges = aloha.ranges;
	var boundarymarkers = aloha.boundarymarkers;
	var tested = [];

	module('traversing');

	test('nextWhile', function () {
		tested.push('nextWhile');
		var node = $('<div><u></u><a>foo</a>bar<b></b><br/></div>')[0];
		var a;
		var br = traversing.nextWhile(node.firstChild, function (elem, arg) {
			if ('BR' === elem.nodeName) {
				a = arg;
				return false;
			}
			return true;
		}, 'foo');
		equal(br.nodeName, node.lastChild.nodeName);
		equal(a, 'foo');
	});

	test('prevWhile', function () {
		tested.push('prevWhile');
		var node = $('<div><u></u><a>foo</a>bar<b></b><br/></div>')[0];
		var a;
		var br = traversing.prevWhile(node.lastChild, function (elem, arg) {
			if ('BR' === elem.nodeName) {
				a = arg;
				return false;
			}
			return true;
		}, 'foo');
		equal(br.nodeName, node.lastChild.nodeName);
		equal(a, 'foo');

		var text = traversing.prevWhile(node.lastChild, function (elem) {
			return aloha.dom.Nodes.TEXT !== elem.nodeType;
		});
		equal(text.data, 'bar');
	});

	test('walk', function () {
		tested.push('walk');
		var node = $('<div><u></u><a>foo</a>bar<b></b><br/></div>')[0];
		var nodes = [];
		var counter = {count: 0};
		traversing.walk(node.firstChild, function (elem, arg) {
			arg.count++;
			nodes.push(elem.nodeName);
		}, counter);
		equal(nodes.join(' '), 'U A #text B BR');
		equal(counter.count, node.childNodes.length);
	});

	test('walkRec', function () {
		tested.push('walkRec');
		var node = $('<div><a>foo<b><i><br></i><u>bar</u></b></a></div>')[0];
		var nodes = [];
		traversing.walkRec(node, function (elem) {
			nodes.push(elem.nodeName);
		});
		equal(nodes.join(' '), '#text BR I #text U B A DIV');
	});

	test('walkUntil', function () {
		tested.push('walkUntil');
		var node = $('<div>foo<b><i><br></i></b><br/><u>bar</u></div>')[0];
		var nodes = [];
		traversing.walkUntil(node.firstChild, function (elem) {
			nodes.push(elem.nodeName);
		}, function (elem, arg) {
			return arg === elem.nodeName;
		}, 'BR');
		equal(nodes.join(' '), '#text B');
	});

	test('walkUntilNode', function () {
		tested.push('walkUntilNode');
		var node = $('<div>foo<b><i><br></i></b><br/><u>bar</u></div>')[0];
		var nodes = [];
		traversing.walkUntilNode(node.firstChild, function (elem) {
			nodes.push(elem.nodeName);
		}, node.lastChild.previousSibling);
		equal(nodes.join(' '), '#text B');
	});

	test('findThrough', function () {
		tested.push('findThrough');
		var nodes = [];
		var steps = [];
		traversing.findThrough(
			$('<div>one<b>two<u><i>three</i></u>four</b>five</div>')[0],
			function (node, isSteppingIn) {
				steps.push(isSteppingIn ? 1 : 0);
				nodes.push(node);
			}
		);
		var expectedNodes = [
			'five', 'B', 'four', 'U', 'I', 'three', 'I', 'U', 'two', 'B', 'one'
		];
		var i;
		for (i = 0; i < expectedNodes.length; i++) {
			equal(nodes[i] && (nodes[i].data || nodes[i].nodeName), expectedNodes[i]);
		}
		var expectedSteps = [1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 0];
		for (i = 0; i < expectedSteps.length; i++) {
			equal(steps[i], expectedSteps[i], nodes[i] && (nodes[i].data || nodes[i].nodeName));
		}
	});

	function testTraversing(node, op, expected) {
		var nodes = [node];
		while (node && (node = op(node))) {
			nodes.push(node);
		}
		var i;
		for (i = 0; i < expected.length; i++) {
			equal(nodes[i] && (nodes[i].data || nodes[i].nodeName), expected[i]);
		}
	}

	test('backward', function () {
		tested.push('backward');
		testTraversing(
			$('<div>one<b>two<u><i>three</i></u>four</b>five</div>')[0].lastChild,
			traversing.backward,
			['five', 'four', 'three', 'I', 'U', 'two', 'B', 'one']
		);
	});

	test('forward', function () {
		tested.push('forward');
		testTraversing(
			$('<div>one<b>two<u><i>three</i></u>four</b>five</div>')[0].firstChild,
			traversing.forward,
			['one', 'B', 'two', 'U', 'I', 'three', 'four', 'five']
		);
	});

	test('findBackward', function () {
		tested.push('findBackward');
		var node = $('<div>foo<b><i><br></i></b><br/><u>bar</u></div>')[0];
		equal(traversing.findBackward(node.lastChild, function (elem) {
			return 'B' === elem.nodeName;
		}), node.firstChild.nextSibling);
	});

	test('findForward', function () {
		tested.push('findForward');
		var node = $('<div>foo<b><i><br></i></b><br/><u>bar</u></div>')[0];
		equal(traversing.findForward(node.lastChild, function (elem) {
			return 'U' === elem.nodeName;
		}), null);
	});

	test('findWordBoundaryAhead', function () {
		tested.push('findWordBoundaryAhead');
		var node = $('<div>foo<b>bar</b>s baz</div>')[0];
		var boundary = traversing.findWordBoundaryAhead(node.firstChild, 0);
		equal(boundary.node, node.lastChild);
		equal(boundary.offset, 1);
	});

	test('findWordBoundaryBehind', function () {
		tested.push('findWordBoundaryBehind');
		var node = $('<div>foo <b>bar</b>s baz</div>')[0];
		var boundary = traversing.findWordBoundaryBehind(node.firstChild.nextSibling, 1);
		equal(boundary.node, node.firstChild);
		equal(boundary.offset, 4);
	});

	test('parentsUntil', function () {
		tested.push('parentsUntil');

		var node = $('<div><p><u><b><i>bar</i></b></u></p></div>')[0];

		var parents = traversing.parentsUntil(
			node.firstChild.firstChild.firstChild.firstChild,
			function (elem) {
				return 'DIV' === elem.nodeName;
			}
		);

		equal(parents.length, 3);

		if (parents.length === 3) {
			equal(parents[0].nodeName, 'B');
			equal(parents[1].nodeName, 'U');
			equal(parents[2].nodeName, 'P');
		}
	});

	test('parentsUntilIncl', function () {
		tested.push('parentsUntilIncl');

		var node = $('<div><p><u><b><i>bar</i></b></u></p></div>')[0];

		var parents = traversing.parentsUntilIncl(
			node.firstChild.firstChild.firstChild.firstChild,
			function (elem) {
				return 'DIV' === elem.nodeName;
			}
		);

		equal(parents.length, 4);

		if (parents.length === 4) {
			equal(parents[0].nodeName, 'B');
			equal(parents[1].nodeName, 'U');
			equal(parents[2].nodeName, 'P');
			equal(parents[3].nodeName, 'DIV');
		}
	});

	test('childAndParentsUntil', function () {
		tested.push('childAndParentsUntil');

		var node = $('<div><p><u><b><i>bar</i></b></u></p></div>')[0];

		var parents = traversing.childAndParentsUntil(
			node.firstChild.firstChild.firstChild.firstChild,
			function (elem) {
				return 'DIV' === elem.nodeName;
			}
		);

		equal(parents.length, 4);

		if (parents.length === 4) {
			equal(parents[0].nodeName, 'I');
			equal(parents[1].nodeName, 'B');
			equal(parents[2].nodeName, 'U');
			equal(parents[3].nodeName, 'P');
		}
	});

	test('childAndParentsUntilIncl', function () {
		tested.push('childAndParentsUntilIncl');

		var node = $('<div><p><u><b><i>bar</i></b></u></p></div>')[0];

		var parents = traversing.childAndParentsUntilIncl(
			node.firstChild.firstChild.firstChild.firstChild,
			function (elem) {
				return 'DIV' === elem.nodeName;
			}
		);

		equal(parents.length, 5);

		if (parents.length === 5) {
			equal(parents[0].nodeName, 'I');
			equal(parents[1].nodeName, 'B');
			equal(parents[2].nodeName, 'U');
			equal(parents[3].nodeName, 'P');
			equal(parents[4].nodeName, 'DIV');
		}
	});

	test('childAndParentsUntilNode', function () {
		tested.push('childAndParentsUntilNode');

		var node = $('<div><p><u><b><i>bar</i></b></u></p></div>')[0];

		var parents = traversing.childAndParentsUntilNode(
			node.firstChild.firstChild.firstChild.firstChild,
			node.firstChild
		);

		equal(parents.length, 3);

		if (parents.length === 3) {
			equal(parents[0].nodeName, 'I');
			equal(parents[1].nodeName, 'B');
			equal(parents[2].nodeName, 'U');
		}
	});

	test('childAndParentsUntilInclNode', function () {
		tested.push('childAndParentsUntilInclNode');

		var node = $('<div><p><u><b><i>bar</i></b></u></p></div>')[0];

		var parents = traversing.childAndParentsUntilInclNode(
			node.firstChild.firstChild.firstChild.firstChild,
			node.firstChild
		);

		equal(parents.length, 4);

		if (parents.length === 4) {
			equal(parents[0].nodeName, 'I');
			equal(parents[1].nodeName, 'B');
			equal(parents[2].nodeName, 'U');
			equal(parents[3].nodeName, 'P');
		}
	});

	testCoverage(test, tested, traversing);
}(window.aloha));
