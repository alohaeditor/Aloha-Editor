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
	'maps',
	'ranges',
	'arrays',
	'browser',
	'overrides',
	'boundaries',
	'traversing'
], function Carets(
	Fn,
	Dom,
	Html,
	Keys,
	Maps,
	Ranges,
	Arrays,
	Browsers,
	Overrides,
	Boundaries,
	Traversing
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

	function show(caret, rect, overrides) {
		var color;
		var width;
		var rotation;
		if (overrides) {
			color = overrides['color'] || '';
			width = rect.width * (overrides['bold'] ? 2 : 1);
			rotation = overrides['italic'] ? 'rotate(8deg)' : '';
		} else {
			color = '';
			width = rect.width;
			rotation = '';
		}
		caret.style.top = rect.top + 'px';
		caret.style.left = rect.left + 'px';
		caret.style.height = rect.height + 'px';
		caret.style.width = width + 'px';
		caret.style.position = 'absolute';
		caret.style.display = 'block';
		caret.style.opacity = '0.5';
		caret.style.background = color;
		caret.style[Browsers.VENDOR_PREFIX + 'transform'] = rotation;
	}

	function renderBoundary(caret, boundary, overrides) {
		var box = Ranges.box(Ranges.create(boundary[0], boundary[1]));
		var doc = caret.ownerDocument;
		box.top += window.pageYOffset - doc.body.clientTop;
		box.left += window.pageXOffset - doc.body.clientLeft;
		box.width = 2;
		show(caret, box, overrides);
	}

	function render(range, caret, startOverrides, endOverrides) {
		var carets = document.querySelectorAll('.aloha-caret');

		if (!carets[0]) {
			carets = [create()];
		}

		if (!carets[1]) {
			carets = [carets[0], create()];
		}

		renderBoundary(carets[0], Boundaries.start(range), startOverrides);
		renderBoundary(carets[1], Boundaries.end(range), endOverrides);

		var steady  = carets['start' === caret ? 1 : 0];
		var blinker = carets['start' === caret ? 0 : 1];

		if (range.collapsed) {
			Dom.remove(steady);
			Dom.addClass(blinker, 'blink');
		} else {
			Dom.removeClass(steady, 'blink');
			Dom.removeClass(blinker, 'blink');
		}
	}

	function computeOverrides(event, caret) {
		var start = Overrides.map(Overrides.harvest(event.range.startContainer));
		var end = Overrides.map(Overrides.harvest(event.range.endContainer));
		if (event.editables) {
			var overrides  = Overrides.map(event.editable.overrides);
			if ('start' === caret) {
				start = Maps.merge(start, overrides);
			} else {
				end = Maps.merge(end, overrides);
			}
		}
		return [start, end];
	}


	function isCtrlDown(event) {
		return event.meta.indexOf('ctrl') > -1;
	}

	function isShiftDown(event) {
		return event.meta.indexOf('shift') > -1;
	}

	function isReversed(sc, so, ec, eo) {
		var position = sc.compareDocumentPosition(ec);
		return (0 === position && so > eo)
		    || (position & Node.DOCUMENT_POSITION_PRECEDING) > 0;
	}

	function up(box, stride) {
		return Ranges.createFromPoint(box.left, box.top - stride);
	}

	function down(box, stride) {
		return Ranges.createFromPoint(box.left, box.top + box.height + stride);
	}

	function left(boundary, stride) {
		if ('char' === stride) {
			return Html.previousVisualBoundary(boundary);
		}
		return Traversing.findWordBoundaryBehind(boundary);
	}

	function right(boundary, stride) {
		if ('char' === stride) {
			return Html.nextVisualBoundary(boundary);
		}
		return Traversing.findWordBoundaryAhead(boundary);
	}

	function climb(event, range, caret, direction) {
		var get;
		var set;

		if ('start' === caret) {
			get = Ranges.collapseToStart;
			set = Ranges.setStartFromBoundary;
		} else {
			get = Ranges.collapseToEnd;
			set = Ranges.setEndFromBoundary;
		}

		var clone = get(range.cloneRange());
		var box = Ranges.box(clone);
		var half = box.height / 2;
		var offset = half;
		var expanding = isShiftDown(event);
		var move = 'up' === direction ? up : down;

		var next = move(box, offset);
		// fix me also check if next and clone are *visually* adjacent
		while (next && Ranges.equal(next, clone)) {
			offset += half;
			next = move(box, offset);
		}

		if (!next) {
			return;
		}

		var sc, so, ec, eo;

		if (!expanding) {
			sc = ec = next.startContainer;
			so = eo = next.startOffset;
		} else if ('start' === caret) {
			sc = next.startContainer;
			so = next.startOffset;
			ec = range.endContainer;
			eo = range.endOffset;
		} else {
			sc = range.startContainer;
			so = range.startOffset;
			ec = next.endContainer;
			eo = next.endOffset;
		}

		var current;
		if (expanding && isReversed(sc, so, ec, eo)) {
			current = Ranges.create(ec, eo, sc, so);
			caret = ('start' === caret) ? 'end' : 'start';
		} else {
			current = Ranges.create(sc, so, ec, eo);
		}

		return {
			range: current,
			caret: caret
		};
	}

	function step(event, range, caret, direction) {
		var shift = isShiftDown(event);
		var move = 'left' === direction ? left : right;

		if (range.collapsed || !shift) {
			caret = 'left' === direction ? 'start' : 'end';
		}

		var get;
		var set;
		var collapse;

		if ('start' === caret) {
			get = Boundaries.start;
			set = Ranges.setStartFromBoundary;
			collapse = Ranges.collapseToStart;
		} else {
			get = Boundaries.end;
			set = Ranges.setEndFromBoundary;
			collapse = Ranges.collapseToEnd;
		}

		var clone = range.cloneRange();

		if (range.collapsed || shift) {
			set(clone, move(get(range), isCtrlDown(event) ? 'word' : 'char'));
		}

		if (!shift) {
			collapse(clone);
		}

		return {
			range: clone,
			caret: caret
		};
	}

	var arrows = {};
	arrows[Keys.CODES.up] = function climbUp(event, range, caret) {
		return climb(event, range, caret, 'up');
	};
	arrows[Keys.CODES.down] = function climbDown(event, range, caret) {
		return climb(event, range, caret, 'down');
	};
	arrows[Keys.CODES.left] = function stepLeft(event, range, caret) {
		return step(event, range, caret, 'left');
	};
	arrows[Keys.CODES.right] = function stepRight(event, range, caret) {
		return step(event, range, caret, 'right');
	};

	function keydown(event, range, caret, dragging) {
		range = event.range || Ranges.get();
		if (!range) {
			return;
		}
		if (arrows[event.which]) {
			return arrows[event.which](event, range, caret);
		}
		return {
			range : range,
			caret : caret
		};
	}

	function keypress(event, range, caret, dragging) {
		return {
			range : event.range || Ranges.get(),
			caret : caret
		};
	}

	function mouseup(event, range, caret, dragging) {
		var current = Ranges.createFromPoint(
			event.native.clientX,
			event.native.clientY
		);
		if (!range || !current) {
			return;
		}
		var sc = range.startContainer;
		var so = range.startOffset;
		var ec = current.endContainer;
		var eo = current.endOffset;
		var expanding = dragging || isShiftDown(event);

		if (!expanding) {
			sc = ec;
			so = eo;
		}

		if (expanding && isReversed(sc, so, ec, eo)) {
			caret = 'start';
			current = Ranges.create(ec, eo, sc, so);
		} else {
			caret = 'end';
			current = Ranges.create(sc, so, ec, eo);
		}

		return {
			range : current,
			caret : caret
		};
	}

	function dblclick(event, range, caret, dragging) {
		var current = Ranges.createFromPoint(
			event.native.clientX,
			event.native.clientY
		);
		if (current) {
			return {
				range : Ranges.expandToWord(current),
				caret : 'end'
			};
		}
	}

	var handlers = {
		'keydown'  : keydown,
		'keypress' : keypress,
		'mouseup'  : mouseup,
		'dblclick' : dblclick
	};

	// State of the user selection
	var state = {
		range       : null,
		caret       : 'end',
		isMouseDown : false,
		isDragging  : false
	};

	var stateHandlers = {
		'mousedown' : function mousedown(event) {
			purge();
			state.isMouseDown = true;
			if (!state.range || !isShiftDown(event)) {
				state.range = Ranges.createFromPoint(
					event.native.clientX,
					event.native.clientY
				);
			}
		},
		'mouseup' : function mouseup(event) {
			state.isDragging = state.isMouseDown = false;
		},
		'mousemove' : function mousemove(event) {
			state.isDragging = state.isMouseDown;
		}
	};

	function handle(event) {
		var data;

		if (handlers[event.type]) {
			data = handlers[event.type](
				event,
				state.range,
				state.caret,
				state.isDragging
			);
		}

		if (stateHandlers[event.type]) {
			stateHandlers[event.type](event);
		}

		if (!data) {
			return event;
		}

		var range = state.range = data.range;
		var caret = state.caret = data.caret;

		event.range = range;

		if ('keydown' === event.type) {
			if (event.which === Keys.CODES.up || event.which === Keys.CODES.down) {
				event.native.preventDefault();
			}
			// Because chrome would moved the selection forward once again
			// otherwise
			if (!range.collapsed) {
				event.native.preventDefault();
			}
		}

		if ('mousedown' !== event.type) {
			var overrides = computeOverrides(event, caret);
			render(range, caret, overrides[0], overrides[1]);
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
