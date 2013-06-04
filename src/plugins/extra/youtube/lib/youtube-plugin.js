/* paste-plugin.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2012 Gentics Software GmbH, Vienna, Austria.
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
 *
 * @overview:
 * The paste plugin intercepts all browser paste events that target aloha
 * editables, and redirects the events into a hidden div.  Once pasting is done
 * into this div, its contents will be processed by registered content handlers
 * before being copied into the active editable, at the current range.
 */
define([
	'jquery',
	'aloha/core',
	'aloha/plugin',
	'aloha/contenthandlermanager',
	'block/block',
	'block/blockmanager'
], function (
	$,
	Aloha,
	Plugin,
	ContentHandlerManager,
	Block,
	BlockManager
) {
	'use strict';

	var YouTubeBlock,
		YouTubeHandler,
		plugin,
		initializeBlock = false;
	/**
	 * YouTube Block
	 */
	YouTubeBlock = Block.AbstractBlock.extend({
		title: 'YouTube Block',

		init: function($element, postProcessFn) {
			$element.html('<embed src="http://www.youtube.com/v/' + $element.data('ytcode') + 
				'" type="application/x-shockwave-flash" ' + 
				'allowscriptaccess="always" allowfullscreen="true" width="100%" height="350" />');
			postProcessFn();
		}
	});
	BlockManager.registerBlockType('YouTubeBlock', YouTubeBlock);


	/**
	 * YouTube ContentHandler
	 */
	YouTubeHandler = ContentHandlerManager.createHandler({
		handleContent: function (content) {			
			var matches = content.match("www.youtube.com/watch\\?v=(\\w+)");

			if (matches !== null && matches[1]) {
				initializeBlock = true;
				return '<div data-aloha-block-type="YouTubeBlock" ' + 
					'data-ytcode="' + matches[1] + '">YouTubeBlock</div>';
			}
			return content;
		}
	});
	ContentHandlerManager.register('youtube', YouTubeHandler);
	Aloha.settings.contentHandler.insertHtml = ['youtube'];


	/**
	 * YouTube Plugin
	 */
	plugin = Plugin.create('youtube', {
		settings: {},
		init: function () {
			Aloha.bind('aloha-smart-content-changed', function () {
				if (!initializeBlock) {
					return;
				}
				$('div[data-aloha-block-type="YouTubeBlock"]').alohaBlock();
				initializeBlock = false;
			});
		}
	});

	return plugin;
});