/* block.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 *
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
 */
define([
	'jquery',
	'block/block',
	'block/blockmanager',
	'aloha/ephemera',
	'jqueryui'
], function (
	$,
	Block,
	BlockManager,
	Ephemera
) {
	'use strict';

	/**
	 * Aloha Video Block
	 * Currently supports YouTube videos, can be easily extended to
	 * other video sites with the help of content-handler.js
	 */
	var VideoBlock = Block.AbstractBlock.extend({
		/**
		 * Title for reference
		 */
		title: 'Video Block',

		/**
		 * Block initalization
		 * Replaces the iframe with a preview image. In order to prevent unwanted
		 * resize handles in IE, the styling and resizing is done not on the root
		 * container DIV, but rather on the preview image itself.
		 * The styles on the root container must be removed for the same reason.
		 * @param {jQuery} $element where elements will be inserted to
		 * @param {function} postProcessFn Aloha Block callback function
		 */
		init: function ($element, postProcessFn) {
			var videoBlockPlugin = Aloha.require('videoblock/videoblock-plugin'), $img;

			var width = videoBlockPlugin.width;
			var height = videoBlockPlugin.height;
			if ($element.attr('style')) {
				width = $element.css('width');
				height = $element.css('height');
			}

			// remove everything in the container (especially, the iframe)
			$element.empty();

			// Insert YouTube preview image
			$element.removeAttr('style')
				.append('<img src="'+videoBlockPlugin.previewUrl.replace("{id}", $element.data('video-id'))+'"/>');
			$img = $element.find('img');
			// set the size to the image
			$img.css({'width': width, 'height': height});

			// Use jQuery UI to make the image resizable
			$img.resizable({
				aspectRatio: true,
				resize: function (event, ui) {
					ui.element.css({
						'position': 'relative',
						'top': 0,
						'left': 0
					});
				}
			});

			$element.find('.ui-wrapper').each(function () {
				Ephemera.markWrapper(this);
			});
			$element.find('.ui-resizable-handle').each(function () {
				Ephemera.markElement(this);
			});

			postProcessFn();
		},

		/**
		 * Aloha Block update function must be implemented.
		 * Receives passed callback function.
		 * @param funciton postProcessFn Aloha Block callback function
		 */
		update: function ($element, postProcessFn) {
			postProcessFn();
		}

	});

	// Make block type automatically available to videoblock-plugin
	BlockManager.registerBlockType('VideoBlock', VideoBlock);

	return VideoBlock;
});