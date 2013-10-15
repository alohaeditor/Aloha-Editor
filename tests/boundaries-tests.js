(function (aloha) {
	'use strict';

	var boundaries = aloha.boundaries;
	var ranges = aloha.ranges;
	var boundarymarkers = aloha.boundarymarkers;
	var tested = [];

    module('boundaries');

	function runTest(before, after, op) {
		var dom = $(before)[0];
		var range = ranges.create();
		boundarymarkers.extract(dom, range);
		var boundary = op([range.startContainer, range.startOffset]);
		range.setStart(boundary[0], boundary[1]);
		boundarymarkers.insert(range);
		equal(dom.outerHTML, after, before + ' ⇒ ' + after);
	}

	test('prev', function () {
		tested.push('prev');

		var t = function (before, after) {
			runTest(before, after, boundaries.prev);
		};

		// ie will automatically convert <b>[foo]</b> to <b>{foo]</b>
		if (!aloha.browser.browser.msie) {
			t('<p><b>[foo]</b></p>', '<p><b>{foo]</b></p>');
		}

		t('<p><b>f[oo]</b></p>', '<p><b>{foo]</b></p>');
		t('<p><b>foo[]</b></p>', '<p><b>{foo]</b></p>');
		t('<p><b>[]</b></p>', '<p><b>{]</b></p>');

		// ie will automatically convery <b>{]</b> to <b>[]</b>
		if (!aloha.browser.browser.msie) {
			t('<p><b>{]</b></p>', '<p>{<b>]</b></p>');
		}

		// ie will automatically convery <b></b>{] to <b></b>[]
		if (!aloha.browser.browser.msie) {
			t('<p><b></b>{}</p>', '<p><b>{</b>}</p>');
		}

		t('<p><b></b>{foo]</p>', '<p><b>{</b>foo]</p>');
		t('<p>foo{<b>]</b></p>', '<p>{foo<b>]</b></p>');
		t('<p><b>foo{]</b></p>', '<p><b>{foo]</b></p>');
	});

	test('prevWhile', function () {
		tested.push('prevWhile');
		var dom = $('<div>foo<p>bar<b><u><i>baz</i></u>buzz</b></p></div>')[0];
		var range = ranges.create();
		boundaries.prevWhile(
			[dom, aloha.dom.nodeIndex(dom.lastChild) + 1],
			function (pos, container, offset) {
				if (container && container.parentNode) {
					range.setStart(container, offset);
					range.setEnd(container, offset);
					ranges.insertTextBehind(range, '|');
					return true;
				}
				return false;
			}
		);
		equal(
			dom.outerHTML,
			'<div>|foo|<p>|bar|<b>|<u>|<i>|baz|</i>|</u>|buzz|</b>|</p>|</div>'
		);
	});

	test('next', function () {
		tested.push('next');

		var t = function (before, after) {
			runTest(before, after, boundaries.next);
		};

		t('<p><b>[foo</b>}</p>', '<p><b>foo{</b>}</p>');
		t('<p><b>f[oo</b>}</p>', '<p><b>foo{</b>}</p>');
		t('<p><b>foo[</b>}</p>', '<p><b>foo{</b>}</p>');
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

	test('nextWhile', function () {
		tested.push('nextWhile');
		var dom = $('<div>foo<p>bar<b><br><u><i>baz</i></u>buzz</b></p></div>')[0];
		var range = ranges.create();
		boundaries.nextWhile([dom, 0], function (pos, container, offset) {
			if (container && container.parentNode) {
				range.setStart(container, offset);
				range.setEnd(container, offset);
				ranges.insertTextBehind(range, '|');
				return true;
			}
			return false;
		});
		equal(
			dom.outerHTML,
			'<div>|foo|<p>|bar|<b>||<br>||<u>||<i>|baz|</i>||</u>|buzz|</b>||</p>||</div>'
		);
	});

	test('leftNode() & rightNode()', function () {
		tested.push('leftNode');
		tested.push('rightNode');
		var t = function (markup, expected) {
			var range = ranges.create();
			boundarymarkers.extract($(markup)[0], range);
			var left = boundaries.leftNode(boundaries.start(range));
			var right = boundaries.rightNode(boundaries.end(range));
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

	testCoverage(test, tested, boundaries);
}(window.aloha));
