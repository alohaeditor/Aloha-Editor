(function (aloha, module, equal, test) {
	'use strict';

    module('content');

	test('allowsNesting', function () {
		equal(aloha.content.allowsNesting('div', 'p'), true);
		equal(aloha.content.allowsNesting('span', 'div'), false);
		equal(aloha.content.allowsNesting('span', 'b'), true);
		equal(aloha.content.allowsNesting('td', 'table'), true);
		equal(aloha.content.allowsNesting('td', 'tr'), false);
		equal(aloha.content.allowsNesting('br', 'span'), false);
		equal(aloha.content.allowsNesting('br', 'br'), false);
		equal(aloha.content.allowsNesting('p', 'p'), false);
		equal(aloha.content.allowsNesting('SPAN', 'span'), true);
		equal(aloha.content.allowsNesting('i', 'i'), true);
		equal(aloha.content.allowsNesting('i', 'table'), false);
		equal(aloha.content.allowsNesting('ol', 'div'), false);
	});

}(window.aloha, window.module, window.equal, window.test));
