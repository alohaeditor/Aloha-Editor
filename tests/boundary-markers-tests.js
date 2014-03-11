(function (aloha) {
	'use strict';

	var Boundaries = aloha.boundaries;
	var BoundaryMarkers = aloha.boundarymarkers;

	module('boundarymarkers');

	test('insert()', function () {
		var $dom = $('<p><b>abc</b><i>xyz</i></p>');
		var start = Boundaries.create($dom.find('b')[0].firstChild, 1);
		var end = Boundaries.create($dom.find('i')[0], 0);
		var boundaries = BoundaryMarkers.insert(start, end);
		equal(
			Boundaries.commonContainer(boundaries[0], boundaries[1]).outerHTML,
			'<p><b>a[bc</b><i>}xyz</i></p>'
		);
	});

	test('extract()', function () {
		var boundaries = BoundaryMarkers.extract($('<p><b>a[bc</b><i>}xyz</i></p>')[0]);
		var start = Boundaries.container(boundaries[0]);
		var end = Boundaries.container(boundaries[1]);
		var common = Boundaries.commonContainer(boundaries[0], boundaries[1]);
		equal(common.nodeName, 'P');
		equal(start.nodeType, aloha.dom.Nodes.TEXT);
		equal(end.nodeName, 'I');
	});

	test('hint()', function () {
		var t = function (before, after) {
			var boundaries = BoundaryMarkers.extract($(before)[0]);
			equal(
				BoundaryMarkers.hint(boundaries).replace(/ xmlns=['"][^'"]*['"]/, ''),
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

}(window.aloha));
