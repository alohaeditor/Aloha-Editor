Aloha.require(['jquery', 'util/html'], function($, Html){
	'use strict';

	module('HTML');

	function assertIsProppedBlock(inputs, assertion) {
		var i;

		for (i = 0; i < inputs.length; i++) {
			assertion(Html.isProppedBlock($(inputs[i])[0]), inputs[i]);
		}
	}

	function notOk(cond, message) {
		ok(!cond, message);
	}

	test('Is propped block', function() {
		var inputs = [
			'<p><br></p>',
			'<p>   <br>   </p>',
			'<p>&nbsp;<br>&nbsp;</p>',
			'<p>\t<br></p>',
			'<p><br>\t\n</p>',
			'<p>\n\t<br>\n\t</p>'
		];

		assertIsProppedBlock(inputs, ok);
	});

	test('Is propped block', function() {
		var inputs = [
			'<p>asd<br></p>',
			'<p>  <br>asdf</p>',
			'<p><span>d</span><br></p>'
		];

		assertIsProppedBlock(inputs, notOk);
	});

	function testRemoveUseLessLineBreks(inputs) {

		var i, len;
		for (i = 0, len = inputs.length; i < len; i++) {
			var input = $(inputs[i][0])[0];
			var expected = $(inputs[i][1])[0];

			equal(Html.removeUselessLineBreaks(input).outerHTML, expected.outerHTML);
		}
	}

	test('Remove linebreaks for block elements', function () {
		var inputs = [
			['<p><br></p>', '<p><br></p>'],
			['<p>probe<br></p>', '<p>probe</p>'],
			['<p>probe<br><br></p>', '<p>probe<br><br></p>'],
			['<p>probe<br>still</p>', '<p>probe<br>still</p>'],
			['<p>probe<br><br></p>', '<p>probe<br><br></p>'],
			['<p>probe<br>more text<br></p>', '<p>probe<br>more text</p>'],

			['<h1><br></h1>', '<h1><br></h1>'],
			['<h2>Heading<br></h1>', '<h2>Heading</h2>']
		];

		testRemoveUseLessLineBreks(inputs);
	});

	test('Check for block and inline elements', function() {
		var inputs = [
			['<h3><span>Heading<br></span></h3>', '<h3><span>Heading</span></h3>'],
			['<p><span>probe<br><br></span></p>', '<p><span>probe<br><br></span></p>']
		];

		testRemoveUseLessLineBreks(inputs);
	});

	test('Remove linebreaks for inline elements', function () {
		var inputs = [
			['<span><br></span>', '<span><br></span>'],
			['<span>text<br><br></span>', '<span>text<br><br></span>']
		];

		testRemoveUseLessLineBreks(inputs);
	});
});
