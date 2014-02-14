/**
 * tests/traversing/word-boundaries.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * Runs tests on a random DOM structure that contains (only) inline nodes to
 * check traversing with word-boundary stepss.
 */
(function (aloha) {
	'use strict';

	var OUTPUT = document.getElementById('test-console');
	var CONTROL = 'she stopped.  she said, "hello there," and then went on.';
	var EXPECTED = 'she| |stopped|.| | she| |said|,| |"|hello| |there|,|"| |and| |then| |went| |on|.';
	var INLINE = ['i', 'b', 'u', 'span', 'del', '#text'];
	var EDITABLE = document.createElement('div');
	EDITABLE.contentEditable = true;

	var Html = aloha.html;
	var Boundaries = aloha.boundaries;
	var Mutation = aloha.mutation;
	var Dom = aloha.dom;
	var Paths = aloha.paths;
	var Arrays = aloha.arrays;

	/**
	 * Chooses a random element in the given list.
	 *
	 * @param  {Array.<*>} list
	 * @return {*}
	 */
	function iniMiniMinyMo(list) {
		return list[Math.round(Math.random() * (list.length - 1))];
	}

	/**
	 * Populates `container` with a random DOM structure based on the given
	 * string and list of wrappers.
	 *
	 * @param  {Element}        container
	 * @param  {String}         str
	 * @param  {Array.<String>} wrappers
	 * @param  {number}         depth
	 */
	function generate(container, str, wrappers, depth) {
		container.innerHTML = '';
		var node;
		var len = str.length;
		var index = 0;
		var max;
		var start;
		var wrapper;
		var text;
		while (index < len) {
			start = index;
			max = len - index;
			index += Math.min(max, Math.ceil(Math.random() * max));
			text = str.substr(start, index - start);
			wrapper = iniMiniMinyMo(wrappers);
			if (!wrapper || '#text' === wrapper) {
				node = document.createTextNode(text);
			} else {
				node = document.createElement(wrapper);
				node.innerHTML = text;
			}
			if (depth > 0 && !Dom.isTextNode(node)) {
				generate(node, text, Arrays.difference(wrappers, [wrapper]), depth - 1);
			}
			container.appendChild(node);
		}
	}

	/**
	 * Returns a list of paths for all word boundaries in the given element,
	 * collecting them from start to end.
	 *
	 * @param  {Element} elem
	 * @return {Array.<Path>}
	 */
	function markForward(elem) {
		Dom.insert(elem, elem.ownerDocument.body, true);
		var boundary = Boundaries.fromNode(elem.firstChild);
		var paths = [];
		while (boundary) {
			boundary = Html.next(boundary, 'word');
			if (Boundaries.nextNode(boundary) === elem) {
				break;
			}
			paths.push(Paths.fromBoundary(elem, boundary));
		}
		Dom.remove(elem);
		return paths;
	}

	/**
	 * Returns a list of paths for all word boundaries in the given element,
	 * collecting them from end to start.
	 *
	 * @param  {Element} elem
	 * @return {Array.<Path>}
	 */
	function markBackward(elem) {
		Dom.insert(elem, elem.ownerDocument.body, true);
		var boundary = Boundaries.fromEndOfNode(elem.lastChild);
		var paths = [];
		while (boundary) {
			boundary = Html.prev(boundary, 'word');
			if (Boundaries.prevNode(boundary) === elem) {
				break;
			}
			paths.push(Paths.fromBoundary(elem, boundary));
		}
		Dom.remove(elem);
		return paths.reverse();
	}

	/**
	 * Prints child nodes of the given element.
	 *
	 * @param  {Element}
	 * @return {string}
	 */
	function print(elem) {
		return [].reduce.call(elem.childNodes, function (product, item) {
			return product + '[ ' + (item.innerHTML || item.data) + ' ]\n';
		}, '');
	}

	function assert(actual, expected, elem, mark) {
		var stripped = actual.replace(/^\||\|$/, '');
		if (expected === stripped) {
			OUTPUT.innerHTML = print(elem);
		} else {
			var result = '\n"' + expected + '"\n!==\n"' + stripped + '"';
			console.error(result, elem);
			//debugger;
			//mark(elem);
			//throw '!';
		}
	}

	/**
	 * Tests one traversal through the given element's DOM structure.
	 *
	 * @param  {Element}                  elem
	 * @param  {Function(Element):string} mark
	 * @param  {string}                   expected
	 */
	function test(elem, mark, expected) {
		var control = elem.textContent;
		var snapshots = mark(elem).reduce(function (snaps, path) {
			var clone = Dom.clone(elem);
			Mutation.insertTextAtBoundary('|', Paths.toBoundary(clone, path), true);
			return snaps.concat(clone.textContent);
		}, []);
		var result = snapshots.reduce(function (result, snap, i) {
			var index = snap.indexOf('|') + i;
			return result.substr(0, index) + '|' + result.substr(index);
		}, control);
		assert(result, expected, elem, mark);
	}

	function run() {
		generate(EDITABLE, CONTROL, INLINE, 0);
		test(EDITABLE, markForward, EXPECTED);
		test(EDITABLE, markBackward, EXPECTED);
	}

	setInterval(run, 10);

}(window.aloha));
