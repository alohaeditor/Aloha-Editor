(function (aloha) {
	'use strict';

	var content = aloha.content;
	var tested = [];

    module('content');

	test('allowsNesting', function () {
		tested.push('allowsNesting');
		equal(content.allowsNesting('div', 'p'), true);
		equal(content.allowsNesting('span', 'div'), false);
		equal(content.allowsNesting('span', 'b'), true);
		equal(content.allowsNesting('td', 'table'), true);
		equal(content.allowsNesting('td', 'tr'), false);
		equal(content.allowsNesting('br', 'span'), false);
		equal(content.allowsNesting('br', 'br'), false);
		equal(content.allowsNesting('p', 'p'), false);
		equal(content.allowsNesting('SPAN', 'span'), true);
		equal(content.allowsNesting('i', 'i'), true);
		equal(content.allowsNesting('i', 'table'), false);
		equal(content.allowsNesting('ol', 'div'), false);
	});

	//testCoverage(test, tested, content);

}(window.aloha));
