(function (aloha, module, test, equal) {
	'use strict';

	return;

	module('editing');

	function runTest(before, after, op, context) {
		var boundaries = aloha.markers.extract($(before)[0]);
		var actual = aloha.markers.hint(op(boundaries));
		equal(actual, after, before + ' ⇒ ' + after);
	}

	test('breakline()', function () {
		(function t(before, after, linebreak) {
			runTest(before, after, function (boundaries) {
				return aloha.editing.breakline(
					aloha.ranges.fromBoundaries(boundaries[0], boundaries[1]),
					'h1',
					linebreak
				);
			});
			return t;
		})(
			'<div contenteditable="true">{}</div>',
			'<div contenteditable="true"><h1>{}<br></h1></div>'
		)(
			'<div contenteditable="true">{}<br></div>',
			'<div contenteditable="true"><br><h1>{}<br></h1></div>'
		)(
			'<div contenteditable="true">{}<br><br></div>',
			'<div contenteditable="true"><br><h1>{}<br><br></h1></div>'
		)(
			'<div contenteditable="true"><br>{}<br></div>',
			'<div contenteditable="true"><br><br><h1>{}<br></h1></div>'
		)(
			'<div contenteditable="true">one{}<br>two</div>',
			'<div contenteditable="true">one<br><h1>{}<br>two</h1></div>'
		)(
			'<div contenteditable="true">{}<br>one</div>',
			'<div contenteditable="true"><br><h1>{}<br>one</h1></div>'
		)(
			'<div contenteditable="true"><br>{}one</div>',
			'<div contenteditable="true"><br><br><h1>{}one</h1></div>'
		)(
			'<div contenteditable="true"><p>{}<br>one</p></div>',
			'<div contenteditable="true"><p><br></p><p>{}<br>one</p></div>'
		)(
			'<div contenteditable="true"><h1><b><u style="text-decoration: none">[]</u>foo</b></h1></div>',
			'<h1><b>{}foo</b></h1>'
		)(
			'<div contenteditable="true"><u style="text-decoration: none">[]</u></div>',
			'<div contenteditable="true"><u style="text-decoration: none"></u><h1>{}<br></h1></div>'
		)(
			'<div contenteditable="true"><u style="text-decoration: none">[]foo</u></div>',
			'<h1><u style="text-decoration: none">{}foo</u></h1>'
		)(
			'<div contenteditable="true">'
				+ '<strike><b style="text-decoration: underline">'
				+ '<i style="font-weight: normal">[]</i>foo</b></strike>'
				+ '</div>',
			'<strike><b style="text-decoration: underline">{}foo</b></strike>'
		)(
			'<div contenteditable="true"><b><i>[]</i>foo</b></div>',
			'<h1><b>{}foo</b></h1>'
		)

		// inserting br's

		(
			'<div contenteditable="true"><i>{}</i></div>',
			'<div contenteditable="true"><i><br>{}</i></div>',
			true
		)(
			'<div contenteditable="true"><i>{}<br></i></div>',
			'<div contenteditable="true"><i><br>{}<br></i></div>',
			true
		)(
			'<div contenteditable="true"><i><br>{}</i></div>',
			'<div contenteditable="true"><i><br><br>{}</i></div>',
			true
		)(
			'<div contenteditable="true"><i>{}foo</i></div>',
			'<div contenteditable="true"><i><br>{}foo</i></div>',
			true
		)(
			'<div contenteditable="true"><i>foo{}</i></div></div>',
			'<div contenteditable="true"><i>foo<br>{}<br></i></div>',
			true
		)(
			'<div contenteditable="true"><i>foo{}<br></i></div>',
			'<div contenteditable="true"><i>foo<br>{}<br></i></div>',
			true
		)(
			'<div contenteditable="true"><i><br>{}foo</i></div>',
			'<div contenteditable="true"><i><br><br>{}foo</i></div>',
			true
		)(
			'<div contenteditable="true"><p>[]</p></div>',
			'<div contenteditable="true"><p><br>{}</p></div>',
			true
		)(
			'<div contenteditable="true"><p>{}<br></p></div>',
			'<div contenteditable="true"><p><br>{}<br></p></div>',
			true
		)(
			'<div contenteditable="true"><p><br>{}</p></div>',
			'<div contenteditable="true"><p><br><br>{}</p></div>',
			true
		)(
			'<div contenteditable="true"><p>foo[]<br></p></div>',
			'<div contenteditable="true"><p>foo<br>{}<br></p></div>',
			true
		)(
			'<div contenteditable="true"><p>foo[]bar</p></div>',
			'<div contenteditable="true"><p>foo<br>{}bar</p></div>',
			true
		)(
			'<div contenteditable="true"><div><p>foo</p>[]bar</div></div>',
			'<div contenteditable="true"><div><p>foo</p><br>{}bar</div></div>',
			true
		)(
			'<div contenteditable="true"><p>foo<i>bar[]</i></p></div>',
			'<p>foo<i>bar<br>{}<br></i></p>',
			true
		)

		// Is this test valid?
		//t('<div><p>1</p>[]<p>2</p></div>', '<div><p>1</p><h1>{}</h1><p>2</p></div>');

		(
			'<div contenteditable="true"><p>{}</p></div>',
			'<div contenteditable="true"><p><br></p><p>{}<br></p></div>'
		)(
			'<div contenteditable="true"><p>[]</p></div>',
			'<div contenteditable="true"><p><br></p><p>{}<br></p></div>'
		)(
			'<div contenteditable="true"><div><p><i>fo[]o</i>bar</p></div></div>',
			'<p><i>{}o</i>bar</p>'
		)(
			'<div contenteditable="true"><div><p><i>fo[]o<b>bar</b></i>baz</p></div></div>',
			'<p><i>{}o<b>bar</b></i>baz</p>'
		)(
			'<div contenteditable="true"><i>[]foo</i></div>',
			'<h1><i>{}foo</i></h1>'
		)(
			'<div contenteditable="true"><i>[]<u>foo</u>bar</i></div>',
			'<h1><i>{}<u>foo</u>bar</i></h1>'
		)(
			'<div contenteditable="true"><i>{}</i></div>',
			'<div contenteditable="true"><i></i><h1>{}<br></h1></div>'
		)(
			'<div contenteditable="true"><i>b[]</i></div>',
			'<div contenteditable="true"><i>b</i><h1>{}<br></h1></div>'
		)(
			'<div contenteditable="true"><i>b{}</i></div>',
			'<div contenteditable="true"><i>b</i><h1>{}<br></h1></div>'
		)

		(
			'<div contenteditable="true"><i>[]b</i></div>',
			'<h1><i>{}b</i></h1>'
		)(
			'<div contenteditable="true"><i>{}b</i></div>',
			'<h1><i>{}b</i></h1>'
		)(
			'<div contenteditable="true"><i>b[]a</i></div>',
			'<h1><i>{}a</i></h1>'
		)

		(
			'<div contenteditable="true"><p>[]</p></div>',
			'<div contenteditable="true"><p><br></p><p>{}<br></p></div>'
		)(
			'<div contenteditable="true"><p>{}</p></div>',
			'<div contenteditable="true"><p><br></p><p>{}<br></p></div>'
		)(
			'<div contenteditable="true"><p>[]b</p></div>',
			'<div contenteditable="true"><p><br></p><p>{}b</p></div>'
		)(
			'<div contenteditable="true"><p>{}b</p></div>',
			'<div contenteditable="true"><p><br></p><p>{}b</p></div>'
		)(
			'<div contenteditable="true"><p>b[]</p></div>',
			'<div contenteditable="true"><p>b</p><p>{}<br></p></div>'
		)(
			'<div contenteditable="true"><p>b{}</p></div>',
			'<div contenteditable="true"><p>b</p><p>{}<br></p></div>'
		)(
			'<div contenteditable="true"><p>b[]a</p></div>',
			'<div contenteditable="true"><p>b</p><p>{}a</p></div>'
		)(
			'<div contenteditable="true"><p>b[]<br></p></div>',
			'<div contenteditable="true"><p>b</p><p>{}<br></p></div>'
		)(
			'<div contenteditable="true"><p>{}<br></p></div>',
			'<div contenteditable="true"><p><br></p><p>{}<br></p></div>'
		)

		(
			'<div contenteditable="true"><p><i>[]</i></p></div>',
			'<div contenteditable="true"><p><br></p><p>{}<br></p></div>'
		)(
			'<div contenteditable="true"><p><i>{}</i></p></div>',
			'<div contenteditable="true"><p><br></p><p>{}<br></p></div>'
		)(
			'<div contenteditable="true"><p><i>[]b</i></p></div>',
			'<p><i>{}b</i></p>'
		)(
			'<div contenteditable="true"><p><i>{}b</i></p></div>',
			'<p><i>{}b</i></p>'
		)(
			'<div contenteditable="true"><p><i>b[]</i></p></div>',
			'<div contenteditable="true"><p><i>b</i></p><p>{}<br></p></div>'
		)(
			'<div contenteditable="true"><p><i>b{}</i></p></div>',
			'<div contenteditable="true"><p><i>b</i></p><p>{}<br></p></div>'
		)(
			'<div contenteditable="true"><p>a<i>[]</i>b</p></div>',
			'<div contenteditable="true"><p>a</p><p>{}b</p></div>'
		)

		(
			'<div contenteditable="true"><p><i>b[]a</i></p></div></div>',
			'<p><i>{}a</i></p>'
		)(
			'<div contenteditable="true"><p>a<u><i>b[]c</i></u>d<i>e</i></p></div>',
			'<u><i>{}c</i></u>'
		)(
			'<div contenteditable="true"><div><p><i>ba[]r</i></p></div></div>',
			'<p><i>{}r</i></p>'
		)(
			'<div contenteditable="true"><div><p><i>fo[]o</i>bar</p></div>',
			'<p><i>{}o</i>bar</p>'
		)(
			'<div contenteditable="true"><div><div><p>1</p>{}<p>2</p></div></div></div>',
			'<div><p>1</p><h1>{}<br></h1><p>2</p></div>'
		)(
			'<div contenteditable="true"><div><p>1</p>{}<p>2</p></div></div>',
			'<div><p>1</p><h1>{}<br></h1><p>2</p></div>'
		)(
			'<div contenteditable="true">1{}<p>2</p>3</div>',
			'<div contenteditable="true">1<h1>{}<br></h1><p>2</p>3</div>'
		)(
			'<div contenteditable="true"><i>1{}</i><p>2</p></div>',
			'<div contenteditable="true"><i>1</i><h1>{}<br></h1><p>2</p></div>'
		)(
			'<div contenteditable="true">foo[]bar</div>',
			'<div contenteditable="true">foo<h1>{}bar</h1></div>'
		)(
			'<div contenteditable="true"><p>one</p>foo[]bar</div>',
			'<div contenteditable="true"><p>one</p>foo<h1>{}bar</h1></div>'
		)(
			'<div contenteditable="true"><div><i>1{}</i><p>2</p></div></div>',
			'<div contenteditable="true"><div><i>1</i></div><div>{}<br><p>2</p></div></div>'
		)(
			'<div contenteditable="true"<div><i>1{}<u>2</u>3</i><p>4</p></div></div>',
			'<i><u>{}2</u>3</i>'
		)(
			'<div contenteditable="true"><p>foo{}<i>bar</i></p></div>',
			'<p><i>{}bar</i></p>'
		)(
			'<div contenteditable="true"><p>foo[]<i>bar</i></p></div>',
			'<p><i>{}bar</i></p>'
		)(
			'<div contenteditable="true"><p>1[]</p><p>2</p></div>',
			'<div contenteditable="true"><p>1</p><p>{}<br></p><p>2</p></div>'
		)(
			'<div contenteditable="true">1[]<p>2</p></div>',
			'<div contenteditable="true">1<h1>{}<br></h1><p>2</p></div>'
		)(
			'<div contenteditable="true">1{}<p>2</p></div>',
			'<div contenteditable="true">1<h1>{}<br></h1><p>2</p></div>'
		)(
			'<div contenteditable="true"><p id="foo">1[]2</p></div>',
			'<div contenteditable="true"><p id="foo">1</p><p id="foo">{}2</p></div>'
		)(
			'<div contenteditable="true"><p><i style="color:red">1[]2</i></p></div>',
			'<p><i style="color:red">{}2</i></p>'
		)(
			'<p contenteditable="true">foo[]bar</p>',
			'<p contenteditable="true">foo<br>{}bar</p>'
		);
	});

}(window.aloha, window.module, window.test, window.equal));
