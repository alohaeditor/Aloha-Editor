(function (aloha) {
	'use strict';

	var Html = aloha.html;

	module('predicates');

	var span = $('<span style="display: block"></span>')[0];
	var div = $('<div></div>')[0];
	var b = $('<b>foo</b>')[0];
	var p = $('<p style="display: inline"></p>')[0];
	var a = $('<a></a>')[0];
	var area = $('<area>')[0];
	var input = $('<input>')[0];
	var strong = $('<strong>things</strong>')[0];

	test('isVoidNode', function() {
		equal(Html.isVoidNode(area), true);
		equal(Html.isVoidNode(input), true);
		equal(Html.isVoidNode(span), false);
	});

	test('isBlockNode', function () {
		equal(Html.isBlockNode(span), false);
		equal(Html.isBlockNode(div), true);
		equal(Html.isBlockNode(b), false);
		equal(Html.isBlockNode(p), true);
		equal(Html.isBlockNode(a), false);
	});

	test('isInlineNode', function () {
		equal(Html.isInlineNode(span), true);
		equal(Html.isInlineNode(div), false);
		equal(Html.isInlineNode(b), true);
		equal(Html.isInlineNode(p), false);
		equal(Html.isInlineNode(a), true);
	});

	test('isTextLevelSemanticNode', function() {
		equal(Html.isTextLevelSemanticNode(strong), true);
		equal(Html.isTextLevelSemanticNode(area), false);
		equal(Html.isTextLevelSemanticNode(input), false);
		equal(Html.isTextLevelSemanticNode(span), true);
	});

}(window.aloha));
