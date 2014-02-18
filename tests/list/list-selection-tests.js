(function (aloha) {
	'use strict';

	var ListSelection  = aloha.listselection;
	var BoundaryMarkers    = aloha.boundarymarkers;
	var Boundaries = aloha.boundaries;

	module('List');

	function innerHTML(str) {
		return $('<div>' + str + '</div>')[0].innerHTML;
	}


	function compareHtml(cases, fn) {
		for (var i = 0, len = cases.length; i < len; i++) {
			var div = document.createElement('div');
			div.innerHTML = cases[i][0];

			var range = document.createRange();
			BoundaryMarkers.extract(div, range);

			var startBoundary = Boundaries.raw(range.startContainer, range.startOffset);
			var endBoundary = Boundaries.raw(range.endContainer, range.endOffset);

			var elements = fn([startBoundary, endBoundary]);

			for (var j = 0, lenElem = elements.length; j < lenElem; j++) {
				equal(elements[j].outerHTML, innerHTML(cases[i][1][j]));
			}

			equal (elements.length, cases[i][1].length, "Number of cases should be the same as the number of results");
		}
	}

	function testElementsFromBoundaries(cases) {
		compareHtml(cases, ListSelection.elementsFromBoundaries);
	}



	test('Selection: transform to list', function () {
		var cases = [
			[
				'<ul>[<li>text</li>]</ul>',
				['<li>text</li>']
			],
			[
				'<ul><li>tex[t</li><li>someth]ing</li></ul>',
				['<li>text</li>', '<li>something</li>']
			],
			[
				'[<ul><li>one</li><li>text</li><li>someth]ing</li></ul>',
				['<li>one</li>', '<li>text</li>', '<li>something</li>']
			],
			[
				'<p>O[ne</p><ol><li>tw]o</li><li>three</li></ol>',
				['<p>One</p>', '<li>two</li>']
			]
		];

		testElementsFromBoundaries(cases);
	});

	test('Selection: several lists', function () {
		var cases = [
			[
				'<ul><li>o[ne</li><li>text</li></ul><ol><li>someth]ing</li></ol>',
				['<li>one</li>', '<li>text</li>', '<li>something</li>']
			],
			[
				'<ul><li>one</li>[<li>text</li></ul><ol><li>someth]ing</li></ol>',
				['<li>text</li>', '<li>something</li>']
			]
		];

		testElementsFromBoundaries(cases);
	});

	test('Selection: several paragraphs', function () {
		var cases = [
			[
				'<p>First</p><p>Second</p><ul><li>o[ne</li><li>text</li></ul><ol><li>someth]ing</li></ol><p>Last</p>',
				['<li>one</li>', '<li>text</li>', '<li>something</li>']
			],
			[
				'<p><i><span>Things</span></i>First</p>' +
					'<p>Second[</p>' +
					'<ul><li>one</li><li>text</li></ul><ol><li>someth]ing</li></ol>' +
					'<p>Last</p>',
				['<p>Second</p>', '<li>one</li>', '<li>text</li>', '<li>something</li>']
			],
			[
				'<p><i><span>Thi[ngs</span></i>First</p>' +
					'<p>Second</p>' +
					'<ul><li>one</li><li>text</li></ul><ol><li>someth]ing</li></ol>' +
					'<p>Last</p>',
				['<p><i><span>Things</span></i>First</p>', '<p>Second</p>', '<li>one</li>', '<li>text</li>', '<li>something</li>']
			],
			[
				'[<p>foo</p><ul><li>List item</li></ul><br /><p>text<span>text</span></p>]',
				['<p>foo</p>', '<li>List item</li>', '<br />', '<p>text<span>text</span></p>']
			]
		];

		testElementsFromBoundaries(cases);
	});


}(window.aloha));
