(function (aloha) {
	'use strict';

	var ranges = aloha.ranges;
	var boundarymarkers = aloha.boundarymarkers;
	var tested = [];

	module('boundarymarkers');

	test('hint()', function () {
		tested.push('hint');
		var t = function (before, after) {
			var range = ranges.create();
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

	testCoverage(test, tested, boundarymarkers);
}(window.aloha));
