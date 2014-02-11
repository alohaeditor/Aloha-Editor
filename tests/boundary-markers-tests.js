(function (aloha) {
	'use strict';

	var ranges = aloha.ranges;
	var boundarymarkers = aloha.boundarymarkers;
	var tested = [];

	module('boundarymarkers');

	test('insert()', function () {
		tested.push('insert');
		var $dom = $('<p><b>abc</b><i>xyz</i></p>');
		var range = ranges.create(
			$dom.find('b')[0].firstChild,
			1,
			$dom.find('i')[0],
			0
		);
		boundarymarkers.insert(range);
		equal(
			range.commonAncestorContainer.outerHTML,
			'<p><b>a[bc</b><i>}xyz</i></p>'
		);
	});

	test('extract()', function () {
		tested.push('extract')
		var range = ranges.create(document.documentElement, 0);
		boundarymarkers.extract($('<p><b>a[bc</b><i>}xyz</i></p>')[0], range);
		equal(range.commonAncestorContainer.nodeName, 'P');
		equal(range.startContainer.nodeType, aloha.dom.Nodes.TEXT);
		equal(range.endContainer.nodeName, 'I');
	});

	test('hint()', function () {
		tested.push('hint');
		var t = function (before, after) {
			var range = ranges.create(document.documentElement, 0);
			boundarymarkers.extract($(before)[0], range);
			equal(
				aloha.boundarymarkers.hint(range).replace(/ xmlns=['"][^'"]*['"]/, ''),
				after,
				before + ' ⇒ ' + after
			);
		};
		t('<p>x[y]z</p>',        '<p>x[y]z</p>');
		t('<p>x[yz]</p>',        '<p>x[yz]</p>');
		t('<p>[xyz]</p>',        '<p>[xyz]</p>');
		t('<p>x{<b>y</b>}z</p>', '<p>x{<b>y</b>}z</p>');
		t('<p>x{<b>y}</b>z</p>', '<p>x{<b>y}</b>z</p>');
		t('<p>x<b>{y</b>}z</p>', '<p>x<b>{y</b>}z</p>');
		t('<p>x<b>{y}</b>z</p>', '<p>x<b>{y}</b>z</p>');
	});

	//testCoverage(test, tested, boundarymarkers);

}(window.aloha));
