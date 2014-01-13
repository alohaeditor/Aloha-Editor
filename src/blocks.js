/**
 * blocks.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom/classes',
	'events',
	'dragdrop'
], function Blocks(
	Classes,
	Events,
	DragDrop
) {
	'use strict';

	/**
	 * Reads the given block's data.
	 *
	 * @param  {Element} block
	 * @return {Object}
	 */
	function read(block) {
		return JSON.parse(block.getAttribute('data-aloha'));
	}

	/**
	 * Writes the given block's data.
	 *
	 * @param  {Element} block
	 * @param  {Object}  data
	 * @return {Object}
	 */
	function write(block, data) {
		block.setAttribute('data-aloha', JSON.stringify(data));
	}

	/**
	 * Creates a drag and drop context for copying.
	 *
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
		return Classes.has(event.nativeEvent.target, event.editor.BLOCK_CLASS);
	}

	/**
	 * Process events on Aloha Blocks.
	 *
	 * @param  {Event} event
	 * @return {Event}
	 */
	function handle(event) {
		var context;
		switch (event.type) {
		case 'aloha':
			var blocks = event.editable.elem.querySelectorAll('.aloha-block');
			[].forEach.call(blocks, function (block) {
				block.setAttribute('contentEditable', 'false');
			});
			break;
		case 'mousedown':
			var block = event.nativeEvent.target;
			if (isBlockEvent(event) && DragDrop.isDraggable(block)) {
				event.editor.dndContext = Events.isWithCtrl(event)
				                        ? copyContext(block)
				                        : moveContext(block);
			}
			break;
		case 'dragstart':
			if (isBlockEvent(event)) {
				context = event.editor.dndContext;
				Classes.add(context.element, 'aloha-block-dragging');
				Classes.add(context.target, 'aloha-block-dragging');
			}
			break;
		case 'dragend':
			if (isBlockEvent(event)) {
				context = event.editor.dndContext;
				Classes.remove(context.element, 'aloha-block-dragging');
				Classes.remove(context.target, 'aloha-block-dragging');
			}
			break;
		}
		return event;
	}

	return {
		read   : read,
		write  : write,
		handle : handle
	};
});
