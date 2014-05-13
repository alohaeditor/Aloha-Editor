(function (aloha) {
	'use strict';

	var Dom = aloha.dom;
	var Maps = aloha.maps;

	module('dom');

	test('attrs', function () {
		var elem = $('<div data-one="1" data-two></div>')[0];
		var attrs = Dom.attrs(elem);
		equal(2, Maps.keys(attrs).length);
		equal(attrs['data-one'], '1');
		equal(attrs['data-two'], '');
	});

	test('hasAttrs', function () {
		equal(Dom.hasAttrs($('<div data-one="1" data-two></div>')[0]), true);
		equal(Dom.hasAttrs($('<input/>')[0]), false);
	});

}(window.aloha));
