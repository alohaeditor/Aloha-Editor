(function (aloha) {
	'use strict';

	var html = aloha.html;
	var ranges = aloha.ranges;
	var editing = aloha.editing;
	var fn = aloha.fn;
	var Browsers = aloha.browsers;
	var boundarymarkers = aloha.boundarymarkers;
	var xhtml = aloha.xhtml;
	var tested = [];

	module('editing');

	var $editable = $('<div id="editable" contentEditable="true"></div>').appendTo('body');

	function runTest(before, after, op, context) {
		var dom = $(before)[0];
		$editable.html('').append(dom);
		var range = ranges.create(dom, 0);
		boundarymarkers.extract(dom, range);
		op(range, context);
		boundarymarkers.insert(range);
		equal($editable.html(), after, before + ' ⇒ ' + after);
	}

	test('break()', function () {
		tested.push('break');
		var t = function (before, after, linebreak, overrides) {
			return runTest(before, after, function (range) {
				var context = {
					settings: {
						defaultBlockNodeName: 'h1'
					},
					overrides: []
				};
				editing.break(range, context, linebreak);
				if (overrides) {
					deepEqual(context.overrides, overrides, overrides.join());
				}
			});
		};

		t('<div contenteditable="true">{}</div>', '<div contenteditable="true"><h1><br></h1><h1>{}</h1></div>');

		t(
			'<b><u style="text-decoration: none">[]</u>foo</b>',
			'<h1><b><u style="text-decoration: none"></u></b></h1><h1><b>{}foo</b></h1>',
			false,
			[
				['underline', false],
				['strikethrough', false]
			]
		);

		t(
			'<u style="text-decoration: none">[]</u>',
			'<h1><u style="text-decoration: none"></u></h1><h1>{}</h1>',
			false,
			[
				['underline', false],
				['strikethrough', false]
			]
		);

		t(
			'<u style="text-decoration: none">[]foo</u>',
			'<h1><u style="text-decoration: none"></u></h1><h1><u style="text-decoration: none">{}foo</u></h1>',
			false,
			[]
		);

		t(
			'<strike><b style="text-decoration: underline"><i style="font-weight: normal">[]</i>foo</b></strike>',
			'<h1><strike><b style="text-decoration: underline"><i style="font-weight: normal"></i></b></strike></h1>' +
			'<h1><strike><b style="text-decoration: underline">{}foo</b></strike></h1>',
			false,
			[
				['italic', true],
				['bold', false]
			]
		);

		t(
			'<b><i>[]</i>foo</b>',
			'<h1><b><i></i></b></h1><h1><b>{}foo</b></h1>',
			false,
			[
				['italic', true]
			]
		);

		t('<i>{}</i>', '<i><br>{}</i>', true);

		t('<i>{}<br></i>', '<i><br>{}<br></i>', true);
		t('<i><br>{}</i>', '<i><br><br>{}</i>', true);

		t('<i>{}foo</i>', '<i><br>{}foo</i>', true);
		t('<i>foo{}</i>', '<i>foo<br><br>{}</i>', true);

		t('<i>foo{}<br></i>', '<i>foo<br>{}<br></i>', true);
		t('<i><br>{}foo</i>', '<i><br><br>{}foo</i>', true);

		t('<p>[]</p>', '<p><br>{}</p>', true);
		t('<p>{}<br></p>', '<p><br>{}<br></p>', true);
		t('<p><br>{}</p>', '<p><br><br>{}</p>', true);

		t('<p>foo[]<br></p>', '<p>foo<br>{}<br></p>', true);
		t('<p>foo[]bar</p>', '<p>foo<br>{}bar</p>', true);
		t('<div><p>foo</p>[]bar</div>', '<div><p>foo</p><br><br>{}bar</div>', true);
		t('<p>foo<i>bar[]</i></p>', '<p>foo<i>bar<br><br>{}</i></p>', true);

		// Is this test valid?
		//t('<div><p>1</p>[]<p>2</p></div>', '<div><p>1</p><h1>{}</h1><p>2</p></div>');

		t('<p>{}</p>', '<p><br></p><p>{}</p>');
		t('<p>[]</p>', '<p><br></p><p>{}</p>');

		t('<div><p><i>fo[]o</i>bar</p></div>',
		  '<div><p><i>fo</i></p><p><i>{}o</i>bar</p></div>');

		t('<div><p><i>fo[]o<b>bar</b></i>baz</p></div>',
		  '<div><p><i>fo</i></p><p><i>{}o<b>bar</b></i>baz</p></div>');

		t('<i>[]foo</i>', '<h1><i></i></h1><h1><i>{}foo</i></h1>');

		t('<i>[]<u>foo</u>bar</i>', '<h1><i></i></h1><h1><i><u>{}foo</u>bar</i></h1>');

		t('<i>{}</i>', '<h1><i></i></h1><h1>{}</h1>', false, [
			['italic', true]
		]);

		t('<i>b[]</i>', '<h1><i>b</i></h1><h1>{}</h1>', false, [
			['italic', true]
		]);

		t('<i>b{}</i>', '<h1><i>b</i></h1><h1>{}</h1>', false, [
			['italic', true]
		]);

		t('<i>[]b</i>', '<h1><i></i></h1><h1><i>{}b</i></h1>');
		t('<i>{}b</i>', '<h1><i></i></h1><h1><i>{}b</i></h1>');
		t('<i>b[]a</i>', '<h1><i>b</i></h1><h1><i>{}a</i></h1>');

		t('<p>[]</p>', '<p><br></p><p>{}</p>');
		t('<p>{}</p>', '<p><br></p><p>{}</p>');
		t('<p>[]b</p>', '<p><br></p><p>{}b</p>');
		t('<p>{}b</p>', '<p><br></p><p>{}b</p>');
		t('<p>b[]</p>', '<p>b</p><p>{}</p>');
		t('<p>b{}</p>', '<p>b</p><p>{}</p>');

		t('<p>b[]a</p>', '<p>b</p><p>{}a</p>');

		t('<p>b[]<br></p>', '<p>b</p><p>{}<br></p>');
		t('<p><br>{}</p>', '<p><br></p><p>{}</p>');

		t('<p><i>[]</i></p>', '<p><i></i></p><p>{}</p>', false, [
			['italic', true]
		]);
		t('<p><i>{}</i></p>', '<p><i></i></p><p>{}</p>', false, [
			['italic', true]
		]);

		t('<p><i>[]b</i></p>', '<p><i></i></p><p><i>{}b</i></p>');
		t('<p><i>{}b</i></p>', '<p><i></i></p><p><i>{}b</i></p>');

		t('<p><i>b[]</i></p>', '<p><i>b</i></p><p>{}</p>', false, [
			['italic', true]
		]);

		t('<p><i>b{}</i></p>', '<p><i>b</i></p><p>{}</p>', false, [
			['italic', true]
		]);

		t('<p>a<i>[]</i>b</p>', '<p>a<i></i></p><p>{}b</p>', false, [
			['italic', true]
		]);

		t('<p><i>b[]a</i></p>', '<p><i>b</i></p><p><i>{}a</i></p>');

		t('<p>a<u><i>b[]c</i></u>d<i>e</i></p>',
		  '<p>a<u><i>b</i></u></p><p><u><i>{}c</i></u>d<i>e</i></p>');

		t('<div><p><i>ba[]r</i></p></div>',
		  '<div><p><i>ba</i></p><p><i>{}r</i></p></div>');

		t('<div><p><i>fo[]o</i>bar</p></div>',
		  '<div><p><i>fo</i></p><p><i>{}o</i>bar</p></div>');

		t('<div><div><p>1</p>{}<p>2</p></div></div>',
		  '<div><div><p>1</p><h1>{}</h1><p>2</p></div></div>');

		t('<div><p>1</p>{}<p>2</p></div>', '<div><p>1</p><h1>{}</h1><p>2</p></div>');

		t('<div contenteditable="true">1{}<p>2</p>3</div>',
		  '<div contenteditable="true">1<h1>{}</h1><p>2</p>3</div>');

		t(
			'<div contenteditable="true"><i>1{}</i><p>2</p></div>',
			'<div contenteditable="true"><h1><i>1</i></h1><h1>{}</h1><p>2</p></div>',
			false,
			[
				['italic', true]
			]
		);

		t('<div contenteditable="true">foo[]bar</div>',
		  '<div contenteditable="true"><h1>foo</h1><h1>{}bar</h1></div>');
		t('<div contenteditable="true"><p>one</p>foo[]bar</div>',
		  '<div contenteditable="true"><p>one</p><h1>foo</h1><h1>{}bar</h1></div>');

		t(
			'<div><i>1{}</i><p>2</p></div>',
			'<div><i>1</i></div><div>{}<p>2</p></div>',
			false,
			[
				['italic', true]
			]
		);

		t('<div><i>1{}<u>2</u>3</i><p>4</p></div>',
		  '<div><i>1</i></div><div><i><u>{}2</u>3</i><p>4</p></div>');

		t('<p>foo{}<i>bar</i></p>', '<p>foo</p><p><i>{}bar</i></p>');
		t('<p>foo[]<i>bar</i></p>', '<p>foo</p><p><i>{}bar</i></p>');

		t('<div><p>1[]</p><p>2</p></div>', '<div><p>1</p><p>{}</p><p>2</p></div>');
		t('<div>1[]<p>2</p></div>', '<div>1<h1>{}</h1><p>2</p></div>');
		t('<div>1{}<p>2</p></div>', '<div>1<h1>{}</h1><p>2</p></div>');

		t('<p id="foo">1[]2</p>', '<p id="foo">1</p><p id="foo">{}2</p>');

		t('<p><i style="color:red">1[]2</i></p>',
		  '<p><i style="color:red">1</i></p><p><i style="color:red">{}2</i></p>');

		t('<p contenteditable="true">foo[]bar</p>', '<p contenteditable="true">foo<br>{}bar</p>');

		$editable.remove();
	});

	test('delete()', function () {
		tested.push('delete');
		var t = function (before, after) {
			return runTest(before, after, editing.delete);
		};

		t('<p>x[y]z</p>', '<p>x[]z</p>');
		t('<p>x[]y</p>', '<p>x[]y</p>');

		t('<p>[x]</p>', '<p>{}</p>');
		t('<p>x[y}</p>', '<p>x{}</p>');
		t('<p>[x]y</p>', '<p>{}y</p>');
		t('<p>{x]y</p>', '<p>{}y</p>');

		t('<p>{y}</p>', '<p>{}</p>');
		t('<p>[y]</p>', '<p>{}</p>');
		t('<p>[y}</p>', '<p>{}</p>');
		t('<p>{y]</p>', '<p>{}</p>');

		t('<p>x<b>{y}</b>z</p>', '<p>x<b>{}</b>z</p>');
		t('<p>x<b>[y]</b>z</p>', '<p>x<b>{}</b>z</p>');
		t('<p>x<b>{y]</b>z</p>', '<p>x<b>{}</b>z</p>');
		t('<p>x<b>[y}</b>z</p>', '<p>x<b>{}</b>z</p>');

		t('<p>x{<b>y</b>}z</p>', '<p>x[]z</p>');
		t('<p>x[<b>y</b>]z</p>', '<p>x[]z</p>');
		t('<p>x{<b>y</b>]z</p>', '<p>x[]z</p>');
		t('<p>x[<b>y</b>}z</p>', '<p>x[]z</p>');

		t('<p>x{<b>y}</b>z</p>', '<p>x{}z</p>'); // fixme should be x[]z
		t('<p>x[<b>y]</b>z</p>', '<p>x{}z</p>'); // fixme should be x[]z
		t('<p>x{<b>y]</b>z</p>', '<p>x{}z</p>'); // fixme should be x[]z
		t('<p>x[<b>y}</b>z</p>', '<p>x{}z</p>'); // fixme should be x[]z

		t('<p>x<b>{y</b>}z</p>', '<p>x<b>{}</b>z</p>');
		t('<p>x<b>[y</b>]z</p>', '<p>x<b>{}</b>z</p>');
		t('<p>x<b>{y</b>]z</p>', '<p>x<b>{}</b>z</p>');
		t('<p>x<b>[y</b>}z</p>', '<p>x<b>{}</b>z</p>');

		t('<p>x<b>y{</b>z}</p>', '<p>x<b>y{}</b></p>');
		t('<p>x<b>y[</b>z]</p>', '<p>x<b>y{}</b></p>');
		t('<p>x<b>y{</b>z]</p>', '<p>x<b>y{}</b></p>');
		t('<p>x<b>y[</b>z}</p>', '<p>x<b>y{}</b></p>');

		t('<p>{x<b>}y</b>z</p>', '<p>{}<b>y</b>z</p>');
		t('<p>[x<b>]y</b>z</p>', '<p>{}<b>y</b>z</p>');
		t('<p>{x<b>]y</b>z</p>', '<p>{}<b>y</b>z</p>');
		t('<p>[x<b>}y</b>z</p>', '<p>{}<b>y</b>z</p>');

		t('<div>w<p>{x<b>yz}</b></p></div>', '<div>w<p>{}</p></div>');
		t('<div>w<p>[x<b>yz]</b></p></div>', '<div>w<p>{}</p></div>');
		t('<div>w<p>{x<b>yz]</b></p></div>', '<div>w<p>{}</p></div>');
		t('<div>w<p>[x<b>yz}</b></p></div>', '<div>w<p>{}</p></div>');

		t('<div>w<p>{x<b>y]z</b></p></div>', '<div>w<p>{}<b>z</b></p></div>');
		t('<div>w<p>[x<b>y]z</b></p></div>', '<div>w<p>{}<b>z</b></p></div>');

		t('<p>1<b>{2</b>3<u>4</u>]5<i>6</i></p>', '<p>1<b>{}</b>5<i>6</i></p>');
		t('<p>1<b>{2</b>3<u>4</u>5<i>]6</i></p>', '<p>1<b>{}</b><i>6</i></p>');
		t('<p><b>1[2</b><u>3]4</u></p>',          '<p><b>1{}</b><u>4</u></p>');
		t('<p><b>1[2</b><u>3}<b>4</b></u></p>',   '<p><b>1{}</b><u><b>4</b></u></p>');
		t('<p><i><b>1[2</b></i><u>3]4</u></p>',   '<p><i><b>1{}</b></i><u>4</u></p>');

		t('<p>x<u><b>{</b></u>x<i>}</i>y</p>', '<p>x<u><b>{}</b></u>y</p>');
		t('<p>x<b>fo[o</b>bar<u>b]az</u>y</p>', '<p>x<b>fo{}</b><u>az</u>y</p>');
		t('<p><b>x</b>{}<i>y</i></p>', '<p><b>x</b>{}<i>y</i></p>');

		t('<ul><li>fo[o<ol><li>}</li></ol></li></ul>', '<ul><li>fo{}</li></ul>');
		t('<ul><li>foo{</li><li>}bar</li></ul>', '<ul><li>foo[]bar</li></ul>');
		t('<ul><li>foo[</li><li>]bar</li></ul>', '<ul><li>foo[]bar</li></ul>');
		t('<ul><li>x{</li><li>}</li><li>y</li></ul>', '<ul><li>x{}</li><li>y</li></ul>');

		t('<div>foo{<ul><li>}bar</li></ul></div>', '<div>foo[]bar</div>');
		t('<div><p>x</p><p>{y</p><p>}z</p></div>', '<div><p>x</p><p>{}z</p></div>');
		t('<div><h1><i>foo{</i></h1><p>}bar</p></div>', '<div><h1><i>foo{}</i>bar</h1></div>');

	});

	function switchElemTextSelection(html) {
		return html.replace(/[\{\}\[\]]/g, function (match) {
			return {'{': '[',
					'}': ']',
					'[': '{',
					']': '}'}[match];
		});
	}

	function testMutation(title, before, expected, mutate) {
		test(title, function () {
			var titleForDebugginDontRemove = title;
			$('#test-editable').empty().html(before);
			var dom = $('#test-editable')[0].firstChild;
			var range = ranges.create(dom, 0);
			boundarymarkers.extract(dom, range);
			dom = mutate(dom, range) || dom;
			boundarymarkers.insert(range);
			var actual = xhtml.nodeToXhtml(dom);
			if ($.type(expected) === 'function') {
				expected(actual);
			} else {
				equal(actual, expected, before + ' ⇒ ' + expected);
			}
		});
	}

	function testMutationSwitchElemTextSelection(title, before, after, mutate) {
		testMutation(title, before, after, mutate);
		var afterSwitched = switchElemTextSelection(after);
		testMutation(title, switchElemTextSelection(before), function (actual) {
			if (actual !== afterSwitched
				    // Because it's ok as long as they come out at the
				    // same position, we ignore differences between
				    // selection type (text or element boundaries).
				    && actual !== after
				    // Because we must account for end of text node
				    // normalization performed by dom.nodeAtOffset() and
				    // dom.isAtEnd().
				    && actual !== afterSwitched.replace(/\]/g, '}')
				    ) {
				if (actual !== afterSwitched) {
					equal(actual, afterSwitched, before + ' ⇒ ' + afterSwitched);
				} else if (actual !== afterSwitched.replace(/\]/g, '}')) {
					equal(
						actual,
						afterSwitched.replace(/\]/g, '}'),
						before + ' ⇒ ' + afterSwitched.replace(/\]/g, '}')
					);
				} else if (actual !== after) {
					equal(actual, after, before + ' ⇒ ' + after);
				}
			} else {
				expect(0);
			}
		}, mutate);
	}

	function testWrap(title, before, after) {
		testMutation(title, before, after, function (dom, range) {
			editing.wrap(range, 'B');
		});
	}

	function testUnformat(title, before, after) {
		testMutation(title, before, after, function (dom, range) {
			editing.wrap(range, 'B', true);
		});
	}

	function testInsertExtractBoundaryMarkers(title, htmlWithBoundaryMarkers) {
		test(title, function () {
			var dom = $(htmlWithBoundaryMarkers)[0];
			var range = ranges.create(dom, 0);
			boundarymarkers.extract(dom, range);
			equal(
				xhtml.nodeToXhtml(dom),
				htmlWithBoundaryMarkers.replace(/[\[\{\}\]]/g, ''),

				htmlWithBoundaryMarkers
				+ ' ⇒  ' +
				htmlWithBoundaryMarkers.replace(/[\[\{\}\]]/g, '')
			);
			boundarymarkers.insert(range);
			equal(
				xhtml.nodeToXhtml(dom),
				htmlWithBoundaryMarkers,
				htmlWithBoundaryMarkers.replace(/[\[\{\}\]]/g, '')
				+ ' ⇒  ' +
				htmlWithBoundaryMarkers
			);
		});
	};

	function testInsertExtractBoundaryMarkers2(title, htmlWithBoundaryMarkers) {
		testInsertExtractBoundaryMarkers(title, htmlWithBoundaryMarkers);
		testInsertExtractBoundaryMarkers(title, switchElemTextSelection(htmlWithBoundaryMarkers));
	}

	function testTrimRange(title, before, after, switched) {
		testMutationSwitchElemTextSelection(title, before, after, function (dom, range) {
			ranges.trimClosingOpening(range, html.isUnrenderedWhitespace, html.isUnrenderedWhitespace);
		});
	}

	function testFormat(title, before, after, styleName, styleValue) {
		// Because different browsers render style attributes
		// differently we have to normalize them.
		function expected(actual) {
			actual = actual
				.replace(/;"/g, '"')
				.replace(/; font-family: "/g, '"')
				.replace(/font-family: ; /g, '')
				.replace(/font-size: 18px; font-family: arial/g, 'font-family: arial; font-size: 18px');
			after = after.replace(/;"/g, '"');
			equal(actual, after, before + ' ⇒  ' + after);
		}
		function isObstruction(node) {
			return !html.hasInlineStyle(node) || 'CODE' === node.nodeName;
		}
		var opts = {
			isObstruction: isObstruction
		};
		testMutation('editing.format - ' + title, before, expected, function (dom, range) {
			editing.format(range, styleName, styleValue, opts);
		});
	}

	var t = function (htmlWithBoundaryMarkers) {
		testInsertExtractBoundaryMarkers('extractBoundaryMarkers,insertBoundaryMarkers', htmlWithBoundaryMarkers);
	};

	t('<p>{Some text.}</p>');
	t('<p>Some{ }text.</p>');
	t('<p>{}Some text.</p>');
	t('<p>Some text.{}</p>');
	t('<p>Som{}e text.</p>');
	t('<p>{<b>Some text.</b>}</p>');
	t('<p>12{34<b>Some text.</b>56}78</p>');
	t('<p>{1234<b>Some text.</b>5678}</p>');
	t('<p>1234{<b>Some text.</b>}5678</p>');

	var t = function (before, after) {
		testTrimRange('ranges.trim()', before, after);
	};

	t('<p>So[me te]xt.</p>', '<p>So[me te]xt.</p>');
	t('<p>So[]xt.</p>', '<p>So[]xt.</p>');
	t('<p>{Some text.}</p>', '<p>{Some text.}</p>');
	t('<p>{}Some text.</p>', '<p>{}Some text.</p>');
	t('<p>Some text.{}</p>', '<p>Some text.{}</p>');
	t('<p>{}</p>', '<p>{}</p>');
	t('<p><b>So[me</b><i> </i><b>te]xt.</b></p>',
	  '<p><b>So[me</b><i> </i><b>te]xt.</b></p>');
	t('<p><b>Some</b>{<i> </i>}<b>text.</b></p>',
	  '<p><b>Some</b>{<i> </i>}<b>text.</b></p>');
	t('<p><b>[Some</b><i> </i><b>text.]</b></p>',
	  '<p><b>[Some</b><i> </i><b>text.]</b></p>');
	t('<p><b>{</b><i>}</i></p>', '<p><b></b>{}<i></i></p>');
	t('<p><b><i>{</i></b><i><b>}</b></i></p>',
	  '<p><b><i></i></b>{}<i><b></b></i></p>');
	t('<p><b><i>one{</i></b><i>two</i><b><i>}three</i></b></p>',
	  '<p><b><i>one</i></b>{<i>two</i>}<b><i>three</i></b></p>');
	t('<p><b><i>one{</i>.</b><i>two</i><b>.<i>}three</i></b></p>',
	  '<p><b><i>one</i>{.</b><i>two</i><b>.}<i>three</i></b></p>');
	t('<p><b><i>{one</i></b><i>two</i><b><i>three}</i></b></p>',
	  '<p><b><i>{one</i></b><i>two</i><b><i>three}</i></b></p>');

	var t = function (title, before, after) {
		testWrap('editing.wrap -' + title, before, after);
	};

	tested.push('wrap');

	t('noop1', '<p><b>[Some text.]</b></p>', '<p><b>{Some text.}</b></p>');
	t('noop2', '<p>{<b>Some text.</b>}</p>', '<p>{<b>Some text.</b>}</p>');
	t('noop3', '<p><b><i>[Some text.]</i></b></p>', '<p><b><i>{Some text.}</i></b></p>');

	t('join existing context elements',
	  '<p>{<b>Some</b><b> text.</b>}</p>',
	  '<p>{<b>Some text.</b>}</p>');

	t('bolding a node with text boundaries',
	  '<p>[Some text.]</p>',
	  '<p>{<b>Some text.</b>}</p>');

	t('bolding an node, splitting text',
	  '<p>So[me te]xt.</p>',
	  '<p>So{<b>me te</b>}xt.</p>');

	t('bolding a node with element boundaries',
	  '<p>{<i>Some text.</i>}</p>',
	  '<p>{<b><i>Some text.</i></b>}</p>');

	t('descending two levels down to each boundary, with boundaries at start and end respectively',
	  '<p><i>one<em>{Some</em>left</i>text<i>right<em>.}</em>two</i></p>',
	  '<p><i>one<b><em>{Some</em>left</b></i><b>text</b><i><b>right<em>.}</em></b>two</i></p>');
	// Same as above except "with boundaries inside text node"
	t('descending two levels down to each boundary, with boundaries inside text node',
	  '<p><i>one<em>!{Some</em>left</i>text<i>right<em>.}!</em>two</i></p>',
	  '<p><i>one<em>!{<b>Some</b></em><b>left</b></i><b>text</b><i><b>right</b><em><b>.</b>}!</em>two</i></p>');
	// Same as above except "with boundaries at end/start of container"
	t('descending two levels down to each boundary, with boundaries at end/start of container',
	  '<p><i>one<em>!{</em>left</i>text<i>right<em>}!</em>two</i></p>',
	  '<p><i>one<em>!</em>{<b>left</b></i><b>text</b><i><b>right</b>}<em>!</em>two</i></p>');
	// Same as above except "with boundaries in empty container"
	t('descending two levels down to each boundary, with boundaries in empty container',
	  '<p><i>one<em>{</em>left</i>text<i>right<em>}</em>two</i></p>',
	  '<p><i>one<em></em>{<b>left</b></i><b>text</b><i><b>right</b>}<em></em>two</i></p>');

	t('expand bold range to the right',
	  '<p><b>one {two</b> three}</p>',
	  '<p><b>one [two three</b>}</p>');

	t('expand bold range to the left',
	  '<p>{one <b>two} three</b></p>',
	  '<p>{<b>one two] three</b></p>');

	t('expand bold range to the left and right',
	  '<p>{one <b>two</b> three}</p>',
	  '<p>{<b>one two three</b>}</p>');

	var t = function (title, before, after) {
		testWrap('editing.wrap-restack - ' + title, before, after);
	};

	t('across elements',
	  '<p><i>{one</i>two<i>three<em>four}</em></i></p>',
	  '<p><b><i>{one</i>two<i>three<em>four}</em></i></b></p>');

	t('with existing bold element',
	  '<p><i><u><s><b>Some</b></s></u>{ text}</i></p>',
	  '<p><i><b><u><s>Some</s></u>{ text</b>}</i></p>');

	t('with non ignorable content before element to restack',
	  '<p><i><u><s>!<b>Some</b></s></u>{ text}</i></p>',
	  '<p><i><u><s>!<b>Some</b></s></u>{<b> text</b>}</i></p>');

	t('with non ignorable content after element to restack',
	  '<p><i><u><s><b>Some</b>!</s></u>{ text}</i></p>',
	  '<p><i><u><s><b>Some</b>!</s></u>{<b> text</b>}</i></p>');

	t('with non ignorable content between child/parent at end',
	  '<p><i><u><s><b>Some</b></s>!</u>{ text}</i></p>',
	  '<p><i><u><s><b>Some</b></s>!</u>{<b> text</b>}</i></p>');

	t('with non ignorable content between child/parent at start',
	  '<p><i><u>!<s><b>Some</b></s></u>{ text}</i></p>',
	  '<p><i><u>!<s><b>Some</b></s></u>{<b> text</b>}</i></p>');

	t('with non ignorable content as previous sibling to bolded text',
	  '<p><i><u><s><b>Some</b></s></u>!{ text}</i></p>',
	  '<p><i><u><s><b>Some</b></s></u>!{<b> text</b>}</i></p>');

	var t = function (title, before, after) {
		testUnformat('editing.unformat - ' + title, before, after);
	};

	t('noop', '<p>{Some text.}</p>', '<p>{Some text.}</p>');

	t('unbolding parent with text boundaries',
	  '<p><b>[Some text.]</b></p>',
	  '<p>{Some text.}</p>');

	t('unbolding parent with element boundaries',
	  '<p><b>{<i>Some text.</i>}</b></p>',
	  '<p>{<i>Some text.</i>}</p>');

	t('unbolding ancestor',
	  '<p><b><i>{Some text.}</i></b></p>',
	  '<p><i>{Some text.}</i></p>');

	t('unbolding end tag 1',
	  '<p><b><i>one{</i>two}</b></p>',
	  '<p><b><i>one</i></b>{two}</p>');
	t('unbolding start tag 1',
	  '<p><b>{one<i>}two</i></b></p>',
	  '<p>{one}<b><i>two</i></b></p>');
	t('unbolding end tag with additional previous sibling',
	  '<p><b>one<i>two{</i>three}</b></p>',
	  '<p><b>one<i>two</i></b>{three}</p>');
	t('unbolding start tag with additional next sibling',
	  '<p><b>{one<i>}two</i>three</b></p>',
	  '<p>{one}<b><i>two</i>three</b></p>');

	t('pushing down through commonAncestorContainer',
	  '<p>-<b>So{me te}xt</b>-</p>',
	  '<p>-<b>So</b>{me te}<b>xt</b>-</p>');

	t('pushing down one level through commonAncestorContainer',
	  '<p><b>one<i>{Some text.}</i>two</b></p>',
	  '<p><b>one</b><i>{Some text.}</i><b>two</b></p>');

	t('pushing down two levels through commonAncestorContainer',
	  '<p><b>one<em>two<i>{Some text.}</i>three</em>four</b></p>',
	  '<p><b>one</b><em><b>two</b><i>{Some text.}</i><b>three</b></em><b>four</b></p>');

	t('pushing down two levels through commonAncestorContainer,'
	  + ' and two levels down to each boundary,'
	  + ' with boundaries at start/end respectively',
	  '<p><b>1<em>2<i>3<sub>4<u>{Some</u>Z</sub>text<sub>Z<u>.}</u>5</sub>6</i>7</em>8</b></p>',
	  '<p><b>1</b><em><b>2</b><i><b>3</b><sub><b>4</b><u>{Some</u>Z</sub>text<sub>Z<u>.}</u><b>5</b></sub><b>6</b></i><b>7</b></em><b>8</b></p>');
	// Same as above except "boundaries in the middle"
	t('pushing down two levels through commonAncestorContainer,'
	  + ' and two levels down to each boundary,'
	  + ' with boundaries in the mioddle',
	  '<p><b>1<em>2<i>3<sub>4<u>left{Some</u>Z</sub>text<sub>Z<u>.}right</u>5</sub>6</i>7</em>8</b></p>',
	  '<p><b>1</b><em><b>2</b><i><b>3</b><sub><b>4</b><u><b>left</b>{Some</u>Z</sub>text<sub>Z<u>.}<b>right</b></u><b>5</b></sub><b>6</b></i><b>7</b></em><b>8</b></p>');
	// Same as above except "boundaries at end/start respectively"
	t('pushing down two levels through commonAncestorContainer,'
	  + ' and two levels down to each boundary,'
	  + ' with boundaries at start/end respectively',
	  '<p><b>1<em>2<i>3<sub>4<u>Some{</u>Z</sub>text<sub>Z<u>}.</u>5</sub>6</i>7</em>8</b></p>',
	  '<p><b>1</b><em><b>2</b><i><b>3</b><sub><b>4<u>Some</u></b>{Z</sub>text<sub>Z}<b><u>.</u>5</b></sub><b>6</b></i><b>7</b></em><b>8</b></p>');
	// Same as above except "boundaries in empty container"
	t('pushing down two levels through commonAncestorContainer,'
	  + ' and two levels down to each boundary,'
	  + ' with boundaries in empty container',
	  '<p><b>1<em>2<i>3<sub>4<u>{</u>Z</sub>text<sub>Z<u>}</u>5</sub>6</i>7</em>8</b></p>',
	  '<p><b>1</b><em><b>2</b><i><b>3</b><sub><b>4<u></u></b>{Z</sub>text<sub>Z}<b><u></u>5</b></sub><b>6</b></i><b>7</b></em><b>8</b></p>');

	t = function (title, before, after) {
		testMutation('editing.split ' + title, before, after, function (dom, range) {
			function below(node) {
				return node.nodeName === 'DIV';
			}
			editing.split(range, {below: below});
		});
	};

	tested.push('split');

	t('split cac',
	  '<div><p><b>one</b>{<i>two</i><i>three</i>}<b>four</b></p></div>',
	  '<div><p><b>one</b></p>{<p><i>two</i><i>three</i></p>}<p><b>four</b></p></div>');

	t('split above incl cac 1',
	  '<div><p><em><b>one</b>{<i>two</i><i>three</i>}<b>four</b></em></p></div>',
	  '<div><p><em><b>one</b></em></p>{<p><em><i>two</i><i>three</i></em></p>}<p><em><b>four</b></em></p></div>');

	t('split above incl cac 2',
	  '<div><p>one<span class="cls">t[]wo</span></p></div>',
	  '<div><p>one<span class="cls">t</span></p>{}<p><span class="cls">wo</span></p></div>');

	t('split above and below cac 1',
	  '<div><p><em><b>one</b>{<i>two</i><i>three</i>}<b>four</b></em></p></div>',
	  '<div><p><em><b>one</b></em></p>{<p><em><i>two</i><i>three</i></em></p>}<p><em><b>four</b></em></p></div>');

	t('split above and below cac 2',
	  '<div><p><em><b>one</b><strong><u>-{<i>two</i></u><u><i>three</i>}-</u></strong><b>four</b></em></p></div>',
	  '<div><p><em><b>one</b><strong><u>-</u></strong></em></p>{<p><em><strong><u><i>two</i></u><u><i>three</i></u></strong></em></p>}<p><em><strong><u>-</u></strong><b>four</b></em></p></div>');

	t('split at start end doesn\'t leave empty nodes 1',
	  '<div><b>one{</b><i>two</i><b>}three</b></div>',
	  '<div><b>one</b>{<i>two</i>}<b>three</b></div>');

	t('split at start end doesn\'t leave empty nodes 2',
	  '<div><b>{one</b><i>two</i><b><em>three</em>}</b></div>',
	  '<div>{<b>one</b><i>two</i><b><em>three</em></b>}</div>');

	t('split collapsed range 1',
	  '<div><b><i>1</i><i>2{}</i><i>3</i></b></div>',
	  '<div><b><i>1</i><i>2</i></b>{}<b><i>3</i></b></div>');

	t('split collapsed range in empty element',
	  '<div><b><i>1</i><i>{}</i><i>3</i></b></div>',
	  '<div><b><i>1</i></b>{}<b><i></i><i>3</i></b></div>');

	t('trim/include the last br if it is the last child of the block',
	  '<div><h1>1{<br/></h1><p>2}<br/></p></div>',
	  '<div><h1>1<br/></h1>{<p>2<br/></p>}</div>');

	t('trim/include the last br if it is the last child of an inline element',
	  '<div><h1>1{<br/></h1><p><b>2}<br/></b></p></div>',
	  '<div><h1>1<br/></h1>{<p><b>2<br/></b></p>}</div>');

	// TODO This test doesn't work on IE because IE automatically strips some
	// spaces and not others. Could be made to work by stripping exactly
	// those whitespace from the expected result.
	if (!Browsers.ie) {
		t('split ignores unrendered nodes 1',
		  '<div>  <span> {  </span> <span>text} </span><b> </b> </div>',
		  '<div>{  <span>   </span> <span>text </span><b> </b> }</div>');
	}

	t('split ignores unrendered nodes 2',
	  '<div><i><u><sub>{</sub></u>a</i>b<i>c<u><sub>}</sub></u></i></div>',
	  '<div>{<i><u><sub></sub></u>a</i>b<i>c<u><sub></sub></u></i>}</div>');

	t = function (title, before, after) {
		testMutation('editing.split+format - ' + title, before, after, function (dom, range) {
			var cac = range.commonAncestorContainer;
			function until(node) {
				return node.nodeName === 'CODE';
			}
			function below(node) {
				return cac === node;
			}
			editing.split(range, {below: below, until: until});
			editing.wrap(range, 'B');
		});
	};

	t('a single level to the right',
	  '<p>So[me <i>te]xt</i></p>',
	  '<p>So{<b>me <i>te</i></b>}<i>xt</i></p>');

	t('multiple levels to the right',
	  '<p>So[me <i>a<u>b]c</u></i></p>',
	  '<p>So{<b>me <i>a<u>b</u></i></b>}<i><u>c</u></i></p>');

	t('multiple levels to the left and right',
	  '<p>S<sub>o<em>{m</em></sub>e <i>a<u>b]c</u></i></p>',
	  '<p>S<sub>o</sub>{<b><sub><em>m</em></sub>e <i>a<u>b</u></i></b>}<i><u>c</u></i></p>');

	t('don\'t split obstruction on the left; with element siblings on the right',
	  '<p><i><em>-</em><code>Some<em>-{-</em>text</code></i>-<i><em>-</em><em>-</em>}<em>-</em><em>-</em></i></p>',
	  '<p><i><em>-</em></i><i><code>Some<em>-{<b>-</b></em><b>text</b></code></i><b>-<i><em>-</em><em>-</em></i></b>}<i><em>-</em><em>-</em></i></p>');

	testMutation('don\'t split if opts.below returns false',
				 '<div><i>a[b</i>c<b>d]e</b></div>',
				 '<div><i>a[b</i>c<b>d]e</b></div>',
				 function (dom, range) {
					 editing.split(range, {below: fn.returnFalse});
				 });

	t = function (title, before, after) {
		testFormat(title, before, after, 'font-family', 'arial');
	};

	tested.push('format');

	t('format some text',
	  '<p>Some [text]</p>',
	  '<p>Some {<span style="font-family: arial;">text</span>}</p>');

	t('reuse an existing span',
	  '<p>Some {<span>text</span>}</p>',
	  '<p>Some {<span style="font-family: arial;">text</span>}</p>');

	t('alternating overrides (times,verdana); don\'t replace existing override (helvetica); element inbetween overrides (b tag)',
	  '<p>Some <span style="font-family: times;">a<b><span style="font-family: helvetica;">b</span>c<span style="font-family: verdana;">d{e</span>f</b>g</span>}</p>',
	  '<p>Some <span style="font-family: times;">a</span><b><span style="font-family: helvetica;">b</span><span style="font-family: times;">c</span><span style="font-family: verdana;">d</span>{<span style="font-family: arial;">ef</span></b><span style="font-family: arial;">g</span>}</p>');

	t('don\'t push down the cac even if it is an override',
	  '<p>S<span style="font-family: times;">om{e t}ex</span>t</p>',
	  '<p>S<span style="font-family: times;">om{<span style="font-family: arial;">e t</span>}ex</span>t</p>');

	t('expand style',
	  '<p>S<span style="font-family: times;">om{one<span style="font-family: arial;">e t</span>two}ex</span>t</p>',
	  '<p>S<span style="font-family: times;">om{<span style="font-family: arial;">onee ttwo</span>}ex</span>t</p>');

	t('push down through one level',
	  '<p><span style="font-family: arial;"><span style="font-family: times;">Som{e t}ext</span></span></p>',
	  '<p><span style="font-family: arial;"><span style="font-family: times;">Som</span>{e t}<span style="font-family: times;">ext</span></span></p>');

	t('reuse outer element directly above',
	  '<p>one<span style="font-family: times;">[Some text]</span>two</p>',
	  '<p>one<span style="font-family: arial;">{Some text}</span>two</p>');

	t('reuse outer element one level up',
	  '<p>one<span style="font-family: times;"><b>[Some text]</b></span>two</p>',
	  '<p>one<span style="font-family: arial;"><b>{Some text}</b></span>two</p>');

	t('reuse outer element that has neither an override or context',
	  '<p>one<span><b>[Some text]</b></span>two</p>',
	  '<p>one<span style="font-family: arial;"><b>{Some text}</b></span>two</p>');

	t('prefer to reuse outer elements above commonAncestorContainer',
	  '<p>one <span style="font-family: times;">{<span style="font-family: helvetica;">two three</span>}</span> four</p>',
	  '<p>one <span style="font-family: arial;">{two three}</span> four</p>');

	t('don\'t reuse if there is an obstruction before ("x")',
	  '<p>one<span style="font-family: times;">x<b>[Some text]</b></span>two</p>',
	  '<p>one<span style="font-family: times;">x<b>{<span style="font-family: arial;">Some text</span>}</b></span>two</p>');
	  '<p>one<span style="font-family: times;">x</span><b>{<span style="font-family: arial;">Some text</span>}</b>two</p>'

	t('don\'t reuse if there is an obstruction after ("x")',
	  '<p>one<span style="font-family: times;"><b>[Some text]x</b></span>two</p>',
	  '<p>one<span style="font-family: times;"><b>{<span style="font-family: arial;">Some text</span>}x</b></span>two</p>');

	t('don\'t reuse if there is an obstruction above (code tag)',
	  '<p>one<span style="font-family: times;"><code>[Some text]</code></span>two</p>',
	  '<p>one<span style="font-family: times;"><code>{<span style="font-family: arial;">Some text</span>}</code></span>two</p>');

	t('extend style right 1',
	  '<p><span style="font-family: arial;">one {two</span> three}</p>',
	  '<p><span style="font-family: arial;">one [two three</span>}</p>');

	t('extend style left 1',
	  '<p>{one <span style="font-family: arial;">two} three</span></p>',
	  '<p>{<span style="font-family: arial;">one two] three</span></p>');

	t('extend style right 2',
	  '<p><span style="font-family: arial; font-size: 18px;">one {two</span> three}</p>',
	  '<p><span style="font-family: arial; font-size: 18px;">one [two</span><span style="font-family: arial;"> three</span>}</p>');

	t('extend style left 2',
	  '<p>{one <span style="font-family: arial; font-size: 18px;">two} three</span></p>',
	  '<p>{<span style="font-family: arial;">one </span><span style="font-family: arial; font-size: 18px;">two] three</span></p>');

	t('push down style without removing wrapper span',
	  '<p><span style="font-size: 18px; font-family: times;">one {two</span> three}</p>',
	  '<p><span style="font-size: 18px;"><span style="font-family: times;">one </span>{<span style="font-family: arial;">two</span></span><span style="font-family: arial;"> three</span>}</p>');

	t('merge wrappers with the same styles',
	  '<p><span style="font-family: arial;">one</span>{two}</p>',
	  '<p><span style="font-family: arial;">one[two</span>}</p>');

	t('don\'t merge wrappers with additionals styles',
	  '<p><span style="font-family: arial; font-size: 18px;">one</span>{two}</p>',
	  '<p><span style="font-family: arial; font-size: 18px;">one</span>{<span style="font-family: arial;">two</span>}</p>');

	t('don\'t merge wrappers with differing values for the same style',
	  '<p><span style="font-family: times;">one</span>{two}</p>',
	  '<p><span style="font-family: times;">one</span>{<span style="font-family: arial;">two</span>}</p>');

	t('reuse outer wrapper and clear nested contexts',
	  '<p><span style="font-family: times;">{one}<span style="font-family: arial;">two</span></span>three</p>',
	  '<p><span style="font-family: arial;">{one]two</span>three</p>');

	t('merge forward',
	  '<p>[one]<span style="font-family: arial;">two</span></p>',
	  '<p>{<span style="font-family: arial;">one]two</span></p>');

	t('don\'t merge forward incompatible style',
	  '<p>[one]<span style="color: black;">two</span></p>',
	  '<p>{<span style="font-family: arial;">one</span>}<span style="color: black;">two</span></p>');

	t('merge back',
	  '<p><span style="font-family: arial;">one</span>[two]</p>',
	  '<p><span style="font-family: arial;">one[two</span>}</p>');

	t('don\'t merge back incompatible style',
	  '<p><span style="color: black;">one</span>[two]</p>',
	  '<p><span style="color: black;">one</span>{<span style="font-family: arial">two</span>}</p>');

	t('range outside and inside element to be formatted',
	  '<p>Some {<a>more}</a> text</p>',
	  '<p>Some {<a><span style="font-family: arial">more</span>}</a> text</p>');

	t('first cac child of start and end positions are equal',
	  '<p>Some {<a>t}ext</a></p>',
	  '<p>Some {<a><span style="font-family: arial">t</span>}ext</a></p>');

	// Because the following tests depend on some CSS classes to be available:
	$('body').prepend('<style>'
					  + '.test-bold { font-weight: bold; }'
					  + '.test-strong { font-weight: bold; }'
					  + '.test-italic { font-style: italic; }'
					  + '.test-emphasis { font-style: italic; }'
					  + '.test-underline { text-decoration: underline; }'
					  + '</style>');

	t = function (title, before, after, styleValue) {
		// Because we want to write tests only against a single wrapper
		// format (<b>), but run them against all wrapper formats.
		var formats = [
			{name: 'bold', nodeName: 'b', styleOn: 'font-weight: bold', styleOff: 'font-weight: normal'},
			{name: 'strong', nodeName: 'strong', styleOn: 'font-weight: bold', styleOff: 'font-weight: normal'},
			{name: 'italic', nodeName: 'i', styleOn: 'font-style: italic', styleOff: 'font-style: normal'},
			{name: 'emphasis', nodeName: 'em', styleOn: 'font-style: italic', styleOff: 'font-style: normal'},
			{name: 'underline', nodeName: 'u', styleOn: 'text-decoration: underline', styleOff: 'text-decoration: none'}
		];
		function replace(format, html) {
			return (html.replace(/<(\/?)b>/g, '<$1' + format.nodeName + '>')
					.replace(/font-weight: bold/g, format.styleOn)
					.replace(/font-weight: normal/g, format.styleOff)
					.replace(/test-bold/g, 'test-' + format.name));
		}
		for (var i = 0; i < formats.length; i++) {
			var format = formats[i];
			testFormat(format.name + ' - ' + title, replace(format, before), replace(format, after), format.name, styleValue);
		}
	};

	t('use wrapper element instead of style',
	  '<p>So[me t]ext</p>',
	  '<p>So{<b>me t</b>}ext</p>',
	  true);

	t('clear styles when wrapped with an element',
	  '<p>S{o<span style="font-weight: bold">me te</span>x}t</p>',
	  '<p>S{<b>ome tex</b>}t</p>',
	  true);

	t('unformatting with a non-clearable ancestor will set a normal style',
	  '<p style="font-weight: bold">So[me te]xt</p>',
	  '<p style="font-weight: bold">So{<span style="font-weight: normal">me te</span>}xt</p>',
	  false);

	// We could argue here that it should really be
	// '<p>So<span style="font-weight: bold">m</span>{<b>e te</b>}xt</p>'
	// But the way the algorithm works is that nodes will be merged into
	// a wrapper to the left, and if that already exists it will be
	// reused.
	t('extending existing style',
	  '<p>So<span style="font-weight: bold">m{e </span>te}xt</p>',
	  '<p>So<span style="font-weight: bold">m[e te</span>}xt</p>',
	  true);

	t('pushing down through wrapper',
	  '<p>So<b>m{e t}e</b>xt</p>',
	  '<p>So<b>m</b>{e t}<b>e</b>xt</p>',
	  false);

	testFormat('italic - pushing down through alternative wrapper',
			   '<p>So<em>m{e t}e</em>xt</p>',
			   '<p>So<i>m</i>{e t}<i>e</i>xt</p>',
			   'italic',
			   false);

	testFormat('bold - pushing down through alternative wrapper',
			   '<p>So<strong>m{e t}e</strong>xt</p>',
			   '<p>So<b>m</b>{e t}<b>e</b>xt</p>',
			   'bold',
			   false);

	testFormat('italic - clear alternative wrapper',
			   '<p>S{o<em>me te</em>x}t</p>',
			   '<p>S[ome tex]t</p>',
			   'italic',
			   false);

	testFormat('italic - clear alternative wrapper',
			   '<p>S{o<strong>me te</strong>x}t</p>',
			   '<p>S[ome tex]t</p>',
			   'bold',
			   false);

	t('pushing down through styled element',
	  '<p>So<span style="font-weight: bold">m{e t}e</span>xt</p>',
	  '<p>So<b>m</b>{e t}<b>e</b>xt</p>',
	  false);

	// NB when this test is executed for "text-decoration: underline"
	// the result will look like the result for bold, but the visual
	// result will be incorrect, since it's not possible to unformat an
	// underline in an inner element. The only way to unformat an
	// underline is to split the underline ancestor, but we can't do
	// that when a class is set on the ancestor.
	t('unformat inside class context',
	  '<p><span class="test-bold">Som[e t]ext</span></p>',
	  '<p><span class="test-bold">Som{<span style="font-weight: normal">e t</span>}ext</span></p>',
	  false);

	t('unformat inside class context one level up',
	  '<p>So<span class="test-bold"><ins>m[e t]e</ins></span>xt</p>',
	  '<p>So<span class="test-bold"><ins>m{<span style="font-weight: normal">e t</span>}e</ins></span>xt</p>',
	  false);

	t('unformat inside class context one level up with em inbetween',
	  '<p>So<span class="test-bold"><em>m[e t]e</em></span>xt</p>',
	  '<p>So<span class="test-bold"><em>m{<span style="font-weight: normal">e t</span>}e</em></span>xt</p>',
	  false);

	t('reuse class context',
	  '<p>So<span class="test-bold">{me te}</span>xt</p>',
	  '<p>So<span class="test-bold">{me te}</span>xt</p>',
	  true);

	t('format inside class context',
	  '<p><span class="test-bold">Som{<span style="font-weight: normal">e t</span>}ext</span></p>',
	  '<p><span class="test-bold">Som[e t]ext</span></p>',
	  true);

	t('Don\'t set a CSS style if there is already a class on it',
	  '<p>S{o<span class="test-bold">me te</span>x}t</p>',
	  '<p>S{<b>o</b><span class="test-bold">me te</span><b>x</b>}t</p>',
	  true);

	t('Don\'t violate contained-in rules',
	  '<ul>{<li><ins>Some</ins> <del>text</del></li>}</ul>',
	  '<ul>{<li><b><ins>Some</ins> <del>text</del></b></li>}</ul>',
	  true);

	//testCoverage(test, tested, editing);

}(window.aloha));
