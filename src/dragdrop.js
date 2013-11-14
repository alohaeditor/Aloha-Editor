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
	'editing'
], function DragDrop(
	Fn,
	Dom,
	Maps,
	Ranges,
	Editing
) {
	'use strict';

	/**
	 * Default drag and drop context properites.
	 *
	 * These are the default attributes from which drag and drop contexts will
	 * be created.
	 *
	 * @type {Object.<string, *>}
	 */
	var DEFAULTS = {
		'dropEffect' : 'none',
		'element'    : null,
		'target '    : null,
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
	 *		the user is given during a drag-and-drop operation.  If the
	 *		`dropEffect` value is set to "copy", for example, the user agent
	 *		may rendered the drag icon with a "+" (plus) sign.
	 *		The supported values are "none", "copy", "link", or "move".  All
	 *		other values will be ignored.
	 *
	 *	`element`
	 *		The element on which dragging was initiated on.  If the drag and
	 *		drop operation is a moving operation, this element will be
	 *		relocated into the range boundary at the point at which the drop
	 *		event is fired.
	 *		If the drag and drop operation is a copying operation, then this
	 *		attribute should a reference to a deep clone of the element on
	 *		which dragging was initiated.
	 *
	 *	`data`
	 *		A tuple describing the data that will be set to the drag data
	 *		store.  See:
	 *		http://www.whatwg.org/specs/web-apps/current-work/multipage/dnd.html#drag-data-store
	 *
	 * @param  {Object} options
	 * @return {Object}
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
	 *         True if the given node is draggable.
	 */
	function isDraggable(node) {
		if (Dom.Nodes.ELEMENT !== node.nodeType) {
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

		return 'A' === node.nodeName && node.getAttribute('href');
	}

	/**
	 * Drops `element` into the range at the current position as determined
	 * from the given event.
	 *
	 * @param  {Event}   event
	 * @param  {Element} element
	 * @return {Range}
	 */
	function drop(event, element) {
		var range = Ranges.createFromPoint(
			event.clientX - 10,
			event.clientY - 10
		);
		if (range && Dom.isEditable(range.commonAncestorContainer)) {
			var prev = element.previousSibling;
			Editing.insert(range, element);
			if (prev && prev.nextSibling) {
				Dom.merge(prev, prev.nextSibling);
			}
		}
		Ranges.collapseToEnd(range);
		return range;
	}

	/**
	 * Processes drag and drop events operations.
	 *
	 * @param  {Event}
	 * @return {Event}
	 */
	function handle(event) {
		var context = event.editor.dndContext;

		if (!context) {
			return event;
		}

		switch (event.type) {
		case 'dragstart':

			// Because this is required for FF for dragging to start on
			// elements other than IMG elements or anchor elements with href
			// values.
			event.native.dataTransfer.setData(context.data[0], context.data[1]);
			break;
		case 'dragover':

			// Because this is necessary to enable dropping to work
			event.native.preventDefault();

			event.range = Ranges.createFromPoint(
				event.native.clientX - 10,
				event.native.clientY - 10
			);
			break;
		case 'drop':

			event.range = drop(event.native, event.editor.dndContext.element);

			// Because some browsers will redirect otherwise
			event.native.preventDefault();
			if (event.native.stopPropagation) {
				event.native.stopPropagation();
			}
			break;
		}
	}

	var exports = {
		handle: handle,
		Context: Context,
		isDraggable: isDraggable
	};

	exports['handle'] = exports.handle;
	exports['Context'] = exports.Context;
	exports['isDraggable'] = exports.isDraggable;

	return exports;
});
