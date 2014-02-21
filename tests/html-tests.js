(function (aloha) {
	'use strict';

	var Dom = aloha.dom;
	var Html = aloha.html;
	var Ranges = aloha.ranges;
	var Boundaries = aloha.boundaries;
	var Traversing = aloha.traversing;
	var BoundaryMarkers = aloha.boundarymarkers;

    module('html');

	function runTest(before, after, op) {
		var dom = $(before)[0];
		$('#editable').html('').append(dom);
		var range = Ranges.create(dom, 0);
		BoundaryMarkers.extract(dom, range);
		op(range);
		BoundaryMarkers.insert(range);
		equal(dom.outerHTML, after, before + ' ⇒ ' + after);
	}

	test('Html.next()', function () {
		var t = function (before, after) {
			return runTest(before, after, function (range) {
				var pos = Html.next(Boundaries.fromRangeEnd(range));
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
		t('<div><i>foo{}<br></i>bar</div>', '<div><i>foo{<br></i>}bar</div>');

		t('<div><p>foo{}</p><ul><li>bar</li></ul></div>',
		  '<div><p>foo{</p><ul><li>}bar</li></ul></div>');

		t('<div>foo{}<ul><li>bar</li></ul></div>',
		  '<div>foo{<ul><li>}bar</li></ul></div>');

		t('<p>foo{}<b>bar</b>baz</p>', '<p>foo{<b>b]ar</b>baz</p>');

		t('<p>{}foo</p>', '<p>{f]oo</p>');

		t('<p>[] foo</p>', '<p>[ f]oo</p>');
		t('<div><p>foo[] </p>bar</div>', '<div><p>foo[ </p>}bar</div>');

		// t('<p><i>[] <b> foo</b></i></p>', '<p><i>[ <b> f]oo</b></i></p>'); // known issue

		t('<div><p><b>foo </b></p><p><i><b>[bar]  </b> </i> </p>baz</div>',
		  '<div><p><b>foo </b></p><p><i><b>[bar  </b> </i> </p>}baz</div>');

		t('<div>foo<b>[]  bar</b></div>',        '<div>foo<b>[ ] bar</b></div>');


		t('<div>foo<p><b>[]  bar</b></p></div>', '<div>foo<p><b>[  b]ar</b></p></div>');

		t('<div>foo<p>[]  bar</p></div>',        '<div>foo<p>[  b]ar</p></div>');
		t('<div><p>foo</p>[]  bar</div>',        '<div><p>foo</p>[  b]ar</div>');

		t('<p contenteditable="true">[]</p>',            '<p contenteditable="true">[}</p>');
		t('<p contenteditable="true"><b>[]</b></p>',     '<p contenteditable="true"><b>[</b>}</p>');
		t('<p contenteditable="true"><b>[] </b></p>',    '<p contenteditable="true"><b>[ </b>}</p>');
		t('<p contenteditable="true"><b>[]  </b></p>',   '<p contenteditable="true"><b>[  </b>}</p>');

		t('<p contenteditable="true"><b> []</b></p>',    '<p contenteditable="true"><b> [</b>}</p>');
		t('<p contenteditable="true"><b> [] </b></p>',   '<p contenteditable="true"><b> [ </b>}</p>');
		t('<p contenteditable="true"><b> [ ] </b></p>',  '<p contenteditable="true"><b> [  </b>}</p>');

		t('<p contenteditable="true"><b>  []</b></p>',   '<p contenteditable="true"><b>  [</b>}</p>');
		t('<p contenteditable="true"><b>  [] </b></p>',  '<p contenteditable="true"><b>  [ </b>}</p>');
		t('<p contenteditable="true"><b>  [  ]</b></p>', '<p contenteditable="true"><b>  [  </b>}</p>');

		t('<b>[]foo</b>',   '<b>[f]oo</b>');
		t('<b> []foo</b>',  '<b> [f]oo</b>');
		t('<b>  []foo</b>', '<b>  [f]oo</b>');

		t('<b>[f]oo</b>', '<b>[fo]o</b>');
		t('<b>[fo]o</b>', '<b>[foo}</b>');

		//            ,-- visible whitespace
		//            |
		//            v
		t('<p><b>[fo]o </b><i>bar</i></p>', '<p><b>[foo] </b><i>bar</i></p>');

		//            ,-- unrendered whitespace
		//            |
		//            v
		t('<p><b>[fo]o </b></p>', '<p><b>[foo] </b></p>');

		t('<p><b>[fo]o  </b><i>bar</i></p>', '<p><b>[foo]  </b><i>bar</i></p>');
		t('<p><b>[fo]o  </b></p>',           '<p><b>[foo]  </b></p>');

		t('<p contenteditable="true"><b>[foo]</b></p>',   '<p contenteditable="true"><b>[foo</b>}</p>');
		t('<p contenteditable="true"><b>[foo] </b></p>',  '<p contenteditable="true"><b>[foo </b>}</p>');
		t('<p contenteditable="true"><b>[foo]  </b></p>', '<p contenteditable="true"><b>[foo  </b>}</p>');

		//             ,-- unrendered whitespace
		//             |
		//             v
		t('<p><b>[foo]  </b>bar</p>', '<p><b>[foo ] </b>bar</p>');

		t('<b>[foo]bar</b>',   '<b>[foob]ar</b>');
		t('<b>[foo] bar</b>',  '<b>[foo ]bar</b>');
		t('<b>[foo ] bar</b>', '<b>[foo  b]ar</b>');

		t('<b>[foo ]bar</b>', '<b>[foo b]ar</b>');
		t('<b>[foo ] bar</b>', '<b>[foo  b]ar</b>');
		t('<b>[foo ]  bar</b>', '<b>[foo   b]ar</b>');

		t('<b>[foo  ]bar</b>', '<b>[foo  b]ar</b>');
		t('<b>[foo  ] bar</b>', '<b>[foo   b]ar</b>');
		t('<b>[foo  ]  bar</b>', '<b>[foo    b]ar</b>');

		t('<p contenteditable="true"><b>[foo  ]</b></p>',   '<p contenteditable="true"><b>[foo  </b>}</p>');
		t('<p contenteditable="true"><b>[foo  ] </b></p>',  '<p contenteditable="true"><b>[foo   </b>}</p>');
		t('<p contenteditable="true"><b>[foo  ]  </b></p>', '<p contenteditable="true"><b>[foo    </b>}</p>');

		t('<b>foo[ ] &nbsp; </b>', '<b>foo[  &nbsp;] </b>');

		t('<p contenteditable="true">[]<br></p>', '<p contenteditable="true">[<br>}</p>');

		t('<p>[]<br>foo</p>', '<p>[<br>}foo</p>');
		t('<p>foo[]<br>bar</p>', '<p>foo[<br>}bar</p>');
		t('<p>foo{}<br><br>bar</p>', '<p>foo{<br>}<br>bar</p>');
		t('<p>foo[]<br><br>bar</p>', '<p>foo[<br>}<br>bar</p>');

		t('<div><p>foo[]<br></p>bar</div>', '<div><p>foo[<br></p>}bar</div>');
		t('<div>foo[]<br><p>bar</p></div>', '<div>foo[<br><p>}bar</p></div>');
		t('<div>foo{}<br><p>bar</p></div>', '<div>foo{<br><p>}bar</p></div>');
	});

	test('Html.prev()', function () {
		var t = function (before, after) {
			return runTest(before, after, function (range) {
				var boundary = Html.prev(Boundaries.fromRangeStart(range));
				if (boundary) {
					range.setStart(boundary[0], boundary[1]);
				}
			});
		};

		t('<ul><li>x</li><li></li><li>{}y</li></ul>', '<ul><li>x</li><li>{</li><li>}y</li></ul>');

		return;

		t('<p contenteditable="true"><b>[]</b></p>',        '<p contenteditable="true">{<b>]</b></p>');
		t('<p contenteditable="true"><b>[foo]</b></p>',     '<p contenteditable="true">{<b>foo]</b></p>');
		t('<p contenteditable="true"><b>f[oo]</b></p>',     '<p contenteditable="true">{<b>foo]</b></p>');
		t('<p contenteditable="true"><b> [foo]</b></p>',    '<p contenteditable="true">{<b> foo]</b></p>');
		t('<p contenteditable="true"><b> [ foo]</b></p>',   '<p contenteditable="true">{<b>  foo]</b></p>');
		t('<p contenteditable="true"><b> [  foo]</b></p>',  '<p contenteditable="true">{<b>   foo]</b></p>');
		t('<p contenteditable="true"><b>  [foo]</b></p>',   '<p contenteditable="true">{<b>  foo]</b></p>');
		t('<p contenteditable="true"><b>  [ foo]</b></p>',  '<p contenteditable="true">{<b>   foo]</b></p>');
		t('<p contenteditable="true"><b>  [  foo]</b></p>', '<p contenteditable="true">{<b>    foo]</b></p>');

		t('<p>foo<b> [bar]</b></p>',    '<p>foo<b>{ bar]</b></p>');
		t('<p>foo<b> [ bar]</b></p>',   '<p>foo<b>{  bar]</b></p>');
		t('<p>foo<b> [  bar]</b></p>',  '<p>foo<b>{   bar]</b></p>');
		t('<p>foo<b>  [ bar]</b></p>',  '<p>foo<b>{   bar]</b></p>');

		t('<p>foo<b>  [bar]</b></p>',   '<p>foo<b>{  bar]</b></p>');
	 	t('<p>foo<b>  [ bar]</b></p>',  '<p>foo<b>{   bar]</b></p>');
		t('<p>foo<b>  [  bar]</b></p>', '<p>foo<b>{    bar]</b></p>');

		t('<b>foo[bar]</b>',    '<b>fo[obar]</b>');
		t('<b>foo [bar]</b>',   '<b>foo[ bar]</b>');
		t('<b>foo  [bar]</b>',  '<b>foo[  bar]</b>');

		t('<p>foo{}<br></p>', '<p>fo[o}<br></p>');
		t('<p>foo<br>{}</p>', '<p>fo[o<br>}</p>');

		t('<div><p>foo</p>[bar]</div>', '<div><p>foo[</p>bar]</div>');
		t('<div><p>foo</p>{bar]</div>', '<div><p>foo[</p>bar]</div>');

		t('<div><p>foo</p><b>[bar]</b></div>',  '<div><p>foo[</p><b>bar]</b></div>');
		t('<div><p>foo</p> <b>[bar]</b></div>', '<div><p>foo[</p> <b>bar]</b></div>');

		//                            unrendered whitespace --.
		//                                                    |
		//                                                    v
		t('<div><p>foo </p> <b>[bar]</b></div>', '<div><p>foo[ </p> <b>bar]</b></div>');

		t('<div><p>foo</p> [bar]</div>',  '<div><p>foo[</p> bar]</div>');
		t('<div><p>foo </p> [bar]</div>', '<div><p>foo[ </p> bar]</div>');

		t('<div><p>foo </p> <p> [bar]</p></div>',
		  '<div><p>foo[ </p> <p> bar]</p></div>');

		t('<div>foo<ul><li>bar</li></ul>{}baz</div>',
		  '<div>foo<ul><li>bar[</li></ul>}baz</div>');

		t('<div>foo<ul><li>{}bar</li></ul></div>', '<div>foo[<ul><li>}bar</li></ul></div>');

		t('<p contenteditable="true"><br>[]foo</p>', '<p contenteditable="true">{<br>]foo</p>');

		t('<p>foo<br>[]bar</p>', '<p>foo[<br>]bar</p>');
		t('<p>foo<br><br>[]bar</p>', '<p>foo<br>{<br>]bar</p>');
		t('<div><p>foo<br></p>[]one</div>', '<div><p>foo[<br></p>]one</div>');
	});

	return;

	test('Html.next("word")', function () {
		var dom = $('<div>foo<b>bar</b>s baz</div>')[0];
		var boundary = Html.next(Boundaries.fromNode(dom.firstChild), 'word');
		equal(Boundaries.container(boundary), dom.lastChild);
		equal(Boundaries.offset(boundary), 1);

		var control = 'She stopped.  She said, "Hello there," and then went on.';
		var expected = 'She| |stopped|.| | |She| |said|,| |"|Hello| |there|,|"| |and| |then| |went| |on|.';
		var index = 0;

		var dom = document.createElement('div');
		dom.innerHTML = control;

		Boundaries.walkWhile(
			Boundaries.fromNode(dom.firstChild),
			function (boundary) {
				return !Dom.isEditingHost(Boundaries.nextNode(boundary));
			},
			function (boundary) {
				return Html.next(boundary, 'word');
			},
			function (boundary) {
				if (!Boundaries.isNodeBoundary(boundary)) {
					var offset = Boundaries.offset(boundary) + (index++);
					control = control.substr(0, offset) + '|' + control.substr(offset);
				}
			}
		);
		equal(control, expected, dom.innerHTML + ' => ' + expected);
	});

	test('Html.prev("word")', function () {
		var dom = $('<div>foo <b>bar</b>s baz</div>')[0];
		var boundary = Html.prev(Boundaries.create(dom.firstChild.nextSibling, 1), 'word');
		equal(Boundaries.container(boundary), dom.firstChild);
		equal(Boundaries.offset(boundary), 4);

		var control = 'She stopped.  She said, "Hello there," and then went on.';
		var expected = 'She| |stopped|.| | |She| |said|,| |"|Hello| |there|,|"| |and| |then| |went| |on|.';

		dom = document.createElement('div');
		dom.innerHTML = control;

		Boundaries.walkWhile(
			Boundaries.create(dom, 1),
			function (boundary) {
				return !Dom.isEditingHost(Boundaries.nextNode(boundary));
			},
			function (boundary) {
				return Html.prev(boundary, 'word');
			},
			function (boundary) {
				if (!Boundaries.isNodeBoundary(boundary)) {
					var offset = Boundaries.offset(boundary);
					control = control.substr(0, offset) + '|' + control.substr(offset);
				}
			}
		);
		equal(control, expected, dom.innerHTML + ' => ' + expected);
	});

	test('isVisuallyAdjacent()', function () {
		var t = function (markup, expected) {
			var dom = $(markup)[0];
			var range = Ranges.create(dom, 0);
			BoundaryMarkers.extract(dom, range);
			equal(
				Html.isVisuallyAdjacent(
					Boundaries.fromRangeStart(range),
					Boundaries.fromRangeEnd(range)
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
		equal(Html.isStyleInherited('color'), true);
		equal(Html.isStyleInherited('background'), true);
	});

	test('hasBlockStyle', function () {
		var span = $('<span style="display: block"></span>')[0];
		var div = $('<div></div>')[0];
		var b = $('<b>foo</b>')[0];
		var p = $('<p style="display: inline"></p>')[0];
		var a = $('<a></a>')[0];
		$('body').append([span, div, b, p, a]);
		equal(Html.hasBlockStyle(span), true);
		equal(Html.hasBlockStyle(div), true);
		equal(Html.hasBlockStyle(b), false);
		equal(Html.hasBlockStyle(p), false);
		equal(Html.hasBlockStyle(a), false);
	});

	test('hasInlineStyle', function () {
		var span = $('<span style="display: block"></span>')[0];
		var div = $('<div></div>')[0];
		var b = $('<b>foo</b>')[0];
		var p = $('<p style="display: inline"></p>')[0];
		var a = $('<a></a>')[0];
		$('body').append([span, div, b, p, a]);
		equal(Html.hasInlineStyle(span), false);
		equal(Html.hasInlineStyle(div), false);
		equal(Html.hasInlineStyle(b), true);
		equal(Html.hasInlineStyle(p), true);
		equal(Html.hasInlineStyle(a), true);
	});

	test('isUnrenderedWhitespace', function () {
		equal(Html.isUnrenderedWhitespace(document.createTextNode('\t\r')), false);
		equal(Html.isUnrenderedWhitespace($('<div>\t\r</div>')[0].firstChild), true);
		equal(Html.isUnrenderedWhitespace($('<div>\t\rt</div>')[0].firstChild), false);
	});

	test('skipUnrenderedToStartOfLine', function () {
		var node = $('<div>foo<b>bar </b>\t\r</div>')[0];

		equal(Html.skipUnrenderedToStartOfLine(
			aloha.cursors.cursor(node.lastChild, false)
		), true);
		equal(Html.skipUnrenderedToStartOfLine(
			aloha.cursors.cursor(node.firstChild.nextSibling.firstChild, false)
		), false);
		equal(Html.skipUnrenderedToStartOfLine(
			aloha.cursors.cursor(node.firstChild, false)
		), false);
	});

	test('skipUnrenderedToEndOfLine', function () {
		var node = $('<div>\t\r</div>')[0].firstChild;
		var point = aloha.cursors.cursor(node, false);
		equal(Html.skipUnrenderedToEndOfLine(point), true);
	});

	test('normalizeBoundary', function () {
	});

	test('isEmpty', function () {

		function emptyTest(string, expectedResult) {
			var node = $(string)[0];

			equal(Html.isEmpty(node), expectedResult);
		}

		emptyTest('<p></p>', true);
		emptyTest('<p>One word</p>', false);

	});

	test('nextLineBreak', function () {
		var t = function (before, after) {
			var dom = $(before)[0];
			var range = Ranges.create(dom, 0);
			BoundaryMarkers.extract(dom, range);
			var linebreak = Html.nextLineBreak(
				Boundaries.fromRangeStart(range),
				Boundaries.fromRangeEnd(range)
			);
			if (linebreak) {
				range.setStart(linebreak[0], linebreak[1]);
				BoundaryMarkers.insert(range);
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

}(window.aloha));
