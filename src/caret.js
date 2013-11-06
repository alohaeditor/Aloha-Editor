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

	/**
	 * Creates a DOM element to be used to represent a caret.
	 *
	 * @param {Element}
	 */
	function create() {
		var caret = document.createElement('div');
		Dom.addClass(caret, 'aloha-caret');
		Dom.insert(caret, document.body, true);
		Dom.disableSelection(caret);
		return caret;
	}

	/**
	 * Hides all caret elements.
	 */
	function purge() {
		Arrays.coerce(document.querySelectorAll('.aloha-caret'))
		      .forEach(Dom.remove);
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
		caret.style.position = 'absolute';
		caret.style.display = 'block';
		caret.style.opacity = '0.5';
		caret.style.background = color;
		caret.style[Browsers.VENDOR_PREFIX + 'transform'] = rotation;
	}

	/**
	 * Renders the given caret according to the boundary and styles
	 * it to reflect the given map of overrides.
	 *
	 * @param {Elemen} caret
	 * @param {Object} rect
	 * @param {Object} overrides
	 */
	function renderBoundary(caret, boundary, overrides) {
		var box = Ranges.box(Ranges.create(boundary[0], boundary[1]));
		var doc = caret.ownerDocument;
		box.top += window.pageYOffset - doc.body.clientTop;
		box.left += window.pageXOffset - doc.body.clientLeft;
		box.width = 2;
		render(caret, box, overrides);
	}

	/**
	 * Shows the given range by rendering cursors at the start and end boundary
	 * of the range.
	 *
	 * @param {Range} range
	 * @param {String} caret
	 *        Which of the carets is the blinking caret. May be "start" or
	 *        "end".
	 * @param {Object} startOverrides
	 * @param {Object} endOverrides
	 */
	function show(range, caret, startOverrides, endOverrides) {
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

	/**
	 * Calculates the override values at the given start and end boundaries.
	 *
	 * @param {Object} event
	 * @param {String} caret
	 *        Which of the carets is the blinking caret. May be "start" or
	 *        "end".
	 * @return {Array<Object>}
	 *         An ordered list of the overrides at the start and end boundary.
	 */
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
		var position = sc.compareDocumentPosition(ec);
		return (0 === position && so > eo)
		    || (position & Node.DOCUMENT_POSITION_PRECEDING) > 0;
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

	/**
	 * Determines the next visual caret position above or below `range`.
	 *
	 * @param {Event} event
	 * @param {Range} range
	 * @param {String} caret
	 * @param {String} direction
	 * @return {Object}
	 */
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

	/**
	 * Determines the next visual caret position before or after `range`. 
	 *
	 * @param {Event} event
	 * @param {Range} range
	 * @param {String} caret
	 * @param {String} direction
	 * @return {Object}
	 */
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

	function keydown(event, range, previous, caret, dragging, doubleclicking) {
		if (arrows[event.which]) {
			return arrows[event.which](event, range, caret);
		}
		return {
			range : range,
			caret : caret
		};
	}

	function keypress(event, range, previous, caret, dragging, doubleclicking) {
		return {
			range : range,
			caret : caret
		};
	}

	function mouseup(event, range, previous, caret, dragging, doubleclicking) {
		if (doubleclicking && !dragging) {
			return dblclick(
				event,
				previous,
				previous,
				caret,
				dragging,
				doubleclicking
			);
		}

		var current = Ranges.createFromPoint(
			event.native.clientX,
			event.native.clientY
		);

		if (!previous || !current) {
			return;
		}

		var sc = previous.startContainer;
		var so = previous.startOffset;
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

	function mousedown(event, range, previous, caret, dragging, doubleclicking) {
		purge();
		var current;
		if (previous && isShiftDown(event)) {
			current = previous;
		} else {
			current = Ranges.createFromPoint(
				event.native.clientX,
				event.native.clientY
			);
		}
		return {
			range : current,
			caret : caret
		};
	}

	function dblclick(event, range, previous, caret, dragging, doubleclicking) {
		return {
			range : Ranges.expandToWord(previous),
			caret : 'end'
		};
	}

	var handlers = {
		'keydown'   : keydown,
		'keypress'  : keypress,
		'mouseup'   : mouseup,
		'mousedown' : mousedown,
		'dblclick'  : dblclick
	};

	// State of the user selection
	var state = {
		range         : null,
		caret         : 'end',
		lastClick     : 0,
		isDragging    : false,
		isMouseDown   : false,
		isDoubleClick : false
	};

	var stateHandlers = {
		'mousedown': function mousedown(event) {
			state.isDragging = false;
			state.isMouseDown = true;
			var last = state.lastClick;
			state.lastClick = new Date();
			state.isDoubleClick = ((state.lastClick - last) < 500)
			                   && Dom.hasClass(event.target, 'aloha-caret');
		},
		'mouseup': function mouseup(event) {
			state.isDoubleClick = state.isDragging = state.isMouseDown = false;
		},
		'mousemove': function mousemove(event) {
			state.isDragging = state.isMouseDown;
		}
	};

	/**
	 * Renders caret elements to show the user selection.
	 *
	 * @param {Event} event
	 * @return {Event}
	 */
	function handle(event) {
		var data;
		var caret;
		var range;

		if (handlers[event.type]) {
			data = handlers[event.type](
				event,
				event.range || Ranges.get(),
				state.range,
				state.caret,
				state.isDragging,
				state.isDoubleClick
			);
		}

		if (stateHandlers[event.type]) {
			stateHandlers[event.type](event, data);
		}

		if (!data) {
			return event;
		}

		caret = state.caret = data.caret;
		range = state.range = event.range = data.range;

		if ('keydown' === event.type && arrows[event.which]) {
			event.native.preventDefault();
		}

		if ('mousedown' !== event.type) {
			var overrides = computeOverrides(event, caret);
			show(range, caret, overrides[0], overrides[1]);
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
