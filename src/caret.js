/* carets.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'functions',
	'dom',
	'html',
	'keys',
	'maps',
	'ranges',
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
	Browsers,
	Overrides,
	Boundaries,
	Traversing
) {
	'use strict';

	/**
	 * Creates a DOM element to be used to represent a caret.
	 *
	 * @param {Element}
	 */
	function create() {
		var caret = document.createElement('div');
		Dom.addClass(caret, 'aloha-caret');
		Dom.insert(caret, document.body, true);
		return caret;
	}

	/**
	 * Renders the given caret according to the dimension of `rect` and styles
	 * it to reflect the given map of overrides.
	 *
	 * @param {Elemen} caret
	 * @param {Object} rect
	 * @param {Object} overrides
	 */
	function render(caret, rect, overrides) {
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
		caret.style.display = 'block';
		caret.style.background = color;
		caret.style[Browsers.VENDOR_PREFIX + 'transform'] = rotation;
		Dom.addClass(caret, 'blink');
	}

	/**
	 * Renders the given caret according to the boundary and styles it to
	 * reflect the given map of overrides.
	 *
	 * @param {Boundary} boundary
	 * @param {Elemen} caret
	 * @param {Object} overrides
	 */
	function show(boundary, caret, overrides) {
		var box = Ranges.box(Ranges.create(boundary[0], boundary[1]));
		var doc = caret.ownerDocument;
		box.top += window.pageYOffset - doc.body.clientTop;
		box.left += window.pageXOffset - doc.body.clientLeft;
		box.width = 2;
		render(caret, box, overrides);
	}

	/**
	 * Hides the given caret element.
	 *
	 * @param {Element} caret
	 */
	function hide(caret) {
		caret.style.display = 'none';
	}

	function unhide(caret) {
		caret.style.display = 'block';
	}

	/**
	 * Calculates the override values at the given start and end boundaries.
	 *
	 * @param {Object} event
	 * @param {Element} node
	 * @return {Array<Object>}
	 *         An ordered list of the overrides at the start and end boundary.
	 */
	function computeOverrides(event, node) {
		var overrides = Overrides.map(Overrides.harvest(node));
		if (event.editables) {
			overrides = Maps.merge(
				overrides,
				Overrides.map(event.editable.overrides)
			);
		}
		return overrides;
	}

	/**
	 * Checks whether the end boundary preceeds the start boundary in the
	 * document order.
	 *
	 * @param {Element} sc Start container
	 * @param {String}  so Start offset
	 * @param {Element} ec End container
	 * @param {String}  eo End offset
	 * @return {Boolean}
	 */
	function isReversed(sc, so, ec, eo) {
		return (sc === ec && so > eo) || Dom.follows(ec, sc);
	}

	function isCtrlDown(event) {
		return event.meta.indexOf('ctrl') > -1;
	}

	function isShiftDown(event) {
		return event.meta.indexOf('shift') > -1;
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

	function calculateExpandedRange(current, previous, focus) {
		var sc, so, ec, eo;

		if ('start' === focus) {
			sc = current.startContainer;
			so = current.startOffset;
			ec = previous.endContainer;
			eo = previous.endOffset;
		} else {
			sc = previous.startContainer;
			so = previous.startOffset;
			ec = current.endContainer;
			eo = current.endOffset;
		}

		if (isReversed(sc, so, ec, eo)) {
			return {
				range: Ranges.create(ec, eo, sc, so),
				focus: 'start' === focus ? 'end' : 'start'
			};
		}

		return {
			range: Ranges.create(sc, so, ec, eo),
			focus: focus
		};
	}

	/**
	 * Determines the next visual caret position above or below `range`.
	 *
	 * @param {Event} event
	 * @param {Range} range
	 * @param {String} focus
	 * @param {String} direction
	 * @return {Object}
	 */
	function climb(event, range, focus, direction) {
		var get;
		var set;

		if ('start' === focus) {
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

		if (!expanding) {
			return {
				range: next,
				focus: focus
			};
		}

		return calculateExpandedRange(next, range, focus);
	}

	/**
	 * Determines the next visual caret position before or after `range`. 
	 *
	 * @param {Event} event
	 * @param {Range} range
	 * @param {String} focus
	 * @param {String} direction
	 * @return {Object}
	 */
	function step(event, range, focus, direction) {
		var shift = isShiftDown(event);
		var move = 'left' === direction ? left : right;

		if (range.collapsed || !shift) {
			focus = 'left' === direction ? 'start' : 'end';
		}

		var get;
		var set;
		var collapse;

		if ('start' === focus) {
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
			focus: focus
		};
	}

	var arrows = {};
	arrows[Keys.CODES.up] = function climbUp(event, range, focus) {
		return climb(event, range, focus, 'up');
	};
	arrows[Keys.CODES.down] = function climbDown(event, range, focus) {
		return climb(event, range, focus, 'down');
	};
	arrows[Keys.CODES.left] = function stepLeft(event, range, focus) {
		return step(event, range, focus, 'left');
	};
	arrows[Keys.CODES.right] = function stepRight(event, range, focus) {
		return step(event, range, focus, 'right');
	};

	function keydown(event, previous, focus) {
		var range = calculateRange(event);
		if (arrows[event.which]) {
			return arrows[event.which](event, range, focus);
		}
		return {
			range: range,
			focus: focus
		};
	}

	function keypress(event) {
		return {
			range: calculateRange(event),
			focus: 'end'
		};
	}

	function mouseup(event, previous, focus, expanding) {
		var range = calculateRange(event);

		if (!expanding) {
			return {
				range: range,
				focus: focus
			};
		}

		return calculateExpandedRange(range, previous, focus);
	}

	function mousedown(event, previous, focus, expanding) {
		var range = calculateRange(event);

		if (!expanding) {
			return {
				range: range,
				focus: focus
			};
		}

		var sc, so, ec, eo;

		sc = range.startContainer;
		so = range.startOffset;

		if ('start' === focus) {
			ec = previous.endContainer;
			eo = previous.endOffset;
		} else {
			ec = previous.startContainer;
			eo = previous.startOffset;
		}

		var current;

		if (isReversed(sc, so, ec, eo)) {
			focus = 'end';
			current = Ranges.create(ec, eo, sc, so);
		} else {
			focus = 'start';
			current = Ranges.create(sc, so, ec, eo);
		}

		return {
			range: current,
			focus: focus
		};
	}

	function dblclick(event) {
		return {
			range: Ranges.expandToWord(calculateRange(event)),
			focus: 'end'
		};
	}

	var handlers = {
		'keydown'   : keydown,
		'keypress'  : keypress,
		'dblclick'  : dblclick,
		'mouseup'   : mouseup,
		'mousedown' : mousedown,
		'mousemove' : Fn.returnFalse
	};

	// State of the user selection
	var state = {
		caret         : create(),
		range         : null,
		focus         : 'end',
		isDragging    : false,
		isMouseDown   : false
	};

	var stateHandlers = {
		'mousedown': function mousedown(event) {
			state.isDragging = false;
			state.isMouseDown = true;
		},
		'mouseup': function mouseup(event) {
			state.isDragging = state.isMouseDown = false;
		},
		'mousemove': function mousemove(event) {
			state.isDragging = state.isMouseDown;
		}
	};

	function calculateRange(event) {
		var range;
		if ('mousedown' === event.type || 'mouseup' === event.type) {
			hide(state.caret);
			range = Ranges.createFromPoint(
				event.native.clientX,
				event.native.clientY
			);
			unhide(state.caret);
		} else {
			range = event.range || Ranges.get();
		}
		return range;
	}

	/**
	 * Renders caret element to show the user selection.
	 *
	 * @param {Event} event
	 * @return {Event}
	 */
	function handle(event) {
		if (!handlers[event.type]) {
			return event;
		}

		var data = handlers[event.type](
			event,
			state.range,
			state.focus,
			state.isDragging || isShiftDown(event)
		);

		var wasDragging = state.isDragging;

		if (stateHandlers[event.type]) {
			stateHandlers[event.type](event);
			if (!wasDragging && state.isDragging) {
				hide(state.caret);
			}
		}

		if (!data || !data.range) {
			return event;
		}

		state.focus = data.focus;
		state.range = event.range = data.range;

		var get = 'start' === state.focus ? Boundaries.start : Boundaries.end;

		var container = 'start' === state.focus
		              ? state.range.startContainer
		              : state.range.endContainer;

		show(get(state.range), state.caret, computeOverrides(event, container));

		if ('keydown' === event.type && arrows[event.which]) {
			event.native.preventDefault();
		}

		return event;
	}

	var exports = {
		show   : show,
		handle : handle
	};

	exports['show'] = exports.show;
	exports['handle'] = exports.handle;

	return exports;
});
