/* genericcontenthandler.js is part of Aloha Editor project http://aloha-editor.org
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
	'jquery',
	'aloha',
	'aloha/contenthandlermanager',
	'aloha/plugincontenthandlermanager',
	'util/contenthandler'
], function (
	$,
	Aloha,
	Manager,
	PluginContentHandlerManager,
	Utils
) {
	'use strict';

	/**
	 * Apply the plugin content handler to an HTMLElement.
	 * 
	 * @param {jQuery.<HTMLElement>} $element The HTMLElement which will be handled.
	 * @param {object} options Used to filter limit which content handlers should be used.
	 * @param {Aloha.Editable} editable The editable whose content is currently being handled.
	 * @return {boolean} true if the generic cleanup should be applied to the element and its children
	 */
	function applyPluginHandler($element, options, editable) {
		var handler = PluginContentHandlerManager.getHandlerForElement($element);
		if (!Array.isArray(handler) || handler.length === 0) {
			return true;
		}
		var i = 0;
		var resumeNext;
		do {
			resumeNext = handler[i]($element, options, editable);
			i++;
		} while (typeof handler[i] === 'function' && (typeof resumeNext === 'undefined' || resumeNext));

		return (typeof resumeNext === 'undefined' || resumeNext);
	}

	var GenericContentHandler = Manager.createHandler({
		/**
		 * Apply the generic and the plugin content handler to HTMLElements and their children.
		 * 
		 * @param {jQuery.<Array.<HTMLElement>>} $element The HTMLElements which will be handled.
		 * @param {object} options Used to filter limit which content handlers should be used.
		 * @param {Aloha.Editable} editable The editable whose content is currently being handled.
		 * @param {boolean} transformFormatting true if formatting should be transformed
		 */
		applyHandlerToElements: function ($elements, options, editable, transformFormatting) {
			var that = this;
			$elements.filter(Utils.notAlohaBlockFilter).each(function () {
				var $elem = $(this);
				var $contents = $elem.contents();
				var isApplyGenericHandler = applyPluginHandler($elem, options, editable);
				if (isApplyGenericHandler) {
					Utils.doGenericCleanup($elem, transformFormatting);
				}
				return that.applyHandlerToElements($contents, options, editable, transformFormatting);
			});
		},
		/**
		 * Transforms pasted content to make it safe and ready to be used in
		 * Aloha Editables.
		 *
		 * @param {jQuery.<HTMLElement>|string} content
		 * @return {string} Clean HTML
		 */
		handleContent: function (content, options, editable) {
			var $content = Utils.wrapContent(content);
			if (!$content) {
				return content;
			}
			this.applyHandlerToElements($content.contents(), options, editable, Utils.isTransformFormatting());
			return $content.html();
		}
	});

	return GenericContentHandler;
});
