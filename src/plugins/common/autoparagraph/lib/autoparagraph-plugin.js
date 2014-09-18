/* autoparagraph-plugin.js is part of the Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 * License http://aloha-editor.org/license.php
 */
/**
 * @name autoparagraph
 * @namespace Autoparagraph plugin
 */
define([
	'jquery',
	'PubSub',
	'aloha/plugin',
	'aloha/core',
	'aloha/content-rules',
	'util/html',
	'util/dom'
], function (
	$,
	PubSub,
	Plugin,
	Aloha,
	ContentRules,
	Html,
	Dom
) {
	'use strict';

	/**
	 * Name of this plugin
	 */
	var pluginName = 'autoparagraph';

	var configurations = {};

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
			var $p = $('<p></p>');

			// correct the start of the selection range, if necessary
			if (selectionRange.startContainer === obj) {
				if (selectionRange.startOffset > indexStart && selectionRange.startOffset <= indexEnd) {
					selectionRange.startContainer = $p[0];
					selectionRange.startOffset -= indexStart;
				} else if (selectionRange.startOffset > indexEnd) {
					selectionRange.startOffset -= (indexEnd - indexStart);
				}
			}
			// correct the end of the selection range, if necessary
			if (selectionRange.endContainer === obj) {
				if (selectionRange.endOffset > indexStart && selectionRange.endOffset <= indexEnd) {
					selectionRange.endContainer = $p[0];
					selectionRange.endOffset -= indexStart;
				} else if (selectionRange.endOffset > indexEnd) {
					selectionRange.endOffset -= (indexEnd - indexStart);
				}
			}

			// insert the paragraph right before the old dom elements
			$(range.objs[0]).before($p);
			// move all old dom elements into the paragraph
			for (j = 0; j < range.objs.length; j++) {
				$p[0].appendChild(range.objs[j]);
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
			PubSub.sub('aloha.editable.created', function (message) {
				var editable = message.editable;
				var config = plugin.getEditableConfig(editable.obj);
				var enabled = config
				           && ($.inArray(pluginName, config) > -1)
				           && ContentRules.isAllowed(editable.obj[0], 'p');
				configurations[editable.getId()] = !!enabled;
				if (enabled) {
					autogenerateParagraphs(editable);
				}
			});

			// autogenerate paragraphs upon smart content change
			Aloha.bind('aloha-smart-content-changed', function (event, data) {
				if (configurations[data.editable.getId()]) {
					autogenerateParagraphs(data.editable);
				}
			});
		}
	});

	return autoParagraphPlugin;
});
