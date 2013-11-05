/* carets.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 o* Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'functions',
	'dom',
	'html',
	'keys',
	'ranges',
	'arrays',
	'browser',
	'overrides',
	'boundaries'
], function Carets(
	Fn,
	Dom,
	Html,
	Keys,
	Ranges,
	Arrays,
	Browsers,
	Overrides,
	Boundaries
) {
	'use strict';

	// Selection states
	var anchor = 'right';
	var depressed = false;
	var dragging = false;
	var rangeAtDown;

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
		caret.style.position = 'absolute';
		caret.style.display = 'block';
		caret.style.opacity = '0.5';
	}

	function renderBoundary(caret, boundary, overrides) {
		var range = Ranges.create(boundary[0], boundary[1]);
		var box = Ranges.box(range);
		var context = Overrides.harvest(range.startContainer);
		var doc = caret.ownerDocument;

		if (overrides) {
			context = overrides.concat(context);
		}

		box.top += window.pageYOffset - doc.body.clientTop;
		box.left += window.pageXOffset - doc.body.clientLeft;
		box.width = Overrides.lookup('bold', context) ? 4 : 2;

		caret.style.background = Overrides.lookup('color', context);

		caret.style[Browsers.VENDOR_PREFIX + 'transform']
			= Overrides.lookup('italic', context)
			? 'rotate(8deg)'
			: 'rotate(0deg)';

		show(caret, box);
	}

	function renderRange(range, overrides, anchor) {
		var carets = document.querySelectorAll('.aloha-caret');

		if (!carets[0]) {
			carets = [create()];
		}

		if (!carets[1]) {
			carets = [carets[0], create()];
		}

		carets[0].style.background = 'red';
		carets[1].style.background = 'brown';

		renderBoundary(carets[0], Boundaries.start(range), overrides);
		renderBoundary(carets[1], Boundaries.end(range), overrides);

		var steady  = carets['left' === anchor ? 1 : 0];
		var blinker = carets['left' === anchor ? 0 : 1];

		Dom.addClass(blinker, 'blink');

		if (range.collapsed) {
			Dom.remove(steady);
		} else {
			Dom.removeClass(steady, 'blink');
		}
	}

	function isCtrlDown(event) {
		return event.meta.indexOf('ctrl') > -1;
	}

	function isShiftDown(event) {
		return event.meta.indexOf('shift') > -1;
	}

	function isReversed(sc, so, ec, eo){
		var position = sc.compareDocumentPosition(ec);
		return (0 === position && so > eo)
		    || (position & Node.DOCUMENT_POSITION_PRECEDING);
	}

	function climb(event, range, anchor, direction) {
		var get;
		var set;

		if ('left' === anchor) {
			get = Ranges.collapseToStart;
			set = Ranges.setStartFromBoundary;
		} else {
			get = Ranges.collapseToEnd;
			set = Ranges.setEndFromBoundary;
		}

		var ref = get(range.cloneRange());
		var box = Ranges.box(ref);
		var half = box.height / 2;
		var offset = half;
		var move = 'up' === direction ? up : down;

		var next = move(box, offset);
		while (next && Ranges.equal(next, ref)) {
			offset += half;
			next = move(box, offset);
		}

		if (next) {
			set(range, Boundaries.start(next));
		}
	}

	function step(event, range, anchor, direction) {
		var shift = isShiftDown(event);

		if (range.collapsed || !shift) {
			anchor = direction;
		}

		var get;
		var set;
		var collapse;

		if ('left' === anchor) {
			get = Boundaries.start;
			set = Ranges.setStartFromBoundary;
			collapse = Ranges.collapseToStart;
		} else {
			get = Boundaries.end;
			set = Ranges.setEndFromBoundary;
			collapse = Ranges.collapseToEnd;
		}

		var move = 'left' === direction ? left : right;
		var boundary = get(range);

		if (range.collapsed || shift) {
			boundary = move(boundary, isCtrlDown(event) ? 'word' : 'char');
			set(range, boundary);
		}

		if (!shift) {
			collapse(range);
		}

		return anchor;
	}

	function up(box, stride) {
		return Ranges.createFromPoint(box.left, box.top - stride);
	}

	function down(box, stride) {
		return Ranges.createFromPoint(box.left, box.top + stride);
	}

	function left(boundary, stride) {
		if ('char' === stride) {
			return Html.previousVisualBoundary(boundary);
		}
		return Html.previousWordBoundary(boundary);
	}

	function right(boundary, stride) {
		if ('char' === stride) {
			return Html.nextVisualBoundary(boundary);
		}
		return Html.nextWordBoundary(boundary);
	}

	var arrows = {};
	arrows[Keys.CODES.up] = function (event, range, anchor) {
		return climb(event, range, anchor, 'up');
	};
	arrows[Keys.CODES.down] = function (event, range, anchor) {
		return climb(event, range, anchor, 'down');
	};
	arrows[Keys.CODES.left] = function (event, range, anchor) {
		return step(event, range, anchor, 'left');
	};
	arrows[Keys.CODES.right] = function (event, range, anchor) {
		return step(event, range, anchor, 'right');
	};

	function keydown(event) {
		var range = event.range || Ranges.get();
		if (!range || !event.editable) {
			return event;
		}
		var isNativeEditable = 'true' === event.editable.elem.getAttribute('contentEditable');
		var clone = range.cloneRange();
		if (arrows[event.which]) {
			anchor = arrows[event.which](event, clone, anchor);
			if (event.which === Keys.CODES.up || event.which === Keys.CODES.down) {
				event.native.preventDefault();
			}
			// chrome hack
			if ((!isNativeEditable && !clone.collapsed)) {
				event.native.preventDefault();
			}
		}
		if (!isNativeEditable) {
			event.range = clone;
		}
		renderRange(clone, event.editable && event.editable.overrides, anchor);
		return event;
	}

	function mousedown(event) {
		purge();
		depressed = true;
		rangeAtDown = Ranges.createFromPoint(
			event.native.clientX,
			event.native.clientY
		);
	}

	function mousemove(event) {
		dragging = depressed;
	}

	function mouseup(event) {
		var native = event.native;
		var expanding = dragging || isShiftDown(event);
		var rangeAtUp = Ranges.createFromPoint(native.clientX, native.clientY);
		var sc = rangeAtDown.startContainer;
		var so = rangeAtDown.startOffset;
		var ec = rangeAtUp.endContainer;
		var eo = rangeAtUp.endOffset;
		var range;

		if (!expanding) {
			sc = ec;
			so = eo;
		}

		if (expanding && isReversed(sc, so, ec, eo)) {
			anchor = 'left';
			range = Ranges.create(ec, eo, sc, so);
		} else {
			anchor = 'right';
			range = Ranges.create(sc, so, ec, eo);
		}

		renderRange(range, event.editable && event.editable.overrides, anchor);

		depressed = false;
		dragging = false;
	}

	var handlers = {
		'keyup'     : Fn.identity,
		'keydown'   : keydown,
		'mouseup'   : mouseup,
		'mousedown' : mousedown,
		'mousemove' : mousemove,
		'click'     : Fn.identity
	};

	function handle(event) {
		if (handlers[event.type]) {
			return handlers[event.type](event);
		}
		var range = event.range || Ranges.get();
		if (range) {
			renderRange(
				range,
				event.editable && event.editable.overrides,
				range.collapsed ? 0 : 1
			);
		}
		return event;
	}

	var exports = {
		render : renderRange,
		handle : handle
	};

	exports['render'] = exports.render;
	exports['handle'] = exports.handle;

	return exports;
});
