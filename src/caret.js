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
		 * Returns a expanded version of a clone of the given range.
		 * This hack is necessary because getBoundingClientRect() only works
		 * with non collapsed ranges.
		 *
		 * @param {Range} live
		 * @return {Range}
		 *         Clone and hacked version of the given range.
		 */
		getExpandedClone: function(live) {
			var range = live.cloneRange();
			range.setEnd(range.startContainer, range.startOffset);
			if (0 === range.startOffset) {
				if (dom.nodeLength(range.endContainer) > range.endOffset) {
					range.setEnd(range.endContainer, range.endOffset + 1);
				}
			} else if (dom.nodeLength(range.startContainer) > 0) {
				range.setStart(range.startContainer, range.startOffset - 1);
			}
			return range;
		},

		/**
		 * Because Chrome has problems returning the correct ranges pixel
		 * positions around visual line-breaks.
		 *
		 * @param {Object} offset
		 * @param {Range} range
		 * @retur {Object}
		 */
		correctOffset: function(offset, range) {
			if (!offset.height) {
			var start = dom.isTextNode(range.startContainer)
					  ? range.startContainer.parentNode
					  : range.startContainer;
			var size = parseInt(dom.getComputedStyle(start, 'font-size'), 10);
			var line = parseInt(dom.getComputedStyle(start, 'line-height'), 10);
				offset = dom.offset(start);
				offset.height = misc.mean(line, size);
				offset.top += Math.abs(line - offset.height) / 2;
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
		var range = hacks.getExpandedClone(live);
		var box = range.getBoundingClientRect();
		return hacks.correctOffset({
			left   : box.left + (live.endOffset === range.endOffset ? box.width : 0),
			top    : box.top,
			height : box.height,
			bottom : box.bottom
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
				return node ? node.data.substr(-1) : '';
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
			height: offset.height,
			left: Math.round(offset.left + correction)
		};
		if (ydir > 0) {
			o.top = Math.round(offset.bottom);
		} else if (ydir < 0) {
			o.top = Math.round(offset.top - offset.height);
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
		if (keys.CODES.backspace === keycode) {
			arrow = 'left';
		}
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
		if (keys.ARROWS[keycode] || keys.CODES.backspace === keycode) {
			return calculate(caretOffset(range), 0, 0);
		}
	}

	function show(caret, offset) {
		caret.style.height = offset.height + 'px';
		caret.style.left = offset.left + 'px';
		caret.style.top = offset.top + 'px';
	}

	function hide(caret) {
		caret.style.height = 0;
		caret.style.top = '-9999px';
	}

	/**
	 * Allows you to pin point the pixel position of the caret while typing
	 * text.
	 *
	 * @param {Object} msg
	 */
	function calculateOffset(event, range) {
		switch (event.type) {
		case 'keypress':
			return offsetAtKeyPress(event.which, range);
		case 'keydown':
			return offsetAtKeyDown(event.which, range);
		case 'keyup':
			return offsetAtKeyUp(event.which, range);
		default:
			return calculate(caretOffset(range), 0, 0);
		}
	}

	var blinker = document.createElement('div');
	dom.addClass(blinker, 'aloha-caret');
	dom.addClass(blinker, 'aloha-blinker');
	dom.insert(blinker, document.body, true);

	function interact(event) {
		var range = event.range || ranges.get();
		if (range) {
			if (range.collapsed) {
				var offset = calculateOffset(event.event, range);
				if (offset) {
					show(getCaret(), offset);
					show(blinker, offset);
				}
			} else {
				hide(getCaret());
				hide(blinker);
			}
		}
	}

	var exports = {
		interact        : interact,
		calculateOffset : calculateOffset
	};

	exports['interact'] = exports.interact;
	exports['calculateOffset'] = exports.calculateOffset;

	return exports;
});
