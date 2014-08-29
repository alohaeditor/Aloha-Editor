(function (aloha, require, module, test, equal) {
	'use strict';

	require('../src/html', function (Html) {

		module('html');

		test('isStyleInherited', function () {
			equal(Html.isStyleInherited('color'), true);
			equal(Html.isStyleInherited('background'), true);
		});

		test('hasBlockStyle', function () {
			var span = $('<span style="display: block"></span>')[0];
			var div = $('<div></div>')[0];
			var b = $('<b>foo</b>')[0];
			var p = $('<p style="display: inline"></p>')[0];
			var a = $('<a></a>')[0];
			$('body').append([span, div, b, p, a]);
			equal(Html.hasBlockStyle(span), true);
			equal(Html.hasBlockStyle(div), true);
			equal(Html.hasBlockStyle(b), false);
			equal(Html.hasBlockStyle(p), false);
			equal(Html.hasBlockStyle(a), false);
		});

		test('hasInlineStyle', function () {
			var span = $('<span style="display: block"></span>')[0];
			var div = $('<div></div>')[0];
			var b = $('<b>foo</b>')[0];
			var p = $('<p style="display: inline"></p>')[0];
			var a = $('<a></a>')[0];
			$('body').append([span, div, b, p, a]);
			equal(Html.hasInlineStyle(span), false);
			equal(Html.hasInlineStyle(div), false);
			equal(Html.hasInlineStyle(b), true);
			equal(Html.hasInlineStyle(p), true);
			equal(Html.hasInlineStyle(a), true);
		});

	});

}(window.aloha, window.require, window.module, window.test, window.equal));
