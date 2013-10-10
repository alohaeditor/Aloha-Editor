(function (aloha) {
	'use strict';

	var html = aloha.html;
	var ranges = aloha.ranges;
	var boundarymarkers = aloha.boundarymarkers;
	var tested = [];

    module('html');

	function runTest(before, after, op) {
		var dom = $(before)[0];
		var range = ranges.create();
		boundarymarkers.extract(dom, range);
		op(range);
		boundarymarkers.insert(range);
		equal(dom.outerHTML, after, before + ' ⇒ ' + after);
	}

	test('nextVisiblePosition', function () {
		tested.push('nextVisiblePosition');
		var t = function (before, after) {
			return runTest(before, after, function (range) {
				var pos = html.nextVisiblePosition(
					range.endContainer,
					range.endOffset
				);
				if (pos.node) {
					range.setEnd(pos.node, pos.offset);
				}
			});
		};

		t('<div>foo<p contenteditable="true">{}bar</p></div>',
		  '<div>foo<p contenteditable="true">{b]ar</p></div>');

		t('<div><p>foo{}<br></p>bar</div>', '<div><p>foo{<br></p>]bar</div>');
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

		t('<b>[fo]o</b>', '<b>[foo]</b>');
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
		t('<p>[]<br>foo</p>', '<p>[<br>]foo</p>');
		t('<p>foo[]<br>bar</p>', '<p>foo[<br>]bar</p>');
		t('<p>foo{}<br><br>bar</p>', '<p>foo{<br>}<br>bar</p>');
		t('<p>foo[]<br><br>bar</p>', '<p>foo[<br>}<br>bar</p>');
		t('<div><p>foo[]<br></p>one</div>', '<div><p>foo[<br></p>]one</div>');
	});

	test('previousVisiblePosition()', function () {
		tested.push('previousVisiblePosition');
		var t = function (before, after) {
			return runTest(before, after, function (range) {
				var pos = html.previousVisiblePosition(
					range.startContainer,
					range.startOffset
				);
				if (pos.node) {
					range.setStart(pos.node, pos.offset);
				}
			});
		};

		t('<b>[]</b>',        '<b>[]</b>');
		t('<b>[foo]</b>',     '<b>[foo]</b>');
		t('<b>f[oo]</b>',     '<b>[foo]</b>');
		t('<b> [foo]</b>',    '<b>[ foo]</b>');
		t('<b> [ foo]</b>',   '<b>[  foo]</b>');
		t('<b> [  foo]</b>',  '<b>[   foo]</b>');
		t('<b>  [foo]</b>',   '<b>[  foo]</b>');
		t('<b>  [ foo]</b>',  '<b>[   foo]</b>');
		t('<b>  [  foo]</b>', '<b>[    foo]</b>');

		t('<p>foo<b> [bar]</b></p>',    '<p>foo<b>[ bar]</b></p>');
		t('<p>foo<b> [ bar]</b></p>',   '<p>foo<b>[  bar]</b></p>');
		t('<p>foo<b> [  bar]</b></p>',   '<p>foo<b>[   bar]</b></p>');
		t('<p>foo<b>  [ bar]</b></p>',  '<p>foo<b> [  bar]</b></p>');

		t('<p>foo<b>  [bar]</b></p>',   '<p>foo<b> [ bar]</b></p>');
	 	t('<p>foo<b>  [ bar]</b></p>',  '<p>foo<b> [  bar]</b></p>');
		t('<p>foo<b>  [  bar]</b></p>', '<p>foo<b> [   bar]</b></p>');

		t('<b>foo[bar]</b>', '<b>fo[obar]</b>');
		t('<b>foo [bar]</b>', '<b>foo[ bar]</b>');
		t('<b>foo  [bar]</b>', '<b>foo [ bar]</b>');
		t('<b> foo  [bar]</b>', '<b> foo [ bar]</b>');

		t('<p>foo{}<br></p>', '<p>fo[o}<br></p>');
		t('<p>foo<br>{}</p>', '<p>foo[<br>}</p>');

		t('<div><p>foo</p>[bar]</div>',
		  '<div><p>foo[</p>bar]</div>');

		t('<div><p>foo</p>{bar]</div>',
		  '<div><p>foo[</p>bar]</div>');

		t('<div><p>foo</p><b>[bar]</b></div>',
		  '<div><p>foo[</p><b>bar]</b></div>');

		t('<div><p>foo</p> <b>[bar]</b></div>',
		  '<div><p>foo[</p> <b>bar]</b></div>');

		t('<div><p>foo </p> <b>[bar]</b></div>',
		  '<div><p>foo[ </p> <b>bar]</b></div>');

		t('<div><p>foo</p> [bar]</div>',
		  '<div><p>foo[</p> bar]</div>');

		t('<div><p>foo </p> [bar]</div>',
		  '<div><p>foo[ </p> bar]</div>');

		t('<div><p>foo </p> <p> [bar]</p></div>',
		  '<div><p>foo[ </p> <p> bar]</p></div>');

		t('<p><br>[]foo</p>', '<p>{<br>]foo</p>');
		t('<p>foo<br>[]bar</p>', '<p>foo[<br>]bar</p>');
		t('<p>foo<br><br>[]bar</p>', '<p>foo<br>{<br>]bar</p>');
		t('<div><p>foo<br></p>[]one</div>', '<div><p>foo[<br></p>]one</div>');
	});

	test('isControlCharacter', function () {
		tested.push('isControlCharacter');
		equal(html.isControlCharacter('\0'), true);
		equal(html.isControlCharacter('\b'), true);
		equal(html.isControlCharacter('\n'), true);
		equal(html.isControlCharacter('\r'), true);
		equal(html.isControlCharacter('\t'), true);
		equal(html.isControlCharacter('\f'), true);
		equal(html.isControlCharacter('\v'), true);
		equal(html.isControlCharacter('\u0000'), true);
		equal(html.isControlCharacter('0'), false);
		equal(html.isControlCharacter(''), false);
		equal(html.isControlCharacter('a'), false);
	});

	/*
	test('isVisuallyAdjacent()', function () {
		//t('<div><p>ba{</p>}az</div>', true);
	});

	test('removeVisualBreak()', function () {
		var t = function(before, after) {
			return runTest(before, after, editing.joinRangeContainers);
		};
		t('<div><p>foo{</p><p>}bar</p></div>', '<div><p>foo{}bar</p></div>');
		t('<div><p>foo[</p><p>]bar</p></div>', '<div><p>foo[]bar</p></div>');
		t('<div><b>foo[</b><b>]bar</b></div>', '<div><b>foo[]bar</b></div>');
		t('<div><b>foo{</b><i>}bar</i></div>', '<div><b>foo{}</b><i>bar</i></div>');
		t('<div><b>foo[</b><i>]bar</i></div>', '<div><b>foo[]</b><i>bar</i></div>');
		t('<div><b>foo{</b><p>}bar</p></div>', '<div><b>foo{}</b>bar</div>');
		t('<div><b>foo[</b><p>]bar</p></div>', '<div><b>foo[]</b>bar</div>');
		t('<div><b>foo[</b><p><b>]bar</b></p></div>',
		                                       '<div><b>foo[]bar</b></div>');
		t('<div><p><b>foo{</b></p>\n<i>\t\r\n<b>}bar</b></i></div>',
		                                       '<div><p><b>foo{}</b><i>\t\r\n<b>bar</b></i></p>\n</div>');

		// TODO: Lists
	});
	*/

	test('isStyleInherited', function () {
		tested.push('isStyleInherited');
		equal(html.isStyleInherited('color'), true);
		equal(html.isStyleInherited('background'), true);
	});

	test('isBlockType', function () {
		tested.push('isBlockType');
		var span = $('<span style="display: block"></span>')[0];
		var div = $('<div></div>')[0];
		var b = $('<b>foo</b>')[0];
		var p = $('<p style="display: inline"></p>')[0];
		var a = $('<a></a>')[0];
		$('body').append([span, div, b, p, a]);
		equal(html.isBlockType(span), false);
		equal(html.isBlockType(div), true);
		equal(html.isBlockType(b), false);
		equal(html.isBlockType(p), true);
		equal(html.isBlockType(a), false);
	});

	test('isInlineType', function () {
		tested.push('isInlineType');
		var span = $('<span style="display: block"></span>')[0];
		var div = $('<div></div>')[0];
		var b = $('<b>foo</b>')[0];
		var p = $('<p style="display: inline"></p>')[0];
		var a = $('<a></a>')[0];
		$('body').append([span, div, b, p, a]);
		equal(html.isInlineType(span), true);
		equal(html.isInlineType(div), false);
		equal(html.isInlineType(b), true);
		equal(html.isInlineType(p), false);
		equal(html.isInlineType(a), true);
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

	testCoverage(test, tested, html);
}(window.aloha));
