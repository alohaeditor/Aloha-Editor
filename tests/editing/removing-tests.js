(function (aloha, module, test, equal) {
	'use strict';

	module('editing');

	function runTest(before, after, op, context) {
		var boundaries = aloha.markers.extract($(before)[0]);
		var actual = aloha.markers.hint(op(boundaries));
		equal(actual, after, before + ' ⇒ ' + after);
	}

	test('remove()', function () {
		(function t(before, after) {
			runTest(before, after, function (boundaries) {
				return aloha.editing.remove(boundaries[0], boundaries[1]);
			});
			return t;
		})

		('<p>x{}<br>z</p>', '<p>x{}<br>z</p>')

		('<p>x[y]z</p>', '<p>x[]z</p>')
		('<p>x[]y</p>',  '<p>x[]y</p>')

		('<p>[x]</p>',  '<p>{}</p>')
		('<p>x[y}</p>', '<p>x{}</p>')
		('<p>[x]y</p>', '<p>{}y</p>')
		('<p>{x]y</p>', '<p>{}y</p>')

		('<p>{y}</p>', '<p>{}</p>')
		('<p>[y]</p>', '<p>{}</p>')
		('<p>[y}</p>', '<p>{}</p>')
		('<p>{y]</p>', '<p>{}</p>')

		('<p>x<b>{y}</b>z</p>', '<p>x<b>{}</b>z</p>')
		('<p>x<b>[y]</b>z</p>', '<p>x<b>{}</b>z</p>')
		('<p>x<b>{y]</b>z</p>', '<p>x<b>{}</b>z</p>')
		('<p>x<b>[y}</b>z</p>', '<p>x<b>{}</b>z</p>')

		('<p>x{<b>y</b>}z</p>', '<p>x[]z</p>')
		('<p>x[<b>y</b>]z</p>', '<p>x[]z</p>')
		('<p>x{<b>y</b>]z</p>', '<p>x[]z</p>')
		('<p>x[<b>y</b>}z</p>', '<p>x[]z</p>')

		('<p>x{<b>y}</b>z</p>', '<p>x{}z</p>') // fixme should this be x[]z ?
		('<p>x[<b>y]</b>z</p>', '<p>x{}z</p>') // fixme should this be x[]z ?
		('<p>x{<b>y]</b>z</p>', '<p>x{}z</p>') // fixme should this be x[]z ?
		('<p>x[<b>y}</b>z</p>', '<p>x{}z</p>') // fixme should this be x[]z ?

		('<p>x<b>{y</b>}z</p>', '<p>x<b>{}</b>z</p>')
		('<p>x<b>[y</b>]z</p>', '<p>x<b>{}</b>z</p>')
		('<p>x<b>{y</b>]z</p>', '<p>x<b>{}</b>z</p>')
		('<p>x<b>[y</b>}z</p>', '<p>x<b>{}</b>z</p>')

		('<p>x<b>y{</b>z}</p>', '<p>x<b>y{}</b></p>')
		('<p>x<b>y[</b>z]</p>', '<p>x<b>y{}</b></p>')
		('<p>x<b>y{</b>z]</p>', '<p>x<b>y{}</b></p>')
		('<p>x<b>y[</b>z}</p>', '<p>x<b>y{}</b></p>')

		('<p>{x<b>}y</b>z</p>', '<p>{}<b>y</b>z</p>')
		('<p>[x<b>]y</b>z</p>', '<p>{}<b>y</b>z</p>')
		('<p>{x<b>]y</b>z</p>', '<p>{}<b>y</b>z</p>')
		('<p>[x<b>}y</b>z</p>', '<p>{}<b>y</b>z</p>')

		('<div>w<p>{x<b>yz}</b></p></div>', '<div>w<p>{}</p></div>')
		('<div>w<p>[x<b>yz]</b></p></div>', '<div>w<p>{}</p></div>')
		('<div>w<p>{x<b>yz]</b></p></div>', '<div>w<p>{}</p></div>')
		('<div>w<p>[x<b>yz}</b></p></div>', '<div>w<p>{}</p></div>')

		('<div>w<p>{x<b>y]z</b></p></div>', '<div>w<p>{}<b>z</b></p></div>')
		('<div>w<p>[x<b>y]z</b></p></div>', '<div>w<p>{}<b>z</b></p></div>')

		('<p>1<b>{2</b>3<u>4</u>]5<i>6</i></p>', '<p>1<b>{}</b>5<i>6</i></p>')
		('<p>1<b>{2</b>3<u>4</u>5<i>]6</i></p>', '<p>1<b>{}</b><i>6</i></p>')
		('<p><b>1[2</b><u>3]4</u></p>',          '<p><b>1{}</b><u>4</u></p>')
		('<p><b>1[2</b><u>3}<b>4</b></u></p>',   '<p><b>1{}</b><u><b>4</b></u></p>')
		('<p><i><b>1[2</b></i><u>3]4</u></p>',   '<i><b>1{}</b></i>')

		('<p>x<u><b>{</b></u>x<i>}</i>y</p>',  '<u><b>{}</b></u>')
		('<p>x<b>fo[o</b>bar<u>b]az</u>y</p>', '<p>x<b>fo{}</b><u>az</u>y</p>')
		('<p><b>x</b>{}<i>y</i></p>',          '<p><b>x</b>{}<i>y</i></p>')

		('<div><p>x</p><p>{y</p><p>}z</p></div>',      '<div><p>x</p><p>{}z</p></div>')
		('<div><h1><i>foo{</i></h1><p>}bar</p></div>', '<h1><i>foo{}</i>bar</h1>')

		('<ul><li>foo{</li><li>}bar</li></ul>',       '<li>foo[]bar</li>')
		('<ul><li>foo[</li><li>]bar</li></ul>',       '<li>foo[]bar</li>')
		('<ul><li>x{</li><li>}</li><li>y</li></ul>',  '<ul><li>x{}</li><li>y</li></ul>')
		('<ul><li>ab[c]<ol><li></li></ol></li></ul>', '<ul><li>ab{}<ol><li></li></ol></li></ul>')

		('<div>foo{<ul><li>}bar</li></ul></div>',     '<div>foo[]bar</div>')
		('<ul><li>fo[o<ol><li>}</li></ol></li></ul>', '<ul><li>fo{}</li></ul>')
	});

}(window.aloha, window.module, window.test, window.equal));
