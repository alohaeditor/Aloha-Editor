/* dragdrop.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * @reference
 * http://www.whatwg.org/specs/web-apps/current-work/#dnd
 * http://www.html5rocks.com/en/tutorials/dnd/basics/
 * https://developer.mozilla.org/en-US/docs/Drag_and_drop_events
 * https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer
 */
define([
	'functions',
	'dom',
	'maps',
	'ranges',
	'editing',
	'boundaries',
	'selections'
], function DragDrop(
	Fn,
	Dom,
	Maps,
	Ranges,
	Editing,
	Boundaries,
	Selections
) {
	'use strict';

	/**
	 * Default drag and drop options.
	 *
	 * @type {Object.<string, *>}
	 */
	var defaults = {
		'effectAllowed' : 'none',
		'element'       : null,
		'data'          : ['text/plain', ''],
		'start'         : Fn.noop,
		'drop'          : Fn.noop,
		'end'           : Fn.noop
	};

	/**
	 * Creates a new context.
	 *
	 * @param  {Object}
	 * @return {Object}
	 */
	function Context(props) {
		return Maps.merge({}, defaults, props);
	}

	/**
	 * Whether or not the given node is draggable.
	 *
	 * @param  {Element} node
	 * @return {boolean}
	 */
	function isDraggable(node) {
		return (Dom.Nodes.ELEMENT === node.nodeType)
		    && ('true' === node.getAttribute('draggable')
		        || 'IMG' === node.nodeName || 'A' === node.nodeName);
	}

	function mousedown(event) {
		event.editor.dndContext = null;
	}

	function start(event) {
		var context = event.editor.dndContext;

		// Because only dropEffect="copy" will be droppable
		event.native.dataTransfer.effectAllowed = context.effectAllowed;

		// Because this is required for FF
		event.native.dataTransfer.setData(context.data[0], context.data[1]);

		context.start(event);
	}

	function over(event) {
		event.range = Ranges.createFromPoint(
			event.native.clientX - 10,
			event.native.clientY - 10
		);

		// Because this is necessary to enable dropping
		event.native.preventDefault();
	}

	function drop(event) {
		event.range = Ranges.createFromPoint(
			event.native.clientX - 10,
			event.native.clientY - 10
		);

		event.editor.dndContext.drop(event);

		// Because some browsers will redirect otherwise
		event.native.preventDefault();
		if (event.native.stopPropagation) {
			event.native.stopPropagation();
		}
	}

	function end(event) {
		event.editor.dndContext.end(event);
	}

	function copy(event) {
		var range = Ranges.fromEvent(event);
		if (range && Dom.isEditable(range.commonAncestorContainer)) {
			Editing.insert(range, event.editor.dndContext.ghost);
		}
		return range;
	}

	/**
	 * Moves the dragged element into the current range.
	 *
	 * @param  {Event} event
	 * @return {Range}
	 */
	function move(event) {
		var range = Ranges.fromEvent(event);
		if (range && Dom.isEditable(range.commonAncestorContainer)) {
			var elem = event.editor.dndContext.element;
			var prev = elem.previousSibling;
			Editing.insert(range, elem);
			if (prev && prev.nextSibling) {
				Dom.merge(prev, prev.nextSibling);
			}
		}
		return range;
	}

	var handlers = {
		'mousedown' : mousedown,
		'dragstart' : start,
		'dragover'  : over,
		'drop'      : drop,
		'dragend'   : end
	};

	function handle(event) {
		if (event.editor.dndContext && handlers[event.type]) {
			handlers[event.type](event);
		}
		return event;
	}

	var exports = {
		copy        : copy,
		move        : move,
		handle      : handle,
		Context     : Context,
		isDraggable : isDraggable
	};

	exports['copy'] = exports.copy;
	exports['move'] = exports.move;
	exports['handle'] = exports.handle;
	exports['Context'] = exports.Context;
	exports['isDraggable'] = exports.isDraggable;

	return exports;
});
