(function (aloha, require, module, test, equal) {
	'use strict';

	var Markers = aloha.markers;
	var Html; require('../src/html', function (Module) { Html = Module; });

	module('html');

	test('isVisuallyAdjacent', function () {
		var t = function (markup, expected) {
			var boundaries = Markers.extract($(markup)[0]);
			equal(
				Html.isVisuallyAdjacent(boundaries[0], boundaries[1]),
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
			var boundaries = Markers.extract($(before)[0]);
			var linebreak = Html.nextLineBreak(boundaries[0], boundaries[1]);
			equal(
				Markers.hint([linebreak || boundaries[0], boundaries[1]]),
				after,
				before + ' ⇒ ' + after
			);
		};
		t('<p>{foo<br>bar}</p>', '<p>foo{<br>bar}</p>');
		t('<p>foo{<br>bar}</p>', '<p>foo{<br>bar}</p>');
		t('<p>foo<br>{bar}</p>', '<p>foo<br>bar{}</p>');
		t('<div><p>foo[<i>bar<b>baz<br>foo</b></i></p>bar}</div>',
		  '<div><p>foo<i>bar<b>baz{<br>foo</b></i></p>bar}</div>');
		t('<div><p>{foo<i>bar<b>baz</b></i></p>foo}</div>',
		  '<div><p>foo<i>bar<b>baz</b></i>{</p>foo}</div>');
	});

}(window.aloha, window.require, window.module, window.test, window.equal));
