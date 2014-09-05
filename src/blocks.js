/**
 * blocks.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'events',
	'dragdrop',
	'browsers',
	'editables'
], function (
	Dom,
	Events,
	DragDrop,
	Browsers,
	Editables
) {
	'use strict';

	/**
	 * List of style property/value pairs.
	 *
	 * @private
	 * @type {Object.<string, string>}
	 */
	var draggingStyles = [
		[
			Browsers.VENDOR_PREFIX + 'transition',
			Browsers.VENDOR_PREFIX + 'transform 0.2s ease-out'
		],
		[Browsers.VENDOR_PREFIX + 'transform', 'scale(0.9)'],
		['opacity', '0.5']
	];

	/**
	 * Creates a drag and drop context for copying.
	 *
	 * @private
	 * @param  {Element} block
	 * @return {Context}
	 */
	function copyContext(block) {
		return DragDrop.Context({
			'dropEffect' : 'copy',
			'element'    : block.cloneNode(true),
			'target'     : block,
			'data'       : ['text/html', block.outerHTML]
		});
	}

	/**
	 * Creates a drag and drop context for moving.
	 *
	 * @private
	 * @param  {Element} block
	 * @return {Context}
	 */
	function moveContext(block) {
		return DragDrop.Context({
			'dropEffect' : 'move',
			'element'    : block,
			'target'     : block,
			'data'       : ['text/html', block.outerHTML]
		});
	}

	/**
	 * Whether or not the given event is an event targeting an Aloha Block
	 * element.
	 *
	 * @param  {Event}   event
	 * @return {boolean}
	 */
	function isBlockEvent(event) {
		return 'IMG' === event.nativeEvent.target.nodeName
		    || Dom.hasClass(event.nativeEvent.target, event.editable.settings.BLOCK_CLASS);
	}

	function handleAloha(event) {
		var blocks = event.editable.elem.querySelectorAll('.aloha-block,img');
		[].forEach.call(blocks, function (block) {
			block.setAttribute('contentEditable', 'false');
			Dom.setStyle(block, 'cursor', Browsers.VENDOR_PREFIX + 'grab');
		});
	}

	function handleMouseDown(event) {
		var block = event.nativeEvent.target;
		if (isBlockEvent(event) && DragDrop.isDraggable(block)) {
			event.dnd = Events.hasKeyModifier(event, 'ctrl')
			          ? copyContext(block)
			          : moveContext(block);
		}
	}

	function handleDragStart(event) {
		if (isBlockEvent(event)) {
			draggingStyles.forEach(function (style) {
				Dom.setStyle(event.dnd.target, style[0], style[1]);
				Dom.setStyle(event.dnd.element, style[0], style[1]);
			});
		}
	}

	function handleDragEnd(event) {
		if (isBlockEvent(event)) {
			draggingStyles.forEach(function (style) {
				Dom.setStyle(event.dnd.target, style[0], '');
				Dom.setStyle(event.dnd.element, style[0], '');
			});
		}
	}

	function handleDragOver(event) {}

	var handlers = {
		'aloha'     : handleAloha,
		'mousedown' : handleMouseDown,
		'dragstart' : handleDragStart,
		'dragend'   : handleDragEnd,
		'dragover'  : handleDragOver
	};

	/**
	 * Updates editable
	 *
	 * @param  {AlohaEvent} event
	 * @return {Event}
	 */
	function handleBlocks(event) {
		if (handlers[event.type]) {
			handlers[event.type](event);
		}
		return event;
	}

	return {
		handleBlocks : handleBlocks
	};
});
