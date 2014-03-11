(function (aloha) {
	'use strict';

	var Dom = aloha.dom;
	var Html = aloha.html;
	var Ranges = aloha.ranges;
	var Boundaries = aloha.boundaries;
	var BoundaryMarkers = aloha.boundarymarkers;

    module('html');

	test('isVisuallyAdjacent()', function () {
		var t = function (markup, expected) {
			var dom = $(markup)[0];
			var range = Ranges.create(dom, 0);
			BoundaryMarkers.extract(dom, range);
			equal(
				Html.__.isVisuallyAdjacent(
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

	test('isUnrenderedWhitespace', function () {
		equal(Html.isUnrenderedWhitespace(document.createTextNode('\t\r')), false);
		equal(Html.isUnrenderedWhitespace($('<div>\t\r</div>')[0].firstChild), true);
		equal(Html.isUnrenderedWhitespace($('<div>\t\rt</div>')[0].firstChild), false);
	});

	test('nextLineBreak', function () {
		var t = function (before, after) {
			var dom = $(before)[0];
			var range = Ranges.create(dom, 0);
			BoundaryMarkers.extract(dom, range);
			var linebreak = Html.__.nextLineBreak(
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
