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
	'boundaries'
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
	Boundaries
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

	function show(caret, rect, style) {
		var color;
		var width;
		var rotation;
		if (style) {
			color = style['color'] || '';
			width = rect.width * (style['bold'] ? 2 : 1);
			rotation = style['italic'] ? 'rotate(8deg)' : '';
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
		caret.style.background = style ? style['color'] : '';
		caret.style[Browsers.VENDOR_PREFIX + 'transform'] = rotation;
	}

	function renderBoundary(caret, boundary, style) {
		var box = Ranges.box(Ranges.create(boundary[0], boundary[1]));
		var doc = caret.ownerDocument;
		box.top += window.pageYOffset - doc.body.clientTop;
		box.left += window.pageXOffset - doc.body.clientLeft;
		box.width = 2;
		show(caret, box, style);
	}

	function renderRange(range, caret, startStyle, endStyle) {
		var carets = document.querySelectorAll('.aloha-caret');

		if (!carets[0]) {
			carets = [create()];
		}

		if (!carets[1]) {
			carets = [carets[0], create()];
		}

		carets[0].style.background = 'red';

		renderBoundary(carets[0], Boundaries.start(range), startStyle);
		renderBoundary(carets[1], Boundaries.end(range), endStyle);

		var steady  = carets['start' === caret ? 1 : 0];
		var blinker = carets['start' === caret ? 0 : 1];

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
		var move = 'up' === direction ? up : down;

		var next = move(box, offset);
		while (next && Ranges.equal(next, clone)) {
			offset += half;
			next = move(box, offset);
		}

		if (next) {
			set(clone, Boundaries.start(next));
		}

		return {
			range: clone,
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
		var range = Ranges.get();
		if (range && arrows[event.which]) {
			return arrows[event.which](event, range, caret);
		}
	}

	function mouseup(event, range, caret, dragging) {
		var expanding = dragging || isShiftDown(event);
		var current = Ranges.createFromPoint(
			event.native.clientX,
			event.native.clientY
		);
		var sc = range.startContainer;
		var so = range.startOffset;
		var ec = current.endContainer;
		var eo = current.endOffset;
		var current;
		var caret;

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

	var handlers = {
		'keyup'     : Fn.noop,
		'keydown'   : keydown,
		'mouseup'   : mouseup,
		'click'     : Fn.noop
	};

	// Selection states
	var selection = {
		range       : null,
		caret       : 'end',
		isMouseDown : false,
		isDragging  : false
	};

	var stateHandlers = {
		'mousedown' : function (event) {
			purge();
			selection.isMouseDown = true;
			if (!selection.range || !isShiftDown(event)) {
				selection.range = Ranges.createFromPoint(
					event.native.clientX,
					event.native.clientY
				);
			}
		},
		'mouseup' : function (event) {
			selection.isDragging = selection.isMouseDown = false;
		},
		'mousemove' : function (event) {
			selection.isDragging = selection.isMouseDown;
		}
	};

	function handle(event) {
		var data;

		if (handlers[event.type]) {
			data = handlers[event.type](
				event,
				selection.range,
				selection.caret,
				selection.isDragging
			);
		}

		if (stateHandlers[event.type]) {
			stateHandlers[event.type](event);
		}

		if (!data) {
			return event;
		}

		var range = selection.range = data.range;
		var caret = selection.caret = data.caret;

		event.range = range;

		if ('keydown' === event.type) {
			if (event.which === Keys.CODES.up || event.which === Keys.CODES.down) {
				event.native.preventDefault();
			}
			// chrome hack to stop unwanted screen movements?
			var isNative = 'true' === event.editable.elem.getAttribute('contentEditable');
			if (!isNative && !range.collapsed) {
				event.native.preventDefault();
			}
		}

		if ('mousedown' !== event.type) {
			var startStyle = Overrides.map(Overrides.harvest(range.startContainer));
			var endStyle   = Overrides.map(Overrides.harvest(range.endContainer));
			if (event.editables) {
				var overrides  = Overrides.map(event.editable.overrides);
				if ('start' === caret) {
					startStyle = Maps.merge(startStyle, overrides);
				} else {
					endStyle = Maps.merge(endStyle, overrides);
				}
			}
			renderRange(range, caret, startStyle, endStyle);
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
