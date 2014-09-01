(function (aloha, require, module, test, equal, deepEqual) {
	'use strict';

	var Dom = aloha.dom;
	var Boundaries = aloha.boundaries;
	var Cursors; require('../src/cursors', function (Module) { Cursors = Module; });
	var Mutation; require('../src/mutation', function (Module) { Mutation = Module; });

	function createRange(sc, so, ec, eo) {
		return Boundaries.range(
			Boundaries.raw(sc, so),
			Boundaries.raw(ec, eo)
		);
	}

	module('dom');

	test('splitTextNode', function () {
		var node = $('<div>foo<b>bar</b></div>')[0];
		var range = createRange(
			node.firstChild,
			1,
			node.lastChild.lastChild,
			2
		);
		Mutation.splitTextContainers(range);
		equal(node.childNodes[0].data, 'f');
		equal(node.childNodes[1].data, 'oo');
		equal(node.lastChild.childNodes[0].data, 'ba');
		equal(node.lastChild.childNodes[1].data, 'r');
	});

	test('splitBoundary', function () {
		var node = $('<div>foo<b>bar</b></div>')[0];
		var range = createRange(
			node.firstChild,
			2,
			node.lastChild.lastChild,
			2
		);
		Mutation.splitBoundary([node.firstChild, 1], [range]);
		equal(
			Dom.nodeAtOffset(range.startContainer, range.startOffset).data,
			'oo'
		);
	});

	test('joinTextNodeAdjustRange', function () {
		var node = $('<div>foo<b>bar</b></div>')[0];
		Mutation.splitTextNode(node.firstChild, 2);
		var range = createRange(
			node.childNodes[1],
			0,
			node.lastChild.lastChild,
			2
		);
		Mutation.joinTextNodeAdjustRange(node.firstChild, range);
		equal(
			Dom.nodeAtOffset(range.startContainer, range.startOffset).data,
			'foo'
		);
	});

	test('removeShallowPreservingBoundariesCursors', function () {
		var node = $('<div><span><b>foo</b></span></div>')[0];
		var points = [
			Cursors.cursorFromBoundaryPoint(node, 0),
			Cursors.cursorFromBoundaryPoint(node.firstChild, 1)
		];
		Mutation.removeShallowPreservingCursors(node.firstChild, points);
		equal(node.outerHTML, '<div><b>foo</b></div>');
		equal(points[0].node.nodeName, 'B');
		equal(points[0].atEnd, false);
		equal(points[1].node.nodeName, 'DIV');
		equal(points[1].atEnd, true);
	});

	test('removePreservingRange', function () {
		var node = $('<div><span>foo<b>bar</b></span></div>')[0];
		var range = createRange(node, 0, node.firstChild.lastChild, 1);

		Mutation.removePreservingRange(node.firstChild.lastChild, range);
		equal(node.outerHTML, '<div><span>foo</span></div>');
		equal(range.startContainer.nodeName, 'DIV');
		equal(range.startOffset, 0);
		equal(range.endContainer.nodeName, 'SPAN');
		equal(range.endOffset, 1);

		Mutation.removePreservingRanges(node.firstChild.firstChild, [range]);
		equal(node.outerHTML, '<div><span></span></div>');
		equal(range.startContainer.nodeName, 'DIV');
		equal(range.startOffset, 0);
		equal(range.endContainer.nodeName, 'SPAN');
		equal(range.endOffset, 0);
	});

}(window.aloha, window.require, window.module, window.test, window.equal, window.deepEqual));
