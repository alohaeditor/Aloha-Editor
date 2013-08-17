require(['jquery', '../src/dom'], function ($, dom) {
	'use strict';

	var input = $('<div><p class="some-class">'
				  + '<span class="some-class-2 some-class"><b class="some-class-3">some</b> <i>text</i></span>'
				  + '<b class="some-class-4">some other text</b>'
				  + '</p></div>')[0];

	module('dom');

	test('getElementsByClassNames', function () {
		var matches = dom.getElementsByClassNames(['some-class'], input);
		equal(
			matches.length,
			input.getElementsByClassName('some-class').length
		);
		equal(
			dom.getElementsByClassNames(['some-class-4'], input)[0].innerHTML,
			'some other text'
		);
		equal(matches[1].className, 'some-class-2 some-class');
		equal(
			dom.getElementsByClassNames(['some-class-4', 'some-class-3'], input).length,
			2
		);
	});

	module('Attributes');

	/*
	test('removeAttr', function () {
		
	});

	test('attrNames', function () {

	});

	test('hasAttrs', function () {

	});

	test('attrs', function () {

	});
	*/

	test('getAttr', function () {
		equal(dom.getAttr($('<a>')[0], 'href'), null);
		equal(dom.getAttr($('<a href>')[0], 'href'), '');
		equal(dom.getAttr($('<a href="">')[0], 'href'), '');
		equal(dom.getAttr($('<a href=" ">')[0], 'href'), ' ');
		equal(dom.getAttr($('<a HREF="foo">')[0], 'href'), 'foo');
		equal(dom.getAttr($('<a href="foo">')[0], 'HREF'), 'foo');
	});

	test('setAttr', function () {
		var element = $('a')[0];
		dom.setAttr(element, 'href', '');
		equal(dom.getAttr(element, 'href'), '');
		dom.setAttr(element, 'href', 'foo');
		equal(dom.getAttr(element, 'href'), 'foo');
		dom.setAttr(element, 'href', 'bar');
		equal(dom.getAttr(element, 'href'), 'bar');
		dom.setAttr(element, 'href', null);
		equal(dom.getAttr(element, 'href'), 'bar');
	});

	test('attrNames', function () {
		var result = dom.attrNames($('<hr>')[0]);
		deepEqual(result, []);
		var result = dom.attrNames($('<li data-attr="some value">')[0]);
		deepEqual(result, ['data-attr']);
	});

	test('indexByClass', function () {
		var result = dom.indexByClass(input, {'some-class': true, 'some-class-4': true});
		deepEqual(result, {'some-class': $(input).find('.some-class').get(),
						   'some-class-4': $(input).find('.some-class-4').get()});
	});

	test('indexByName', function () {
		var result = dom.indexByName(input, ['P', 'B']);
		deepEqual(result, {'P': $(input).find('p').get(),
						   'B': $(input).find('b').get()});
	});

	/*
	module('Classes');

	test('addClass', function () {

	});

	test('removeClass', function () {

	});

	test('hasClass', function () {

	});
	*/

	/*
	'indexByClassHaveList'

	'outerHtml'

	'moveNextAll'

	'removeShallow'
	'removeShallowPreservingBoundaries'
	'removePreservingRange'
	'removePreservingRanges'
	'cloneShallow'
	'wrap'
	'insert'
	'replaceShallow'
	'isAtEnd'
	'nodeIndex'
	'nodeLength'
	'nodeAtOffset'
	'isTextNode'
	'splitTextNode'
	'splitTextContainers'
	'splitTextNodeAdjustRange'
	'joinTextNodeAdjustRange'
	'contains'
	'setStyle'
	'getStyle'
	'getComputedStyle'
	'removeStyle'
	'isEditable'
	'isEditingHost'
	'getEditingHost'
	'Nodes'
	*/


});
