/* blocks.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'arrays'
], function Blocks(
	Dom,
	Arrays
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
		var blocks = findBlocks(event.editable, event.editor);
		console.warn(blocks.length + ' blocks found in ' + event.editable.elem);
	}

	function mousedown(event) {
		var isBlockTarget = Dom.hasClass(event.target, event.editor.BLOCK_CLASS);
		if (isBlockTarget) {
			console.log(read(event.target));
		}
	}

	var handlers = {};
	handlers['aloha'] = initialize;
	handlers['mousedown'] = mousedown;

	function handler(event) {
		var modifier = event.meta ? event.meta + '+' : '';
		return (handlers[event.name]
		    && handlers[event.name][modifier + event.code])
		    || handlers[event.name];
	}

	function handle(event) {
		var handle = handler(event);
		if (handle) {
			handle(event);
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
