/**
 * dragdrop.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * @see
 * http://www.whatwg.org/specs/web-apps/current-work/#dnd
 * http://www.html5rocks.com/en/tutorials/dnd/basics/
 * https://developer.mozilla.org/en-US/docs/Drag_and_drop_events
 * https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer
 * @namespace dragdrop
 */
define([
	'dom',
	'maps',
	'events',
	'editing',
	'boundaries',
	'selections'
], function (
	Dom,
	Maps,
	Events,
	Editing,
	Boundaries,
	Selections
) {
	'use strict';

	/**
	 * The pixel distance between the mouse pointer and where the caret should
	 * be rendered when dragging.
	 *
	 * @const
	 * @type {number}
	 */
	var DRAGGING_CARET_OFFSET = -10;

	/**
	 * Default drag and drop context properites.
	 *
	 * These are the default attributes from which drag and drop contexts will
	 * be created.
	 *
	 * @const
	 * @type {Object.<string, *>}
	 */
	var DEFAULTS = {
		'dropEffect' : 'none',
		'element'    : null,
		'target'     : null,
		'data'       : ['text/plain', '']
	};

	/**
	 * Creates a new drag and drop context.
	 *
	 * The following attributes are supported in the options object that is
	 * passed to this function:
	 *
	 *	`dropEffect`
	 *		The dropEffect attribute controls the drag-and-drop feedback that
	 *		the user is given during a drag-and-drop operation. If the
	 *		`dropEffect` value is set to "copy", for example, the user agent may
	 *		rendered the drag icon with a "+" (plus) sign. The supported values
	 *		are "none", "copy", "link", or "move". All other values are ignored.
	 *
	 *	`element`
	 *		The element on which dragging was initiated on. If the drag and drop
	 *		operation is a moving operation, this element will be relocated into
	 *		the boundary at the point at which the drop event is fired. If the
	 *		drag and drop operation is a copying operation, then this attribute
	 *		should a reference to a deep clone of the element on which dragging
	 *		was initiated.
	 *
	 *	`data`
	 *		A tuple describing the data that will be set to the drag data store.
	 *		See:
	 *		http://www.whatwg.org/specs/web-apps/current-work/multipage/dnd.html#drag-data-store
	 *
	 * @param  {Object} options
	 * @return {Object}
	 * @memberOf dragdrop
	 */
	function Context(options) {
		return Maps.merge({}, DEFAULTS, options);
	}

	/**
	 * Whether or not the given node is draggable.
	 *
	 * In an attempt to follow the implementation on most browsers, text
	 * selections, IMG elements, and anchor elements with an href attribute are
	 * draggable by default.
	 *
	 * @param  {Element} node
	 * @return {boolean}
	 * @memberOf dragdrop
	 */
	function isDraggable(node) {
		if (!Dom.isElementNode(node)) {
			return false;
		}
		var attr = node.getAttribute('draggable');
		if ('false' === attr) {
			return false;
		}
		if ('true' === attr) {
			return true;
		}
		if ('IMG' === node.nodeName) {
			return true;
		}
		return ('A' === node.nodeName) && node.getAttribute('href');
	}

	/**
	 * Moves the given node into the given boundary positions.
	 *
	 * @private
	 * @param  {Boundary} start
	 * @param  {Boundary} end
	 * @param  {Node}     node
	 * @return {Array.<Boundary>}
	 */
	function moveNode(start, end, node) {
		var prev = node.previousSibling;
		var boundary = Editing.insert(start, end, node);
		if (prev && prev.nextSibling) {
			Dom.merge(prev, prev.nextSibling);
		}
		return [boundary, boundary];
	}

	function handleDragStart(event) {
		// Because this is required in Firefox for dragging to start on elements
		// other than IMG elements or anchor elements with href values
		event.nativeEvent.dataTransfer.setData(
			event.dnd.data[0],
			event.dnd.data[1]
		);
		event.dnd.element = event.nativeEvent.target;
		event.dnd.target = event.nativeEvent.target;
	}

	function calculateBoundaries(x, y, doc) {
		var carets = Selections.hideCarets(doc);
		var boundary = Boundaries.fromPosition(
			Dom.scrollLeft(doc) + x,
			Dom.scrollTop(doc) + y,
			doc
		);
		Selections.unhideCarets(carets);
		return [boundary, boundary];
	}

	function handleDragOver(event) {
		var nativeEvent = event.nativeEvent;
		event.selection.boundaries = calculateBoundaries(
			nativeEvent.clientX + DRAGGING_CARET_OFFSET,
			nativeEvent.clientY + DRAGGING_CARET_OFFSET,
			nativeEvent.target.ownerDocument
		);
		// Because this is necessary for dropping to work
		Events.preventDefault(nativeEvent);
	}

	function handleDrop(event) {
		var nativeEvent = event.nativeEvent;
		event.selection.boundaries = calculateBoundaries(
			// +8 because, for some reason the boundaries are always calculated
			// a character behind of where it should be...
			nativeEvent.clientX + DRAGGING_CARET_OFFSET + 8,
			nativeEvent.clientY + DRAGGING_CARET_OFFSET,
			nativeEvent.target.ownerDocument
		);
		if (event.selection.boundaries) {
			event.selection.boundaries = moveNode(
				event.selection.boundaries[0],
				event.selection.boundaries[1],
				event.dnd.element
			);
		}
		Events.stopPropagation(nativeEvent);
		// Because some browsers will otherwise redirect
		Events.preventDefault(nativeEvent);
	}

	var handlers = {
		'dragstart' : handleDragStart,
		'dragover'  : handleDragOver,
		'drop'      : handleDrop
	};

	/**
	 * Processes drag and drop events.
	 *
	 * Updates dnd and nativeEvent
	 *
	 * @param  {AlohaEvent} event
	 * @return {AlohaEvent}
	 * @memberOf dragdrop
	 */
	function handleDragDrop(event) {
		if (event.dnd && handlers[event.type]) {
			handlers[event.type](event);
		}
		return event;
	}

	return {
		handleDragDrop : handleDragDrop,
		Context        : Context,
		isDraggable    : isDraggable
	};
});
