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

	/**
	 * Tests expected number of empty elements.
	 * @param {String} input
	 * @param {String} expected
	 */
	function testExpectedNumberEmptyElements(input, expected) {
		var paragraphs = EmptyParagraph.getEmptyElements(input, ['p']);
		equal(paragraphs.length, expected);
	}

	/**
	 * Tests removed empty elements.
	 * @param {String} input
	 * @param {String} expected
	 */
	function testRemoveEmptyElements(input, expected) {
		EmptyParagraph.removeEmptyElements(input, ['p']);
		equal(input.innerHTML, expected.innerHTML);
	}

	module('Get empty paragraph');

	test('emtpy paragraph with whitespaces', function() {
		var input = $('<div>' +
			'<p></p>' +
			'<p>&nbsp;</p>' +
			'<p>&nbsp;</p>' +
			'<p>     \t\r</p>' +
			'<p>   <br>&nbsp;<span>&nbsp;</span>  \t\r</p>' +
			'</div>')[0];
		testExpectedNumberEmptyElements(input, 5);
	});
	
	test('heading are not included', function() {
		var input = $('<div>' +
			'<h1></h1>' +
			'<h2>&nbsp;</h2>' +
			'<h3>&nbsp;</h3>' +
			'</div>')[0];
		testExpectedNumberEmptyElements(input, 0);
	});

	test('emtpy paragraph with br elements', function() {
		var input = $('<div>' +
			'<p><br>\t <br></p>' +
			'<p><br>\t &nbsp;<br></p>' +
			'</div>')[0];
		testExpectedNumberEmptyElements(input, 2);
	});

	test('emtpy paragraph with span elements', function() {
		var input = $('<div>' +
			'<p><span></span></p>' +
			'<p><span>   </span><br></p>' +
			'<p><b>   </b><br></p>' +
			'</div>')[0];
		testExpectedNumberEmptyElements(input, 3);
	});

	test('not emtpy paragraph', function() {
		var input = $('<div> ' +
			'<p><br> s <br></p> ' +
			'<p>d<br>\t <br></p>' +
			'<p><img/></p>' +
			'<p><span><img/></span></p>' +
			'<p><span></span><b>s</b><br>\t <br></p>' +
			' </div>')[0];
		testExpectedNumberEmptyElements(input, 0);
	});

	module('Remove empty paragraph');

	test('removes empty paragraph', function() {
		var input = $('<div>' +
			'<p></p>' +
			'<p> </p>' +
			'<p>     \t\r</p>' +
			'</div>')[0];

		var expected = $('<div></div>')[0];
		testRemoveEmptyElements(input, expected);
	});

	test('removes empty paragraph, between not empty paragraph', function() {
		var input = $('<div>' +
			'<p>Things</p>' +
			'<p> </p>' +
			'<p>  never   \t\r</p>' +
			'</div>')[0];

		var expected = $('<div>' +
			'<p>Things</p>' +
			'<p>  never   \t\r</p>' +
			'</div>')[0];
		
		testRemoveEmptyElements(input, expected);
	});
});
