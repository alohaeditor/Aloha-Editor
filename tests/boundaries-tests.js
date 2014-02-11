(function (aloha) {
	'use strict';

	var Boundaries = aloha.boundaries;
	var Ranges = aloha.ranges;
	var Mutation = aloha.mutation;
	var BoundaryMarkers = aloha.boundarymarkers;
	var tested = [];

    module('boundaries');

	function runTest(before, after, op) {
		var dom = $(before)[0];
		var range = Ranges.create(dom, 0);
		BoundaryMarkers.extract(dom, range);
		var boundary = op([range.startContainer, range.startOffset]);
		range.setStart(boundary[0], boundary[1]);
		BoundaryMarkers.insert(range);
		equal(dom.outerHTML, after, before + ' ⇒ ' + after);
	}

	test('prev', function () {
		tested.push('prev');

		var t = function (before, after) {
			runTest(before, after, Boundaries.prev);
		};

		// ie will automatically convert <b>[foo]</b> to <b>{foo]</b>
		if (!aloha.browsers.msie) {
			t('<p><b>[foo]</b></p>', '<p><b>{foo]</b></p>');
		}

		t('<p><b>f[oo]</b></p>', '<p><b>{foo]</b></p>');
		t('<p><b>foo[]</b></p>', '<p><b>{foo]</b></p>');
		t('<p><b>[}</b></p>', '<p><b>{}</b></p>');

		// ie will automatically convery <b>{]</b> to <b>[]</b>
		if (!aloha.browsers.msie) {
			t('<p><b>{]</b></p>', '<p>{<b>]</b></p>');
		}

		// ie will automatically convery <b></b>{] to <b></b>[]
		if (!aloha.browsers.msie) {
			t('<p><b></b>{}</p>', '<p><b>{</b>}</p>');
		}

		t('<p><b></b>{foo]</p>', '<p><b>{</b>foo]</p>');
		t('<p>foo{<b>]</b></p>', '<p>{foo<b>]</b></p>');
		t('<p><b>foo{]</b></p>', '<p><b>{foo]</b></p>');
	});

	test('next', function () {
		tested.push('next');

		var t = function (before, after) {
			runTest(before, after, Boundaries.next);
		};

		t('<p><b>[foo</b>}</p>', '<p><b>foo{</b>}</p>');
		t('<p><b>f[oo</b>}</p>', '<p><b>foo{</b>}</p>');
		t('<p><b>foo[</b>}</p>', '<p><b>foo</b>{}</p>');

		t('<p><b>[</b>}</p>', '<p><b>{</b>}</p>');

		t('<p><b>{</b>}</p>', '<p><b></b>{}</p>');
		t('<p><b>{foo</b>}</p>', '<p><b>foo{</b>}</p>');

		t('<p><b>foo{</b>}</p>', '<p><b>foo</b>{}</p>');
		t('<p><b>{</b>}</p>', '<p><b></b>{}</p>');

		t('<p>{foo}</p>', '<p>foo{}</p>');
		t('<p>{<b>foo</b>}</p>', '<p><b>{foo</b>}</p>');

		t('<p><b>{</b>foo]</p>', '<p><b></b>{foo]</p>');
		t('<p>{foo<b>]</b></p>', '<p>foo{<b>]</b></p>');

		t('<p>{foo<b>]</b></p>', '<p>foo{<b>]</b></p>');

		t('<p><b>{foo]</b></p>', '<p><b>foo{}</b></p>');
	});

	test('prevWhile', function () {
		tested.push('prevWhile');
		var dom = document.createElement('div');
		dom.innerHTML = 'foo<p>bar<b><u><i>baz</i></u>buzz</b></p>';
		Boundaries.prevWhile(Boundaries.fromEndOfNode(dom), function (boundary) {
			Mutation.insertTextAtBoundary('|', boundary, false);
			return Boundaries.prevNode(boundary) !== dom;
		});
		equal(
			dom.outerHTML,
			'<div>|foo|<p>|bar|<b>|<u>|<i>|baz|</i>|</u>|buzz|</b>|</p>|</div>'
		);
	});

	test('nextWhile', function () {
		tested.push('nextWhile');
		var dom = document.createElement('div');
		dom.innerHTML = 'foo<p>bar<b><u><i>baz</i></u>buzz</b></p>';
		Boundaries.nextWhile(Boundaries.fromNode(dom.firstChild), function (boundary) {
			Mutation.insertTextAtBoundary('|', boundary, true);
			return Boundaries.nextNode(boundary) !== dom;
		});
		equal(
			dom.outerHTML,
			'<div>|foo|<p>|bar|<b>||<u>||<i>|baz|</i>||</u>|buzz|</b>||</p>||</div>'
		);
	});

	test('nodeBefore() & nodeAfter()', function () {
		tested.push('nodeBefore');
		tested.push('nodeAfter');
		var t = function (markup, expected) {
			var range = Ranges.create(document.documentElement, 0);
			BoundaryMarkers.extract($(markup)[0], range);
			var left = Boundaries.prevNode(Boundaries.fromRangeStart(range));
			var right = Boundaries.nextNode(Boundaries.fromRangeEnd(range));
			equal(left.data || left.nodeName, expected[0], markup + ' => ' + expected.join());
			equal(right.data || right.nodeName, expected[1], markup + ' => ' + expected.join());
		};
		t('<p>{}<i></i></p>',   ['P', 'I']);
		t('<p>{<i>}</i></p>',   ['P', 'I']);
		t('<p><i>{}</i></p>',   ['I', 'I']);
		t('<p><i>{</i>}</p>',   ['I', 'P']);
		t('<p><i></i>{}</p>',   ['I', 'P']);
		t('<p>a{}<i></i></p>',  ['a', 'I']);
		t('<p>a{<i>}</i></p>',  ['a', 'I']);
		t('<p><i>a{</i>}</p>',  ['a', 'P']);
		t('<p>{<i>}a</i></p>',  ['P', 'a']);
		t('<p><i>{</i>}a</p>',  ['I', 'a']);
		t('<p><i></i>{}a</p>',  ['I', 'a']);
		t('<p><i>a{</i>}b</p>', ['a', 'b']);
		t('<p><i>{foo</i>b<u>a}<u>r</p>', ['I', 'U']);
	});

	//testCoverage(test, tested, Boundaries);

}(window.aloha));
