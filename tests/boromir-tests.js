(function (aloha) {
	'use strict';

	var Boromir = aloha.Boromir;
	
    module('boromir');

	function setupDomNode() {
		var domNode = document.getElementById('test-editable');
		domNode.innerHTML = '<p style="color: blue; font-size: 10px;" id="123" lang="en"><b>Some</b> text<br/></p>';
		return domNode.firstChild;
	}

	test('read the DOM', function () {
		var domNode = setupDomNode();
		var node = Boromir(domNode);
		equal(node.name(), 'P');
		equal(node.type(), Boromir.ELEMENT);
		equal(node.attr('id'), '123');
		equal(node.attrs()['id'], '123');
		ok(!node.attrs()['style']);
		equal(node.style('color'), 'blue');
		equal(node.style('font-size'), '10px');
		equal(node.children().length, 3);
		equal(node.children()[0].name(), 'B');
		equal(node.children()[1].text(), ' text');
		equal(node.children()[2].name(), 'BR');
	});

	test('set an attribute', function () {
		var domNode = setupDomNode();
		var node = Boromir(domNode);
		equal(node.attr('id'), '123')
		equal(node.attrs()['id'], '123');
		node = node.attr('id', '456');
		node = node.updateDom();
		equal(node.attr('id'), '456');
		equal(node.attrs()['id'], '456');
		equal(Boromir(node.domNode()).attr('id'), '456');
	});

	test('set an attribute map', function () {
		var domNode = setupDomNode();
		var node = Boromir(domNode);
		var node1 = node.attrs({'lang': 'sp'});
		equal(node.attr('lang'), 'en');
		equal(node.attr('id'), '123');
		equal(node1.attr('lang'), 'sp');
		ok(null == node1.attr('id'));
		var node2 = node1.updateDom();
		ok(!node1.attrs().hasOwnProperty('id'));
		equal(Boromir(node2.domNode()).attr('lang'), 'sp');
		ok(null == Boromir(node2.domNode()).attr('id'));
	});

	test('reading classes', function () {
		var domNode = setupDomNode();
		domNode.setAttribute('class', 'one two');
		var node = Boromir(domNode);
		deepEqual(node.classes(), {'one': true, 'two': true});
		ok(node.hasClass('one'));
		ok(node.hasClass('two'));
	});

	test('add/remove a class', function () {
		var domNode = setupDomNode();
		var node = Boromir(domNode);
		equal(node.attr('class'), null);
		deepEqual(node.classes(), {});

		node = node.addClass('some-class');
		ok(node.hasClass('some-class'));
		equal(node.attr('class'), 'some-class');
		deepEqual(node.classes(), {'some-class': true})

		node = node.updateDom();
		equal(domNode.getAttribute('class'), 'some-class');

		node = node.addClass('another-class');
		node = node.updateDom();
		ok(domNode.getAttribute('class') === 'some-class another-class'
		   || domNode.getAttribute('class') === 'another-class some-class');

		ok(node.hasClass('some-class'));
		ok(node.hasClass('another-class'));
		ok(node.attr('class') === 'some-class another-class'
		   || node.attr('class') === 'another-class some-class');
		deepEqual(node.classes(), {'some-class': true, 'another-class': true});

		node = node.removeClass('some-class');
		node = node.updateDom();
		equal(domNode.getAttribute('class'), 'another-class');
		
		ok(!node.hasClass('some-class'));
		ok(node.hasClass('another-class'));
		equal(node.attr('class'), 'another-class');
		deepEqual(node.classes(), {'another-class': true});
	});

	test('set a style', function () {
		var domNode = setupDomNode();
		var node = Boromir(domNode);
		equal(node.style('color'), 'blue');
		equal(node.style('font-size'), '10px');
		node = node.style('color', 'black');
		node = node.updateDom();
		equal(node.style('color'), 'black');
		equal(node.style('font-size'), '10px');
		equal(Boromir(node.domNode()).style('color'), 'black');
		equal(Boromir(node.domNode()).style('font-size'), '10px');
	});

	test('update children', function () {
		var domNode = setupDomNode();
		var node = Boromir(domNode);
		equal(node.children().length, 3);
		node = node.children(node.children().map(function (child, i) {
			return child.type() === Boromir.ELEMENT ? child.attr('id', i) : child;
		}));
		node = node.updateDom();
		equal(node.children().length, 3);
		equal(node.children()[0].attr('id'), 0);
		equal(node.children()[2].attr('id'), 2);
		equal(Boromir(node.domNode()).children()[0].attr('id'), 0);
		equal(Boromir(node.domNode()).children()[2].attr('id'), 2);
	});

	test('insert and remove children', function () {
		var domNode = setupDomNode();
		var node = Boromir(domNode);
		equal(node.children().length, 3);
		var newChildren = node.children().slice(0);
		newChildren.splice(1, 1,
		                   Boromir({name: 'B', attrs: {'id': 'insert'}}),
		                   Boromir({text: 'insert'}));
		node = node.children(newChildren);
		node = node.updateDom();
		equal(node.children().length, 4);
		node = Boromir(node.domNode());
		equal(node.children()[1].type(), Boromir.ELEMENT);
		equal(node.children()[1].attr('id'), 'insert');
		equal(node.children()[2].type(), Boromir.TEXT);
		equal(node.children()[2].text(), 'insert');
	});

	test('move children', function () {
		var domNode = document.getElementById('test-editable');
		domNode.innerHTML = 'This is my <b>first</b> paragraph.';
		var node = Boromir(domNode);
		var newChildren = node.children().slice(0);
		newChildren.push(newChildren.shift());
		node = node.children(newChildren);
		node = node.updateDom();
		equal(node.domNode().innerHTML, '<b>first</b> paragraph.This is my ');
		equal(node.children()[0].name(), 'B');
		equal(node.children()[1].text(), ' paragraph.');
		equal(node.children()[2].text(), 'This is my ');
	});

}(window.aloha));
