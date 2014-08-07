(function (aloha) {
	'use strict';

	var Dom = aloha.dom;
	var Traversing = aloha.traversing;
	var Boundaries = aloha.boundaries;
	var Markers = aloha.markers;

    module('traversing');

	function runTest(before, after, op) {
		var boundaries = Markers.extract($(before)[0]);
		var actual = Markers.hint(op(boundaries));
		equal(actual, after, before + ' ⇒ ' + after);
	}

	test('next', function () {
		var t = function (before, after) {
			return runTest(before, after, function (boundaries) {
				return [boundaries[0], Traversing.next(boundaries[1])];
			});
		};

		t('<div><p contenteditable="true">{}<br></p>foo</div>',
		  '<div><p contenteditable="true">{<br>}</p>foo</div>');

		t(
			'<div contenteditable="true">'
				+ '<ul>'
				+ '<li><p>[foo]</p></li>'
				+ '<li><b><i>bar</i></b></li>'
				+ '</ul>'
				+ '</div>',
			'<div contenteditable="true">'
				+ '<ul>'
				+ '<li><p>[foo</p></li>'
				+ '<li><b><i>}bar</i></b></li>'
				+ '</ul>'
				+ '</div>'
		);

		t('<div contenteditable="true"><p>{}<br></p>foo</div>',
		  '<div contenteditable="true"><p>{<br></p>}foo</div>');

		t('<div><p>foo{}<br></p>bar</div>', '<div><p>foo{<br></p>}bar</div>');

		t('<div contenteditable="true"><p>foo[]</p><div><ul><li>bar</li></ul></div></div>',
		  '<div contenteditable="true"><p>foo[</p><div><ul><li>}bar</li></ul></div></div>');

		t('<p contenteditable="true">{}bar</p>', '<p contenteditable="true">{b]ar</p>');

		t('<div contenteditable="true"><i>foo{}<br></i>bar</div>',
		  '<div contenteditable="true"><i>foo{<br></i>}bar</div>');

		t('<div contenteditable="true"><p>foo{}</p><ul><li>bar</li></ul></div>',
		  '<div contenteditable="true"><p>foo{</p><ul><li>}bar</li></ul></div>');

		t('<div contenteditable="true">foo{}<ul><li>bar</li></ul></div>',
		  '<div contenteditable="true">foo{<ul><li>}bar</li></ul></div>');

		t('<p contenteditable="true">foo{}<b>bar</b>baz</p>',
		  '<p contenteditable="true">foo{<b>b]ar</b>baz</p>');

		t('<p>{}foo</p>', '<p>{f]oo</p>');

		t('<p>[] foo</p>', '<p>[ f]oo</p>');
		t('<div><p>foo[] </p>bar</div>', '<div><p>foo[ </p>}bar</div>');

		// t('<p><i>[] <b> foo</b></i></p>', '<p><i>[ <b> f]oo</b></i></p>'); // known issue

		t('<div><p><b>[foo </b></p><p><i><b>bar]  </b> </i> </p>baz</div>',
		  '<div><p><b>[foo </b></p><p><i><b>bar  </b> </i> </p>}baz</div>');

		t('<div>[foo<b>]  bar</b></div>',        '<div>[foo<b> ] bar</b></div>');


		t('<div>[foo<p><b>]  bar</b></p></div>', '<div>[foo<p><b>  b]ar</b></p></div>');

		t('<div>[foo<p>]  bar</p></div>',        '<div>[foo<p>  b]ar</p></div>');
		t('<div><p>[foo</p>]  bar</div>',        '<div><p>[foo</p>  b]ar</div>');

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
		t('<p contenteditable="true"><b>[fo]o</b></p>', '<p contenteditable="true"><b>[foo}</b></p>');

		//            ,-- visible whitespace
		//            |
		//            v
		t('<p>{<b>fo]o </b><i>bar</i></p>', '<p>{<b>foo] </b><i>bar</i></p>');

		//            ,-- unrendered whitespace
		//            |
		//            v
		t('<p>{<b>fo]o </b></p>',            '<p>{<b>foo] </b></p>');
		t('<p>{<b>fo]o  </b><i>bar</i></p>', '<p>{<b>foo]  </b><i>bar</i></p>');
		t('<p>{<b>fo]o  </b></p>',           '<p>{<b>foo]  </b></p>');

		t('<p contenteditable="true">{<b>foo]</b></p>',   '<p contenteditable="true">{<b>foo</b>}</p>');
		t('<p contenteditable="true">{<b>foo] </b></p>',  '<p contenteditable="true">{<b>foo </b>}</p>');
		t('<p contenteditable="true">{<b>foo]  </b></p>', '<p contenteditable="true">{<b>foo  </b>}</p>');

		//             ,-- unrendered whitespace
		//             |
		//             v
		t('<p>{<b>foo]  </b>bar</p>', '<p>{<b>foo ] </b>bar</p>');

		t('<b>[foo]bar</b>',   '<b>[foob]ar</b>');
		t('<b>[foo] bar</b>',  '<b>[foo ]bar</b>');
		t('<b>[foo ] bar</b>', '<b>[foo  b]ar</b>');

		t('<b>[foo ]bar</b>', '<b>[foo b]ar</b>');
		t('<b>[foo ] bar</b>', '<b>[foo  b]ar</b>');
		t('<b>[foo ]  bar</b>', '<b>[foo   b]ar</b>');

		t('<b>[foo  ]bar</b>', '<b>[foo  b]ar</b>');
		t('<b>[foo  ] bar</b>', '<b>[foo   b]ar</b>');
		t('<b>[foo  ]  bar</b>', '<b>[foo    b]ar</b>');

		t('<p contenteditable="true">{<b>foo  ]</b></p>',   '<p contenteditable="true">{<b>foo  </b>}</p>');
		t('<p contenteditable="true">{<b>foo  ] </b></p>',  '<p contenteditable="true">{<b>foo   </b>}</p>');
		t('<p contenteditable="true">{<b>foo  ]  </b></p>', '<p contenteditable="true">{<b>foo    </b>}</p>');

		t('<b>foo[ ] &nbsp; </b>', '<b>foo[  &nbsp;] </b>');

		t('<p contenteditable="true">[]<br></p>', '<p contenteditable="true">[<br>}</p>');

		t('<p>[]<br>foo</p>', '<p>[<br>}foo</p>');
		t('<p>foo[]<br>bar</p>', '<p>foo[<br>}bar</p>');
		t('<p>foo{}<br><br>bar</p>', '<p>foo{<br>}<br>bar</p>');
		t('<p>foo[]<br><br>bar</p>', '<p>foo[<br>}<br>bar</p>');

		t('<div><p>foo[]<br></p>bar</div>', '<div><p>foo[<br></p>}bar</div>');

		t('<div contenteditable="true">foo[]<br><p>bar</p></div>',
		  '<div contenteditable="true">foo[<br><p>}bar</p></div>');

		t('<div contenteditable="true">foo{}<br><p>bar</p></div>',
		  '<div contenteditable="true">foo{<br><p>}bar</p></div>');
	});

	test('prev', function () {
		var t = function (before, after) {
			return runTest(before, after, function (boundaries) {
				return [Traversing.prev(boundaries[0]), boundaries[1]];
			});
		};

		t('<div><ul><li>one</li><li>t[wo</li></ul>}</div>',
		  '<div><ul><li>one</li><li>{two</li></ul>}</div>');

		t('<div contenteditable="true"><ul><li>x</li><li></li><li>{y</li></ul>}</div>',
		  '<div contenteditable="true"><ul><li>x</li><li>{</li><li>y</li></ul>}</div>');

		t('<p contenteditable="true"><b>[]</b></p>',        '<p contenteditable="true">{<b>]</b></p>');
		t('<p contenteditable="true"><b>[foo]</b></p>',     '<p contenteditable="true">{<b>foo]</b></p>');
		t('<p contenteditable="true"><b>f[oo]</b></p>',     '<p contenteditable="true"><b>{foo]</b></p>');
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

		t('<p contenteditable="true">foo<br>{}</p>',
		  '<p contenteditable="true">fo[o<br>}</p>');

		t('<div contenteditable="true"><p>foo</p>[bar]</div>',
		  '<div contenteditable="true"><p>foo[</p>bar]</div>');

		t('<div contenteditable="true"><p>foo</p>{bar]</div>',
		  '<div contenteditable="true"><p>foo[</p>bar]</div>');

		t('<div contenteditable="true"><p>foo</p><b>[bar]</b></div>',
		  '<div contenteditable="true"><p>foo[</p><b>bar]</b></div>');

		t('<div contenteditable="true"><p>foo</p> <b>[bar]</b></div>',
		  '<div contenteditable="true"><p>foo[</p> <b>bar]</b></div>');

		// unrendered whitespace
		//            |
		//            v
		t('<div contenteditable="true"><p>foo </p> <b>[bar]</b></div>',
		  '<div contenteditable="true"><p>foo[ </p> <b>bar]</b></div>');

		t('<div contenteditable="true"><p>foo</p> [bar]</div>',
		  '<div contenteditable="true"><p>foo[</p> bar]</div>');

		t('<div contenteditable="true"><p>foo </p> [bar]</div>',
		  '<div contenteditable="true"><p>foo[ </p> bar]</div>');

		t('<div contenteditable="true"><p>foo </p> <p> [bar]</p></div>',
		  '<div contenteditable="true"><p>foo[ </p> <p> bar]</p></div>');

		t('<div contenteditable="true">foo<ul><li>bar</li></ul>{}baz</div>',
		  '<div contenteditable="true">foo<ul><li>bar[</li></ul>}baz</div>');

		t('<div>foo<ul><li>{}bar</li></ul></div>',
		  '<div>foo[<ul><li>}bar</li></ul></div>');

		t('<p contenteditable="true"><br>[]foo</p>',
		  '<p contenteditable="true">{<br>]foo</p>');

		t('<p>foo<br>[]bar</p>', '<p>foo[<br>]bar</p>');
		t('<p>foo<br><br>[]bar</p>', '<p>foo<br>{<br>]bar</p>');

		t('<div contenteditable="true"><p>foo<br></p>[]one</div>',
		  '<div contenteditable="true"><p>foo[<br></p>]one</div>');
	});

}(window.aloha));
