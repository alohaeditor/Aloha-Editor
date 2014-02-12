(function (aloha) {
	'use strict';

	var Dom = aloha.dom;
	var Mutation = aloha.mutation;
	var tested = [];

	var input = $('<div><p class="some-class">'
				  + '<span class="some-class-2 some-class"><b class="some-class-3">some</b> <i>text</i></span>'
				  + '<b class="some-class-4">some other text</b>'
				  + '</p></div>')[0];

	module('dom');

	/* Are these obsolete?
	test('getElementsByClassNames', function () {
		tested.push('getElementsByClassNames');
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

	test('indexByClass', function () {
		tested.push('indexByClass');
		var result = Dom.indexByClass(input, {'some-class': true, 'some-class-4': true});
		deepEqual(result, {'some-class': $(input).find('.some-class').get(),
						   'some-class-4': $(input).find('.some-class-4').get()});
	});

	test('indexByName', function () {
		tested.push('indexByName');
		var result = Dom.indexByName(input, ['P', 'B']);
		deepEqual(result, {'P': $(input).find('p').get(),
						   'B': $(input).find('b').get()});
	});

	// fixme
	test('indexByClassHaveList', function () {
		tested.push('indexByClassHaveList');
		ok(1);
	});
	*/

	test('moveNextAll', function () {
		tested.push('moveNextAll');
		var elem = $('<div><a></a><b></b><span></span></div>')[0];
		var nodes = $('<div><sup></sup><sub></sub></div>')[0];
		Dom.moveNextAll(elem, nodes.firstChild, elem.lastChild);
		equal(
			elem.outerHTML,
			'<div><a></a><b></b><sup></sup><sub></sub><span></span></div>'
		);
		equal(nodes.outerHTML, '<div></div>');
	});

	test('contains', function () {
		tested.push('contains');
		var span = $('<div><b></b><span><a></a></span></div>')[0].lastChild;
		equal(Dom.contains(span, span.firstChild), true);
		equal(Dom.contains(span, span.previousSibling), false);
	});

	test('removeShallow', function () {
		tested.push('removeShallow');
		var node = $('<div><span><b></b></span></div>')[0];
		Dom.removeShallow(node.firstChild);
		equal(node.firstChild.nodeName, 'B');
		Dom.removeShallow(node.firstChild);
		equal(node.outerHTML, '<div></div>');
	});

	test('removeShallowPreservingBoundariesCursors', function () {
		tested.push('removeShallowPreservingBoundaries');
		var node = $('<div><span><b>foo</b></span></div>')[0];
		var points = [
			aloha.cursors.cursorFromBoundaryPoint(node, 0),
			aloha.cursors.cursorFromBoundaryPoint(node.firstChild, 1)
		];
		Mutation.removeShallowPreservingCursors(node.firstChild, points);
		equal(node.outerHTML, '<div><b>foo</b></div>');
		equal(points[0].node.nodeName, 'B');
		equal(points[0].atEnd, false);
		equal(points[1].node.nodeName, 'DIV');
		equal(points[1].atEnd, true);
	});

	test('removePreservingRange', function () {
		tested.push('removePreservingRange');
		tested.push('removePreservingRanges');

		var node = $('<div><span>foo<b>bar</b></span></div>')[0];
		var range = aloha.ranges.create(node, 0, node.firstChild.lastChild, 1);

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

	test('replaceShallow', function () {
		tested.push('replaceShallow');
		var node = $('<div><span><b>foo</b></span></div>')[0];
		Dom.replaceShallow(node.firstChild, document.createElement('u'));
		equal(node.outerHTML, '<div><u><b>foo</b></u></div>');
	});

	test('cloneShallow', function () {
		tested.push('cloneShallow');
		var node = $('<div><span><b>foo</b></span></div>')[0];
		equal(Dom.cloneShallow(node.firstChild).outerHTML, '<span></span>');
	});

	test('wrap', function () {
		tested.push('wrap');
		var span = $('<span>foo</span>')[0];
		Dom.wrap(span, document.createElement('div'));
		equal(span.parentNode.outerHTML, '<div><span>foo</span></div>');
	});

	test('insert', function () {
		tested.push('insert');
		var node = $('<span>foo</span>')[0];
		Dom.insert(document.createElement('u'), node.firstChild);
		Dom.insert(document.createElement('b'), node, true);
		equal(node.outerHTML, '<span><u></u>foo<b></b></span>');
	});

	test('nodeIndex', function () {
		tested.push('nodeIndex');
		var node = $('<div>foo<b>bar</b></div>')[0];
		equal(Dom.nodeIndex(node.lastChild), 1);
		equal(Dom.nodeIndex(node.firstChild), 0);
		equal(Dom.nodeIndex(node), 0);
	});

	test('nodeLength', function () {
		tested.push('nodeLength');
		var node = $('<div>foo<b>bar</b></div>')[0];
		equal(Dom.nodeLength(node.lastChild), 1);
		equal(Dom.nodeLength(node.firstChild), 3);
		equal(Dom.nodeLength(node), 2);
	});

	test('nodeAtOffset', function () {
		tested.push('nodeAtOffset');
		var node = $('<div>foo<b>bar</b></div>')[0];
		equal(Dom.nodeAtOffset(node, 0).data, 'foo');
		equal(Dom.nodeAtOffset(node, 1), node.lastChild);
	});

	test('isTextNode', function () {
		tested.push('isTextNode');
		var node = $('<div>foo<b>bar</b></div>')[0];
		equal(Dom.isTextNode(node.firstChild), true);
		equal(Dom.isTextNode(node), false);
	});

	test('splitTextNode', function () {
		tested.push('splitTextNode');
		var node = $('<div>foo</div>')[0];
		equal(Mutation.splitTextNode(node.firstChild, 2).data, 'fo');
		equal(node.lastChild.data, 'o');
	});

	test('splitTextContainers', function () {
		tested.push('splitTextContainers');
		var node = $('<div>foo<b>bar</b></div>')[0];
		var range = aloha.ranges.create(
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
		tested.push('splitBoundary');
		var node = $('<div>foo<b>bar</b></div>')[0];
		var range = aloha.ranges.create(
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
		tested.push('joinTextNodeAdjustRange');
		var node = $('<div>foo<b>bar</b></div>')[0];
		Mutation.splitTextNode(node.firstChild, 2);
		var range = aloha.ranges.create(
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

	test('setStyle', function () {
		tested.push('setStyle');
		var elem = $('<div></div>')[0];
		Dom.setStyle(elem, 'width', '100px')
		equal(elem.style.width, '100px');
	});

	test('getStyle', function () {
		tested.push('getStyle');
		var elem = $('<div></div>')[0];
		elem.style.width = '100px';
		equal(Dom.getStyle(elem, 'width'), '100px');
	});

	test('removeStyle', function () {
		tested.push('removeStyle');
		var elem = $('<div></div>')[0];
		elem.style.width = '100px';
		equal(Dom.getStyle(elem, 'width'), '100px');
		Dom.removeStyle(elem, 'width');
		equal(Dom.getStyle(elem, 'width'), '');
	});

	test('getComputedStyle', function () {
		tested.push('getComputedStyle');
		var elem = $('<div class="color: red"></div>');
		equal(Dom.getComputedStyle(elem, 'color'));
		equal(Dom.getComputedStyle(elem, 'background'), null);
	});

	test('isEditable', function () {
		tested.push('isEditable');
		var elem = $('<div><span contentEditable="true"><b></b></span></div>')[0];
		equal(Dom.isEditable(elem.firstChild.firstChild), true);
		equal(Dom.isEditable(elem.firstChild), true);
		equal(Dom.isEditable(elem), false);
	});

	test('isEditingHost', function () {
		tested.push('isEditingHost');
		var elem = $('<div><span contentEditable="true"><b></b></span></div>')[0];
		equal(Dom.isEditingHost(elem.firstChild.firstChild), false);
		equal(Dom.isEditingHost(elem.firstChild), true);
		equal(Dom.isEditingHost(elem), false);
	});

	test('getEditingHost', function () {
		tested.push('getEditingHost');
		var elem = $('<div><span contentEditable="true"><b></b></span></div>')[0];
		equal(Dom.editingHost(elem.firstChild.firstChild), elem.firstChild);
		equal(Dom.editingHost(elem.firstChild), elem.firstChild);
		equal(Dom.editingHost(elem), null);
	});

	test('attrs', function () {
		tested.push('attrs');
		var elem = $('<div data-one="1" data-two></div>')[0];
		var attrs = Dom.attrs(elem);
		equal(2, attrs.length);
		equal(attrs[0][0], 'data-one');
		equal(attrs[0][1], '1');
		equal(attrs[1][0], 'data-two');
		equal(attrs[1][1], '');
	});

	test('attrNames', function () {
		tested.push('attrNames');
		var elem = $('<div data-one="1" data-two></div>')[0];
		var attrs = Dom.attrNames(elem);
		equal(attrs[0], 'data-one');
		equal(attrs[1], 'data-two');
	});

	test('hasAttrs', function () {
		tested.push('hasAttrs');
		equal(Dom.hasAttrs($('<div data-one="1" data-two></div>')[0]), true);
		equal(Dom.hasAttrs($('<input/>')[0]), false);
	});

	test('attrNames', function () {
		tested.push('attrNames');
		var result = Dom.attrNames($('<hr>')[0]);
		deepEqual(result, []);
		var result = Dom.attrNames($('<li data-attr="some value">')[0]);
		deepEqual(result, ['data-attr']);
	});

	test('addClass', function () {
		tested.push('addClass');
		var elem = $('<span></span>')[0];
		Dom.addClass(elem, 'one');
		equal(elem.outerHTML, '<span class="one"></span>');
		Dom.addClass(elem, 'two three');
		equal(elem.outerHTML, '<span class="one two three"></span>');
	});

	test('removeClass', function () {
		tested.push('removeClass');
		var elem = $('<span class="one two three"></span>')[0];
		Dom.removeClass(elem, 'two');
		equal(elem.outerHTML, '<span class="one three"></span>');
		Dom.removeClass(elem, 'one three');
		equal(elem.outerHTML, '<span class=""></span>');
		Dom.removeClass(elem, 'one');
		equal(elem.outerHTML, '<span class=""></span>');
	});

	test('hasClass', function () {
		tested.push('hasClass');
		var elem = $('<span class="one two three"></span>')[0];
		equal(true, Dom.hasClass(elem, 'one'));
		equal(false, Dom.hasClass(elem, 'four'));
	});

	//testCoverage(test, tested, Dom);

}(window.aloha));
