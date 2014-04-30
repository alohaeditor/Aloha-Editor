/* content-handler.js is part of Aloha Editor project http://aloha-editor.org
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
	'aloha/contenthandlermanager'
], function (
	Manager
) {
    'use strict';

	var handler = Manager.createHandler({

		/**
		 * Extracts YouTube video ID for later insertion into iframe embed code
		 *
		 * @param String url The pasted video URL
		 * @return String or false
		 */
		extractVideoId: function (url) {
			var videoid = url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
			if(videoid === null) {
			   return false;
			}
			return videoid[1];
		},


		/**
		 * Construct wrapping DOM element for block
		 * @param String content the pasted video URL
		 */
        handleContent: function (content) {
			var videoid = this.extractVideoId(content);
			if (!videoid){
				return content;
			}
            return'<div class="aloha-video-block aloha" data-aloha-block-type="VideoBlock" data-video-id="' + videoid + '"></div>';
        }
    });

	// Make content handler automatically available to videoblock-plugin
	Manager.register('video', handler);

	return handler;
});