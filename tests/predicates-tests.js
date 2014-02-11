(function (aloha) {
	'use strict';

	var Predicates = aloha.predicates;
	var tested = [];


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
		tested.push('isVoidNode');

		equal(Predicates.isVoidNode(area), true);
		equal(Predicates.isVoidNode(input), true);
		equal(Predicates.isVoidNode(span), false);
	});

	test('isBlockNode', function () {
		tested.push('isBlockNode');

		equal(Predicates.isBlockNode(span), false);
		equal(Predicates.isBlockNode(div), true);
		equal(Predicates.isBlockNode(b), false);
		equal(Predicates.isBlockNode(p), true);
		equal(Predicates.isBlockNode(a), false);
	});

	test('isInlineNode', function () {
		tested.push('isInlineNode');

		equal(Predicates.isInlineNode(span), true);
		equal(Predicates.isInlineNode(div), false);
		equal(Predicates.isInlineNode(b), true);
		equal(Predicates.isInlineNode(p), false);
		equal(Predicates.isInlineNode(a), true);
	});

	test('isTextLevelSemanticNode', function() {
		tested.push('isTextLevelSemanticNode');

		equal(Predicates.isTextLevelSemanticNode(strong), true);
		equal(Predicates.isTextLevelSemanticNode(area), false);
		equal(Predicates.isTextLevelSemanticNode(input), false);
		equal(Predicates.isTextLevelSemanticNode(span), true);
	});

	//testCoverage(test, tested, Predicates);

}(window.aloha));
