require(['jquery', '../src/dom'], function ($, Dom) {
	'use strict';

	var input = $('<div><p class="some-class">'
				  + '<span class="some-class-2 some-class"><b class="some-class-3">some</b> <i>text</i></span>'
				  + '<b class="some-class-4">some other text</b>'
				  + '</p></div>')[0];

	module('Dom');

	test('getElementsByClassNames', function () {
		var matches = Dom.getElementsByClassNames(['some-class'], input);
		equal(
			matches.length,
			input.getElementsByClassName('some-class').length
		);
		equal(
			Dom.getElementsByClassNames(['some-class-4'], input)[0].innerHTML,
			'some other text'
		);
		equal(matches[1].className, 'some-class-2 some-class');
		equal(
			Dom.getElementsByClassNames(['some-class-4', 'some-class-3'], input).length,
			2
		);
	});

	test('getAttr', function () {
		equal(Dom.getAttr($('<a>')[0], 'href'), null);
		equal(Dom.getAttr($('<a href>')[0], 'href'), '');
		equal(Dom.getAttr($('<a href="">')[0], 'href'), '');
		equal(Dom.getAttr($('<a href=" ">')[0], 'href'), ' ');
		equal(Dom.getAttr($('<a HREF="foo">')[0], 'href'), 'foo');
		equal(Dom.getAttr($('<a href="foo">')[0], 'HREF'), 'foo');
	});

	test('setAttr', function () {
		var element = $('a')[0];
		Dom.setAttr(element, 'href', '');
		equal(Dom.getAttr(element, 'href'), '');
		Dom.setAttr(element, 'href', 'foo');
		equal(Dom.getAttr(element, 'href'), 'foo');
		Dom.setAttr(element, 'href', 'bar');
		equal(Dom.getAttr(element, 'href'), 'bar');
		Dom.setAttr(element, 'href', null);
		equal(Dom.getAttr(element, 'href'), 'bar');
	});

	test('attrNames', function () {
		var result = Dom.attrNames($('<hr>')[0]);
		deepEqual(result, []);
		var result = Dom.attrNames($('<li data-attr="some value">')[0]);
		deepEqual(result, ['data-attr']);
	});

	test('indexByClass', function () {
		var result = Dom.indexByClass(input, {'some-class': true, 'some-class-4': true});
		deepEqual(result, {'some-class': $(input).find('.some-class').get(),
						   'some-class-4': $(input).find('.some-class-4').get()});
	});

	test('indexByName', function () {
		var result = Dom.indexByName(input, ['P', 'B']);
		deepEqual(result, {'P': $(input).find('p').get(),
						   'B': $(input).find('b').get()});
	});

	window._ = {Dom:Dom};
});
