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
	 * Creates a DOM element to be used to represent the caret position.
	 *
	 * @return {Element}
	 */
	function create() {
		var caret = document.createElement('div');
		caret.style.display = 'none';
		Dom.addClass(caret, 'aloha-caret');
		Dom.insert(caret, document.body, true);
		return caret;
	}

	/**
	 * Renders the given element at the specified boundary to represent the
	 * caret position. Will also style caret if `opt_style` is provided.
	 *
	 * @param {Element}  caret
	 * @param {Boundary} boundary
	 * @param {Object}   opt_style
	 */
	function show(caret, boundary, opt_style) {
		var box = Ranges.box(Ranges.create(boundary[0], boundary[1]));
		var doc = caret.ownerDocument;
		box.top += window.pageYOffset - doc.body.clientTop;
		box.left += window.pageXOffset - doc.body.clientLeft;
		var style = opt_style || {};
		style['top'] = box.top + 'px';
		style['left'] = box.left + 'px';
		style['height'] = box.height + 'px';
		style['width'] = '2px';
		style['display'] = 'block';
		var prop;
		for (prop in style) {
			if (style.hasOwnProperty(prop)) {
				caret.style[prop] = style[prop];
			}
		}
	}

	/**
	 * Hides the given given element.
	 *
	 * @param {Element} elem
	 */
	function hide(elem) {
		elem.style.display = 'none';
	}

	/**
	 * Un-hides the given element.
	 *
	 * @param {Element} elem
	 */
	function unhide(elem) {
		elem.style.display = 'block';
	}

	/**
	 * Calculates the override values at the given boundary container.
	 *
	 * @param  {Object}  event
	 * @param  {Element} container
	 * @return {Object}
	 *         An object with overrides mapped against their names.
	 */
	function overrides(event, container) {
		if (event.editable) {
			return Maps.merge(
				Overrides.map(Overrides.harvest(container)),
				Overrides.map(event.editable.overrides)
			);
		}
		return Overrides.map(Overrides.harvest(container));
	}

	/**
	 * Determines how to style the caret based on the given overrides.
	 *
	 * @param  {Object} overrides
	 * @return {Object}
	 *         A map of style properties and their values
	 */
	function stylesFromOverrides(overrides) {
		var style = {};
		style['padding'] = overrides['bold'] ? '1px' : '0px';
		style[Browsers.VENDOR_PREFIX + 'transform'] = overrides['italic'] ? 'rotate(8deg)' : '';
		style['background'] = overrides['color'] || '';
		return style;
	}

	/**
	 * Given the containers and offsets representing a start and end boundary,
	 * checks whether the end boundary preceeds the start boundary in document
	 * order.
	 *
	 * @param  {Element} sc Start container
	 * @param  {string}  so Start offset
	 * @param  {Element} ec End container
	 * @param  {string}  eo End offset
	 * @return {boolean}
	 *         True if the boundary positions are reversed.
	 */
	function isReversed(sc, so, ec, eo) {
		return (sc === ec && so > eo) || Dom.followedBy(ec, sc);
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
	 * Determines the closest visual caret position above or below the given
	 * range.
	 *
	 * @param  {Event}  event
	 * @param  {Range}  range
	 * @param  {string} focus
	 * @param  {string} direction "up" or "down"
	 * @return {Object}
	 */
	function climb(event, range, focus, direction) {
		var clone = ('start' === focus)
		          ? Ranges.collapseToStart(range.cloneRange())
		          : Ranges.collapseToEnd(range.cloneRange());

		var box = Ranges.box(clone);
		var half = box.height / 2;
		var offset = half;
		var move = 'up' === direction ? up : down;
		var next = move(box, offset);

		// TODO: also check if `next` and `clone` are *visually* adjacent
		while (next && Ranges.equal(next, clone)) {
			offset += half;
			next = move(box, offset);
		}

		if (!next) {
			return;
		}

		if (!isShiftDown(event)) {
			return {
				range: next,
				focus: focus
			};
		}

		return calculateExpandedRange(next, range, focus);
	}

	/**
	 * Determines the next visual caret position before or after the given
	 * range.
	 *
	 * @param  {Event}  event
	 * @param  {Range}  range
	 * @param  {string} focus
	 * @param  {string} direction "left" or "right"
	 * @return {Object}
	 */
	function step(event, range, focus, direction) {
		var get, set, collapse;
		var shift = isShiftDown(event);
		var move = 'left' === direction ? left : right;
		var clone = range.cloneRange();

		if (range.collapsed || !shift) {
			focus = 'left' === direction ? 'start' : 'end';
		}

		if ('start' === focus) {
			get = Boundaries.start;
			set = Ranges.setStartFromBoundary;
			collapse = Ranges.collapseToStart;
		} else {
			get = Boundaries.end;
			set = Ranges.setEndFromBoundary;
			collapse = Ranges.collapseToEnd;
		}

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

	function keypress(event, range, focus) {
		return {
			range: range,
			focus: focus
		};
	}

	function keydown(event, range, focus) {
		return (arrows[event.which] || keypress)(event, range, focus);
	}

	function dblclick(event, range) {
		return {
			range: Ranges.expandToWord(range),
			focus: 'end'
		};
	}

	function mouseup(event, range, focus, previous, expanding) {
		if (!expanding) {
			return {
				range: range,
				focus: focus
			};
		}
		return calculateExpandedRange(range, previous, focus);
	}

	function mousedown(event, range, focus, previous, expanding) {
		if (!expanding) {
			return {
				range: range,
				focus: focus
			};
		}

		var sc, so, ec, eo, current;

		sc = range.startContainer;
		so = range.startOffset;

		if ('start' === focus) {
			ec = previous.endContainer;
			eo = previous.endOffset;
		} else {
			ec = previous.startContainer;
			eo = previous.startOffset;
		}

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

	var handlers = {
		'keydown'   : keydown,
		'keypress'  : keypress,
		'dblclick'  : dblclick,
		'mouseup'   : mouseup,
		'mousedown' : mousedown,
		'mousemove' : Fn.returnFalse
	};

	/**
	 * State of the user selection.
	 * A necessary "evil."
	 */
	var state = {
		caret            : create(),
		range            : null,
		focus            : 'end',
		isDragging       : false,
		isMouseDown      : false,
		isDoubleClicking : false
	};

	var stateHandlers = {
		'mousedown': function mousedown(state) {
			state.time = new Date();
			state.isDragging = false;
			state.isMouseDown = true;
		},
		'mouseup': function mouseup(state) {
			state.isDoubleClicking = state.isDragging = state.isMouseDown = false;
		},
		'mousemove': function mousemove(state) {
			state.isDragging = state.isMouseDown;
		}
	};

	/**
	 * Given a previous and current range, an event name, and the time since the
	 * last mousedown event, determines whether or not the user is in the
	 * process of a double click.
	 *
	 * @param  {string} name     Name of the event type
	 * @param  {Range}  range    Current range
	 * @param  {Range}  previous Previous range
	 * @param  {Date}   then     Time of last mousedown event
	 * @return {boolean}
	 */
	function isDoubleClicking(name, range, previous, then) {
		return ('mousedown' === name)
		    && ((new Date() - then) < 500) && Ranges.equal(range, previous);
	}

	/**
	 * Renders a caret element to show the user selection.
	 *
	 * @param  {Event} event
	 * @return {Event}
	 */
	function handle(event) {
		if (!handlers[event.type]) {
			return event;
		}

		var range;
		var type = event.type;

		// Because we will never show the caret on mousemove, we avoid
		// unncessary computation.
		if ('mousemove' === type) {
			range = null;
		} else {
			// Because otherwise, if, in the process of a click, the user's
			// cursor is over the caret, Ranges.fromEvent() will compute the
			// range to be inside the absolutely positioned caret element.
			hide(state.caret);
			range = Ranges.fromEvent(event);
			unhide(state.caret);

			state.isDoubleClicking = state.isDoubleClicking
				|| isDoubleClicking(type, range, state.range, state.time);

			if (state.isDoubleClicking) {
				type = 'dblclick';
			}
		}

		var data = handlers[type](
			event,
			range,
			state.focus,
			state.range,
			state.isDragging || isShiftDown(event)
		);

		var wasDragging = state.isDragging;

		if (stateHandlers[event.type]) {
			stateHandlers[event.type](state);
			// Because we want to move the caret out of the way when the user
			// starts to create an expanded selection by dragging.
			if (!wasDragging && state.isDragging) {
				hide(state.caret);
			}
		}

		if (!data || !data.range) {
			return event;
		}

		state.focus = data.focus;
		state.range = event.range = data.range;

		var boundary;
		var container;
		var caretStyle;

		if ('start' === state.focus) {
			boundary = Boundaries.start(state.range);
			container = state.range.startContainer;
		} else {
			boundary = Boundaries.end(state.range);
			container = state.range.endContainer;
		}

		caretStyle = stylesFromOverrides(overrides(event, container));

		show(state.caret, boundary, caretStyle);

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
