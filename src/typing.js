/* typing.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'keys',
	'ranges',
	'editing'
], function Typing(
	dom,
	keys,
	ranges,
	editing
) {
	'use strict';

	function enter(msg) {
		ranges.insertTextBehind(msg.range, '¶');
	}

	function space(msg) {
		ranges.insertTextBehind(msg.range, '·');
		msg.event.preventDefault();
	}

	function delete_(msg) {
		ranges.select(editing.remove(msg.range));
		msg.event.preventDefault();
	}

	// h (72) => left  (37)
	// k (75) => up    (38)
	// l (76) => right (39)
	// j (74) => down  (40)
	var movement = {
		72: 37,
		75: 38,
		76: 39,
		74: 40
	};

	function triggerKeyboardEvent(elem, name, code) {
		var event = document.createEventObject
		          ? document.createEventObject()
		          : document.createEvent('Event');

		if (event.initEvent) {
			event.initEvent(name, true, true);
		}
	
		event.keyIdentifier = 'U+004A';
		event.keyCode = code;

		if (elem.dispatchEvent) {
			elem.dispatchEvent(event);
		} else {
			elem.fireEvent('on' + name, event);
		}
	}

	function down(msg) {
		var key = movement[keys.keycode(msg.event)];
		if (!key) {
			return;
		}
		msg.event.preventDefault();
		/*
		triggerKeyboardEvent(
			dom.getEditingHost(msg.range.startContainer),
			'keydown',
			key
		);
		*/
	}

	function skippedCharacter(dir, range) {
		if ('left' === dir && dom.isTextNode(range.startContainer)) {
			return range.startContainer.data.substr(range.startOffset - 1, 1);
		}
		if ('right' === dir && dom.isTextNode(range.startContainer)) {
			return range.startContainer.data.substr(range.startOffset, 1);
		}
		return '';
	}

	var caret;
	function getCaret() {
		if (!caret) {
			caret = document.createElement('div');
			dom.addClass(caret, 'aloha-caret');
			dom.insert(caret, document.body, true);
		}
		return caret;
	}

	function characterWidthAt(chr, caret, node) {
		caret.style.fontSize = parseInt(
			dom.getComputedStyle(node, 'font-size'),
			10
		) + 'px';
		caret.style.fontWeight = dom.getComputedStyle(node, 'font-weight');
		caret.innerHTML = (' ' === chr) ? '&nbsp;' : chr;
		var width = parseInt(dom.getComputedStyle(caret, 'width'), 10);
		caret.innerHTML = ' ';
		return width;
	}

	function updateCaret(chr, range, xdir, ydir) {
		var offset = ranges.offset(range);
		var caret = getCaret();
		var xCorrection = characterWidthAt(
			chr,
			caret,
			dom.isTextNode(range.startContainer)
				? range.startContainer.parentNode
				: range.startContainer
		);

		caret.style.height = offset.box.height + 'px';

		caret.style.left = Math.round(offset.left + (xdir * xCorrection)) + 'px';

		if (ydir > 0) {
			caret.style.top = Math.round(offset.box.bottom) + 'px';
		} else if (ydir < 0) {
			caret.style.top = Math.round(offset.top - offset.box.height) + 'px';
		} else {
			caret.style.top = Math.round(offset.top) + 'px';
		}
	}

	function positionCaretOnDown(msg) {
		var arrow = keys.ARROWS[keys.code(msg.event)];
		if (!arrow) {
			return;
		}
		var chr = skippedCharacter(arrow, msg.range);
		var xdir = 0;
		var ydir = 0;
		switch (arrow) {
		case 'left'  : xdir = -1; break;
		case 'right' : xdir =  1; break;
		case 'up'    : ydir = -1; break;
		case 'down'  : ydir =  1; break;
		}
		updateCaret(chr, msg.range, xdir, ydir);
	}

	function positionCaretOnPress(msg) {
		if (keys.ARROWS[keys.code(msg.event)]) {
			return;
		}
		updateCaret(
			String.fromCharCode(keys.code(msg.event)),
			msg.range,
			1,
			0
		);
	}
  
	var exports = {
		down     : down,
		enter    : enter,
		space    : space,
		'delete' : delete_,
		positionCaretOnDown  : positionCaretOnDown,
		positionCaretOnPress : positionCaretOnPress
	};

	exports['down'] = down;
	exports['enter'] = enter;
	exports['space'] = space;
	exports['delete'] = exports.delete;
	exports['positionCaretOnDown'] = exports.positionCaretOnDown;
	exports['positionCaretOnPress'] = exports.positionCaretOnPress;

	return exports;
});
