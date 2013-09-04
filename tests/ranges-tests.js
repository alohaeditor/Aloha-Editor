(function (aloha) {
	'use strict';

	var ranges = aloha.ranges;
	var boundarymarkers = aloha.boundarymarkers;
	var tested = [];

	module('ranges');

	function testExpand(before, after) {
		var dom = $(before)[0];
		var range = ranges.create();
		boundarymarkers.extract(dom, range);
		ranges.expand(range);
		boundarymarkers.insert(range);
		equal(dom.outerHTML, after, before + ' ⇒ ' + after);
	}

	test('expand()', function () {
		tested.push('expand');
		var t = testExpand;
		t('<p>x<b>y[]</b>z</p>',              '<p>x<b>y[</b>}z</p>');
		t('<p>x<b>[]</b>y</p>',               '<p>x{<b></b>}y</p>');
		t('<p><b>[x]</b></p>',                '<p>{<b>x</b>}</p>');
		t('<p><u><b>[x]</b></u></p>',         '<p>{<u><b>x</b></u>}</p>');
		t('<p>w<i><u>{<b>x]</b></u></i></p>', '<p>w{<i><u><b>x</b></u></i>}</p>');
		t('<p><b>[x]</b>y</p>',               '<p>{<b>x</b>}y</p>');
		t('<p>x<b>[y]</b>z</p>',              '<p>x{<b>y</b>}z</p>');
		t('<p><b>x[y]z</b></p>',              '<p><b>x[y]z</b></p>');
	});

	testCoverage(test, tested, ranges);
}(window.aloha));
