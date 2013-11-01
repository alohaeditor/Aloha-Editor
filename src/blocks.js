/* blocks.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'arrays',
	'ranges',
	'dragdrop'
], function Blocks(
	Dom,
	Arrays,
	Ranges,
	DragDrop
) {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('blocks');
	}

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
			//Dom.insert(document.createTextNode('\u200B'), block, true);
			block.setAttribute('contentEditable', 'false');
		});
	}

	function mousedown(event) {
		var isBlockTarget = Dom.hasClass(event.target, event.editor.BLOCK_CLASS);
		if (!isBlockTarget) {
			return;
		}
		var block = event.target;
		var index = Dom.nodeIndex(block);
		event.range = Ranges.create(
			block.parentNode,
			index,
			block.parentNode,
			index + 1
		);
		console.log(read(block));
	}

	// https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer
	function drop(event) {
		var native = event.native;
		var range = DragDrop.range(native);
		var data = DragDrop.data(native, 'html');
		console.warn(aloha.boundarymarkers.hint(range));
		console.log(data);
		native.preventDefault();
	}

	function mousemove(event) {
	}

	var handlers = {
		'aloha'     : initialize,
		'mousedown' : mousedown,
		'mousemove' : mousemove,
		'drop'      : drop
//      'dragend'   : drop
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
