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
(function (aloha, require, module, test, equal) {
	'use strict';

	require(['../src/html', '../src/mutation'], function (Html, Mutation) {

		module('traversing');

		var Dom = aloha.dom;
		var Paths = aloha.paths;
		var Arrays = aloha.arrays;
		var Boundaries = aloha.boundaries;

		var CONTROL    = 'she stopped.  she said, "hello there," and then went on.';
		var EXPECTED   = 'she| |stopped|.| | she| |said|,| |"|hello| |there|,|"| |and| |then| |went| |on|.';
		var ACCEPTABLE = 'she| |stopped|.| | |she| |said|,| |"|hello| |there|,|"| |and| |then| |went| |on|.';
		//                she| |stopped|.| | |she| |said|,| |"|hello| |there|,|"| |and| |then| |went| |on|.

		function isEqual(actual, source) {
			if (actual === EXPECTED) {
				equal(actual, EXPECTED, source);
			} else if (actual === ACCEPTABLE) {
				equal(actual, ACCEPTABLE, source);
			} else {
				equal(actual, EXPECTED, source);
			}
		}

		test('next("word")', function () {
			var dom = $('<div>foo<b>bar</b>s baz</div>')[0];
			var boundary = Html.next(Boundaries.fromStartOfNode(dom), 'word');
			equal(Boundaries.container(boundary), dom.lastChild);
			equal(Boundaries.offset(boundary), 1);

			var control = CONTROL;
			var index = 0;

			dom = $('<div contenteditable="true">' + control + '</div>')[0];

			Boundaries.walkWhile(
				Boundaries.fromStartOfNode(dom),
				function (boundary) {
					return !Dom.isEditingHost(Boundaries.nextNode(boundary));
				},
				function (boundary) {
					return Html.next(boundary, 'word');
				},
				function (boundary) {
					if (Boundaries.isTextBoundary(boundary)) {
						var offset = Boundaries.offset(boundary) + (index++);
						control = control.substr(0, offset) + '|' + control.substr(offset);
					}
				}
			);

			isEqual(control, dom.innerHTML);
		});

		test('prev("word")', function () {
			var dom = $('<div>foo <b>bar</b>s baz</div>')[0];
			var boundary = Html.prev(Boundaries.fromStartOfNode(dom.firstChild.nextSibling), 'word');
			equal(Boundaries.container(boundary), dom.firstChild);
			equal(Boundaries.offset(boundary), 4);

			var control = CONTROL;

			dom = $('<div contenteditable="true">' + control + '</div>')[0];

			Boundaries.walkWhile(
				Boundaries.fromEndOfNode(dom),
				function (boundary) {
					return !Dom.isEditingHost(Boundaries.prevNode(boundary));
				},
				function (boundary) {
					return Html.prev(boundary, 'word');
				},
				function (boundary) {
					if (!Boundaries.isNodeBoundary(boundary)) {
						var offset = Boundaries.offset(boundary);
						control = control.substr(0, offset) + '|' + control.substr(offset);
					}
				}
			);

			isEqual(control, dom.innerHTML);
		});

		var INLINE = ['i', 'b', 'u', 'span', 'del', '#text'];
		var EDITABLE = document.createElement('div');
		EDITABLE.contentEditable = true;

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
			var boundary = Boundaries.fromStartOfNode(elem);
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

		/**
		 * Tests one traversal through the given element's DOM structure.
		 *
		 * @param {Element}                  elem
		 * @param {Function(Element):string} mark
		 */
		function run(elem, mark) {
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
			var actual = result.replace(/^\||\|$/, '');
			isEqual(actual, elem.innerHTML);
			//console.log(print(elem));
		}

		test('randomized word traversing', function () {
			for (var i = 0; i < 100; i++) {
				generate(EDITABLE, CONTROL, INLINE, 1);
				run(EDITABLE, markForward);
				run(EDITABLE, markBackward);
			}
		});

	});

}(window.aloha, window.require, window.module, window.test, window.equal));
