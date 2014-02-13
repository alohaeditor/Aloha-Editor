(function (aloha) {
	'use strict';

	var Transform = aloha.transform;

	module('Transform');

	function nodeEqual(output, expected) {
		var expectedElem = aloha.html.parse(expected, document);
		var outputElem = aloha.html.parse(output, document);
		equal(outputElem.innerHTML, expectedElem.innerHTML);
	}

	test('text/plain', function() {
		nodeEqual(
			Transform.plain('this is an \n example', document),
			'<p>this is an</p><p>example</p>'
		);
	});

	test('text/plain with break lines', function() {
		nodeEqual(
			Transform.plain('this is an \n\n example \n\n', document),
			'<p>this is an</p><p><br></p><p>example</p><p><br></p><p><br></p>'
		);
	});

})(window.aloha);
