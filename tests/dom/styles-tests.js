(function (aloha) {
	'use strict';

	var Dom = aloha.dom;

	module('dom');

	test('setStyle', function () {
		var elem = $('<div></div>')[0];
		Dom.setStyle(elem, 'width', '100px')
		equal(elem.style.width, '100px');
	});

	test('getStyle', function () {
		var elem = $('<div></div>')[0];
		elem.style.width = '100px';
		equal(Dom.getStyle(elem, 'width'), '100px');
	});

	test('removeStyle', function () {
		var elem = $('<div></div>')[0];
		elem.style.width = '100px';
		equal(Dom.getStyle(elem, 'width'), '100px');
		Dom.removeStyle(elem, 'width');
		equal(Dom.getStyle(elem, 'width'), '');
	});

	test('getComputedStyle', function () {
		var elem = $('<div class="color: red"></div>');
		equal(Dom.getComputedStyle(elem, 'color'));
		equal(Dom.getComputedStyle(elem, 'background'), null);
	});

}(window.aloha));
