(function (aloha) {
	'use strict';

	var List  = aloha.list;
	var BoundaryMarkers    = aloha.boundarymarkers;

	module('List');


	function compareHtml(cases, fn) {
		for (var i = 0, len = cases.length; i < len; i++) {
			var div = document.createElement('div');
			div.innerHTML = cases[i][0];

			var range = document.createRange();
			BoundaryMarkers.extract(div, range);

			fn(range);

			equal(div.innerHTML, $('<div>' + cases[i][1] + '</div>')[0].innerHTML, cases[i][0] + ' => ' + cases[i][1]);
		}
	}

	function testToOrderedList(cases) {
		compareHtml(cases, List.toOrderedListFromRange);
	}

	function testToUnorderedList(cases) {
		compareHtml(cases, List.toUnorderedListFromRange);
	}



	test('transform to ordered list', function () {
		var cases = [
			[
				'<ul>[<li>text</li>]</ul>',
				'<ol><li>text</li></ol>'
			],
			[
				'<ul><li>tex[t</li><li>someth]ing</li></ul>',
				'<ol><li>text</li><li>something</li></ol>'
			],
			[
				'<ul><li>one</li><li>text</li><li>someth[]ing</li></ul>',
				'<ol><li>one</li><li>text</li><li>something</li></ol>'
			],
			[
				'<ul><li>one</li><li>te[xt</li></ul>' +
					'<ol><li>someth]ing</li><li>last</li></ol>',
				'<ul><li>one</li></ul>' +
					'<ol><li>text</li><li>something</li><li>last</li></ol>'
			]
		];

		testToOrderedList(cases);
	});

	test('from paragraph to list', function () {
		var cases = [
			[
				'[<p>one</p><p>two</p>]<p>three</p>',
				'<ul><li>one</li><li>two</li></ul><p>three</p>'
			],
			[
				'<p>on[e</p><p>two</p><p>]three</p>',
				'<ul><li>one</li><li>two</li><li>three</li></ul>'
			],
			[
				'<p>one</p><p>t[w]o</p><p>three</p>',
				'<p>one</p><ul><li>two</li></ul><p>three</p>'
			],
			[
				'<p><i>some</i> <b>t[hing</b>one</p><p>tw]o</p><p>three</p>',
				'<ul><li><i>some</i> <b>thing</b>one</li><li>two</li></ul><p>three</p>'
			]
		];

		testToUnorderedList(cases);
	});

	test('transform to unordered list', function () {
		var cases = [
			[
				'<ol>[<li>text</li>]</ol>',
				'<ul><li>text</li></ul>'
			],
			[
				'<ul><li>tex[t</li><li>someth]ing</li></ul>',
				'<ul><li>text</li><li>something</li></ul>'
			],
			[
				'<p>O[ne</p><ol><li>tw]o</li><li>three</li></ol>',
				'<ul><li>One</li><li>two</li></ul><ol><li>three</li></ol>'
			],
			[
				'<p>One</p><ol><li>two</li><li>th[ree</li></ol><p>E]nd</p><p>Post</p>',
				'<p>One</p><ol><li>two</li></ol><ul><li>three</li><li>End</li></ul><p>Post</p>'
			],
			[
				'<ul><li>one</li><li>te[xt</li></ul>' +
					'<ol><li>someth]ing</li><li>last</li></ol>',
				'<ul><li>one</li><li>text</li><li>something</li></ul>' +
					'<ol><li>last</li></ol>'
			]
		];

		testToUnorderedList(cases);
	});

	test('paragraph and nested list', function () {
		var cases = [
			[
				'<ul>' +
					'<li>O[ne</li>' +
					'<li>tw]o</li>' +
					'<ol><li>1</li><li>2</li></ol>' +
				'</ul>',
				'<ol>' +
					'<li>One</li>' +
					'<li>two</li>' +
					'<ol><li>1</li><li>2</li></ol>' +
				'</ol>'
			],
			[
				'[<ul>' +
					'<li>One</li>' +
					'<li>two</li>' +
					'<ul><li>1</li><li>2</li></ul>' +
					'</ul>]',
				'<ol>' +
					'<li>One</li>' +
					'<li>two</li>' +
					'<ol><li>1</li><li>2</li></ol>' +
				'</ol>'
			],
			[
				'[<p>foo</p><ul><li>List item</li></ul><br /><p>text<span>text</span></p>]',
				'<ol>' +
					'<li>foo</li>' +
					'<li>List item</li>' +
					'<li></li>' +
					'<li>text<span>text</span></li>' +
				'</ol>'
			]
		];

		testToOrderedList(cases);
	});

	test('nested list', function () {
		var cases = [
			[
				'<ul>' +
					'<li>O[ne</li>' +
					'<li>two</li>' +
					'<ol><li>1</li><li>2</li></ol>' +
					'</ul>]',
				'<ul>' +
					'<li>One</li>' +
					'<li>two</li>' +
					'<ul><li>1</li><li>2</li></ul>' +
				'</ul>'
			],
			[
				'<ol>' +
					'<li>One</li>' +
					'<li>two</li>' +
					'<ol><li>[]1</li><li>2</li></ol>' +
				'</ol>',
				'<ol>' +
					'<li>One</li>' +
					'<li>two</li>' +
					'<ul><li>1</li><li>2</li></ul>' +
				'</ol>'
			]
		];

		testToUnorderedList(cases);
	});

	test('Content to list: sequential lists', function() {
		var cases = [
			[
				'[<p>one</p> ' +
					'<ol><li>Ordered</li></ol> ' +
					'<p>middle</p> ' +
					'<ul><li>Unordered</li></ul>]',

				'<ul>' +
					'<li>one</li>' +
					'<li>Ordered</li>' +
					'<li>middle</li>' +
					'<li>Unordered</li>' +
					'</ul>'
			],
			[
				'<ol>[<li>One</li></ol>' +
					'<ul><li>Two</li>]</ul>',
				'<ul><li>One</li><li>Two</li></ul>'
			]
		];

		testToUnorderedList(cases);
	});


}(window.aloha));
