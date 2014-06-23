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
	 * Tests highlighted empty elements.
	 * @param {String} input
	 * @param {String} expected
	 */
	function testHighlightEmptyElements(input, expected) {
		EmptyParagraph.highlightEmptyElements(input, ['p']);
		equal(input.innerHTML, expected.innerHTML);
	}

	/**
	 * Tests remove empty elements.
	 * @param {String} input
	 * @param {String} expected
	 */
	function testRemoveEmptyElements(input, expected) {
		EmptyParagraph.removeEmptyElements(input, ['p']);
		EmptyParagraph.removeConsecutiveBr(input);
		equal(input.innerHTML, expected.innerHTML);
	}

	module('Highlight Elements');

	test('Highlight empty paragraphs', function() {
		var input = $('<div>' +
			'<p></p>' +
			'</div>')[0];
		
		var expected = $('<div>' +
				'<p class="' + EmptyParagraph.EMPTY_ELEMENT_CSS_CLASS + '"></p>' +
				'</div>')[0];
		
		testHighlightEmptyElements(input, expected);
	});

	test('Highlight empty paragraphs and Headings', function() {
		var input = $('<div>' +
			'<p></p>' +
			'<h1></h1>' +
			'<h2></h2>' +
			'<h3></h3>' +
			'</div>')[0];

		var expected = $('<div>' +
			'<p class="' + EmptyParagraph.EMPTY_ELEMENT_CSS_CLASS + '"></p>' +
			'<h1 class="' + EmptyParagraph.EMPTY_ELEMENT_CSS_CLASS + '"></h1>' +
			'<h2 class="' + EmptyParagraph.EMPTY_ELEMENT_CSS_CLASS + '"></h2>' +
			'<h3></h3>' +
			'</div>')[0];

		EmptyParagraph.highlightEmptyElements(input, ['p', 'h1', 'h2']);

		equal(input.innerHTML, expected.innerHTML);
	});
	
	module('Remove Elements');
	
	test('remove empty paragraphs', function() {
		var input = $('<div>' +
				'<p class="' + EmptyParagraph.EMPTY_ELEMENT_CSS_CLASS + '"></p>' +
				'</div>')[0];
		
		var expected = $('<div>' +
				'</div>')[0];
		
		testRemoveEmptyElements(input, expected);
	});
	
	test('remove sequential br\'s', function() {
		var input = $('<div>' +
				'<p>start<br/><br/><br/><br/><br/>end</p>' +
				'<p><br>things</p>' +
				'</div>')[0];
		
		var expected = $('<div>' +
				'<p>start<br/>end</p>' +
				'<p>things</p>' +
				'</div>')[0];
		
		testRemoveEmptyElements(input, expected);
	});

	
});
