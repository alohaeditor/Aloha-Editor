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
	'jqueryui'
], function (
	$,
	Block,
	BlockManager
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
		 * Default settings
		 */
		settings: {
			'width': '640px',
			'height': '360px',
			'embedUrl': 'https://youtube.com/embed/'
		},

		/**
		 * Block initalization
		 * Creates YouTube iframe and overlay div (so clicking on video interacts
		 * with Block and not with iframe content)
		 * @param DOM $element where elements will be inserted to
		 * @param funciton postProcessFn Aloha Block callback function
		 */
		init: function ($element, postProcessFn) {

			// Default settings can be overwritten via Aloha.settings.plugins.videoblock
			if (Aloha.settings.plugins && Aloha.settings.plugins.videoblock) {
				this.settings = Aloha.settings.plugins.videoblock;
			}

			// Insert YouTube iframe into wrapping div
			$element.css({'width': this.settings.width, 'height': this.settings.height})
				.append('<iframe width="100%" height="100%" src="' + this.settings.embedUrl
					+ $element.data('video-id')
					+ '" frameborder="0" allowfullscreen></iframe>');

			// Insert semi-transparent overlay div so clicks don't get
			// passed through to video in iframe.
			$element.append('<div class="video-helper-overlay"></div>');
			$('.video-helper-overlay', $element).css({
				'width': '100%',
				'height': '100%',
				'position': 'absolute',
				'top': 0,
				'left': 0,
				'display': 'block',
				'background': '#b0b0b0',
			    '-ms-filter': 'progid:DXImageTransform.Microsoft.Alpha(Opacity=50)',
			    'filter': 'alpha(opacity=50)',
			    '-moz-opacity': '0.5',
			    '-khtml-opacity': '0.5',
			    'opacity': '0.5'
			});

			// Use jQuery UI to make video resizable
			$element.resizable({
				aspectRatio: true,
				resize: function (event, ui) {
					ui.element.css({
						'position': 'relative',
						'top': 0,
						'left': 0
					});
				}
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