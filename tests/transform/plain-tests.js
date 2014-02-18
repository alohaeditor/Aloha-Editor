(function (aloha) {
	'use strict';

	module('Transform');

	function t(input, expected) {
		equal(aloha.transform.plain(input, document), expected, input + ' ⇒ ' + expected);
	}

	test('text/plain', function() {
		t('this is an \n example', '<p>this is an</p><p>example</p>');
		t('this is an \n\n example \n\n', '<p>this is an</p><p><br></p><p>example</p><p><br></p><p><br></p>');
	});

})(window.aloha);
