/*global define: true */

/* autoparagraph-plugin.js is part of Aloha Editor project http://aloha-editor.org
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
/**
 * @name autoparagraph
 * @namespace Autoparagraph plugin
 */
define([
	'jquery',
	'aloha/plugin',
	'aloha/core',
	'util/html',
	'util/dom'
], function (
	$,
	Plugin,
	Aloha,
	Html,
	Dom
) {
	'use strict';

	/**
	 * Name of this plugin
	 */
	var pluginName = 'autoparagraph';

	/**
	 * Auto-generate missing paragraphs in the given editable, when the editable allows insertion of paragraphs.
	 * If the editable is the currently active one, the current selection will be modified according to the content
	 * changes and the corrected range will be selected.
	 * This means that the visual selection should remain in its original state
	 * 
	 * @param {Editable} editable
	 */
	function autogenerateParagraphs(editable) {
		if (!editable) {
			return;
		}
		var $obj = editable.obj;
		if (!$obj) {
			return;
		}
		var obj = $obj[0], i, j, selectionRange = Aloha.Selection.rangeObject, contentChanged = false;

		// check whether nesting of paragraphs inside the editable is allowed
		if (!Dom.allowsNesting(obj, $('<p></p>')[0])) {
			return;
		}

		// collect lists of subsequent child elements of the editable,
		// that are no block level elements (and thus need to be wrapped
		// into a paragraph)
		var nonBlockRanges = [];
		var current;
		$obj.contents().each(function () {
			if (!Html.isBlock(this)) {
				if (!current) {
					// start a new list
					current = {
						objs: []
					};
					nonBlockRanges.push(current);
				}

				// add the DOM element to the current list
				current.objs.push(this);
			} else {
				// we found a block element, so we are done with the current list
				current = null;
			}
		});

		// wrap all non-block lists into p Tags
		// in other words: replace the list of sibling DOM elements with
		// a single (new) paragraph, that will contain the list of DOM
		// elements as children
		for (i = 0; i < nonBlockRanges.length; i++) {
			var range = nonBlockRanges[i];
			var indexStart = Dom.getIndexInParent(range.objs[0]);
			var indexEnd = Dom.getIndexInParent(range.objs[range.objs.length - 1]);
			var p = $("<p></p>");

			// correct the start of the selection range, if necessary
			if (selectionRange.startContainer === obj) {
				if (selectionRange.startOffset > indexStart && selectionRange.startOffset <= indexEnd) {
					selectionRange.startContainer = p[0];
					selectionRange.startOffset -= indexStart;
				} else if (selectionRange.startOffset > indexEnd) {
					selectionRange.startOffset -= (indexEnd - indexStart);
				}
			}
			// correct the end of the selection range, if necessary
			if (selectionRange.endContainer === obj) {
				if (selectionRange.endOffset > indexStart && selectionRange.endOffset <= indexEnd) {
					selectionRange.endContainer = p[0];
					selectionRange.endOffset -= indexStart;
				} else if (selectionRange.endOffset > indexEnd) {
					selectionRange.endOffset -= (indexEnd - indexStart);
				}
			}

			// insert the paragraph right before the old dom elements
			$(range.objs[0]).before(p);
			// move all old dom elements into the paragraph
			for (j = 0; j < range.objs.length; j++) {
				p[0].appendChild(range.objs[j]);
			}
			contentChanged = true;
		}

		// select the corrected selection, but only if we changed
		// something in the content and the editable is the active one
		if (contentChanged && editable.isActive) {
			selectionRange.select();
		}
	}

	/**
	 * Checks whether or not pluginName is activated for an editable.
	 *
	 * @param {object} The plugin/editable configuration.
	 * @return {boolean} True if activated.
	 */
	function isPluginActivated(config) {
		return (
			$.type(config) === 'array' && $.inArray(pluginName, config) !== -1
		);
	}

	/**
	 * @type {Aloha.Plugin}
	 */
	var autoParagraphPlugin = Plugin.create(pluginName, {
		/**
		 * Default config: plugin active for all editables
		 */
		config: [pluginName],

		/**
		 * Initialize the plugin
		 */
		init: function () {
			var plugin = this;
			// autogenerate paragraphs when a new editable is created
			Aloha.bind('aloha-editable-created', function (event, editable) {
				var config = plugin.getEditableConfig(editable.obj);
				if (isPluginActivated(config)) {
					autogenerateParagraphs(editable);
				}
			});

			// autogenerate paragraphs upon smart content change
			Aloha.bind('aloha-smart-content-changed', function (event, data) {
				var config = plugin.getEditableConfig(data.editable.obj);
				if (isPluginActivated(config)) {
					autogenerateParagraphs(data.editable);
				}
			});
		}
	});

	return autoParagraphPlugin;
});
