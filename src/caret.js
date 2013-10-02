/* caret.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'keys',
	'misc',
	'html',
	'ranges',
	'traversing'
], function Caret(
	dom,
	keys,
	misc,
	html,
	ranges,
	traversing
) {
	'use strict';

	var caret;

	function getCaret() {
		if (!caret) {
			caret = document.createElement('div');
			dom.addClass(caret, 'aloha-caret');
			dom.insert(caret, document.body, true);
		}
		return caret;
	}

	var hacks = {

		/**
		 * Because causing the ranges startOffset to be decreased causes Chrome
		 * to return the correct pixel position for the range, in most cases.
		 *
		 * @param {Range} live
		 * @return {Range}
		 *         Clone and hacked version of the given range.
		 */
		cloneRange: function cloneRangeHack(live) {
			var range = live.cloneRange();
			var node = range.startContainer;
			var offset = range.startOffset;
			if (0 === offset) {
				return range;
			}
			if (0 === dom.nodeLength(node)) {
				range.setStart(node.parentNode, 0);
				range.setStart(node, offset);
			} else {
				range.setStart(node, offset - 1);
			}
			return range;
		},

		/**
		 * Because Chrome has problems returning the correct ranges pixel
		 * positions at terminal regions of a range containers.
		 *
		 * @param {Object} offset
		 * @param {Range} range
		 * @retur {Object}
		 */
		correctCaretOffset: function correctCaretOffsetHack(offset, range) {
			if (!offset.box.height) {
				var start = dom.isTextNode(range.startContainer)
						  ? range.startContainer.parentNode
						  : range.startContainer;
				offset = dom.offset(start);

				var height = parseInt(dom.getComputedStyle(start, 'line-height'), 10);
				var size = parseInt(dom.getComputedStyle(start, 'font-size'), 10);
				var boxHeight = misc.mean(height, size);
				offset.box = {
					height: boxHeight
				};
				offset.top += Math.abs(height - boxHeight) / 2;
			} else {
				offset.top  += window.pageYOffset - document.body.clientTop;
				offset.left += window.pageXOffset - document.body.clientLeft;
			}
			return offset;
		}
	};

	/**
	 * Calculates the pixel position of the given range.
	 *
	 * @param {Range}
	 * @return {Object}
	 */
	function caretOffset(live) {
		var range = hacks.cloneRange(live);
		if (misc.defined(range.offsetLeft)) {
			return {
				left : range.offsetLeft,
				top  : range.offsetTop,
				box  : {}
			};
		}
		var box = range.getBoundingClientRect();
		return hacks.correctCaretOffset({
			left : box.left + box.width,
			top  : box.top,
			box  : box
		}, range);
	}

	function characterWidthAtRange(character, context) {
		var canvas = getCaret();
		canvas.style.fontSize = parseInt(
			dom.getComputedStyle(context, 'font-size'),
			10
		) + 'px';
		canvas.style.fontWeight = dom.getComputedStyle(context, 'font-weight');
		canvas.innerHTML = (' ' === character) ? '&nbsp;' : character;
		var width = parseInt(dom.getComputedStyle(canvas, 'width'), 10);
		canvas.innerHTML = ' ';
		return width;
	}

	function isVisibleTextNode(node) {
		return dom.isTextNode(node) && html.isRendered(node);
	}

	function findVisibleTextNode(node, step) {
		return step(node, isVisibleTextNode, dom.isLinebreakingNode);
	}

	function getStyleContext(range) {
		return dom.isTextNode(range.startContainer)
		     ? range.startContainer.parentNode
		     : range.startContainer;
	}

	function skippedCharacter(dir, range) {
		var node;
		if ('left' === dir && dom.isTextNode(range.startContainer)) {
			if (0 === range.startOffset) {
				node = findVisibleTextNode(
					range.startContainer,
					traversing.findBackward
				);
				return node ? node.data.substr(0, 1) : '';
			}
			return range.startContainer.data.substr(range.startOffset - 1, 1);
		}
		if ('right' === dir && dom.isTextNode(range.startContainer)) {
			if (dom.nodeLength(range.startContainer) === range.startOffset) {
				node = findVisibleTextNode(
					range.startContainer,
					traversing.findForward
				);
				return node ? node.data.substr(0, 1) : '';
			}
			return range.startContainer.data.substr(range.startOffset, 1);
		}
		return '';
	}

	function calculate(offset, correction, ydir) {
		var o = {
			height: offset.box.height,
			left: Math.round(offset.left + correction)
		};
		if (ydir > 0) {
			o.top = Math.round(offset.box.bottom);
		} else if (ydir < 0) {
			o.top = Math.round(offset.top - offset.box.height);
		} else {
			o.top = Math.round(offset.top);
		}
		return o;
	}


	function offsetAtKeyPress(keycode, range) {
		if (keys.ARROWS[keycode]) {
			return;
		}
		return calculate(
			caretOffset(range),
			characterWidthAtRange(
				String.fromCharCode(keycode),
				getStyleContext(range)
			),
			0
		);
	}

	function offsetAtKeyDown(keycode, range) {
		var arrow = keys.ARROWS[keycode];
		if (!arrow) {
			return;
		}
		var xdir = 0;
		var ydir = 0;
		switch (arrow) {
		case 'left':
			xdir = -1;
			break;
		case 'right':
			xdir =  1;
			break;
		case 'up':
			ydir = -1;
			break;
		case 'down':
			ydir =  1;
			break;
		}
		return calculate(
			caretOffset(range),
			characterWidthAtRange(
				skippedCharacter(arrow, range),
				getStyleContext(range)
			) * xdir,
			ydir
		);
	}

	function offsetAtKeyUp(keycode, range) {
		if (keys.ARROWS[keycode]) {
			return calculate(caretOffset(range), 0, 0);
		}
	}

	function show(caret, offset) {
		caret.style.height = offset.height + 'px';
		caret.style.left = offset.left + 'px';
		caret.style.top = offset.top + 'px';
	}

	/**
	 * Allows you to pin point the pixel position of the caret while typing
	 * text.
	 *
	 * @param {Object} msg
	 */
	function calculateOffset(event, range) {
		var keycode = keys.code(event);
		switch (event.type) {
		case 'keypress':
			return offsetAtKeyPress(keycode, range);
		case 'keydown':
			return offsetAtKeyDown(keycode, range);
		case 'keyup':
			return offsetAtKeyUp(keycode, range);
		default:
			return offsetAtKeyUp(keycode, range);
		}
	}

	function showOnEvent(msg) {
		if (msg.range) {
			var offset = calculateOffset(msg.event, msg.range);
			if (offset) {
				show(getCaret(), offset);
			}
		}
	}

	var exports = {
		showOnEvent: showOnEvent,
		calculateOffset: calculateOffset
	};

	exports['showOnEvent'] = exports.showOnEvent;
	exports['calculateOffset'] = exports.calculateOffset;

	return exports;
});
