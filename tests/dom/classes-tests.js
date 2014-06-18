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
		Dom.addClass(elem, 'two', 'three');
		equal(elem.outerHTML, '<span class="one two three"></span>');
		Dom.addClass(elem, 'two', 'three', 'two', 'three');
		equal(elem.outerHTML, '<span class="one two three"></span>');
		Dom.addClass(elem, 'two', 'three', 'four', 'three');
		equal(elem.outerHTML, '<span class="one two three four"></span>');

		elem = $('<span class="one\n\t   two"></span>')[0];
		Dom.addClass(elem, 'three');
		equal(elem.outerHTML, '<span class="one two three"></span>');
		Dom.addClass(elem, 'two three');
		equal(elem.outerHTML, '<span class="one two three"></span>');
	});

	test('removeClass', function () {
		var elem = $('<span class="one two three"></span>')[0];
		Dom.removeClass(elem, 'two');
		equal(elem.outerHTML, '<span class="one three"></span>');
		Dom.removeClass(elem, 'one', 'three');
		equal(elem.outerHTML, '<span class=""></span>');
		Dom.removeClass(elem, 'one');
		equal(elem.outerHTML, '<span class=""></span>');

		elem = $('<span class="one two three"></span>')[0];
		Dom.removeClass(elem, 'one', 'three', 'two');
		equal(elem.outerHTML, '<span class=""></span>');

		elem = $('<span class="one two three"></span>')[0];
		Dom.removeClass(elem, 'four');
		equal(elem.outerHTML, '<span class="one two three"></span>');
		Dom.removeClass(elem, 'four', 'one', 'one');
		equal(elem.outerHTML, '<span class="two three"></span>');

		elem = $('<span class="one\n\t   two\nthree"></span>')[0];
		Dom.removeClass(elem, 'two');
		equal(elem.outerHTML, '<span class="one three"></span>');
		
		elem = $('<span class="one\n\t   two\nthree"></span>')[0];
		Dom.removeClass(elem, 'one', 'three', 'two');
		equal(elem.outerHTML, '<span class=""></span>');
	});

	test('hasClass', function () {
		var elem = $('<span class="one two three"></span>')[0];
		equal(true, Dom.hasClass(elem, 'one'));
		equal(false, Dom.hasClass(elem, 'four'));
	});

}(window.aloha));
