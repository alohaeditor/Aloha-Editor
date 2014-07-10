/**
 * selections.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * @TODO: better climbing
 *        ie support
 */
define([
	'functions',
	'dom',
	'keys',
	'maps',
	'mouse',
	'events',
	'ranges',
	'browsers',
	'overrides',
	'animation',
	'boundaries',
	'traversing',
	'colors'
], function (
	Fn,
	Dom,
	Keys,
	Maps,
	Mouse,
	Events,
	Ranges,
	Browsers,
	Overrides,
	Animation,
	Boundaries,
	Traversing,
	Colors
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
			'top'     : box.top + 'px',
			'left'    : box.left + 'px',
			'height'  : box.height + 'px',
			'width'   : '1px',
			'display' : 'block'
		});
	}

	/**
	 * Determines how to style a caret element based on the given overrides.
	 *
	 * @private
	 * @param  {Object} overrides
	 * @return {Object} A map of style properties and their values
	 */
	function stylesFromOverrides(overrides) {
		var style = {};
		style['padding'] = overrides['bold'] ? '1px' : '0px';
		style[Browsers.VENDOR_PREFIX + 'transform']
				= overrides['italic'] ? 'rotate(16deg)' : '';
		style['background'] = overrides['color'] || 'black';
		return style;
	}

	/**
	 * Given the containers and offsets representing a start and end boundary,
	 * checks whether the end boundary preceeds the start boundary in document
	 * order.
	 *
	 * @private
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
	 * Creates a range that is `stride` pixels above the given offset bounds.
	 *
	 * @private
	 * @param  {Object.<string, number>} box
	 * @param  {number}                  stride
	 * @param  {Document}                doc
	 * @return {Range}
	 */
	function up(box, stride, doc) {
		return Ranges.fromPosition(box.left, box.top - stride, doc);
	}

	/**
	 * Creates a range that is `stride` pixels below the given offset bounds.
	 *
	 * @private
	 * @param  {Object.<string, number>} box
	 * @param  {number}                  stride
	 * @return {Range}
	 */
	function down(box, stride, doc) {
		return Ranges.fromPosition(box.left, box.top + box.height + stride, doc);
	}

	/**
	 * Given two ranges, creates a range that is between the two.
	 *
	 * @private
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
	 * @private
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
		var doc = range.commonAncestorContainer.ownerDocument;
		var win = Dom.documentWindow(doc);
		var topOffset = win.pageYOffset - doc.body.clientTop;
		var leftOffset = win.pageXOffset - doc.body.clientLeft;

		box.top -= topOffset;
		box.left -= leftOffset;

		var half = box.height / 2;
		var stride = half;
		var move = ('up' === direction) ? up : down;
		var next = move(box, stride, doc);

		// TODO: also check if `next` and `clone` are *visually* adjacent
		while (next && Ranges.equals(next, clone)) {
			stride += half;
			next = move(box, stride, doc);
		}
		if (!next) {
			return;
		}
		if (!Events.hasKeyModifier(event, 'shift')) {
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
	 * @private
	 * @param  {Event}  event
	 * @param  {Range}  range
	 * @param  {string} focus
	 * @param  {string} direction "left" or "right"
	 * @return {Object}
	 */
	function step(event, range, focus, direction) {
		var get, set, collapse;
		var shift = Events.hasKeyModifier(event, 'shift');
		var clone = range.cloneRange();
		var move = ('left' === direction) ? Traversing.prev : Traversing.next;
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
			var stride = (Events.hasKeyModifier(event, 'ctrl') || Events.hasKeyModifier(event, 'alt'))
			           ? 'word'
			           : 'visual';
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
	 * @private
	 * @type {Object.<string, function(Event, Range, string):Object>}
	 */
	var movements = {};

	movements[Keys.CODES['up']] = function climbUp(event, range, focus) {
		return climb(event, range, focus, 'up');
	};

	movements[Keys.CODES['down']] = function climbDown(event, range, focus) {
		return climb(event, range, focus, 'down');
	};

	movements[Keys.CODES['left']] = function stepLeft(event, range, focus) {
		return step(event, range, focus, 'left');
	};

	movements[Keys.CODES['right']] = function stepRight(event, range, focus) {
		return step(event, range, focus, 'right');
	};

	/**
	 * Processes a keypress event.
	 *
	 * @private
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
	 * @private
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
	 * @private
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
	 * @private
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
	 * @private
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
	 * @private
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

	function resize(event, range, focus) {
		return {
			range: range,
			focus: focus
		};
	}

	function paste(event, range, focus) {
		return {
			range: event.range,
			focus: 'end'
		};
	}

	/**
	 * Event handlers.
	 *
	 * @private
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
		'drop'      : dragndrop,
		'resize'    : resize,
		'paste'     : paste
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
	 * @private
	 * @param  {Event}   event
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
		if (!Mouse.EVENTS[event.type]) {
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
	 * @private
	 * @param  {Event}   event
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
	 * Initialize blinking using the given element.
	 *
	 * @private
	 * @param  {Element} caret
	 * @return {Object}
	 */
	function blinking(caret) {
		var timers = [];
		var blink = true;
		function fade(start, end, duration) {
			Animation.animate(
				start,
				end,
				Animation.easeLinear,
				duration,
				function (value, percent, state) {
					if (!blink) {
						return true;
					}
					Dom.setStyle(caret, 'opacity', value);
					if (percent < 1) {
						return;
					}
					if (0 === value) {
						timers.push(setTimeout(function () {
							fade(0, 1, 100);
						}, 300));
					} else if (1 === value){
						timers.push(setTimeout(function () {
							fade(1, 0, 100);
						}, 500));
					}
				}
			);
		}
		function stop() {
			blink = false;
			Dom.setStyle(caret, 'opacity', 1);
			timers.forEach(clearTimeout);
			timers = [];
		}
		function start() {
			stop();
			blink = true;
			timers.push(setTimeout(function () {
				fade(1, 0, 100);
			}, 500));
		}
		function restart() {
			stop();
			timers.push(setTimeout(start, 300));
		}
		return {
			stop    : stop,
			start   : start,
			restart : restart
		};
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
		Maps.extend(caret.style, {
			'color'    : '#000',
			'zIndex'   : '9999',
			'display'  : 'none',
			'position' : 'absolute'
		});
		Dom.addClass(caret, 'aloha-caret', 'aloha-ephemera');
		Dom.insert(caret, doc.body, true);
		return {
			caretOpacity   : 0,
			blinking       : blinking(caret),
			caret          : caret,
			range          : null,
			focus          : 'end',
			dragging       : false,
			mousedown      : false,
			doubleclicking : false,
			tripleclicking : false,
			formatting     : [],
			overrides      : []
		};
	}

	/**
	 * Returns a new selection context as a function of the given event, the
	 * previous state, and changes to the state.
	 *
	 * @private
	 * @param  {Event}  event
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
	 * @private
	 * @param  {AlohaEvent} alohaEvent
	 * @return {?Range}
	 */
	function fromEvent(alohaEvent) {
		var event = alohaEvent.nativeEvent;
		if (Mouse.EVENTS[alohaEvent.type]) {
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
		var win = Dom.documentWindow(Boundaries.document(boundary));
		win.scrollTo(box.left, box.top);
	}

	/**
	 * Enures that the given boundary is visible inside of the viewport by
	 * scolling the view port if necessary.
	 *
	 * @private
	 * @param {Boundary} boundary
	 */
	function ensureInViewport(boundary) {
		var box = Ranges.box(Ranges.fromBoundaries(boundary, boundary));
		var doc = Boundaries.document(boundary);
		var win = Dom.documentWindow(doc);
		var top = win.pageYOffset - doc.body.clientTop;
		var left = win.pageXOffset - doc.body.clientLeft;
		var height = win.innerHeight;
		var width = win.innerWidth;
		var buffer = box.height;
		var caretTop = box.top;
		var caretLeft = box.left;
		var correctTop = 0;
		var correctLeft = 0;
		if (caretTop < top) {
			// Because we want to caret to be near the top
			correctTop = caretTop - buffer;
		} else if (caretTop > top + height) {
			// Because we want to caret to be near the bottom
			correctTop = caretTop - height + buffer + buffer;
		}
		if (caretLeft < left) {
			// Because we want to caret to be near the left
			correctLeft = caretLeft - buffer;
		} else if (caretLeft > left + width) {
			// Because we want to caret to be near the right
			correctLeft = caretLeft - width + buffer + buffer;
		}
		if (correctTop || correctLeft) {
			win.scrollTo(correctLeft || left, correctTop || top);
		}
	}

	/**
	 * Computes a table of the given override and those collected at the given
	 * node.
	 *
	 * @private
	 * @param  {Array.<Override>} formatting
	 * @param  {Array.<Override>} overrides
	 * @param  {Node}             node
	 * @return {Object}           An object with overrides mapped against their names
	 */
	function mapOverrides(formatting, overrides, node) {
		var table = Maps.merge(
			Maps.mapTuples(formatting),
			Maps.mapTuples(Overrides.harvest(node)),
			Maps.mapTuples(overrides)
		);
		if (!table['color']) {
			table['color'] = Dom.getComputedStyle(
				Dom.isTextNode(node) ? node.parentNode : node,
				'color'
			);
		}
		return table;
	}

	/**
	 * Renders a caret element to show the user selection.
	 *
	 * @param  {AlohaEvent} event
	 * @return {AlohaEvent}
	 */
	function handle(event) {
		if (!event.editable || !handlers[event.type]) {
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
				context.blinking.stop();
			}

			return event;
		}

		if ('mousedown' === event.type) {
			old.blinking.stop();
		} else if ('mouseup' === event.type) {
			old.blinking.start();
		} else if ('keydown' === event.type) {
			old.blinking.restart();
		}

		// Because otherwise, if, in the process of a click, and the user's
		// cursor is over the caret, fromEvent() will compute the range to be
		// inside the absolutely positioned caret element
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
			old.dragging || Events.hasKeyModifier(event, 'shift')
		));

		event.editor.selectionContext = context;

		range = context.range;

		if (!Dom.isEditableNode(range.commonAncestorContainer)) {
			return event;
		}

		var preventDefault = ('keydown' === type && movements[event.which])
				|| (event.editor.CARET_CLASS === event.nativeEvent.target.className);

		if (preventDefault) {
			event.nativeEvent.preventDefault();
		}

		// Because browsers have a non-intuitive way of handling expanding of
		// selections when holding down the shift key. We therefore "trick" the
		// browser by setting the selection to a range which will cause the the
		// expansion to be done in the way that the user expects
		if (!preventDefault && 'mousedown' === type && Events.hasKeyModifier(event, 'shift')) {
			if ('start' === context.focus) {
				range = Ranges.collapseToEnd(range);
			} else {
				range = Ranges.collapseToStart(range);
			}
		}

		event.range = range;

		return event;
	}

	/**
	 * Whether the given event will cause the position of the selection to
	 * move.
	 *
	 * @private
	 * @param  {Event} event
	 * @return {boolean}
	 */
	function isCaretMovingEvent(event) {
		if ('keypress' === event.type) {
			return true;
		}
		if ('paste' === event.type) {
			return true;
		}
		if (Keys.ARROWS[event.which]) {
			return true;
		}
		if (Keys.CODES['undo'] == event.which) {
			if ('meta' === event.meta || 'ctrl' === event.meta || 'shift' === event.meta) {
				return true;
			}
		}
	}

	/**
	 * Causes the selection that is held in the given selection context to be
	 * set to the browser and the caret position to be visualized.
	 *
	 * @param {AlohaEvent} event
	 */
	function select(event) {
		var context = event.editor.selectionContext;
		if (!context.range || 'mousemove' === event.type) {
			return;
		}
		var boundaries = Boundaries.fromRange(context.range);
		var focus = boundaries[('start' === context.focus) ? 0 : 1];
		show(context.caret, focus);
		Maps.extend(context.caret.style, stylesFromOverrides(mapOverrides(
			context.formatting,
			context.overrides,
			Boundaries.container(focus)
		)));
		Boundaries.select(boundaries[0], boundaries[1]);
		if (isCaretMovingEvent(event)) {
			ensureInViewport(focus);
		}
	}

	return {
		show         : show,
		select       : select,
		handle       : handle,
		Context      : Context,
		hideCarets   : hideCarets,
		unhideCarets : unhideCarets,
		scrollTo     : scrollTo
	};
});
