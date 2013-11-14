/* blocks.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * @reference
 * http://www.html5rocks.com/en/tutorials/dnd/basics/
 */
define([
	'dom',
	'arrays',
	'events',
	'dragdrop'
], function Blocks(
	Dom,
	Arrays,
	Events,
	DragDrop
) {
	'use strict';

	/**
	 * Find aloha blocks in the given element.
	 *
	 * @reference
	 * http://ejohn.org/blog/thoughts-on-queryselectorall
	 * https://developer.mozilla.org/en-US/docs/Web/API/Document.querySelector
	 */
	function findBlocks(editable, editor) {
		return Arrays.coerce(
			editable.elem.querySelectorAll('.' + editor.BLOCK_CLASS)
		);
	}

	function read(block) {
		return JSON.parse(block.getAttribute('data-aloha'));
	}

	function write(block, data) {
		block.setAttribute('data-aloha', JSON.stringify(data));
	}

	function initialize(event) {
		findBlocks(event.editable, event.editor).forEach(function (block) {
			block.setAttribute('contentEditable', 'false');
			Dom.disableSelection(block);
		});
	}

	function isBlockEvent(event) {
		return Dom.hasClass(event.native.target, event.editor.BLOCK_CLASS);
	}

	function startdrag(event) {
		Dom.addClass(event.editor.dndContext.element, 'aloha-block-dragging');
		Dom.addClass(event.editor.dndContext.ghost, 'aloha-block-dragging');
	}

	function enddrag(event) {
		Dom.removeClass(event.editor.dndContext.element, 'aloha-block-dragging');
		Dom.removeClass(event.editor.dndContext.ghost, 'aloha-block-dragging');
	}

	function move(event) {
		event.range = DragDrop.move(event);
	}

	function copy(event) {
		event.range = DragDrop.copy(event);
	}

	function mousedown(event) {
		var target = event.native.target;
		if (isBlockEvent(event) && DragDrop.isDraggable(target)) {
			var drop, effect, ghost;
			if (Events.isWithCtrl(event)) {
				drop = copy;
				effect = 'copy';
				ghost = target.cloneNode(true);
			} else {
				drop = move;
				effect = 'move';
				ghost = target;
			}
			event.editor.dndContext = DragDrop.Context({
				'effectAllowed' : effect,
				'element'       : target,
				'ghost'         : ghost,
				'data'          : ['text/html', target.outerHTML],
				'start'         : startdrag,
				'drop'          : drop,
				'end'           : enddrag
			});
		}
	}

	var handlers = {
		'aloha'     : initialize,
		'mousedown' : mousedown
	};

	function handle(event) {
		if (handlers[event.type]) {
			handlers[event.type](event);
		}
	}

	var exports = {
		read   : read,
		write  : write,
		handle : handle
	};

	exports['read'] = exports.read;
	exports['write'] = exports.write;
	exports['handle'] = exports.handle;

	return exports;
});
