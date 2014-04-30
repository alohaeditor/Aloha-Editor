/* videoblock-plugin.js is part of Aloha Editor project http://aloha-editor.org
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
	'aloha/core',
	'aloha/plugin',
	'i18n!videoblock/nls/i18n',
	'i18n!aloha/nls/i18n',
	'block/blockmanager',
	'ui/ui',
	'ui/button',
	'ui/port-helper-attribute-field',
	'videoblock/block',
	'videoblock/content-handler'
], function (
	$,
	Aloha,
	Plugin,
	i18n,
	i18nCore,
	BlockManager,
	Ui,
	Button,
	AttributeField,
	VideoBlock,
	ContentHandler
) {
	'use strict';

	/**
	* Curerntly selected block
	*/
	var selectedBlock;

	/**
	 * Checks to see if video blocks in current editable are already initialized
	 *
	 * @param Dom element jQuery element with class 'aloha-video-block'
	 * @return Boolean
	 */
	function isInitialized(element) {
		return $(element).hasClass('aloha-block');
	}

	/**
	 * Removes selected VideoBlock on toolbar button click
	 */
	function removeVideoBlock() {
		if (selectedBlock) {
			selectedBlock.$element[0].remove();
		}
	}

	return Plugin.create('videoblock', {

		/**
		 * Default settings
		 */
		settings: {
			'width': '640px',
			'height': '360px',
			'embedUrl': 'https://youtube.com/embed/'
		},

		/**
		* Reference to input field in video tab
		*/
		hrefField: null,

		/**
		 * Add URL-field and remove-button to video tab in Aloha floating menu
		 */
		createToolbarTab: function () {
			this.hrefField = new AttributeField({
				name: 'video-url',
				width: 320,
				valueField: 'url',
				label: i18n.t("tab.video.label")
			});

			var removeVideoButton = Ui.adopt("remove-video", Button, {
				tooltip: i18n.t("button.removevideo.tooltip"),
				icon: "aloha-icon aloha-icon-unlink",
				click: removeVideoBlock
			});
		},

		/**
		 * Set input field in video tab to video URL
		 */
		setHrefField: function () {
			if (selectedBlock) {
				$(this.hrefField.getInputElem()).val('http://youtube.com/watch?v='
					+ selectedBlock.$element.data('video-id'));
			}
		},

		/**
		 * Get on changed video URL from input in toolbar
		 * and apply YouTube video id to "src" attribute of iframe.
		 */
		hrefChange: function () {
			var videoid = ContentHandler.extractVideoId($(this.hrefField.getInputElem()).val());
			selectedBlock.$element.find('iframe').attr('src', this.settings.embedUrl + videoid);
			selectedBlock.$element.data('video-id', videoid);
		},

		/**
		* Initialize plugin
		*/
		init: function () {
			var that = this;
			
			// Default settings can be overwritten via Aloha.settings.plugins.videoblock
			if (Aloha.settings.plugins && Aloha.settings.plugins.videoblock) {
				this.settings = Aloha.settings.plugins.videoblock;
			}
			
			this.createToolbarTab();

			/**
			 * Event listener for toolbar tab input field URL changes
			 */
			this.hrefField.addListener('keyup', function (event) {
				that.hrefChange();
			});

			/**
			 * Event listener for block selection,
			 * to change toolbar tab input field value
			 */
			BlockManager.bind('block-selection-change', function (blocks){
				selectedBlock = blocks[0];
				that.setHrefField();
			});

			/**
			 * Event listener for editable to initialize video blocks
			 */
			Aloha.bind('aloha-smart-content-changed', function (event, data) {
				data.editable.obj.find('.aloha-video-block').each(function () {
					if (!isInitialized(this)){
						$(this).alohaBlock();
					}
				});
			});
		}
	});
});