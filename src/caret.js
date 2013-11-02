/* carets.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'keys',
	'ranges',
	'arrays'
], function Carets(
	Dom,
	Keys,
	Ranges,
	Arrays
) {
	'use strict';

	function create() {
		var caret = document.createElement('div');
		Dom.addClass(caret, 'aloha-caret');
		Dom.insert(caret, document.body, true);
		Dom.disableSelection(caret);
		return caret;
	}

	function purge() {
		Arrays.coerce(document.querySelectorAll('.aloha-caret'))
		      .forEach(Dom.remove);
	}

	function show(caret, rect) {
		caret.style.top = rect.top + 'px';
		caret.style.left = rect.left + 'px';
		caret.style.width = rect.width + 'px';
		caret.style.height = rect.height + 'px';
		caret.style.position = 'fixed';
		caret.style.display = 'block';
		caret.style.opacity = '0.5';
	}

	function render(range) {
		purge();

		var startRange = Ranges.collapseToStart(range.cloneRange());
		var endRange = Ranges.collapseToEnd(range.cloneRange());
		var startCaret = create();
		var endCaret = create();
		var startBox = Ranges.box(startRange);
		var endBox = Ranges.box(endRange);

		startBox.width = endBox.width = 1;

		startCaret.style.background = 'blue';
		endCaret.style.background = 'red';

		show(startCaret, startBox);
		show(endCaret, endBox);
	}

	function getRange(event) {
		return event.range || Ranges.get();
	}

	function isCtrlDown(event) {
		return event.meta.indexOf('ctrl') > -1;
	}

	function isShiftDown(event) {
		return event.meta.indexOf('shift') > -1;
	}

	function up(event, range, isNativeEditable) {
		var ref = Ranges.collapseToEnd(range.cloneRange());
		var box = Ranges.box(ref);
		var half = box.height / 2;
		var offset = half;
		var next = Ranges.createFromPoint(box.left, box.top - offset);

		while (next && Ranges.equal(next, ref)) {
			offset += half;
			next = Ranges.createFromPoint(box.left, box.top - offset);
		}

		if (!next) {
			return;
		}

		range.setEnd(next.endContainer, next.endOffset);

		if (range.collapsed && isShiftDown(event)) {
			range.setStart(next.endContainer, next.endOffset);
		}
		
		if (!isNativeEditable) {
			event.native.preventDefault();
		}
	}

	function down(event, range, isNativeEditable) {
		var ref = Ranges.collapseToEnd(range.cloneRange());
		var box = Ranges.box(ref);
		box.top += box.height;
		var half = box.height / 2;
		var offset = half;
		var next = Ranges.createFromPoint(box.left, box.top + offset);

		while (next && Ranges.equal(next, ref)) {
			offset += half;
			next = Ranges.createFromPoint(box.left, box.top + offset);
		}

		if (!next) {
			return;
		}

		if (range.collapsed && !isShiftDown(event)) {
			range.setStart(next.endContainer, next.endOffset);
		}

		range.setEnd(next.endContainer, next.endOffset);

		if (!isNativeEditable) {
			event.native.preventDefault();
		}
	}

	function left(event, range) {
		var expand = isCtrlDown(event)
				   ? Ranges.expandBackwardToVisibleWordPosition
		           : Ranges.expandBackwardToVisiblePosition;

		var contract = isCtrlDown(event)
				     ? Ranges.contractBackwardToVisibleWordPosition
		             : Ranges.contractBackwardToVisiblePosition;

		if (isShiftDown(event)) {
			if (range.collapsed) {
				expand(range);
			} else {
				contract(range);
			}
			return;
		}

		if (range.collapsed) {
			contract(range);
		}

		Ranges.collapseToStart(range);
	}

	function right(event, range) {
		var shift = isShiftDown(event);
		if (range.collapsed || shift) {
			if (isCtrlDown(event)) {
				Ranges.expandForwardToVisibleWordPosition(range);
			} else {
				Ranges.expandForwardToVisiblePosition(range);
			}
		}
		if (!shift) {
			Ranges.collapseToEnd(range);
		}
	}

	var arrows = {};
	arrows[Keys.CODES.up] = up;
	arrows[Keys.CODES.down] = down;
	arrows[Keys.CODES.left] = left;
	arrows[Keys.CODES.right] = right;

	function keydown(event) {
		var range = event.range || Ranges.get();
		if (!range) {
			return event;
		}
		var isNativeEditable = 'true' === event.editable.elem.getAttribute('contentEditable');
		var clone = range.cloneRange();
		if (arrows[event.which]) {
			arrows[event.which](event, clone, isNativeEditable);
			// chrome hack
			if (!isNativeEditable && !clone.collapsed) {
				event.native.preventDefault();
			}
		}
		if (!isNativeEditable) {
			event.range = clone;
		}
		render(clone);
		return event; }

	function mousedown(event) {
		var native = event.native;
		var range = Ranges.createFromPoint(native.clientX, native.clientY);
		if (range) {
			render(range);
		}
	}

	var handlers = {
		'keydown'   : keydown,
		'mousedown' : mousedown
	};

	function handle(event) {
		if (handlers[event.type]) {
			return handlers[event.type](event);
		}
		var range = event.range || Ranges.get();
		if (range) {
			render(range);
		}
		return event;
	}

	var exports = {
		render : render,
		handle : handle
	};

	exports['render'] = exports.render;
	exports['handle'] = exports.handle;

	return exports;
});
