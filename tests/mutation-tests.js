(function (aloha, module, equal, test) {
	'use strict';

    module('mutation');

	function runTest(before, after, op) {
		var $dom = $(before);
		var boundaries = aloha.markers.extract($dom[0]);
		var actual = aloha.markers.hint(op($dom.find('u')[0], boundaries));
		equal(actual, after, before + ' ⇒ ' + after);
	}

	test('replaceShallowPreservingBoundaries', function () {
		[
			['<p>fo[o<u>ba]r</u></p>', '<p>fo[o<i>ba]r</i></p>'],
			['<p>fo[o<u>ba}r</u></p>', '<p>fo[o<i>ba}r</i></p>'],
			['<p>fo[o<u>bar}</u></p>', '<p>fo[o<i>bar}</i></p>']
		].forEach(function (testCase) {
			runTest(testCase[0], testCase[1], function (node, boundaries) {
				return aloha.mutation.replaceShallowPreservingBoundaries(
					node,
					node.ownerDocument.createElement('i'),
					boundaries
				);
			});
		});
	});

}(window.aloha, window.module, window.equal, window.test));
