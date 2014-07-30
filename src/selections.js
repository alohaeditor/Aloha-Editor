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
	'dom',
	'keys',
	'maps',
	'html',
	'mouse',
	'events',
	'ranges',
	'browsers',
	'overrides',
	'animation',
	'boundaries',
	'traversing',
	'functions'
], function (
	Dom,
	Keys,
	Maps,
	Html,
	Mouse,
	Events,
	Ranges,
	Browsers,
	Overrides,
	Animation,
	Boundaries,
	Traversing,
	Fn
) {
	'use strict';

	/**
	 * Hides all visible caret elements and returns all those that were hidden
	 * in this operation.
	 *
	 * @param  {Document} doc * @return {Array.<Element>}
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
	 * Jumps the front or end position of the given editable.
	 *
	 * @private
	 * @param  {string} direction "up" or "down"
	 * @param  {Event}  event
	 * @param  {Range}  range
	 * @param  {string} focus
	 * @return {Object}
	 */
	function jump(direction, event, range, focus) {
		var boundary;
		if ('up' === direction) {
			boundary = Boundaries.create(event.editable.elem, 0);
			boundary = Html.expandForward(boundary);
		} else {
			boundary = Boundaries.fromEndOfNode(event.editable.elem);
			boundary = Html.expandBackward(boundary);
		}
		var next = Ranges.fromBoundaries(boundary, boundary);
		if (!Events.hasKeyModifier(event, 'shift')) {
			return {
				range: next,
				focus: focus
			};
		}
		return mergeRanges(next, range, focus);
	}

	/**
	 * Determines the closest visual caret position above or below the given
	 * range.
	 *
	 * @private
	 * @param  {string} direction "up" or "down"
	 * @param  {Event}  event
	 * @param  {Range}  range
	 * @param  {string} focus
	 * @return {Object}
	 */
	function climb(direction, event, range, focus) {
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
	 * @param  {string} direction "left" or "right"
	 * @param  {Event}  event
	 * @param  {Range}  range
	 * @param  {string} focus
	 * @return {Object}
	 */
	function step(direction, event, range, focus) {
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
	movements[Keys.CODES['up']] = Fn.partial(climb, 'up');
	movements[Keys.CODES['down']] = Fn.partial(climb, 'down');
	movements[Keys.CODES['left']] = Fn.partial(step, 'left');
	movements[Keys.CODES['right']] = Fn.partial(step, 'right');
	movements[Keys.CODES['pageUp']] =
	movements['meta+' + Keys.CODES['up']] = Fn.partial(jump, 'up');
	movements[Keys.CODES['pageDown']] =
	movements['meta+' + Keys.CODES['down']] = Fn.partial(jump, 'down');

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
		var meta = event.meta.indexOf('meta') > -1;
		if (meta && movements['meta+' + event.keycode]) {
			return movements['meta+' + event.keycode](event, range, focus);
		}
		return (movements[event.keycode] || keypress)(event, range, focus);
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
	 * mouse events because we will sometimes end up missing a dblclick event
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
		case 'drop':
			context.dragging = false;
			break;
		}
		return context;
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

	function toggleBlinking(blinking, type) {
		if ('mousedown' === type) {
			blinking.stop();
		} else if ('mouseup' === type) {
			blinking.start();
		} else if ('keydown' === type) {
			blinking.restart();
		}
	}

	function positionAtEvent(event) {
		if (!event.target.ownerDocument) {
			return null;
		}
		var range;
		// Because drag positions are calculated with an offset
		if (Mouse.EVENTS[event.type] && 'dragover' !== event.type) {
			range = Ranges.fromPosition(
				event.nativeEvent.clientX,
				event.nativeEvent.clientY,
				event.target.ownerDocument
			);
		}
		if (!range) {
			range = event.range || Ranges.get(event.target.ownerDocument);
		}
		return range;
	}

	/**
	 * Requires:
	 * 		type
	 * 		editor
	 * Provides:
	 * 		range
	 *
	 * @param  {AlohaEvent} event
	 * @return {AlohaEvent}
	 */
	function handle(event) {
		if (!handlers[event.type]) {
			return event;
		}

		var old = event.editor.selectionContext;

		// Because otherwise, if, if we are in the process of a click, and the
		// user's cursor is over the caret element, Ranges.fromPosition() will
		// compute the range to be inside the absolutely positioned caret
		// element
		if ('mousedown' === event.type) {
			Dom.setStyle(old.caret, 'display', 'none');

		// Because we will never update the caret position on mousemove, we
		// avoid unncessary computation
		} else if ('mousemove' === event.type) {
			event.editor.selectionContext = newContext(event, old);

			// Because we want to move the caret out of the way when the user
			// starts creating an expanded selection by dragging
			if (!old.dragging && event.editor.selectionContext.dragging) {
				Dom.setStyle(old.caret, 'display', 'none');
				old.blinking.stop();
			}

			return event;
		}

		var position = positionAtEvent(event);

		if (!position) {
			old.blinking.stop();
			return event;
		}

		toggleBlinking(old.blinking, event.type);

		if (!event.editable) {
			event.editor.selectionContext = newContext(event, old, {
				range: position
			});
			return event;
		}

		var type = normalizeEventType(
			event,
			position,
			old.range,
			old.focus,
			old.time,
			old.doubleclicking,
			old.tripleclicking
		);

		var context = newContext(event, old, process(
			event,
			type,
			position,
			old.focus,
			old.range,
			old.dragging || Events.hasKeyModifier(event, 'shift')
		));

		event.editor.selectionContext = context;

		if (!Dom.isEditableNode(context.range.commonAncestorContainer)) {
			return event;
		}

		var preventDefault = ('keydown' === type && movements[event.keycode])
				|| (event.editor.CARET_CLASS === event.nativeEvent.target.className);

		if (preventDefault) {
			Events.preventDefault(event.nativeEvent);
		}

		// Because browsers have a non-intuitive way of handling expanding of
		// selections when holding down the shift key. We therefore "trick" the
		// browser by setting the selection to a range which will cause the the
		// expansion to be done in the way that the user expects
		if (!preventDefault && 'mousedown' === type && Events.hasKeyModifier(event, 'shift')) {
			event.range = ('start' === context.focus)
			            ? Ranges.collapseToEnd(context.range)
			            : Ranges.collapseToStart(context.range);
		} else {
			event.range = context.range;
		}

		return event;
	}

	/**
	 * Whether the given event will cause the position of the selection to move.
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
		if (Keys.ARROWS[event.keycode]) {
			return true;
		}
		if (Keys.CODES['pageDown'] === event.keycode || Keys.CODES['pageUp'] === event.keycode) {
			return true;
		}
		if (Keys.CODES['undo'] === event.keycode) {
			if ('meta' === event.meta || 'ctrl' === event.meta || 'shift' === event.meta) {
				return true;
			}
		}
		return false;
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
		if (!Dom.isEditableNode(Boundaries.container(focus))) {
			Dom.setStyle(context.caret, 'display', 'none');
			return;
		}
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
		unhideCarets : unhideCarets
	};
});
