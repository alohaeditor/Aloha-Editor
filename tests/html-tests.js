(function (aloha) {
	'use strict';

	var html = aloha.html;
	var ranges = aloha.ranges;
	var Boundaries = aloha.boundaries;
	var boundarymarkers = aloha.boundarymarkers;
	var tested = [];

    module('html');

	function runTest(before, after, op) {
		var dom = $(before)[0];
		$('#editable').html('').append(dom);
		var range = ranges.create();
		boundarymarkers.extract(dom, range);
		op(range);
		boundarymarkers.insert(range);
		equal(dom.outerHTML, after, before + ' ⇒ ' + after);
	}

	test('nextVisibleBoundary', function () {
		tested.push('nextVisibleBoundary');
		var t = function (before, after) {
			return runTest(before, after, function (range) {
				var pos = html.nextVisibleBoundary(Boundaries.end(range));
				if (pos[0]) {
					range.setEnd(pos[0], pos[1]);
				}
			});
		};

		t('<div><p contenteditable="true">{}<br></p>foo</div>',
		  '<div><p contenteditable="true">{<br>}</p>foo</div>');

		t('<div><p>foo[]</p><div><ul><li>bar</li></ul></div></div>',
		  '<div><p>foo[</p><div><ul><li>}bar</li></ul></div></div>');

		t('<div>foo<p contenteditable="true">{}bar</p></div>',
		  '<div>foo<p contenteditable="true">{b]ar</p></div>');

		t('<div><p>foo{}<br></p>bar</div>', '<div><p>foo{<br></p>}bar</div>');
		t('<div><i>foo{}<br></i>bar</div>', '<div><i>foo{<br>}</i>bar</div>');

		t('<div><p>foo{}</p><ul><li>bar</li></ul></div>',
		  '<div><p>foo{</p><ul><li>}bar</li></ul></div>');

		t('<div>foo{}<ul><li>bar</li></ul></div>',
		  '<div>foo{<ul><li>}bar</li></ul></div>');

		t('<p>foo{}<b>bar</b>baz</p>', '<p>foo{<b>b]ar</b>baz</p>');

		t('<p>{}foo</p>', '<p>{f]oo</p>');

		t('<p>[] foo</p>', '<p>[ f]oo</p>');
		t('<p>foo[] </p>', '<p>foo[ }</p>');
		t('<p><i>[] <b> foo</b></i></p>', '<p><i>[ <b> f]oo</b></i></p>');
		t('<div><p><b>foo </b></p><p><i><b>[bar]  </b> </i> </p>baz</div>',
		  '<div><p><b>foo </b></p><p><i><b>[bar  </b> </i> </p>b]az</div>');
		t('<div>foo<b>[]  bar</b></div>', '<div>foo<b>[ ] bar</b></div>');
		t('<div>foo<p><b>[]  bar</b></p></div>', '<div>foo<p><b>[  b]ar</b></p></div>');
		t('<div>foo<p>[]  bar</p></div>', '<div>foo<p>[  b]ar</p></div>');
		t('<div><p>foo</p>[]  bar</div>', '<div><p>foo</p>[  b]ar</div>');

		t('<b>[]</b>', '<b>[}</b>');
		t('<b>[] </b>', '<b>[ }</b>');
		t('<b>[]  </b>', '<b>[  }</b>');

		t('<b> []</b>', '<b> [}</b>');
		t('<b> [] </b>', '<b> [ }</b>');
		t('<b> [ ] </b>', '<b> [  }</b>');

		t('<b>  []</b>', '<b>  [}</b>');
		t('<b>  [] </b>', '<b>  [ }</b>');
		t('<b>  [  ]</b>', '<b>  [  }</b>');

		t('<b>[]foo</b>', '<b>[f]oo</b>');
		t('<b> []foo</b>', '<b> [f]oo</b>');
		t('<b>  []foo</b>', '<b>  [f]oo</b>');

		t('<b>[f]oo</b>', '<b>[fo]o</b>');

		t('<b>[fo]o</b>', '<b>[foo}</b>');
		t('<b>[fo]o </b>', '<b>[foo] </b>');
		t('<b>[fo]o  </b>', '<b>[foo]  </b>');

		t('<b>[foo]</b>', '<b>[foo}</b>');
		t('<b>[foo] </b>', '<b>[foo }</b>');

		t('<b>[foo]  </b>', '<b>[foo  }</b>');
		t('<p><b>[foo]  </b>bar</p>', '<p><b>[foo ] </b>bar</p>');

		t('<b>[foo]bar</b>', '<b>[foob]ar</b>');
		t('<b>[foo] bar</b>', '<b>[foo ]bar</b>');
		t('<b>[foo ] bar</b>', '<b>[foo  b]ar</b>');

		t('<b>[foo ]</b>', '<b>[foo }</b>');
		t('<b>[foo ] </b>', '<b>[foo  }</b>');
		t('<b>[foo ]  </b>', '<b>[foo   }</b>');

		t('<b>[foo ]bar</b>', '<b>[foo b]ar</b>');
		t('<b>[foo ] bar</b>', '<b>[foo  b]ar</b>');
		t('<b>[foo ]  bar</b>', '<b>[foo   b]ar</b>');

		t('<b>[foo  ]</b>', '<b>[foo  }</b>');
		t('<b>[foo  ] </b>', '<b>[foo   }</b>');
		t('<b>[foo  ]  </b>', '<b>[foo    }</b>');

		t('<b>[foo  ]bar</b>', '<b>[foo  b]ar</b>');

		t('<b>[foo  ] bar</b>', '<b>[foo   b]ar</b>');
		t('<b>[foo  ]  bar</b>', '<b>[foo    b]ar</b>');

		t('<b>foo[ ] &nbsp; </b>', '<b>foo[  &nbsp;] </b>');

		t('<p>[]<br></p>', '<p>[<br>}</p>');
		t('<p>[]<br>foo</p>', '<p>[<br>}foo</p>');
		t('<p>foo[]<br>bar</p>', '<p>foo[<br>}bar</p>');
		t('<p>foo{}<br><br>bar</p>', '<p>foo{<br>}<br>bar</p>');
		t('<p>foo[]<br><br>bar</p>', '<p>foo[<br>}<br>bar</p>');

		t('<div><p>foo[]<br></p>bar</div>', '<div><p>foo[<br></p>}bar</div>');
		t('<div>foo[]<br><p>bar</p></div>', '<div>foo[<br><p>}bar</p></div>');
		t('<div>foo{}<br><p>bar</p></div>', '<div>foo{<br><p>}bar</p></div>');
	});

	test('previousVisibleBoundary()', function () {
		tested.push('previousVisibleBoundary');
		var t = function (before, after) {
			return runTest(before, after, function (range) {
				var boundary = html.previousVisibleBoundary(Boundaries.start(range));
				if (boundary) {
					range.setStart(boundary[0], boundary[1]);
				}
			});
		};

		t('<b>[]</b>',        '<b>{]</b>');
		t('<b>[foo]</b>',     '<b>{foo]</b>');
		t('<b>f[oo]</b>',     '<b>{foo]</b>');
		t('<b> [foo]</b>',    '<b>{ foo]</b>');
		t('<b> [ foo]</b>',   '<b>{  foo]</b>');
		t('<b> [  foo]</b>',  '<b>{   foo]</b>');
		t('<b>  [foo]</b>',   '<b>{  foo]</b>');
		t('<b>  [ foo]</b>',  '<b>{   foo]</b>');
		t('<b>  [  foo]</b>', '<b>{    foo]</b>');

		t('<p>foo<b> [bar]</b></p>',    '<p>foo<b>{ bar]</b></p>');
		t('<p>foo<b> [ bar]</b></p>',   '<p>foo<b>{  bar]</b></p>');
		t('<p>foo<b> [  bar]</b></p>',  '<p>foo<b>{   bar]</b></p>');
		t('<p>foo<b>  [ bar]</b></p>',  '<p>foo<b> [  bar]</b></p>');

		t('<p>foo<b>  [bar]</b></p>',   '<p>foo<b> [ bar]</b></p>');
	 	t('<p>foo<b>  [ bar]</b></p>',  '<p>foo<b> [  bar]</b></p>');
		t('<p>foo<b>  [  bar]</b></p>', '<p>foo<b> [   bar]</b></p>');

		t('<b>foo[bar]</b>', '<b>fo[obar]</b>');
		t('<b>foo [bar]</b>', '<b>foo[ bar]</b>');
		t('<b>foo  [bar]</b>', '<b>foo [ bar]</b>');
		t('<b> foo  [bar]</b>', '<b> foo [ bar]</b>');

		t('<p>foo{}<br></p>', '<p>fo[o}<br></p>');
		t('<p>foo<br>{}</p>', '<p>foo{<br>}</p>');

		t('<div><p>foo</p>[bar]</div>', '<div><p>foo{</p>bar]</div>');
		t('<div><p>foo</p>{bar]</div>', '<div><p>foo{</p>bar]</div>');

		t('<div><p>foo</p><b>[bar]</b></div>', '<div><p>foo{</p><b>bar]</b></div>');
		t('<div><p>foo</p> <b>[bar]</b></div>', '<div><p>foo{</p> <b>bar]</b></div>');
		t('<div><p>foo </p> <b>[bar]</b></div>', '<div><p>foo[ </p> <b>bar]</b></div>');

		t('<div><p>foo</p> [bar]</div>', '<div><p>foo{</p> bar]</div>');
		t('<div><p>foo </p> [bar]</div>', '<div><p>foo[ </p> bar]</div>');

		t('<div><p>foo </p> <p> [bar]</p></div>',
		  '<div><p>foo[ </p> <p> bar]</p></div>');

		t('<div>foo<ul><li>bar</li></ul>{}baz</div>',
		  '<div>foo<ul><li>bar{</li></ul>}baz</div>');

		t('<p><br>[]foo</p>', '<p>{<br>]foo</p>');
		t('<p>foo<br>[]bar</p>', '<p>foo{<br>]bar</p>');
		t('<p>foo<br><br>[]bar</p>', '<p>foo<br>{<br>]bar</p>');
		t('<div><p>foo<br></p>[]one</div>', '<div><p>foo{<br></p>]one</div>');
	});

	test('isVisuallyAdjacent()', function () {
		tested.push('isVisuallyAdjacent');
		var t = function (markup, expected) {
			var range = ranges.create();
			boundarymarkers.extract($(markup)[0], range);
			equal(
				html.isVisuallyAdjacent(
					Boundaries.start(range),
					Boundaries.end(range)
				),
				expected,
				markup
			);
		};
		t('<p>{}<i></i></p>',   true);
		t('<p>{<i>}</i></p>',   true);
		t('<p><i>{}</i></p>',   true);
		t('<p><i>{</i>}</p>',   true);
		t('<p><i></i>{}</p>',   true);
		t('<p>a{}<i></i></p>',  true);
		t('<p>a{<i>}</i></p>',  true);
		t('<p><i>a{</i>}</p>',  true);
		t('<p>{<i>}a</i></p>',  true);
		t('<p><i>{</i>}a</p>',  true);
		t('<p><i></i>{}a</p>',  true);
		t('<p><i>a{</i>}b</p>', true);
		t('<p><i>a{</i>b}</p>', false);
		t('<p><i>{foo</i>b<u>a}<u>r</p>', false);
		t('<div><p>foo{<br/></p>}bar</div>', true);
		t('<div><p>{foo<br/></p>}bar</div>', false);
		t('<div><p><i>foo{</i><br/></p>}bar</div>', true);
		t('<div><p><i>foo{</i><br/><br/></p>}bar</div>', false);
	});

	test('isStyleInherited', function () {
		tested.push('isStyleInherited');
		equal(html.isStyleInherited('color'), true);
		equal(html.isStyleInherited('background'), true);
	});

	test('hasBlockStyle', function () {
		tested.push('hasBlockStyle');
		var span = $('<span style="display: block"></span>')[0];
		var div = $('<div></div>')[0];
		var b = $('<b>foo</b>')[0];
		var p = $('<p style="display: inline"></p>')[0];
		var a = $('<a></a>')[0];
		$('body').append([span, div, b, p, a]);
		equal(html.hasBlockStyle(span), true);
		equal(html.hasBlockStyle(div), true);
		equal(html.hasBlockStyle(b), false);
		equal(html.hasBlockStyle(p), false);
		equal(html.hasBlockStyle(a), false);
	});

	test('hasInlineStyle', function () {
		tested.push('hasInlineStyle');
		var span = $('<span style="display: block"></span>')[0];
		var div = $('<div></div>')[0];
		var b = $('<b>foo</b>')[0];
		var p = $('<p style="display: inline"></p>')[0];
		var a = $('<a></a>')[0];
		$('body').append([span, div, b, p, a]);
		equal(html.hasInlineStyle(span), false);
		equal(html.hasInlineStyle(div), false);
		equal(html.hasInlineStyle(b), true);
		equal(html.hasInlineStyle(p), true);
		equal(html.hasInlineStyle(a), true);
	});

	test('isUnrenderedWhitespace', function () {
		tested.push('isUnrenderedWhitespace');
		equal(html.isUnrenderedWhitespace(document.createTextNode('\t\r')), false);
		equal(html.isUnrenderedWhitespace($('<div>\t\r</div>')[0].firstChild), true);
		equal(html.isUnrenderedWhitespace($('<div>\t\rt</div>')[0].firstChild), false);
	});

	test('skipUnrenderedToStartOfLine', function () {
		tested.push('skipUnrenderedToStartOfLine');
		var node = $('<div>foo<b>bar </b>\t\r</div>')[0]
		equal(html.skipUnrenderedToStartOfLine(
			aloha.cursors.cursor(node.lastChild, false)
		), true);
		equal(html.skipUnrenderedToStartOfLine(
			aloha.cursors.cursor(node.firstChild.nextSibling.firstChild, false)
		), false);
		equal(html.skipUnrenderedToStartOfLine(
			aloha.cursors.cursor(node.firstChild, false)
		), false);
	});

	test('skipUnrenderedToEndOfLine', function () {
		tested.push('skipUnrenderedToEndOfLine');
		var node = $('<div>\t\r</div>')[0].firstChild;
		var point = aloha.cursors.cursor(node, false);
		equal(html.skipUnrenderedToEndOfLine(point), true);
	});

	test('normalizeBoundary', function () {
		tested.push('normalizeBoundary');
	});

	test('isEmpty', function () {
		tested.push('isEmpty');
	});

	test('nextLineBreak', function () {
		tested.push('nextLineBreak');
		var t = function (before, after) {
			var dom = $(before)[0];
			var range = ranges.create();
			boundarymarkers.extract(dom, range);
			var linebreak = html.nextLineBreak(
				Boundaries.start(range),
				Boundaries.end(range)
			);
			if (linebreak) {
				range.setStart(linebreak[0], linebreak[1]);
				boundarymarkers.insert(range);
			}
			equal(dom.outerHTML, after, before + ' ⇒ ' + after);
		};
		t('<p>{foo<br>bar}</p>', '<p>foo{<br>bar}</p>');
		t('<p>foo{<br>bar}</p>', '<p>foo{<br>bar}</p>');
		t('<p>foo<br>{bar}</p>', '<p>foo<br>bar{}</p>');
		t('<div><p>foo[<i>bar<b>baz<br>foo</b></i></p>bar}</div>',
		  '<div><p>foo<i>bar<b>baz{<br>foo</b></i></p>bar}</div>');
		t('<div><p>{foo<i>bar<b>baz</b></i></p>foo}</div>',
		  '<div><p>foo<i>bar<b>baz</b></i>{</p>foo}</div>');
	});

	testCoverage(test, tested, html);
}(window.aloha));
