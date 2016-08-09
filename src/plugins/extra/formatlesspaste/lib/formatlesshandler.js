/* formatlesshandler.js is part of Aloha Editor project http://aloha-editor.org
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
 */
define([
	'aloha',
	'jquery',
	'aloha/contenthandlermanager'
], function (
	Aloha,
	$,
	ContentHandlerManager
) {
	'use strict';

	/**
	 * Remove unwanted formatting in the pasted element.
	 *
	 * @param {jQuery.<HTMLElement>} $content Element to process.
	 * @param {Array.<string>} toStip A list of tags to strip from the content.
	 */
	function removeFormatting($content, toStrip) {
		$content.find(toStrip.join(',')).filter(function (index) {
			return $( this ).parents('.aloha-block').length === 0;
		}).each(function () {
			if ($(this).contents().length === 0) {
				$(this).remove();
			} else {
				$(this).contents().unwrap();
			}
		});
	}

	/**
	 * Register the formatless paste handler.
	 *
	 * @class {FormatlessPasteHandler}
	 */
	var FormatlessPasteHandler = ContentHandlerManager.createHandler({

		/**
		 * Whether or not formatless copying and pasting is enable.
		 *
		 * @type {boolean}
		 */
		enabled: false,

		/**
		 * Handles the copying and pasting. Removes all content that have been
		 * configured to be striooed away.
		 *
		 * @param {string|jQuery.<HTMLElement>} content The content to
		 *                                              transform.
		 * @return {string} Transformed markup.
		 */
		handleContent: function (content) {
			var $content;

			if (typeof content === 'string') {
				$content = $('<div>' + content + '</div>');
			} else if (content instanceof $) {
				$content = $('<div>').append(content);
			}

			if (this.enabled) {
				removeFormatting($content, this.strippedElements);
			}

			return $content.html();
		}
	});

	return FormatlessPasteHandler;
});
