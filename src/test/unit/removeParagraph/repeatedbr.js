/**
 * Created by najorcruzcruz on 23/04/14.
 */
Aloha.require([
	'jquery',
	'../plugins/extra/emptyparagraph/lib/emptyparagraph'
], function(
	$,
    EmptyParagraph
) {
	'use strict';

	function testExpectedNumberBR(input, expected) {
		var brs = EmptyParagraph.getConsecutiveBr(input);
		equal(brs.length, expected);
	}

	function testRemoveRepeatedBr(input, expected) {
		EmptyParagraph.removeConsecutiveBr(input);
		equal(input.innerHTML, expected.innerHTML);
	}

	module('Get repeated br\'s');

	test('get repeated br\'s', function() {
		var input = $('<div> ' +
			'<p>things<br><br></p> ' +
			'things<br><br><br>' +
			'<p><br/>things</p>' +
			' </div>')[0];
		testExpectedNumberBR(input, 4);
	});

	test('get repeated br\'s, empty elements', function() {
		var input = $('<div> ' +
			'<p><br id="first"><span></span><br id="repeated">things</p> ' +
			' </div>')[0];
		testExpectedNumberBR(input, 1);
		var brs = EmptyParagraph.getConsecutiveBr(input);
		equal(brs[0].id, 'first');
	});

	test('get repeated br\'s, empty elements', function() {
		var input = $('<div> ' +
			'<p><br id="first"><span></span><br id="repeated_1">things</p> ' +
			'<p><br id="second"><br id="repeated_2"></p>' +
			' </div>')[0];
		testExpectedNumberBR(input, 2);

		var brs = EmptyParagraph.getConsecutiveBr(input);
		equal(brs[0].id, 'first');
		equal(brs[1].id, 'second');
	});

	module('Remove repeated br\'s');

	test('get repeated br\'s, empty elements', function() {
		var input = $('<div> ' +
			'<p><br id="first"><span></span><br id="repeated_1">things</p> ' +
			'<p><br id="second"><br id="repeated_2"></p>' +
			' </div>')[0];
		var expected = $('<div> ' +
			'<p><span></span><br id="repeated_1">things</p> ' +
			'<p><br id="repeated_2"></p>' +
			' </div>')[0];
		
		testRemoveRepeatedBr(input, expected);
	});
});
