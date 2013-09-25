(function (aloha) {
	'use strict';

	var html = aloha.html;
	var tested = [];

    module('html');

	test('isControlCharacter', function () {
		tested.push('isControlCharacter');
		equal(html.isControlCharacter('\0'), true);
		equal(html.isControlCharacter('\b'), true);
		equal(html.isControlCharacter('\n'), true);
		equal(html.isControlCharacter('\r'), true);
		equal(html.isControlCharacter('\t'), true);
		equal(html.isControlCharacter('\f'), true);
		equal(html.isControlCharacter('\v'), true);
		equal(html.isControlCharacter('\u0000'), true);
		equal(html.isControlCharacter('0'), false);
		equal(html.isControlCharacter(''), false);
		equal(html.isControlCharacter('a'), false);
	});

	/*
	test('isVisuallyAdjacent()', function () {
		//t('<div><p>ba{</p>}az</div>', true);
	});

	test('removeVisualBreak()', function () {
		var t = function(before, after) {
			return runTest(before, after, editing.joinRangeContainers);
		};
		t('<div><p>foo{</p><p>}bar</p></div>', '<div><p>foo{}bar</p></div>');
		t('<div><p>foo[</p><p>]bar</p></div>', '<div><p>foo[]bar</p></div>');
		t('<div><b>foo[</b><b>]bar</b></div>', '<div><b>foo[]bar</b></div>');
		t('<div><b>foo{</b><i>}bar</i></div>', '<div><b>foo{}</b><i>bar</i></div>');
		t('<div><b>foo[</b><i>]bar</i></div>', '<div><b>foo[]</b><i>bar</i></div>');
		t('<div><b>foo{</b><p>}bar</p></div>', '<div><b>foo{}</b>bar</div>');
		t('<div><b>foo[</b><p>]bar</p></div>', '<div><b>foo[]</b>bar</div>');
		t('<div><b>foo[</b><p><b>]bar</b></p></div>',
		                                       '<div><b>foo[]bar</b></div>');
		t('<div><p><b>foo{</b></p>\n<i>\t\r\n<b>}bar</b></i></div>',
		                                       '<div><p><b>foo{}</b><i>\t\r\n<b>bar</b></i></p>\n</div>');

		// TODO: Lists
	});
	*/

	test('isStyleInherited', function () {
		tested.push('isStyleInherited');
		equal(html.isStyleInherited('color'), true);
		equal(html.isStyleInherited('background'), true);
	});

	test('isBlockType', function () {
		tested.push('isBlockType');
		var span = $('<span style="display: block"></span>')[0];
		var div = $('<div></div>')[0];
		var b = $('<b>foo</b>')[0];
		var p = $('<p style="display: inline"></p>')[0];
		var a = $('<a></a>')[0];
		$('body').append([span, div, b, p, a]);
		equal(html.isBlockType(span), false);
		equal(html.isBlockType(div), true);
		equal(html.isBlockType(b), false);
		equal(html.isBlockType(p), true);
		equal(html.isBlockType(a), false);
	});

	test('isInlineType', function () {
		tested.push('isInlineType');
		var span = $('<span style="display: block"></span>')[0];
		var div = $('<div></div>')[0];
		var b = $('<b>foo</b>')[0];
		var p = $('<p style="display: inline"></p>')[0];
		var a = $('<a></a>')[0];
		$('body').append([span, div, b, p, a]);
		equal(html.isInlineType(span), true);
		equal(html.isInlineType(div), false);
		equal(html.isInlineType(b), true);
		equal(html.isInlineType(p), false);
		equal(html.isInlineType(a), true);
	});

	test('hasBlockStyle', function () {
		tested.push('hasBlockStyle');
		var span = $('<span style="display: block"></span>')[0];
		var div = $('<div></div>')[0];
		var b = $('<b>foo</b>')[0];
		var p = $('<p style="display: inline"></p>')[0];
		var a = $('<a></a>')[0];
		$('body').append([span, div, b, p, a]);
		equal(html.hasBlockStyle(span), true);
		equal(html.hasBlockStyle(div), true);
		equal(html.hasBlockStyle(b), false);
		equal(html.hasBlockStyle(p), false);
		equal(html.hasBlockStyle(a), false);
	});

	test('hasInlineStyle', function () {
		tested.push('hasInlineStyle');
		var span = $('<span style="display: block"></span>')[0];
		var div = $('<div></div>')[0];
		var b = $('<b>foo</b>')[0];
		var p = $('<p style="display: inline"></p>')[0];
		var a = $('<a></a>')[0];
		$('body').append([span, div, b, p, a]);
		equal(html.hasInlineStyle(span), false);
		equal(html.hasInlineStyle(div), false);
		equal(html.hasInlineStyle(b), true);
		equal(html.hasInlineStyle(p), true);
		equal(html.hasInlineStyle(a), true);
	});

	test('isUnrenderedWhitespace', function () {
		tested.push('isUnrenderedWhitespace');
		equal(html.isUnrenderedWhitespace(document.createTextNode('\t\r')), false);
		equal(html.isUnrenderedWhitespace($('<div>\t\r</div>')[0].firstChild), true);
		equal(html.isUnrenderedWhitespace($('<div>\t\rt</div>')[0].firstChild), false);
	});

	test('skipUnrenderedToStartOfLine', function () {
		tested.push('skipUnrenderedToStartOfLine');
		var node = $('<div>foo<b>bar </b>\t\r</div>')[0]
		equal(html.skipUnrenderedToStartOfLine(
			aloha.cursors.cursor(node.lastChild, false)
		), true);
		equal(html.skipUnrenderedToStartOfLine(
			aloha.cursors.cursor(node.firstChild.nextSibling.firstChild, false)
		), false);
		equal(html.skipUnrenderedToStartOfLine(
			aloha.cursors.cursor(node.firstChild, false)
		), false);
	});

	test('skipUnrenderedToEndOfLine', function () {
		tested.push('skipUnrenderedToEndOfLine');
		var node = $('<div>\t\r</div>')[0].firstChild;
		var point = aloha.cursors.cursor(node, false);
		equal(html.skipUnrenderedToEndOfLine(point), true);
	});

	test('normalizeBoundary', function () {
		tested.push('normalizeBoundary');
	});

	test('isEmpty', function () {
		tested.push('isEmpty');
	});

	testCoverage(test, tested, html);
}(window.aloha));
