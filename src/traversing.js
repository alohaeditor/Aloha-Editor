/* traversing.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'functions'
], function Traversing(
	dom,
	fn
) {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('traversing');
	}

	/**
	 * Map of tag names which represent element that do not imply a word
	 * boundary.
	 *
	 * eg: <b>bar</b>camp where there is no word boundary in "barcamp".
	 *
	 * In HTML5 parlance, these would be many of those elements that fall in the
	 * category of "Text Level Semantics":
	 * http://www.w3.org/TR/html5/text-level-semantics.html
	 *
	 * @type {Object}
	 */
	var IN_WORD_TAGS = {
		'A'       : true,
		'ABBR'    : true,
		'B'       : true,
		'CITE'    : true,
		'CODE'    : true,
		'DEL'     : true,
		'EM'      : true,
		'I'       : true,
		'INS'     : true,
		'S'       : true,
		'SMALL'   : true,
		'SPAN'    : true,
		'STRONG'  : true,
		'SUB'     : true,
		'SUP'     : true,
		'U'       : true,
		'#text' : true
	};

	/**
	 * Characters that delimit boundaries of words.
	 *
	 * These include whitespaces, hyphens, and punctuation.
	 *
	 * @type {Array[String]}
	 */
	var WORD_CHARACTERS = [
		'\u0041-', '\u005A', '\u0061-', '\u007A', '\u00AA', '\u00B5', '\u00BA',
		'\u00C0-', '\u00D6', '\u00D8-', '\u00F6', '\u00F8-',

		'\u02C1',  '\u02C6-', '\u02D1', '\u02E0-', '\u02E4', '\u02EC', '\u02EE',
		'\u0370-', '\u0374',  '\u0376', '\u0377',  '\u037A-', '\u037D',
		'\u0386',  '\u0388-', '\u038A', '\u038C',  '\u038E-', '\u03A1',
		'\u03A3-', '\u03F5', '\u03F7-', '\u0481', '\u048A-', '\u0525',
		'\u0531-', '\u0556', '\u0559', '\u0561-', '\u0587', '\u05D0-', '\u05EA',
		'\u05F0-', '\u05F2', '\u0621-', '\u064A', '\u066E', '\u066F', '\u0671-',
		'\u06D3', '\u06D5', '\u06E5', '\u06E6', '\u06EE', '\u06EF', '\u06FA-',
		'\u06FC', '\u06FF', '\u0710', '\u0712-', '\u072F', '\u074D-', '\u07A5',
		'\u07B1', '\u07CA-', '\u07EA', '\u07F4', '\u07F5', '\u07FA', '\u0800-',
		'\u0815', '\u081A', '\u0824', '\u0828', '\u0904-', '\u0939', '\u093D',
		'\u0950', '\u0958-', '\u0961', '\u0971', '\u0972', '\u0979-', '\u097F',
		'\u0985-', '\u098C', '\u098F', '\u0990', '\u0993-', '\u09A8', '\u09AA-',
		'\u09B0', '\u09B2', '\u09B6-', '\u09B9', '\u09BD', '\u09CE', '\u09DC',
		'\u09DD', '\u09DF-', '\u09E1', '\u09F0', '\u09F1',

		'\u0A05-', '\u0A0A', '\u0A0F', '\u0A10', '\u0A13-', '\u0A28', '\u0A2A-',
		'\u0A30', '\u0A32', '\u0A33', '\u0A35', '\u0A36', '\u0A38', '\u0A39',
		'\u0A59-', '\u0A5C', '\u0A5E', '\u0A72-', '\u0A74', '\u0A85-', '\u0A8D',
		'\u0A8F-', '\u0A91', '\u0A93-', '\u0AA8', '\u0AAA-', '\u0AB0', '\u0AB2',
		'\u0AB3', '\u0AB5-', '\u0AB9', '\u0ABD', '\u0AD0', '\u0AE0', '\u0AE1',

		'\u0B05-', '\u0B0C', '\u0B0F', '\u0B10', '\u0B13-', '\u0B28', '\u0B2A-',
		'\u0B30', '\u0B32', '\u0B33', '\u0B35-', '\u0B39', '\u0B3D', '\u0B5C',
		'\u0B5D', '\u0B5F-', '\u0B61', '\u0B71', '\u0B83', '\u0B85-', '\u0B8A',
		'\u0B8E-', '\u0B90', '\u0B92-', '\u0B95', '\u0B99', '\u0B9A', '\u0B9C',
		'\u0B9E', '\u0B9F', '\u0BA3', '\u0BA4', '\u0BA8-', '\u0BAA', '\u0BAE-',
		'\u0BB9', '\u0BD0',

		'\u0C05-', '\u0C0C', '\u0C0E-', '\u0C10', '\u0C12-', '\u0C28',
		'\u0C2A-', '\u0C33', '\u0C35-', '\u0C39', '\u0C3D', '\u0C58', '\u0C59',
		'\u0C60', '\u0C61', '\u0C85-', '\u0C8C', '\u0C8E-', '\u0C90', '\u0C92-',
		'\u0CA8', '\u0CAA-', '\u0CB3', '\u0CB5-', '\u0CB9', '\u0CBD', '\u0CDE',
		'\u0CE0', '\u0CE1',

		'\u0D05-', '\u0D0C', '\u0D0E-', '\u0D10', '\u0D12-', '\u0D28',
		'\u0D2A-', '\u0D39', '\u0D3D', '\u0D60', '\u0D61', '\u0D7A-', '\u0D7F',
		'\u0D85-', '\u0D96', '\u0D9A-', '\u0DB1', '\u0DB3-', '\u0DBB', '\u0DBD',
		'\u0DC0-', '\u0DC6',

		'\u0E01-', '\u0E30', '\u0E32', '\u0E33', '\u0E40-', '\u0E46', '\u0E81',
		'\u0E82', '\u0E84', '\u0E87', '\u0E88', '\u0E8A', '\u0E8D', '\u0E94-',
		'\u0E97', '\u0E99-', '\u0E9F', '\u0EA1-', '\u0EA3', '\u0EA5', '\u0EA7',
		'\u0EAA', '\u0EAB', '\u0EAD-', '\u0EB0', '\u0EB2', '\u0EB3', '\u0EBD',
		'\u0EC0-', '\u0EC4', '\u0EC6', '\u0EDC', '\u0EDD',

		'\u0F00', '\u0F40-', '\u0F47', '\u0F49-', '\u0F6C', '\u0F88-', '\u0F8B',

		'\u1000-', '\u102A', '\u103F', '\u1050-', '\u1055', '\u105A-', '\u105D',
		'\u1061', '\u1065', '\u1066', '\u106E-', '\u1070', '\u1075-', '\u1081',
		'\u108E', '\u10A0-', '\u10C5', '\u10D0-', '\u10FA', '\u10FC',

		'\u1100-', '\u1248', '\u124A-', '\u124D', '\u1250-', '\u1256', '\u1258',
		'\u125A-', '\u125D', '\u1260-', '\u1288', '\u128A-', '\u128D',
		'\u1290-', '\u12B0', '\u12B2-', '\u12B5', '\u12B8-', '\u12BE', '\u12C0',
		'\u12C2-', '\u12C5', '\u12C8-', '\u12D6', '\u12D8-', '\u1310',
		'\u1312-', '\u1315', '\u1318-', '\u135A', '\u1380-', '\u138F',
		'\u13A0-', '\u13F4', '\u1401-', '\u166C', '\u166F-', '\u167F',
		'\u1681-', '\u169A', '\u16A0-', '\u16EA', '\u1700-', '\u170C',
		'\u170E-', '\u1711', '\u1720-', '\u1731', '\u1740-', '\u1751',
		'\u1760-', '\u176C', '\u176E-', '\u1770', '\u1780-', '\u17B3', '\u17D7',
		'\u17DC', '\u1820-', '\u1877', '\u1880-', '\u18A8', '\u18AA', '\u18B0-',
		'\u18F5', '\u1900-', '\u191C', '\u1950-', '\u196D', '\u1970-', '\u1974',
		'\u1980-', '\u19AB', '\u19C1-', '\u19C7',

		'\u1A00-', '\u1A16', '\u1A20-', '\u1A54', '\u1AA7', '\u1B05-', '\u1B33',
		'\u1B45-', '\u1B4B', '\u1B83-', '\u1BA0', '\u1BAE', '\u1BAF', '\u1C00-',
		'\u1C23', '\u1C4D-', '\u1C4F', '\u1C5A-', '\u1C7D', '\u1CE9-', '\u1CEC',
		'\u1CEE-', '\u1CF1', '\u1D00-', '\u1DBF', '\u1E00-', '\u1F15',
		'\u1F18-', '\u1F1D', '\u1F20-', '\u1F45', '\u1F48-', '\u1F4D',
		'\u1F50-', '\u1F57', '\u1F59', '\u1F5B', '\u1F5D', '\u1F5F-', '\u1F7D',
		'\u1F80-', '\u1FB4', '\u1FB6-', '\u1FBC', '\u1FBE', '\u1FC2-', '\u1FC4',
		'\u1FC6-', '\u1FCC', '\u1FD0-', '\u1FD3', '\u1FD6-', '\u1FDB',
		'\u1FE0-', '\u1FEC', '\u1FF2-', '\u1FF4', '\u1FF6-', '\u1FFC',

		'\u2071', '\u207F', '\u2090-', '\u2094', '\u2102', '\u2107', '\u210A-',
		'\u2113', '\u2115', '\u2119-', '\u211D', '\u2124', '\u2126', '\u2128',
		'\u212A-', '\u212D', '\u212F-', '\u2139', '\u213C-', '\u213F',
		'\u2145-', '\u2149', '\u214E', '\u2183', '\u2184', '\u2C00-', '\u2C2E',
		'\u2C30-', '\u2C5E', '\u2C60-', '\u2CE4', '\u2CEB-', '\u2CEE',
		'\u2D00-', '\u2D25', '\u2D30-', '\u2D65', '\u2D6F', '\u2D80-', '\u2D96',
		'\u2DA0-', '\u2DA6', '\u2DA8-', '\u2DAE', '\u2DB0-', '\u2DB6',
		'\u2DB8-', '\u2DBE', '\u2DC0-', '\u2DC6', '\u2DC8-', '\u2DCE',
		'\u2DD0-', '\u2DD6', '\u2DD8-', '\u2DDE', '\u2E2F',

		'\u3005', '\u3006', '\u3031-', '\u3035', '\u303B', '\u303C', '\u3041-',
		'\u3096', '\u309D-', '\u309F', '\u30A1-', '\u30FA', '\u30FC-', '\u30FF',
		'\u3105-', '\u312D', '\u3131-', '\u318E', '\u31A0-', '\u31B7',
		'\u31F0-', '\u31FF', '\u3400-',

		'\u4DB5', '\u4E00-',

		'\u9FCB',

		'\uA000-', '\uA48C', '\uA4D0-', '\uA4FD', '\uA500-', '\uA60C',
		'\uA610-', '\uA61F', '\uA62A', '\uA62B', '\uA640-', '\uA65F', '\uA662-',
		'\uA66E', '\uA67F-', '\uA697', '\uA6A0-', '\uA6E5', '\uA717-', '\uA71F',
		'\uA722-', '\uA788', '\uA78B', '\uA78C', '\uA7FB-', '\uA801', '\uA803-',
		'\uA805', '\uA807-', '\uA80A', '\uA80C-', '\uA822', '\uA840-', '\uA873',
		'\uA882-', '\uA8B3', '\uA8F2-', '\uA8F7', '\uA8FB', '\uA90A-', '\uA925',
		'\uA930-', '\uA946', '\uA960-', '\uA97C', '\uA984-', '\uA9B2', '\uA9CF',
		'\uAA00-', '\uAA28', '\uAA40-', '\uAA42', '\uAA44-', '\uAA4B',
		'\uAA60-', '\uAA76', '\uAA7A', '\uAA80-', '\uAAAF', '\uAAB1', '\uAAB5',
		'\uAAB6', '\uAAB9-', '\uAABD', '\uAAC0', '\uAAC2', '\uAADB-', '\uAADD',
		'\uABC0-', '\uABE2', '\uAC00-',

		'\uD7A3', '\uD7B0-', '\uD7C6', '\uD7CB-', '\uD7FB',

		'\uF900-', '\uFA2D', '\uFA30-', '\uFA6D', '\uFA70-', '\uFAD9',
		'\uFB00-', '\uFB06', '\uFB13-', '\uFB17', '\uFB1D', '\uFB1F-', '\uFB28',
		'\uFB2A-', '\uFB36', '\uFB38-', '\uFB3C', '\uFB3E', '\uFB40', '\uFB41',
		'\uFB43', '\uFB44', '\uFB46-', '\uFBB1', '\uFBD3-', '\uFD3D', '\uFD50-',
		'\uFD8F', '\uFD92-', '\uFDC7', '\uFDF0-', '\uFDFB', '\uFE70-', '\uFE74',
		'\uFE76-', '\uFEFC', '\uFF21-', '\uFF3A', '\uFF41-', '\uFF5A',
		'\uFF66-', '\uFFBE', '\uFFC2-', '\uFFC7', '\uFFCA-', '\uFFCF',
		'\uFFD2-', '\uFFD7', '\uFFDA-', '\uFFDC'
	].join('');

	var WORD_BOUNDARY = new RegExp('[^' + WORD_CHARACTERS + ']');

	var WORD_BOUNDARY_FROM_END = new RegExp(
		'[^' + WORD_CHARACTERS + '][' + WORD_CHARACTERS + ']*$'
	);

	/**
	 * Looks backwards in the node tree for the nearest word boundary position.
	 *
	 * @param {DOMObject} node
	 * @param {Number} offset
	 * @return position Information about the nearst found word boundary.
	 * @return position.node
	 * @return position.offset
	 */
	function findWordBoundaryBehind(node, offset) {
		if (dom.isEditingHost(node)) {
			return {
				node: node,
				offset: offset
			};
		}
		if (dom.Nodes.TEXT === node.nodeType) {
			var boundary = node.data.substr(0, offset)
			                   .search(WORD_BOUNDARY_FROM_END);
			return (
				-1 === boundary
					? findWordBoundaryBehind(
						node.parentNode,
						dom.nodeIndex(node)
					)
					: {
						node: node,
						offset: boundary + 1
					}
			);
		}
		if (dom.Nodes.ELEMENT === node.nodeType) {
			if (offset > 0) {
				var child = node.childNodes[offset - 1];
				return (
					IN_WORD_TAGS[child.nodeName]
						? findWordBoundaryBehind(child, dom.nodeLength(child))
						: {
							node: node,
							offset: offset
						}
				);
			}
			return findWordBoundaryBehind(node.parentNode, dom.nodeIndex(node));
		}
		return {
			node: node,
			offset: offset
		};
	}

	/**
	 * Looks forwards in the node tree for the nearest word boundary position.
	 *
	 * @param {DOMObject} node
	 * @param {Number} offset
	 * @return position Information about the nearst found word boundary.
	 * @return position.node
	 * @return position.offset
	 */
	function findWordBoundaryAhead(node, offset) {
		if (dom.isEditingHost(node)) {
			return {
				node: node,
				offset: offset
			};
		}
		if (dom.Nodes.TEXT === node.nodeType) {
			var boundary = node.data.substr(offset).search(WORD_BOUNDARY);
			return (
				-1 === boundary
					? findWordBoundaryAhead(
						node.parentNode,
						dom.nodeIndex(node) + 1
					)
					: {
						node: node,
						offset: offset + boundary
					}
			);
		}
		if (dom.Nodes.ELEMENT === node.nodeType) {
			if (offset < dom.nodeLength(node)) {
				return (
					IN_WORD_TAGS[node.childNodes[offset].nodeName]
						? findWordBoundaryAhead(node.childNodes[offset], 0)
						: {
							node: node,
							offset: offset
						}
				);
			}
			return findWordBoundaryAhead(
				node.parentNode,
				dom.nodeIndex(node) + 1
			);
		}
		return {
			node: node,
			offset: offset
		};
	}


	/**
	 *	<div>
	 *		foo
	 *		<p>
	 *			bar
	 *			<b>
	 *				<u></u>
	 *				baz
	 *			</b>
	 *		</p>
	 *	</div>
	 *
	 *	|foo|<p>|bar|<b>|<u>|</u>|baz<b>|</p>|
	 */
	function prevNodeBoundary(container, offset) {
		// <p>[foo</p>
		// <p>fo[o</p>
		// <p>foo[</p>
		// ==
		// <p>{foo</p>
		//
		// <p>{<p> ==> {<p></p>
		if (0 === offset || dom.isTextNode(container)) {
			return {
				container: container.parentNode,
				offset: dom.nodeIndex(container)
			};
		}

		// <p>foo{</p> ==> <p>{foo</p>
		// <p><b>foo</b>bar{</p> ==> <p><b>foo</b>{foo</p>
		// <p><b><b>{</p> ==> <p><b>{</b></p>
		// <p><b></b>{foo</p> ==> <p><b>{</b>foo</p>
		// <p><b>foo</b>{bar</p> ==> <p><b>foo{</b>bar</p>
		// <p>foo{<b></b></p> ==> <p>{foo<b></b></p>
		var node = container.childNodes[offset - 1];

		return (
			dom.isTextNode(node)
				? {
					container: node.parentNode,
			   		offset: dom.nodeIndex(node)
				}
				: {
					container: node,
					offset: dom.nodeLength(node)
				}
		);
	}

	function nextNodeBoundary(container, offset) {
		// <p>[foo</p>
		// <p>fo[o</p>
		// <p>foo[</p>
		// ==
		// <p>foo{</p>
		//
		// <p><b>foo{</b></p> ==> <p><b>foo</b>{</p>
		// <p><b>{</b></p> ==> <p><b></b>{</p>
		if (dom.isTextNode(container) || dom.nodeLength(container) === offset) {
			return {
				container: container.parentNode,
				offset: dom.nodeIndex(container) + 1
			};
		}

		// <p>{foo</p> ==> <p>foo{</p>
		// <p>{<b>foo</b></p> ==> <p><b>{foo</b></p>
		var node = container.childNodes[offset];

		return (
			dom.isTextNode(node)
				? {
					container: container,
					offset: offset + 1
				}
				: {
					container: node,
					offset: 0
				}
		);
	}

	function stepNodeBoundaryWhile(container, offset, cond, step) {
		var pos = {
			container: container,
			offset: offset
		};
		while (cond(pos.container, pos.offset)) {
			pos = step(pos.container, pos.offset);
		}
		return pos;
	}

	function prevNodeBoundaryWhile(container, offset, cond) {
		return stepNodeBoundaryWhile(container, offset, cond, prevNodeBoundary);
	}

	function nextNodeBoundaryWhile(container, offset, cond) {
		return stepNodeBoundaryWhile(container, offset, cond, nextNodeBoundary);
	}

	/**
	 * Given a node, will return node that succeeds it in the document order.
	 *
	 * For example, if this function is called recursively, starting from the
	 * text node "one" in the below DOM tree:
	 *
	 *	"one"
	 *	<b>
	 *		"two"
	 *		<u>
	 * 			<i>
	 * 				"three"
	 * 			</i>
	 * 		</u>
	 * 		"four"
	 * 	</b>
	 * 	"five"
	 *
	 * forward() will return nodes in the following order:
	 *
	 * <b>...</b>, "two", <u>...</u>, <i>...</i>,"three", "four", "five"
	 *
	 * @param {DOMObject} node
	 * @return {DOMObject}
	 *         The succeeding node or null if the given node has no previous
	 *         siblings and no parent.
	 */
	function forward(node) {
		if (node.firstChild) {
			return node.firstChild;
		}
		var next = node;
		while (next && !next.nextSibling) {
			next = next.parentNode;
		}
		return next && next.nextSibling;
	}

	/**
	 * Given a node, will return node that preceeds it in the document order.
	 *
	 * For example, if this function is called recursively, starting from the
	 * text node "five" in the below DOM tree:
	 *
	 *	"one"
	 *	<b>
	 *		"two"
	 *		<u>
	 * 			<i>
	 * 				"three"
	 * 			</i>
	 * 		</u>
	 * 		"four"
	 * 	</b>
	 * 	"five"
	 *
	 * backward() will return nodes in the following order:
	 *
	 * "four", "three", <i>...</i>, <u>...</u>, "two", <b>...</b>, "one"
	 *
	 * @param {DOMObject} node
	 * @return {DOMObject}
	 *         The preceeding node or null if the given node has no previous
	 *         siblings and no parent.
	 */
	function backward(node) {
		var prev = node.previousSibling;
		while (prev && prev.lastChild) {
			prev = prev.lastChild;
		}
		return prev || node.parentNode;
	}

	/**
	 * Starting from the given node, and moving forwards through the DOM tree,
	 * searches for a node which returns `true` when applied to the predicate
	 * `match()`.
	 *
	 * @param {DOMObject} node
	 * @param {Function(DOMObject):Boolean} match
	 * @return {DOMObject}
	 */
	function findForward(node, match) {
		while (node && !match(node)) {
			node = forward(node);
		}
		return node;
	}

	/**
	 * Starting from the given node, and moving backwards through the DOM tree,
	 * searches for a node which returns `true` when applied to the predicate
	 * `match()`.
	 *
	 * @param {DOMObject} node
	 * @param {Function(DOMObject):Boolean} match
	 * @return {DOMObject}
	 */
	function findBackward(node, match) {
		while (node && !match(node)) {
			node = backward(node);
		}
		return node;
	}

	/**
	 * Starting from the given node and moving forward, traverses the set of
	 * `node`'s sibiling nodes until either the predicate `cond` returns false
	 * or we reach the last sibling of `node`'s parent element.
	 *
	 * @param {DOMObject} node
	 * @param {Function(DOMObject, *?):Boolean} cond
	 * @param {*} arg
	 *        Optional arbitrary value that will be passed to the `cond()`
	 *        predicate.
	 * @return {DOMObject}
	 *         `node`, or one if it's next siblings.
	 */
	function nextWhile(node, cond, arg) {
		while (node && cond(node, arg)) {
			node = node.nextSibling;
		}
		return node;
	}

	/**
	 * Starting from the given node and moving backwards, traverses the set of
	 * `node`'s sibiling nodes until either the predicate `cond` returns false
	 * or we reach the last sibling of `node`'s parent element.
	 *
	 * @param {DOMObject} node
	 * @param {Function(DOMObject, *?):Boolean} cond
	 * @param {*} arg
	 *        Optional arbitrary value that will be passed to the `cond()`
	 *        predicate.
	 * @return {DOMObject}
	 *         `node`, or one if it's previous siblings.
	 */
	function prevWhile(node, cond, arg) {
		while (node && cond(node, arg)) {
			node = node.previousSibling;
		}
		return node;
	}

	/**
	 * Applies the given function `func()`, to the the given node `node` and
	 * it's next siblings, until the given `until()` function retuns `true` or
	 * all next siblings have been walked.
	 *
	 * @param {DOMObject} node
	 * @param {Function(DOMObject, *)} func
	 *        Callback function to apply to the traversed nodes.  Will receive
	 *        the each node as the first argument, and the value of `arg` as the
	 *        second argument.
	 * @param {Function(DOMObject, *):Boolean} until
	 *        Predicate function to test each traversed nodes.  Walking will be
	 *        terminated when this function returns `true`.  Will receive the
	 *        each node as the first argument, and the value of `arg` as the
	 *        second argument.
	 * @param {*} arg
	 *        A value that will be passed to `func()` as the second argument.
	 */
	function walkUntil(node, func, until, arg) {
		while (node && !until(node, arg)) {
			var next = node.nextSibling;
			func(node, arg);
			node = next;
		}
	}

	/**
	 * Applies the given function `func()`, to the the given node `node` and all
	 * it's next siblings.
	 *
	 * @param {DOMObject} node
	 * @param {Function(DOMObject, *)} fn
	 *        Callback function to apply to the traversed nodes.  Will receive
	 *        the each node as the first argument, and the value of `arg` as the
	 *        second argument.
	 * @param {*} arg
	 *        A value that will be passed to `func()` as the second argument.
	 */
	function walk(node, func, arg) {
		walkUntil(node, func, fn.returnFalse, arg);
	}

	/**
	 * Depth-first postwalk of the given DOM node.
	 */
	function walkRec(node, func, arg) {
		if (dom.Nodes.ELEMENT === node.nodeType) {
			walk(node.firstChild, function (node) {
				walkRec(node, func, arg);
			});
		}
		func(node, arg);
	}

	/**
	 * Applies the given function `func()`, to the the given node `node` and
	 * it's next siblings, until `untilNode` is encountered or the last sibling
	 * is reached.
	 *
	 * @param {DOMObject} node
	 * @param {Function(DOMObject, *)} fn
	 *        Callback function to apply to the traversed nodes.  Will receive
	 *        the each node as the first argument, and the value of `arg` as the
	 *        second argument.
	 * @param {DOMObject} untilNode
	 *        Terminal node.
	 * @param {*} arg
	 *        A value that will be passed to `func()` as the second argument.
	 */
	function walkUntilNode(node, func, untilNode, arg) {
		walkUntil(node, func, function (nextNode) {
			return nextNode === untilNode;
		}, arg);
	}

	/**
	 * Traverses up the given node's ancestors, collecting all parent nodes,
	 * until the given predicate returns true.
	 *
	 * @param {DOMObject} node
	 * @param {Function(DOMObject):Boolean} pred
	 *        Predicate function which will receive nodes as they are traversed.
	 *        This function returns `true`, it will terminate the traversal.
	 * @return {Array[DOMObject]}
	 *         A set of parent elements of the given node.
	 */
	function parentsUntil(node, pred) {
		var parents = [];
		var parent = node.parentNode;
		while (parent && !pred(parent)) {
			parents.push(parent);
			parent = parent.parentNode;
		}
		return parents;
	}

	/**
	 * Starting with the given node, traverses up the given node's ancestors,
	 * collecting each parent node, until the first ancestor that causes the
	 * given predicate function to return true.
	 *
	 * @param {DOMObject} node
	 * @param {Function(DOMObject):Boolean} pred
	 *        Predicate function which will receive nodes as they are traversed.
	 *        This function returns `true`, it will terminate the traversal.
	 * @return {Array[DOMObject]}
	 *         A set of parent element of the given node.
	 */
	function parentsUntilIncl(node, pred) {
		var parents = parentsUntil(node, pred);
		var topmost = parents.length ? parents[parents.length - 1] : node;
		if (topmost.parentNode) {
			parents.push(topmost.parentNode);
		}
		return parents;
	}

	/**
	 * Collects all ancestors of the given node until the first ancestor that
	 * causes the given predicate function to return true.
	 *
	 * @param {DOMObject} node
	 * @param {Function(DOMObject):Boolean} pred
	 *        Predicate function which will receive nodes as they are traversed.
	 *        This function returns `true`, it will terminate the traversal.
	 * @return {Array[DOMObject]}
	 *         A set of parent element of the given node.
	 */
	function childAndParentsUntil(node, pred) {
		if (pred(node)) {
			return [];
		}
		var parents = parentsUntil(node, pred);
		parents.unshift(node);
		return parents;
	}

	/**
	 * Collects the given node, and all its ancestors until the first ancestor
	 * that causes the given predicate function to return true.
	 *
	 * @param {DOMObject} node
	 * @param {Function(DOMObject):Boolean} pred
	 *        Predicate function which will receive nodes as they are traversed.
	 *        This function returns `true`, it will terminate the traversal.
	 * @return {Array[DOMObject]}
	 *         A set of parent element of the given node.
	 */
	function childAndParentsUntilIncl(node, pred) {
		if (pred(node)) {
			return [node];
		}
		var parents = parentsUntilIncl(node, pred);
		parents.unshift(node);
		return parents;
	}

	/**
	 * Collects all ancestors of the given node until `untilNode` is reached.
	 *
	 * @param {DOMObject} node
	 * @param {DOMObject} untilNode
	 *        Terminal ancestor.
	 * @return {Array[DOMObject]}
	 *         A set of parent element of the given node.
	 */
	function childAndParentsUntilNode(node, untilNode) {
		return childAndParentsUntil(node, function (nextNode) {
			return nextNode === untilNode;
		});
	}

	/**
	 * Collects the given node, and all its ancestors until `untilInclNode` is
	 * reached.
	 *
	 * @param {DOMObject} node
	 * @param {DOMObject} untilInclNode
	 *        Terminal ancestor.  Will be included in results.
	 * @return {Array[DOMObject]}
	 *         A set of parent element of the given node.
	 */
	function childAndParentsUntilInclNode(node, untilInclNode) {
		return childAndParentsUntilIncl(node, function (nextNode) {
			return nextNode === untilInclNode;
		});
	}

	/**
	 * DOM traversal functions.
	 *
	 * traversing.prevNodeBoundary()
	 * traversing.nextNodeBoundary()
	 * traversing.prevNodeBoundaryWhile()
	 * traversing.nextNodeBoundaryWhile()
	 * traversing.backward()
	 * traversing.forward()
	 * traversing.nextWhile()
	 * traversing.prevWhile()
	 * traversing.walk()
	 * traversing.walkRec()
	 * traversing.walkUntil()
	 * traversing.walkUntilNode()
	 * traversing.findBackward()
	 * traversing.findForward()
	 * traversing.findWordBoundaryAhead()
	 * traversing.findWordBoundaryBehind()
	 * traversing.parentsUntil()
	 * traversing.parentsUntilIncl()
	 * traversing.childAndParentsUntil()
	 * traversing.childAndParentsUntilIncl()
	 * traversing.childAndParentsUntilNode()
	 * traversing.childAndParentsUntilInclNode()
	 */
	var exports = {
		prevNodeBoundary: prevNodeBoundary,
		nextNodeBoundary: nextNodeBoundary,
		prevNodeBoundaryWhile: prevNodeBoundaryWhile,
		nextNodeBoundaryWhile: nextNodeBoundaryWhile,
		backward: backward,
		forward: forward,
		nextWhile: nextWhile,
		prevWhile: prevWhile,
		walk: walk,
		walkRec: walkRec,
		walkUntil: walkUntil,
		walkUntilNode: walkUntilNode,
		findBackward: findBackward,
		findForward: findForward,
		findWordBoundaryAhead: findWordBoundaryAhead,
		findWordBoundaryBehind: findWordBoundaryBehind,
		parentsUntil: parentsUntil,
		parentsUntilIncl: parentsUntilIncl,
		childAndParentsUntil: childAndParentsUntil,
		childAndParentsUntilIncl: childAndParentsUntilIncl,
		childAndParentsUntilNode: childAndParentsUntilNode,
		childAndParentsUntilInclNode: childAndParentsUntilInclNode
	};

	exports['backward'] = exports.backward;
	exports['forward'] = exports.forward;
	exports['prevNodeBoundary'] = exports.prevNodeBoundary;
	exports['nextNodeBoundary'] = exports.nextNodeBoundary;
	exports['prevNodeBoundaryWhile'] = exports.prevNodeBoundaryWhile;
	exports['nextNodeBoundaryWhile'] = exports.nextNodeBoundaryWhile;
	exports['nextWhile'] = exports.nextWhile;
	exports['prevWhile'] = exports.prevWhile;
	exports['walk'] = exports.walk;
	exports['walkRec'] = exports.walkRec;
	exports['walkUntil'] = exports.walkUntil;
	exports['walkUntilNode'] = exports.walkUntilNode;
	exports['findBackward'] = exports.findBackward;
	exports['findForward'] = exports.findForward;
	exports['findWordBoundaryAhead'] = exports.findWordBoundaryAhead;
	exports['findWordBoundaryBehind'] = exports.findWordBoundaryBehind;
	exports['parentsUntil'] = exports.parentsUntil;
	exports['parentsUntilIncl'] = exports.parentsUntilIncl;
	exports['childAndParentsUntil'] = exports.childAndParentsUntil;
	exports['childAndParentsUntilIncl'] = exports.childAndParentsUntilIncl;
	exports['childAndParentsUntilNode'] = exports.childAndParentsUntilNode;
	exports['childAndParentsUntilInclNode'] = exports.childAndParentsUntilInclNode;

	return exports;
});
