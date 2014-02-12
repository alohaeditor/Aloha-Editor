(function (aloha) {
	'use strict';

	var Traversing = aloha.traversing;
	var Boundaries = aloha.boundaries;
	var BoundaryMarkers = aloha.boundarymarkers;
	var Ranges = aloha.ranges;
	var Dom = aloha.dom;
	var tested = [];

	module('traversing');

	test('nextWhile', function () {
		tested.push('nextWhile');
		var node = $('<div><u></u><a>foo</a>bar<b></b><br/></div>')[0];
		var a;
		var br = Traversing.nextWhile(node.firstChild, function (elem, arg) {
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
		var br = Traversing.prevWhile(node.lastChild, function (elem, arg) {
			if ('BR' === elem.nodeName) {
				a = arg;
				return false;
			}
			return true;
		}, 'foo');
		equal(br.nodeName, node.lastChild.nodeName);
		equal(a, 'foo');

		var text = Traversing.prevWhile(node.lastChild, function (elem) {
			return aloha.dom.Nodes.TEXT !== elem.nodeType;
		});
		equal(text.data, 'bar');
	});

	test('walk', function () {
		tested.push('walk');
		var node = $('<div><u></u><a>foo</a>bar<b></b><br/></div>')[0];
		var nodes = [];
		var counter = {count: 0};
		Traversing.walk(node.firstChild, function (elem, arg) {
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
		Traversing.walkRec(node, function (elem) {
			nodes.push(elem.nodeName);
		});
		equal(nodes.join(' '), '#text BR I #text U B A DIV');
	});

	test('walkUntil', function () {
		tested.push('walkUntil');
		var node = $('<div>foo<b><i><br></i></b><br/><u>bar</u></div>')[0];
		var nodes = [];
		Traversing.walkUntil(node.firstChild, function (elem) {
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
		Traversing.walkUntilNode(node.firstChild, function (elem) {
			nodes.push(elem.nodeName);
		}, node.lastChild.previousSibling);
		equal(nodes.join(' '), '#text B');
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

	test('findBackward', function () {
		tested.push('findBackward');
		var node = $('<div>foo<b><i><br></i></b><br/><u>bar</u></div>')[0];
		equal(Traversing.findBackward(node.lastChild, function (elem) {
			return 'B' === elem.nodeName;
		}), node.firstChild.nextSibling);
	});

	test('findForward', function () {
		tested.push('findForward');
		var node = $('<div>foo<b><i><br></i></b><br/><u>bar</u></div>')[0];
		equal(Traversing.findForward(node.lastChild, function (elem) {
			return 'U' === elem.nodeName;
		}), null);
	});

	test('childAndParentsUntil', function () {
		tested.push('childAndParentsUntil');

		var node = $('<div><p><u><b><i>bar</i></b></u></p></div>')[0];

		var parents = Traversing.childAndParentsUntil(
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

		var parents = Traversing.childAndParentsUntilIncl(
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

		var parents = Traversing.childAndParentsUntilNode(
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

		var parents = Traversing.childAndParentsUntilInclNode(
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

	//testCoverage(test, tested, Traversing);

}(window.aloha));
