(function (aloha) {
	'use strict';

	var dom = aloha.dom;
	var tested = [];

	var input = $('<div><p class="some-class">'
				  + '<span class="some-class-2 some-class"><b class="some-class-3">some</b> <i>text</i></span>'
				  + '<b class="some-class-4">some other text</b>'
				  + '</p></div>')[0];

	module('dom: general');

	test('getElementsByClassNames', function () {
		tested.push('getElementsByClassNames');
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

	test('outerHtml', function () {
		tested.push('outerHtml');
		var elem = $('<span class="one two three"><i>one</i></span>')[0];
		equal(elem.outerHTML, dom.outerHtml(elem));
	});

	test('moveNextAll', function () {
		tested.push('moveNextAll');
		var elem = $('<div><a></a><b></b><span></span></div>')[0];
		var nodes = $('<div><sup></sup><sub></sub></div>')[0];
		dom.moveNextAll(elem, nodes.firstChild, elem.lastChild);
		equal(
			dom.outerHtml(elem),
			'<div><a></a><b></b><sup></sup><sub></sub><span></span></div>'
		);
		equal(dom.outerHtml(nodes), '<div></div>');
	});

	test('contains', function () {
		tested.push('contains');
		var span = $('<div><b></b><span><a></a></span></div>')[0].lastChild;
		equal(dom.contains(span, span.firstChild), true);
		equal(dom.contains(span, span.previousSibling), false);
	});

	module('dom: remove');

	test('removeShallow', function () {
		tested.push('removeShallow');
		var node = $('<div><span><b></b></span></div>')[0];
		dom.removeShallow(node.firstChild);
		equal(node.firstChild.nodeName, 'B');
		dom.removeShallow(node.firstChild);
		equal(dom.outerHtml(node), '<div></div>');
	});

	test('removeShallowPreservingBoundaries', function () {
		tested.push('removeShallowPreservingBoundaries');
		var node = $('<div><span><b>foo</b></span></div>')[0];
		var points = [
			aloha.cursors.cursorFromBoundaryPoint(node, 0),
			aloha.cursors.cursorFromBoundaryPoint(node.firstChild, 1)
		];
		dom.removeShallowPreservingBoundaries(node.firstChild, points);
		equal(dom.outerHtml(node), '<div><b>foo</b></div>');
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

		dom.removePreservingRange(node.firstChild.lastChild, range);
		equal(dom.outerHtml(node), '<div><span>foo</span></div>');
		equal(range.startContainer.nodeName, 'DIV');
		equal(range.startOffset, 0);
		equal(range.endContainer.nodeName, 'SPAN');
		equal(range.endOffset, 1);

		dom.removePreservingRanges(node.firstChild.firstChild, [range]);
		equal(dom.outerHtml(node), '<div><span></span></div>');
		equal(range.startContainer.nodeName, 'DIV');
		equal(range.startOffset, 0);
		equal(range.endContainer.nodeName, 'SPAN');
		equal(range.endOffset, 0);
	});

	test('replaceShallow', function () {
		tested.push('replaceShallow');
		var node = $('<div><span><b>foo</b></span></div>')[0];
		dom.replaceShallow(node.firstChild, document.createElement('u'));
		equal(dom.outerHtml(node), '<div><u><b>foo</b></u></div>');
	});

	test('cloneShallow', function () {
		tested.push('cloneShallow');
		var node = $('<div><span><b>foo</b></span></div>')[0];
		equal(dom.outerHtml(dom.cloneShallow(node.firstChild)), '<span></span>');
	});

	test('wrap', function () {
		tested.push('wrap');
		var span = $('<span>foo</span>')[0];
		dom.wrap(span, document.createElement('div'));
		equal(dom.outerHtml(span.parentNode), '<div><span>foo</span></div>');
	});

	test('insert', function () {
		tested.push('insert');
		var node = $('<span>foo</span>')[0];
		dom.insert(document.createElement('u'), node.firstChild);
		dom.insert(document.createElement('b'), node, true);
		equal(dom.outerHtml(node), '<span><u></u>foo<b></b></span>');
	});

	module('dom: nodes');

	test('isAtStart', function () {
		tested.push('isAtStart');
		var node = $('<div>one</div>')[0];
		equal(dom.isAtStart(node.firstChild, 0), true);
		equal(dom.isAtStart(node, 1), false);
	});

	test('isAtEnd', function () {
		tested.push('isAtEnd');
		var node = $('<div>one</div>')[0];
		equal(dom.isAtEnd(node.firstChild, 3), true);
		equal(dom.isAtEnd(node, 0), false);
	});

	test('nodeIndex', function () {
		tested.push('nodeIndex');
		var node = $('<div>foo<b>bar</b></div>')[0];
		equal(dom.nodeIndex(node.lastChild), 1);
		equal(dom.nodeIndex(node.firstChild), 0);
		equal(dom.nodeIndex(node), 0);
	});

	test('nodeLength', function () {
		tested.push('nodeLength');
		var node = $('<div>foo<b>bar</b></div>')[0];
		equal(dom.nodeLength(node.lastChild), 1);
		equal(dom.nodeLength(node.firstChild), 3);
		equal(dom.nodeLength(node), 2);
	});

	test('nodeAtOffset', function () {
		tested.push('nodeAtOffset');
		var node = $('<div>foo<b>bar</b></div>')[0];
		equal(dom.nodeAtOffset(node, 0).data, 'foo');
		equal(dom.nodeAtOffset(node, 1), node.lastChild);
	});

	test('isTextNode', function () {
		tested.push('isTextNode');
		var node = $('<div>foo<b>bar</b></div>')[0];
		equal(dom.isTextNode(node.firstChild), true);
		equal(dom.isTextNode(node), false);
	});

	test('splitTextNode', function () {
		tested.push('splitTextNode');
		var node = $('<div>foo</div>')[0];
		equal(dom.splitTextNode(node.firstChild, 2).data, 'fo');
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
		dom.splitTextContainers(range);
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
		dom.splitBoundary([node.firstChild, 1], [range]);
		equal(
			dom.nodeAtOffset(range.startContainer, range.startOffset).data,
			'oo'
		);
	});

	test('joinTextNodeAdjustRange', function () {
		tested.push('joinTextNodeAdjustRange');
		var node = $('<div>foo<b>bar</b></div>')[0];
		dom.splitTextNode(node.firstChild, 2);
		var range = aloha.ranges.create(
			node.childNodes[1],
			0,
			node.lastChild.lastChild,
			2
		);
		dom.joinTextNodeAdjustRange(node.firstChild, range);
		equal(
			dom.nodeAtOffset(range.startContainer, range.startOffset).data,
			'foo'
		);
	});

	module('dom: style');

	test('setStyle', function () {
		tested.push('setStyle');
		var elem = $('<div></div>')[0];
		dom.setStyle(elem, 'width', '100px')
		equal(elem.style.width, '100px');
	});

	test('getStyle', function () {
		tested.push('getStyle');
		var elem = $('<div></div>')[0];
		elem.style.width = '100px';
		equal(dom.getStyle(elem, 'width'), '100px');
	});

	test('removeStyle', function () {
		tested.push('removeStyle');
		var elem = $('<div></div>')[0];
		elem.style.width = '100px';
		equal(dom.getStyle(elem, 'width'), '100px');
		dom.removeStyle(elem, 'width');
		equal(dom.getStyle(elem, 'width'), '');
	});

	test('getComputedStyle', function () {
		tested.push('getComputedStyle');
		var elem = $('<div class="color: red"></div>');
		equal(dom.getComputedStyle(elem, 'color'));
		equal(dom.getComputedStyle(elem, 'background'), null);
	});

	module('dom: editables');

	test('isEditable', function () {
		tested.push('isEditable');
		var elem = $('<div><span contentEditable="true"><b></b></span></div>')[0];
		equal(dom.isEditable(elem.firstChild.firstChild), true);
		equal(dom.isEditable(elem.firstChild), false);
		equal(dom.isEditable(elem), false);
	});

	test('isEditingHost', function () {
		tested.push('isEditingHost');
		var elem = $('<div><span contentEditable="true"><b></b></span></div>')[0];
		equal(dom.isEditingHost(elem.firstChild.firstChild), false);
		equal(dom.isEditingHost(elem.firstChild), true);
		equal(dom.isEditingHost(elem), false);
	});

	test('getEditingHost', function () {
		tested.push('getEditingHost');
		var elem = $('<div><span contentEditable="true"><b></b></span></div>')[0];
		equal(dom.getEditingHost(elem.firstChild.firstChild), elem.firstChild);
		equal(dom.getEditingHost(elem.firstChild), elem.firstChild);
		equal(dom.getEditingHost(elem), null);
	});

	module('dom: attributes');

	test('attrs', function () {
		tested.push('attrs');
		var elem = $('<div data-one="1" data-two></div>')[0];
		var attrs = dom.attrs(elem);
		equal(2, attrs.length);
		equal(attrs[0][0], 'data-one');
		equal(attrs[0][1], '1');
		equal(attrs[1][0], 'data-two');
		equal(attrs[1][1], '');
	});

	test('attrNames', function () {
		tested.push('attrNames');
		var elem = $('<div data-one="1" data-two></div>')[0];
		var attrs = dom.attrNames(elem);
		equal(attrs[0], 'data-one');
		equal(attrs[1], 'data-two');
	});

	test('hasAttrs', function () {
		tested.push('hasAttrs');
		equal(dom.hasAttrs($('<div data-one="1" data-two></div>')[0]), true);
		equal(dom.hasAttrs($('<input/>')[0]), false);
	});

	test('attrNames', function () {
		tested.push('attrNames');
		var result = dom.attrNames($('<hr>')[0]);
		deepEqual(result, []);
		var result = dom.attrNames($('<li data-attr="some value">')[0]);
		deepEqual(result, ['data-attr']);
	});

	module('dom: classes');

	test('addClass', function () {
		tested.push('addClass');
		var elem = $('<span></span>')[0];
		dom.addClass(elem, 'one');
		equal(dom.outerHtml(elem), '<span class="one"></span>');
		dom.addClass(elem, 'two three');
		equal(dom.outerHtml(elem), '<span class="one two three"></span>');
	});

	test('removeClass', function () {
		tested.push('removeClass');
		var elem = $('<span class="one two three"></span>')[0];
		dom.removeClass(elem, 'two');
		equal(dom.outerHtml(elem), '<span class="one three"></span>');
		dom.removeClass(elem, 'one three');
		equal(dom.outerHtml(elem), '<span class=""></span>');
		dom.removeClass(elem, 'one');
		equal(dom.outerHtml(elem), '<span class=""></span>');
	});

	test('hasClass', function () {
		tested.push('hasClass');
		var elem = $('<span class="one two three"></span>')[0];
		equal(true, dom.hasClass(elem, 'one'));
		equal(false, dom.hasClass(elem, 'four'));
	});

	test('indexByClass', function () {
		tested.push('indexByClass');
		var result = dom.indexByClass(input, {'some-class': true, 'some-class-4': true});
		deepEqual(result, {'some-class': $(input).find('.some-class').get(),
						   'some-class-4': $(input).find('.some-class-4').get()});
	});

	test('indexByName', function () {
		tested.push('indexByName');
		var result = dom.indexByName(input, ['P', 'B']);
		deepEqual(result, {'P': $(input).find('p').get(),
						   'B': $(input).find('b').get()});
	});

	/* fixme */
	test('indexByClassHaveList', function () {
		tested.push('indexByClassHaveList');
		ok(1);
	});

	module('dom');

	testCoverage(test, tested, dom);
}(window.aloha));
