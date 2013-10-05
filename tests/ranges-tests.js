(function (aloha) {
	'use strict';

	var ranges = aloha.ranges;
	var boundarymarkers = aloha.boundarymarkers;
	var tested = [];

	module('ranges');

	function runTest(before, after, op) {
		var dom = $(before)[0];
		var range = ranges.create();
		boundarymarkers.extract(dom, range);
		op(range);
		boundarymarkers.insert(range);
		equal(dom.outerHTML, after, before + ' ⇒ ' + after);
	}

	test('expandBackwardToVisiblePosition()', function () {
		tested.push('expandBackwardToVisiblePosition');
		var t = function (before, after) {
			return runTest(before, after, ranges.expandBackwardToVisiblePosition);
		};
		t('<b>[]</b>', '<b>[]</b>');
		t('<b>[foo]</b>', '<b>[foo]</b>');
		t('<b>f[oo]</b>', '<b>[foo]</b>');
		t('<b> [foo]</b>', '<b>[ foo]</b>');
		t('<b> [ foo]</b>', '<b>[  foo]</b>');
		t('<b> [  foo]</b>', '<b>[   foo]</b>');
		t('<b>  [foo]</b>', '<b> [ foo]</b>');
		t('<b>  [ foo]</b>', '<b> [  foo]</b>');
		t('<b>  [  foo]</b>', '<b> [   foo]</b>');

		t('<b>foo[bar]</b>', '<b>fo[obar]</b>');
		t('<b>foo [bar]</b>', '<b>foo[ bar]</b>');
		t('<b>foo  [bar]</b>', '<b>foo[  bar]</b>');

		t('<div><p>foo</p>[bar]</div>', '<div><p>foo{</p>bar]</div>');
		t('<div><p>foo</p>{bar]</div>', '<div><p>foo{</p>bar]</div>');
		t('<div><p>foo</p><b>{bar]</b></div>', '<div><p>foo{</p><b>bar]</b></div>');
		t('<div><p>foo</p> <b>{bar]</b></div>', '<div><p>foo{</p> <b>bar]</b></div>');
	});

	/*
	test('expandBackwardToVisiblePosition()', function () {
		tested.push('expandBackwardToVisiblePosition');
		var t = function (before, after) {
			return runTest(before, after, ranges.expandBackwardToVisiblePosition);
		};
		t('<b>[]</b>', '<b>[]</b>');
		t('<b>[] </b>', '<b>[ ]</b>');
		t('<b>[]  </b>', '<b>[ ] </b>');

		t('<b> []</b>', '<b> []</b>');
		t('<b> [] </b>', '<b> [ ]</b>');
		t('<b> [ ] </b>', '<b> [  ]</b>');

		t('<b>  []</b>', '<b>  []</b>');
		t('<b>  [] </b>', '<b>  [ ]</b>');
		t('<b>  [  ]</b>', '<b>  [  ]</b>');

		t('<b>[]foo</b>', '<b>[f]oo</b>');
		t('<b> []foo</b>', '<b> [f]oo</b>');
		t('<b>  []foo</b>', '<b>  [f]oo</b>');

		t('<b>[f]oo</b>', '<b>[fo]o</b>');

		t('<b>[fo]o</b>', '<b>[foo]</b>');
		t('<b>[fo]o </b>', '<b>[foo] </b>');
		t('<b>[fo]o  </b>', '<b>[foo]  </b>');

		t('<b>[foo]</b>', '<b>[foo]</b>');
		t('<b>[foo] </b>', '<b>[foo ]</b>');
		t('<b>[foo]  </b>', '<b>[foo ] </b>');

		t('<b>[foo]bar</b>', '<b>[foob]ar</b>');
		t('<b>[foo] bar</b>', '<b>[foo ]bar</b>');
		t('<b>[foo ] bar</b>', '<b>[foo  b]ar</b>');

		t('<b>[foo ]</b>', '<b>[foo ]</b>');
		t('<b>[foo ] </b>', '<b>[foo  ]</b>');
		t('<b>[foo ]  </b>', '<b>[foo   ]</b>');

		t('<b>[foo ]bar</b>', '<b>[foo b]ar</b>');
		t('<b>[foo ] bar</b>', '<b>[foo  b]ar</b>');
		t('<b>[foo ]  bar</b>', '<b>[foo   b]ar</b>');

		t('<b>[foo  ]</b>', '<b>[foo  ]</b>');
		t('<b>[foo  ] </b>', '<b>[foo   ]</b>');
		t('<b>[foo  ]  </b>', '<b>[foo    ]</b>');

		t('<b>[foo  ]bar</b>', '<b>[foo  b]ar</b>');

		t('<b>[foo  ] bar</b>', '<b>[foo   b]ar</b>');
		t('<b>[foo  ]  bar</b>', '<b>[foo    b]ar</b>');

		t('<b>foo[ ] &nbsp; </b>', '<b>foo[  &nbsp;] </b>');
	});
	*/

	test('expand()', function () {
		tested.push('expand');
		var t = function (before, after) {
			return runTest(before, after, ranges.expand);
		};
		t('<p>x{<b>y</b>}z</p>',              '<p>x{<b>y</b>}z</p>');
		t('<p>x<b>y[]</b>z</p>',              '<p>x<b>y[</b>}z</p>');
		t('<p>x<b>[]</b>y</p>',               '<p>x{<b></b>}y</p>');
		t('<p><b>[x]</b></p>',                '<p>{<b>x</b>}</p>');
		t('<p><u><b>[x]</b></u></p>',         '<p>{<u><b>x</b></u>}</p>');
		t('<p>w<i><u>{<b>x]</b></u></i></p>', '<p>w{<i><u><b>x</b></u></i>}</p>');
		t('<p><b>[x]</b>y</p>',               '<p>{<b>x</b>}y</p>');
		t('<p>x<b>[y]</b>z</p>',              '<p>x{<b>y</b>}z</p>');
		t('<p><b>x[y]z</b></p>',              '<p><b>x[y]z</b></p>');

		t('<div>x<p>y[]</p>z</div>',          '<div>x<p>y[}</p>z</div>');
		t('<div>x<p>y{}</p>z</div>',          '<div>x<p>y{}</p>z</div>');
		t('<div>x<p>{<b>y</b>}</p></div>',    '<div>x<p>{<b>y</b>}</p></div>');
	});

	test('contract()', function () {
		tested.push('contract');
		var t = function (before, after) {
			return runTest(before, after, ranges.contract);
		};
		t('<p>{<b>}</b></p>',                  '<p>{}<b></b></p>');
		t('<p><b>{</b>}</p>',                  '<p><b>{}</b></p>');
		t('<p><b>[foo}</b></p>',               '<p><b>[foo}</b></p>');
		t('<p>foo{<b></b>}</p>',               '<p>foo{}<b></b></p>');
		t('<p><b>{</b><u></u>}</p>',           '<p><b>{}</b><u></u></p>');
		t('<p><b>{foo}</b></p>',               '<p><b>{foo}</b></p>');
		t('<p>{<b><i><u>}</u></i></b></p>',    '<p>{}<b><i><u></u></i></b></p>');
		t('<p>{<b><i><u>foo}</u></i></b></p>', '<p><b><i><u>{foo}</u></i></b></p>');
		t('<p>{<b><i></i>foo}</b></p>',        '<p><b><i></i>{foo}</b></p>');

		t('<p>{<b><i></i><br>foo}</b></p>',    '<p><b><i></i>{<br>foo}</b></p>');
		t('<p><b>{x<br>}</b></p>',             '<p><b>{x<br>}</b></p>');
		t('<div>{<p>x</p>}</div>',             '<div>{<p>x</p>}</div>');
		t('<div><p>{</p>x}</div>',             '<div><p>{</p>x}</div>');
	});

	testCoverage(test, tested, ranges);
}(window.aloha));
