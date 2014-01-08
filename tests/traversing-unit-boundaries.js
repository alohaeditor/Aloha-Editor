(function (aloha) {
	'use strict';

	var consoleDiv = document.getElementById('test-console');

	var Html = aloha.html;
	var Boundaries = aloha.boundaries;
	var Mutation = aloha.mutation;
	var Dom = aloha.dom;
	var Arrays = aloha.arrays;

	var control = 'she stopped.  she said, "hello there," and then went on.';
	var expected = 'she| |stopped|.|  |she| |said|,| |"|hello| |there|,|"| |and| |then| |went| |on|.';

	var editable = document.createElement('div');
	editable.contentEditable = true;

	var inline = ['i', 'b', 'u', 'span', 'del', '#text'];

	function choose(list) {
		return list[Math.round(Math.random() * (list.length - 1))];
	}

	function generate(elem, str, wrappers, depth) {
		elem.innerHTML = '';
		var node;
		var len = str.length;
		var index = 0;
		var max;
		var start;
		var wrapper;
		var text;
		while (index < len) {
			start = index;
			max = len - index
			index += Math.min(max, Math.ceil(Math.random() * max));
			text = str.substr(start, index - start);
			wrapper = choose(wrappers);
			if (!wrapper || '#text' === wrapper) {
				node = document.createTextNode(text);
			} else {
				node = document.createElement(wrapper);
				node.innerHTML = text;
			}
			if (depth > 0 && !Dom.isTextNode(node)) {
				generate(node, text, Arrays.difference(wrappers, [wrapper]), depth - 1);
			}
			elem.appendChild(node);
		}
	}

	function markForward(elem) {
		Dom.insert(elem, elem.ownerDocument.body, true);
		var boundary = Boundaries.fromNode(elem.firstChild);
		while (boundary) {
			boundary = Html.next(boundary, 'word');
			if (Boundaries.nextNode(boundary) === elem) {
				break;
			}
			boundary = Mutation.insertTextAtBoundary('|', boundary, true);
		}
		Dom.remove(elem);
	}

	function markBackward(elem) {
		Dom.insert(elem, elem.ownerDocument.body, true);
		var boundary = Boundaries.fromEndOfNode(elem.lastChild);
		while (boundary) {
			boundary = Html.prev(boundary, 'word');
			if (Boundaries.prevNode(boundary) === elem) {
				break;
			}
			boundary = Mutation.insertTextAtBoundary('|', boundary, false);
		}
		Dom.remove(elem);
	}

	function print(elem) {
		return [].reduce.call(elem.childNodes, function (product, item) {
			return product + '[ ' + (item.innerHTML || item.data) + ' ]\n';
		}, '');
	}

	function mark(elem, markFn) {
		var clone = Dom.clone(elem);
		markFn(elem);
		assert(elem.textContent, expected, elem, clone, markFn);
	}

	function assert(actual, expected, elem, clone, markFn) {
		var stripped = actual.replace(/^\||\|$/, '');
		if (expected === stripped) {
			consoleDiv.innerHTML = print(elem);
		} else {
			var result = '\n"' + expected + '"\n!==\n"' + stripped + '"';
			console.error(result, elem, clone);
			debugger;
			markFn(clone);
			//throw '!';
		}
	}

	function run() {
		generate(editable, control, inline, 1);
		//editable.innerHTML = "<b>one </b><i> two</i>"; // known issue
		mark(Dom.clone(editable), markForward);
		mark(editable, markBackward);
	}

	setInterval(run, 500);

}(window.aloha));
