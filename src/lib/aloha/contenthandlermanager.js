/* contenthandlermanager.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
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
	'aloha/core',
	'aloha/registry',
	'util/class'
], function (
	Aloha,
	Registry,
	Class
) {
	'use strict';

	var ContentHandlerManager = Registry.extend({

		/**
		 * Create a contentHandler from the given definition.  Acts as a factory
		 * method for contentHandler.
		 *
		 * @param {object} definition
		 */
		createHandler: function (definition) {
			if (typeof definition.handleContent !== 'function') {
				throw 'ContentHandler has no function handleContent().';
			}
			var AbstractContentHandler = Class.extend({
				handleContent: function (content) {
					// Implement in subclass!
				}
			}, definition);
			return new AbstractContentHandler();
		},

		/**
		 * Manipulates the given contents of an editable by invoking content
		 * handlers over it.
		 *
		 * @param {string} content The content of an editable which will be
		 *                         handled.
		 * @param {object} options Used to filter limit which content handlers
		 *                         should be used.
		 * @param {Aloha.Editable} The editable whose content is being handled.
		 * @return {string} The handled content.
		 */
		handleContent: function (content, options, editable) {
			var manager = this;

			// Because if no options are specified, to indicate which content
			// handler to use, then all that are available are used.
			var handlers = options ? options.contenthandler : manager.getIds();

			if (!handlers) {
				return content;
			}

			var i;
			var handler;
			for (i = 0; i < handlers.length; i++) {
				handler = manager.get(handlers[i]);
				if (handler) {
					content = handler.handleContent(
						content,
						options,
						editable || Aloha.activeEditable
					);
				}

				// FIXME: Is it ever valid for content to be null?  This would
				//        break the handleContent(string):string contract.
				if (null === content) {
					break;
				}
			}

			return content;
		}
	});

	return new ContentHandlerManager();
});
