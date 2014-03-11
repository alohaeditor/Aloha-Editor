(function (aloha) {
	'use strict';

	var Dom = aloha.dom;
	var Traversing = aloha.traversing;
	var Ranges = aloha.ranges;
	var Boundaries = aloha.boundaries;
	var BoundaryMarkers = aloha.boundarymarkers;

    module('traversing');

	function runTest(before, after, op) {
		var dom = $(before)[0];
		$('#editable').html('').append(dom);
		var range = Ranges.create(dom, 0);
		BoundaryMarkers.extract(dom, range);
		op(range);
		BoundaryMarkers.insert(range);
		equal(dom.outerHTML, after, before + ' ⇒ ' + after);
	}


	test('next', function () {
		var t = function (before, after) {
			return runTest(before, after, function (range) {
				var pos = Traversing.next(Boundaries.fromRangeEnd(range));
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

	test('prev', function () {
		var t = function (before, after) {
			return runTest(before, after, function (range) {
				var boundary = Traversing.prev(Boundaries.fromRangeStart(range));
				if (boundary) {
					range.setStart(boundary[0], boundary[1]);
				}
			});
		};

		t('<ul><li>x</li><li></li><li>{}y</li></ul>', '<ul><li>x</li><li>{</li><li>}y</li></ul>');

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

	test('next("word")', function () {
		var dom = $('<div>foo<b>bar</b>s baz</div>')[0];
		var boundary = Traversing.next(Boundaries.fromNode(dom.firstChild), 'word');
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
				return Traversing.next(boundary, 'word');
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

	test('prev("word")', function () {
		var dom = $('<div>foo <b>bar</b>s baz</div>')[0];
		var boundary = Traversing.prev(Boundaries.create(dom.firstChild.nextSibling, 1), 'word');
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
				return Traversing.prev(boundary, 'word');
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

}(window.aloha));
