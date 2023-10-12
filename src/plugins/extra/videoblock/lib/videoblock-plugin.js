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
	 * @param Dom element jQuery element with class 'aloha-block-VideoBlock'
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
			selectedBlock.$element.remove();
		}
	}

	return Plugin.create('videoblock', {
		width: '640px',

		height: '360px',

		embedUrl: 'https://youtube.com/embed/',

		previewUrl: 'https://i1.ytimg.com/vi/{id}/0.jpg',

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
			selectedBlock.$element.find('img').attr('src', this.previewUrl.replace("{id}", videoid));
			selectedBlock.$element.data('video-id', videoid);
			selectedBlock.$element.attr('data-video-id', videoid);
		},

		/**
		* Initialize plugin
		*/
		init: function () {
			var that = this;

			// Default settings can be overwritten via Aloha.settings.plugins.videoblock
			if (Aloha.settings.plugins && Aloha.settings.plugins.videoblock) {
				this.width = Aloha.settings.plugins.videoblock.width || this.width;
				this.height = Aloha.settings.plugins.videoblock.height || this.height;
				this.embedUrl = Aloha.settings.plugins.videoblock.embedUrl || this.embedUrl;
				this.previewUrl = Aloha.settings.plugins.videoblock.previewUrl || this.previewUrl;
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

			Aloha.bind('aloha-editable-created', function (event, editable) {
				editable.obj.find('.aloha-block-VideoBlock').each(function () {
					if (!isInitialized(this)){
						$(this).alohaBlock();
					}
				});
			});

			/**
			 * Event listener for editable to initialize video blocks
			 */
			Aloha.bind('aloha-smart-content-changed', function (event, data) {
				data.editable.obj.find('.aloha-block-VideoBlock').each(function () {
					if (!isInitialized(this)){
						$(this).alohaBlock();
					}
				});
			});
		},

		/**
		 * Make the given jQuery object (representing an editable) clean for saving
		 * Replace the preview image by the video embedded in an iframe. Remove unwanted attributes and classes.
		 * @param obj jQuery object to make clean
		 * @return void
		 */
		makeClean: function (obj) {
			var plugin = this;
			obj.find('.aloha-block-VideoBlock').each(function () {
				var $element = $(this), $img = $element.find("img");
				if ($element.data('video-id')) {
					$element.append('<iframe width="100%" height="100%" src="'
						+ plugin.embedUrl
						+ $element.data('video-id')
						+ '" frameborder="0" allowfullscreen></iframe>');
				}
				$element.css({width: $img.css("width"), height: $img.css("height")});
				$img.remove();
				$element.removeClass('ui-resizable ui-draggable aloha aloha-block')
					.removeAttr('id')
					.removeAttr('contenteditable');
			});
		}
	});
});
