(function (aloha) {
	'use strict';

	var PasteTransformPlainText = aloha.pasteTransformPlainText;

	module('Paste Transform');

	function nodeEqual(output, expected) {
		var expectedEl = document.createElement('div'),
			outputEl = document.createElement('div');

		outputEl.innerHTML = output;
		expectedEl.innerHTML = expected;

		equal(
			outputEl.innerHTML,
			expectedEl.innerHTML);
	}

	test('text/plain', function() {
		nodeEqual(
			PasteTransformPlainText.transform('this is an \n example', document),
			'<p>this is an </p><p> example</p>'
		);
	});

	test('text/plain with break lines', function() {
		nodeEqual(
			PasteTransformPlainText.transform('this is an \n\n example \n\n', document),
			'<p>this is an </p><p><br></p><p> example </p><p><br></p><p><br></p>'
		);
	});

})(window.aloha);