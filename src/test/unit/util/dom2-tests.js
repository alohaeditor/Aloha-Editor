Aloha.require(['jquery', 'util/dom2'], function($, Dom){
	'use strict';

	var input = $('<div><p class="some-class">'
				  + '<span class="some-class-2 some-class"><b class="some-class-3">some</b> <i>text</i></span>'
				  + '<b class="some-class-4">some other text</b>'
				  + '</p></div>')[0];

	module('Dom');

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
});
