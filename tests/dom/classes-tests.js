(function (aloha) {
	'use strict';

	var Dom = aloha.dom;

	module('dom');

	test('addClass', function () {
		var elem = $('<span></span>')[0];
		Dom.addClass(elem, 'one');
		equal(elem.outerHTML, '<span class="one"></span>');
		Dom.addClass(elem, 'two three');
		equal(elem.outerHTML, '<span class="one two three"></span>');
	});

	test('removeClass', function () {
		var elem = $('<span class="one two three"></span>')[0];
		Dom.removeClass(elem, 'two');
		equal(elem.outerHTML, '<span class="one three"></span>');
		Dom.removeClass(elem, 'one three');
		equal(elem.outerHTML, '<span class=""></span>');
		Dom.removeClass(elem, 'one');
		equal(elem.outerHTML, '<span class=""></span>');
	});

	test('hasClass', function () {
		var elem = $('<span class="one two three"></span>')[0];
		equal(true, Dom.hasClass(elem, 'one'));
		equal(false, Dom.hasClass(elem, 'four'));
	});

}(window.aloha));
