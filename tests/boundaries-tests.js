(function (aloha, module, equal, test, require) {
	'use strict';

	var Markers = aloha.markers;
	var Mutation; require('../src/mutation', function (Module) { Mutation = Module; });
	var Boundaries; require('../src/boundaries', function (Module) { Boundaries = Module; });

    module('boundaries');

	function runTest(before, after, op) {
		var boundaries = Markers.extract($(before)[0]);
		equal(
			Markers.hint([op(boundaries[0]), boundaries[1]]),
			after,
			before + ' ⇒ ' + after
		);
	}

	test('prev', function () {
		var t = function (before, after) {
			runTest(before, after, Boundaries.prev);
		};

		// ie will automatically convert <b>[foo]</b> to <b>{foo]</b>
		if (!aloha.browsers.msie) {
			t('<p><b>[foo]</b></p>', '<p>{<b>foo]</b></p>');
		}

		t('<p><b>f[oo]</b></p>', '<p><b>{foo]</b></p>');
		t('<p><b>foo[]</b></p>', '<p><b>{foo]</b></p>');
		t('<p><b>[}</b></p>',    '<p>{<b>}</b></p>');

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

	test('prevRawBoundary', function () {
		var t = function (before, after) {
			runTest(before, after, Boundaries.prevRawBoundary);
		};

		// ie will automatically convert <b>[foo]</b> to <b>{foo]</b>
		if (!aloha.browsers.msie) {
			t('<p><b>[foo]</b></p>', '<p><b>{foo]</b></p>');
		}

		t('<p><b>[}</b></p>',    '<p><b>{}</b></p>');
		t('<p><b>{}</b></p>',    '<p>{<b>}</b></p>');
		t('<p><b>foo{}</b></p>', '<p><b>foo[}</b></p>');
	});

	test('next', function () {
		var t = function (before, after) {
			runTest(before, after, Boundaries.next);
		};
		t('<p><b>[foo</b>}</p>', '<p><b>foo{</b>}</p>');
		t('<p><b>f[oo</b>}</p>', '<p><b>foo{</b>}</p>');
		t('<p><b>foo[</b>}</p>', '<p><b>foo</b>{}</p>');
		t('<p><b>[</b>}</p>',    '<p><b>{</b>}</p>');
		t('<p><b>{</b>}</p>',    '<p><b></b>{}</p>');
		t('<p><b>{foo</b>}</p>', '<p><b>foo{</b>}</p>');
		t('<p><b>foo{</b>}</p>', '<p><b>foo</b>{}</p>');
		t('<p><b>{</b>}</p>',    '<p><b></b>{}</p>');
		t('<p>{foo}</p>',        '<p>foo{}</p>');
		t('<p>{<b>foo</b>}</p>', '<p><b>{foo</b>}</p>');
		t('<p><b>{</b>foo]</p>', '<p><b></b>{foo]</p>');
		t('<p>{foo<b>]</b></p>', '<p>foo{<b>]</b></p>');
		t('<p>{foo<b>]</b></p>', '<p>foo{<b>]</b></p>');
		t('<p><b>[foo}</b></p>', '<p><b>foo{}</b></p>');
	});

	test('prevWhile', function () {
		var dom = document.createElement('div');
		dom.innerHTML = 'foo<p>bar<b><u><i>baz</i></u>buzz</b></p>';
		Boundaries.prevWhile(
			Boundaries.fromEndOfNode(dom),
			function (boundary) {
				Mutation.insertTextAtBoundary('|', boundary, false);
				return Boundaries.prevNode(boundary) !== dom;
			}
		);
		equal(
			dom.outerHTML,
			'<div>|foo|<p>|bar|<b>|<u>|<i>|baz|</i>|</u>|buzz|</b>|</p>|</div>'
		);
	});

	test('nextWhile', function () {
		var dom = document.createElement('div');
		dom.innerHTML = 'foo<p>bar<b><u><i>baz</i></u>buzz</b></p>';
		Boundaries.nextWhile(
			Boundaries.fromStartOfNode(dom),
			function (boundary) {
				Mutation.insertTextAtBoundary('|', boundary, true);
				return Boundaries.nextNode(boundary) !== dom;
			}
		);
		equal(
			dom.outerHTML,
			'<div>|foo|<p>|bar|<b>||<u>||<i>|baz|</i>||</u>|buzz|</b>||</p>||</div>'
		);
	});

	test('nodeBefore & nodeAfter', function () {
		var t = function (markup, expected) {
			var boundaries = Markers.extract($(markup)[0]);
			var left = Boundaries.prevNode(boundaries[0]);
			var right = Boundaries.nextNode(boundaries[1]);
			equal(left.data || left.nodeName, expected[0], markup + ' => ' + expected.join());
			equal(right.data || right.nodeName, expected[1], markup + ' => ' + expected.join());
		};
		t('<p>{}<i></i></p>',             ['P', 'I']);
		t('<p>{<i>}</i></p>',             ['P', 'I']);
		t('<p><i>{}</i></p>',             ['I', 'I']);
		t('<p><i>{</i>}</p>',             ['I', 'P']);
		t('<p><i></i>{}</p>',             ['I', 'P']);
		t('<p>a{}<i></i></p>',            ['a', 'I']);
		t('<p>a{<i>}</i></p>',            ['a', 'I']);
		t('<p><i>a{</i>}</p>',            ['a', 'P']);
		t('<p>{<i>}a</i></p>',            ['P', 'a']);
		t('<p><i>{</i>}a</p>',            ['I', 'a']);
		t('<p><i></i>{}a</p>',            ['I', 'a']);
		t('<p><i>a{</i>}b</p>',           ['a', 'b']);
		t('<p><i>{foo</i>b<u>a}<u>r</p>', ['I', 'U']);
	});

}(window.aloha, window.module, window.equal, window.test, window.require));
