/**
 * selections.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * @TODO: better climbing
 *        <br>|<br> in chrome
 *        ie support
 */
define([
	'functions',
	'dom',
	'keys',
	'maps',
	'events',
	'ranges',
	'strings',
	'browsers',
	'overrides',
	'boundaries',
	'traversing'
], function Selection(
	Fn,
	Dom,
	Keys,
	Maps,
	Events,
	Ranges,
	Strings,
	Browsers,
	Overrides,
	Boundaries,
	Traversing
) {
	'use strict';

	/**
	 * Hides all visible caret elements and returns all those that were hidden
	 * in this operation.
	 *
	 * @param  {Document} doc
	 * @return {Array.<Element>}
	 */
	function hideCarets(doc) {
		var carets = doc.querySelectorAll('div.aloha-caret');
		var visible = [];
		[].forEach.call(carets, function (caret) {
			if ('block' === Dom.getStyle(caret, 'display')) {
				visible.push(caret);
				Dom.setStyle(caret, 'display', 'none');
			}
		});
		return visible;
	}

	/**
	 * Unhides the given list of caret elements.
	 *
	 * @param {Array.<Element>} carets
	 */
	function unhideCarets(carets) {
		carets.forEach(function (caret) {
			Dom.setStyle(caret, 'display', 'block');
		});
	}

	/**
	 * Renders the given element at the specified boundary to represent the
	 * caret position.
	 *
	 * @param {Element}  caret
	 * @param {Boundary} boundary
	 */
	function show(caret, boundary) {
		var box = Ranges.box(Ranges.fromBoundaries(boundary, boundary));
		Maps.extend(caret.style, {
			'top': box.top + 'px',
			'left': box.left + 'px',
			'height': box.height + 'px',
			'width': '2px',
			'display': 'block'
		});
	}

	/**
	 * Hides the given element.
	 *
	 * @param {Element} elem
	 */
	function hide(elem) {
		elem.style.display = 'none';
	}

	/**
	 * Calculates the override values at the given boundary container.
	 *
	 * @param  {Object}  event
	 * @param  {Element} container
	 * @return {Object}  An object with overrides mapped against their names
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
	 * Determines how to style a caret element based on the given overrides.
	 *
	 * @param  {Object} overrides
	 * @return {Object} A map of style properties and their values
	 */
	function stylesFromOverrides(overrides) {
		var style = {};
		style['padding'] = overrides['bold'] ? '1px' : '0px';
		style[Browsers.VENDOR_PREFIX + 'transform']
				= overrides['italic'] ? 'rotate(8deg)' : '';
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

	/**
	 * Checks whether or not the given event is a mouse event.
	 *
	 * @param  {Event|AlohaEvent} event
	 * @return {boolean}
	 */
	function isMouseEvent(event) {
		switch (event.type) {
		case 'mouseup':
		case 'mousedown':
		case 'mousemove':
		case 'dblclick':
		case 'dragover':
			return true;
		default:
			return false;
		}
	}

	/**
	 * Creates a range that is `stride` pixels above the given offset bounds.
	 *
	 * @param  {Object}   box
	 * @param  {number}   stride
	 * @param  {Document} doc
	 * @return {Range}
	 */
	function up(box, stride, doc) {
		return Ranges.fromPosition(box.left, box.top - stride, doc);
	}

	/**
	 * Creates a range that is `stride` pixels below the given offset bounds.
	 *
	 * @param  {Object} box
	 * @param  {number} stride
	 * @return {Range}
	 */
	function down(box, stride, doc) {
		return Ranges.fromPosition(box.left, box.top + box.height + stride, doc);
	}
	function left(boundary, stride) {
		return Traversing.prev(boundary, stride);
	}
	function right(boundary, stride) {
		return Traversing.next(boundary, stride);
	}

	/**
	 * Given two ranges, creates a range that is between the two.
	 *
	 * @param  {Range}  a
	 * @param  {Range}  b
	 * @param  {string} focus Either "start" or "end"
	 * @return {Object}
	 */
	function mergeRanges(a, b, focus) {
		var sc, so, ec, eo;
		if ('start' === focus) {
			sc = a.startContainer;
			so = a.startOffset;
			ec = b.endContainer;
			eo = b.endOffset;
		} else {
			sc = b.startContainer;
			so = b.startOffset;
			ec = a.endContainer;
			eo = a.endOffset;
		}
		if (isReversed(sc, so, ec, eo)) {
			return {
				range: Ranges.create(ec, eo, sc, so),
				focus: ('start' === focus) ? 'end' : 'start'
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
	 * @param  {Object} event
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
		var move = ('up' === direction) ? up : down;
		var doc = range.commonAncestorContainer.ownerDocument;
		var next = move(box, offset, doc);

		// TODO: also check if `next` and `clone` are *visually* adjacent
		while (next && Ranges.equals(next, clone)) {
			offset += half;
			next = move(box, offset, doc);
		}
		if (!next) {
			return;
		}
		if (!Events.isWithShift(event)) {
			return {
				range: next,
				focus: focus
			};
		}
		return mergeRanges(next, range, focus);
	}

	/**
	 * Determines the next visual caret position before or after the given
	 * range.
	 *
	 * @param  {Object} event
	 * @param  {Range}  range
	 * @param  {string} focus
	 * @param  {string} direction "left" or "right"
	 * @return {Object}
	 */
	function step(event, range, focus, direction) {
		var get, set, collapse;
		var shift = Events.isWithShift(event);
		var clone = range.cloneRange();
		var move = ('left' === direction) ? left : right;
		if (range.collapsed || !shift) {
			focus = ('left' === direction) ? 'start' : 'end';
		}
		if ('start' === focus) {
			get = Boundaries.fromRangeStart;
			set = Boundaries.setRangeStart;
			collapse = Ranges.collapseToStart;
		} else {
			get = Boundaries.fromRangeEnd;
			set = Boundaries.setRangeEnd;
			collapse = Ranges.collapseToEnd;
		}
		if (range.collapsed || shift) {
			Ranges.envelopeInvisibleCharacters(range);
			var stride = Events.isWithCtrl(event) ? 'word' : 'visual';
			var boundary = get(range);
			set(clone, move(boundary, stride) || boundary);
		}
		if (!shift) {
			collapse(clone);
		}
		return {
			range: clone,
			focus: focus
		};
	}

	/**
	 * Caret movement operations mapped against cursor key keycodes.
	 *
	 * @type {Object.<String, function(Event, Range, string):Object>}
	 */
	var movements = {};

	movements[Keys.CODES.up] = function climbUp(event, range, focus) {
		return climb(event, range, focus, 'up');
	};

	movements[Keys.CODES.down] = function climbDown(event, range, focus) {
		return climb(event, range, focus, 'down');
	};

	movements[Keys.CODES.left] = function stepLeft(event, range, focus) {
		return step(event, range, focus, 'left');
	};

	movements[Keys.CODES.right] = function stepRight(event, range, focus) {
		return step(event, range, focus, 'right');
	};

	/**
	 * Processes a keypress event.
	 *
	 * @param  {Event}  event
	 * @param  {Range}  range
	 * @param  {string} focus
	 * @return {Object}
	 */
	function keypress(event, range, focus) {
		return {
			range: range,
			focus: focus
		};
	}

	/**
	 * Processes a keydown event.
	 *
	 * @param  {Event}  event
	 * @param  {Range}  range
	 * @param  {string} focus
	 * @return {Object}
	 */
	function keydown(event, range, focus) {
		return (movements[event.which] || keypress)(event, range, focus);
	}

	/**
	 * Processes a double-click event.
	 *
	 * @param  {Event}  event
	 * @param  {Range}  range
	 * @param  {string} focus
	 * @return {Object}
	 */
	function dblclick(event, range, focus, previous, expanding) {
		return {
			range: Ranges.expand(range, 'word'),
			focus: 'end'
		};
	}

	/**
	 * Processes a triple click event.
	 *
	 * @param  {Event}  event
	 * @param  {Range}  range
	 * @param  {string} focus
	 * @return {Object}
	 */
	function tplclick(event, range, focus, previous, expanding) {
		return {
			range: Ranges.expand(range, 'block'),
			focus: 'end'
		};
	}

	/**
	 * Processes a mouseup event.
	 *
	 * @param  {Event}  event
	 * @param  {Range}  range
	 * @param  {string} focus
	 * @return {Object}
	 */
	function mouseup(event, range, focus, previous, expanding) {
		if (!expanding) {
			return {
				range: range,
				focus: focus
			};
		}
		return mergeRanges(range, previous, focus);
	}

	/**
	 * Processes a mousedown event.
	 *
	 * @param  {Event}  event
	 * @param  {Range}  range
	 * @param  {string} focus
	 * @return {Object}
	 */
	function mousedown(event, range, focus, previous, expanding) {
		if (!expanding) {
			return {
				range: range,
				focus: focus
			};
		}
		var sc = range.startContainer;
		var so = range.startOffset;
		var ec, eo, current;
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

	function dragndrop(event, range) {
		return {
			range: range,
			focus: 'end'
		};
	}

	/**
	 * Event handlers.
	 *
	 * @type {Object.<string, function>}
	 */
	var handlers = {
		'keydown'   : keydown,
		'keypress'  : keypress,
		'dblclick'  : dblclick,
		'tplclick'  : tplclick,
		'mouseup'   : mouseup,
		'mousedown' : mousedown,
		'mousemove' : Fn.returnFalse,
		'dragover'  : dragndrop,
		'drop'      : dragndrop
	};

	/**
	 * Normalizes the event type.
	 *
	 * This function is necessary for us to properly determine how to treat
	 * mouse events because we will sometime end up missing a dblclick event
	 * when the user's cursor is hovering over caret element.
	 *
	 * Furthermore, browsers do not send triple click events to JavaScript; this
	 * function will make it possible to detect them.
	 *
	 * @param  {Object}  event
	 * @param  {Range}   current
	 * @param  {Range}   previous
	 * @param  {string}  focus
	 * @param  {number}  then
	 * @param  {boolean} doubleclicking
	 * @param  {boolean} tripleclicking
	 * @return {string}
	 */
	function normalizeEventType(event, current, previous, focus, then,
	                            doubleclicking, tripleclicking) {
		if (!isMouseEvent(event)) {
			return event.type;
		}
		var isMouseDown = 'mousedown' === event.type;
		var isMulticlicking = current
		                   && previous
		                   && isMouseDown
		                   && ((new Date() - then) < 500);
		if (!isMulticlicking && isMouseDown) {
			return event.type;
		}
		if (doubleclicking) {
			return isMouseDown ? 'tplclick' : 'dblclick';
		}
		if (tripleclicking) {
			return 'tplclick';
		}
		if (!isMouseDown) {
			return event.type;
		}
		var ref = ('start' === focus)
		        ? Ranges.collapseToStart(previous.cloneRange())
		        : Ranges.collapseToEnd(previous.cloneRange());
		return Ranges.equals(current, ref) ? 'dblclick' : event.type;
	}

	/**
	 * Processes an event in relation to how it affects the selection.
	 *
	 * @param  {Object}  event
	 * @param  {string}  type      Normalized event type
	 * @param  {Range}   range
	 * @param  {string}  focus
	 * @param  {Range}   previous
	 * @param  {boolean} expanding
	 * @retrun {Object}
	 */
	function process(event, type, range, focus, previous, expanding) {
		var change = handlers[type](event, range, focus, previous, expanding);
		if (change) {
			change.doubleclicking = 'dblclick' === type;
			change.tripleclicking = 'tplclick' === type;
		}
		return change;
	}

	/**
	 * Creates a new selection context.
	 *
	 * Will create a DOM element at the end of the document body to be used to
	 * represent the caret position.
	 *
	 * @param  {Document} doc
	 * @return {Object}
	 */
	function Context(doc) {
		var caret = doc.createElement('div');
		caret.style.display = 'none';
		Dom.addClass(caret, 'aloha-caret');
		Dom.insert(caret, doc.body, true);
		return {
			caret          : caret,
			range          : null,
			focus          : 'end',
			dragging       : false,
			mousedown      : false,
			doubleclicking : false,
			tripleclicking : false
		};
	}

	/**
	 * Returns a new selection context as a function of the given event, the
	 * previous state, and changes to the state.
	 *
	 * @param  {Object} event
	 * @param  {Object} old    context
	 * @param  {Object} change context
	 * @return {Object}
	 */
	function newContext(event, old, change) {
		var context = Maps.extend({}, old, change);
		switch (event.type) {
		case 'mousedown':
			context.time = new Date();
			context.dragging = false;
			context.mousedown = true;
			break;
		case 'mouseup':
			context.mousedown = false;
			break;
		case 'mousemove':
			context.dragging = old.mousedown;
			break;
		}
		return context;
	}

	/**
	 * Returns a range based on the given event object.
	 *
	 * @param  {AlohaEvent} alohaEvent An Aloha Editor event
	 * @return {?Range}
	 */
	function fromEvent(alohaEvent) {
		var event = alohaEvent.nativeEvent;
		if (isMouseEvent(alohaEvent)) {
			return Ranges.fromPosition(
				event.clientX,
				event.clientY,
				(event.target || event.srcElement).ownerDocument
			);
		}
		if (alohaEvent.range) {
			return alohaEvent.range;
		}
		return Ranges.get((event.target || event.srcElement).ownerDocument);
	}

	/**
	 * Scrolls the viewport to the position of the given boundary.
	 *
	 * @param {Boundary}
	 */
	function scrollTo(boundary) {
		var box = Ranges.box(Ranges.fromBoundaries(boundary, boundary));
		var doc = Boundaries.container(boundary).ownerDocument;
		var win = Dom.documentWindow(doc);
		var topDelta = win.pageYOffset - doc.body.clientTop;
		var leftDelta = win.pageXOffset - doc.body.clientLeft;
		win.scrollTo(box.left + leftDelta, box.top + topDelta);
	}

	/**
	 * Renders a caret element to show the user selection.
	 *
	 * @param  {Object} event
	 * @return {Object}
	 */
	function handle(event) {
		if (!handlers[event.type]) {
			return event;
		}

		var context;
		var old = event.editor.selectionContext;

		// Because we will never update the caret position on mousemove, we
		// avoid unncessary computation
		if ('mousemove' === event.type) {
			context = event.editor.selectionContext = newContext(event, old);

			// Because we want to move the caret out of the way when the user
			// starts creating an expanded selection by dragging
			if (!old.dragging && context.dragging) {
				Dom.setStyle(context.caret, 'display', 'none');
				Dom.removeClass(context.caret, 'aloha-caret-blink');
			}

			return event;
		}

		if ('mousedown' === event.type) {
			Dom.addClass(old.caret, 'aloha-caret-blink');
		}

		// Because otherwise, if, in the process of a click, the user's cursor
		// is over the caret, fromEvent() will compute the range to be inside
		// the absolutely positioned caret element
		Dom.setStyle(old.caret, 'display', 'none');

		var range = fromEvent(event);

		if (!range) {
			return event;
		}

		var type = normalizeEventType(
			event,
			range,
			old.range,
			old.focus,
			old.time,
			old.doubleclicking,
			old.tripleclicking
		);

		context = newContext(event, old, process(
			event,
			type,
			range,
			old.focus,
			old.range,
			old.dragging || Events.isWithShift(event)
		));

		event.editor.selectionContext = context;

		range = context.range;

		if (!Dom.isEditableNode(range.commonAncestorContainer)) {
			return event;
		}

		var boundary, container;
		if ('start' === context.focus) {
			boundary = Boundaries.fromRangeStart(range);
			container = range.startContainer;
		} else {
			boundary = Boundaries.fromRangeEnd(range);
			container = range.endContainer;
		}

		show(context.caret, boundary);

		Maps.extend(
			context.caret.style,
			stylesFromOverrides(overrides(event, container))
		);

		var preventDefault = ('keydown' === type && movements[event.which])
				|| (event.editor.CARET_CLASS === event.nativeEvent.target.className);

		if (preventDefault) {
			event.nativeEvent.preventDefault();
		}

		// Because browsers have a non-intuitive way of handling expanding of
		// selections when holding down the shift key.  We therefore "trick" the
		// browser by setting the selection to a range which will cause the the
		// expansion to be done in the way that the user expects
		if (!preventDefault && 'mousedown' === type && Events.isWithShift(event)) {
			if ('start' === context.focus) {
				range = Ranges.collapseToEnd(range);
			} else {
				range = Ranges.collapseToStart(range);
			}
		}

		event.range = range;

		return event;
	}

	return {
		show         : show,
		handle       : handle,
		Context      : Context,
		hideCarets   : hideCarets,
		unhideCarets : unhideCarets,
		scrollTo     : scrollTo
	};
});
