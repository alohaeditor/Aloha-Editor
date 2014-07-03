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
	 * @param {Element} block
	 * @param {Object}  data
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
		return 'IMG' === event.nativeEvent.target.nodeName
		    || Dom.hasClass(event.nativeEvent.target, event.editor.BLOCK_CLASS);
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
			var blocks = event.editable['elem'].querySelectorAll('.aloha-block,img');
			[].forEach.call(blocks, function (block) {
				block.setAttribute('contentEditable', 'false');
				Dom.setStyle(block, 'cursor', Browsers.VENDOR_PREFIX + 'grab');
			});
			break;
		case 'mousedown':
			var block = event.nativeEvent.target;
			if (isBlockEvent(event) && DragDrop.isDraggable(block)) {
				event.editor.dndContext = Events.hasKeyModifier(event, 'ctrl')
				                        ? copyContext(block)
				                        : moveContext(block);
			}
			break;
		case 'dragstart':
			if (isBlockEvent(event)) {
				context = event.editor.dndContext;
				draggingStyles.forEach(function (style) {
					Dom.setStyle(context.target, style[0], style[1]);
					Dom.setStyle(context.element, style[0], style[1]);
				});
			}
			break;
		case 'dragend':
			if (isBlockEvent(event)) {
				context = event.editor.dndContext;
				draggingStyles.forEach(function (style) {
					Dom.setStyle(context.target, style[0], '');
					Dom.setStyle(context.element, style[0], '');
				});
			}
			break;
		case 'dragover':
			var host = Dom.editingHost(event.editor.dndContext.element.parentNode);
			event.editable = host && Editables.fromElem(event.editor, host);
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
