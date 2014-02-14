(function (aloha) {
	'use strict';

	module('Transform MS-Word');

	var Dom = aloha.dom;
	var Transform = aloha.transform;

	function trim(node) {
		if (Dom.isTextNode(node)) {
			node.data = node.data.trim();
		} else {
			Dom.children(node).forEach(trim);
		}
		return node;
	}

	function runTests(content) {
		$('<div>' + content + '</div>').find('>.test').each(function () {
			var $test = $(this);
			var input = trim($test.find('>.input')[0]).innerHTML;
			var expected = trim($test.find('>.expected')[0]).innerHTML;
			var actual = Transform.html(Transform.msword(input, document), document);
			test(input + ' ⇒ ' + expected, function () {
				equal(actual, expected);
			});
			/*
			$('body')
				.append('======= input:\n\n\n\n\n\n\n\n\n\n\n\n\n')
				.append(input)
				.append('======= expected: \n\n\n\n\n\n\n\n\n\n\n\n\n')
				.append(expected)
				.append('======= actual: \n\n\n\n\n\n\n\n\n\n\n\n\n')
				.append(actual)
				.append('<hr>');
			*/
		});
	}

	for (var i = 1; i <= 16; i++) {
		$.ajax({
			async: false,
			url: 'transform/ms-word/lists/' + (i < 10 ? '0' : '') + i + '.html',
			success: runTests
		});
	}
}(window.aloha));
