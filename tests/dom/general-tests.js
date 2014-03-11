(function (aloha) {
	'use strict';

	var Dom = aloha.dom;

	module('dom');

	test('contains', function () {
		var span = $('<div><b></b><span><a></a></span></div>')[0].lastChild;
		equal(Dom.contains(span, span.firstChild), true);
		equal(Dom.contains(span, span.previousSibling), false);
	});

	test('nodeIndex', function () {
		var node = $('<div>foo<b>bar</b></div>')[0];
		equal(Dom.nodeIndex(node.lastChild), 1);
		equal(Dom.nodeIndex(node.firstChild), 0);
		equal(Dom.nodeIndex(node), 0);
	});

	test('nodeLength', function () {
		var node = $('<div>foo<b>bar</b></div>')[0];
		equal(Dom.nodeLength(node.lastChild), 1);
		equal(Dom.nodeLength(node.firstChild), 3);
		equal(Dom.nodeLength(node), 2);
	});

	test('nodeAtOffset', function () {
		var node = $('<div>foo<b>bar</b></div>')[0];
		equal(Dom.nodeAtOffset(node, 0).data, 'foo');
		equal(Dom.nodeAtOffset(node, 1), node.lastChild);
	});

	test('isTextNode', function () {
		var node = $('<div>foo<b>bar</b></div>')[0];
		equal(Dom.isTextNode(node.firstChild), true);
		equal(Dom.isTextNode(node), false);
	});

	test('moveNextAll', function () {
		var elem = $('<div><a></a><b></b><span></span></div>')[0];
		var nodes = $('<div><sup></sup><sub></sub></div>')[0];
		Dom.moveNextAll(elem, nodes.firstChild, elem.lastChild);
		equal(
			elem.outerHTML,
			'<div><a></a><b></b><sup></sup><sub></sub><span></span></div>'
		);
		equal(nodes.outerHTML, '<div></div>');
	});

	test('removeShallow', function () {
		var node = $('<div><span><b></b></span></div>')[0];
		Dom.removeShallow(node.firstChild);
		equal(node.firstChild.nodeName, 'B');
		Dom.removeShallow(node.firstChild);
		equal(node.outerHTML, '<div></div>');
	});

	test('replaceShallow', function () {
		var node = $('<div><span><b>foo</b></span></div>')[0];
		Dom.replaceShallow(node.firstChild, document.createElement('u'));
		equal(node.outerHTML, '<div><u><b>foo</b></u></div>');
	});

	test('cloneShallow', function () {
		var node = $('<div><span><b>foo</b></span></div>')[0];
		equal(Dom.cloneShallow(node.firstChild).outerHTML, '<span></span>');
	});

	test('wrap', function () {
		var span = $('<span>foo</span>')[0];
		Dom.wrap(span, document.createElement('div'));
		equal(span.parentNode.outerHTML, '<div><span>foo</span></div>');
	});

	test('insert', function () {
		var node = $('<span>foo</span>')[0];
		Dom.insert(document.createElement('u'), node.firstChild);
		Dom.insert(document.createElement('b'), node, true);
		equal(node.outerHTML, '<span><u></u>foo<b></b></span>');
	});

	test('isEditable', function () {
		var elem = $('<div><span contentEditable="true"><b></b></span></div>')[0];
		equal(Dom.isEditable(elem.firstChild.firstChild), true);
		equal(Dom.isEditable(elem.firstChild), true);
		equal(Dom.isEditable(elem), false);
	});

	test('isEditingHost', function () {
		var elem = $('<div><span contentEditable="true"><b></b></span></div>')[0];
		equal(Dom.isEditingHost(elem.firstChild.firstChild), false);
		equal(Dom.isEditingHost(elem.firstChild), true);
		equal(Dom.isEditingHost(elem), false);
	});

	test('getEditingHost', function () {
		var elem = $('<div><span contentEditable="true"><b></b></span></div>')[0];
		equal(Dom.editingHost(elem.firstChild.firstChild), elem.firstChild);
		equal(Dom.editingHost(elem.firstChild), elem.firstChild);
		equal(Dom.editingHost(elem), null);
	});

}(window.aloha));
