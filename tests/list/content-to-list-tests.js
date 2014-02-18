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

	function testToParagraph(cases) {
		compareHtml(cases, List.toParagraphsFromRange);
	}



	test('list to paragraph', function () {
		var cases = [
			[
				'<ol><li>t[ext</li> <li>some] text</li></ol>',
				'<p>text</p><p>some text</p>'
			],
			[
				'<ul><li>before</li>[<li>text</li>]<li>after</li></ul>',
				'<ul><li>before</li></ul><p>text</p><ul><li>after</li></ul>'
			],
			[
				'<p>t[ext</p><ul><li>one</li><li>two</li></ul><p>la]st</p>',
				'<p>text</p><p>one</p><p>two</p><p>last</p>'
			],
			[
				'<ul><li>tex[t</li><li>someth]ing</li></ul>',
				'<p>text</p><p>something</p>'
			]
		];

		testToParagraph(cases);
	});

	test('List to content: several paragraphs', function () {
		var cases = [
			[
				'<p>Pa[ragraph </p>' +
					'<ul>' +
					'<li>First line of text</li>' +
					'<li> text </li>' +
					'<li>Second line of tex]t</li>' +
					'</ul>',
				'<p>Paragraph </p>' +
					'<p>First line of text</p><p> text </p><p>Second line of text</p>'
			],
			[
				'[<ul> ' +
					'<li> First line of text</li>' +
					'<li></li>' +
					'<ol><li>Second line of text</li></ol>' +
					']</ul>',
				'<p> First line of text</p><p><br></p><p>Second line of text</p>'
			],
			[
				'[<ul> ' +
					'<li> First line of text</li>' +
					'<li>  </li>' +
					'<ol><li>Second line of text</li> </ol>' +
					'] </ul>',
				'<p> First line of text</p><p>  </p><p>Second line of text</p>'
			]
		];

		testToParagraph(cases);
	});

}(window.aloha));
