(function (aloha) {
	'use strict';

	var Dom = aloha.dom;

	module('dom');

	test('attrs', function () {
		var elem = $('<div data-one="1" data-two></div>')[0];
		var attrs = Dom.attrs(elem);
		equal(2, attrs.length);
		equal(attrs[0][0], 'data-one');
		equal(attrs[0][1], '1');
		equal(attrs[1][0], 'data-two');
		equal(attrs[1][1], '');
	});

	test('attrNames', function () {
		var elem = $('<div data-one="1" data-two></div>')[0];
		var attrs = Dom.attrNames(elem);
		equal(attrs[0], 'data-one');
		equal(attrs[1], 'data-two');
	});

	test('hasAttrs', function () {
		equal(Dom.hasAttrs($('<div data-one="1" data-two></div>')[0]), true);
		equal(Dom.hasAttrs($('<input/>')[0]), false);
	});

	test('attrNames', function () {
		var result = Dom.attrNames($('<hr>')[0]);
		deepEqual(result, []);
		var result = Dom.attrNames($('<li data-attr="some value">')[0]);
		deepEqual(result, ['data-attr']);
	});

}(window.aloha));
