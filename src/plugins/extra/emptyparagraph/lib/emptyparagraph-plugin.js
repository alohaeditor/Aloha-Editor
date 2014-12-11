/*global define: true */

/* emptyparagraph-plugin.js is part of Aloha Editor project http://aloha-editor.org
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
 * @name emptyparagraph
 * @namespace emptyparagraph plugin
 */
define([
	'jquery',
	'aloha/plugin',
	'aloha/core',
	'util/html',
	'util/dom',
	'./emptyparagraph',
	'css!emptyparagraph/css/emptyparagraph.css'
], function (
	$,
	Plugin,
	Aloha,
	Html,
	Dom,
	EmptyParagraph
) {
	'use strict';

	/**
	 * Name of this plugin
	 */
	var pluginName = 'emptyparagraph';
	var DEFAULT_ELEMENTS = ['p'];

	/**
	 * Checks if this plugin is activated by name.
	 * @param config
	 * @returns {boolean}
	 */
	function isPluginActivatedByName(config) {
		return $.type(config) === 'array' && $.inArray(pluginName, config) !== -1;
	}

	/**
	 * Checks whether or not pluginName is activated for an editable.
	 *
	 * @param {object} The plugin/editable configuration.
	 * @return {boolean} True if activated.
	 */
	function isPluginActivated(config) {
		return isPluginActivatedByName(config) || $.type(config) !== 'array';
	}

	/**
	 * Highlights empty elements
	 * @param plugin
	 * @param editable
	 */
	function highlightDisallowedElements(plugin, editable) {
		var config = plugin.getEditableConfig(editable.obj);
		var editableElement = editable.obj[0];
		
		if (isPluginActivated(config)) {
			EmptyParagraph.highlightEmptyElements(editableElement, config.emptyelements || DEFAULT_ELEMENTS);
		}
	}

	/**
	 * Checks if remove consecutive br's is activated.
	 * @param {Object} config
	 * @returns {boolean}
	 */
	function isRemoveConsecutiveBrActivated(config) {
		switch(typeof config.removebr) {
		case 'undefined':
			return true;
		case 'boolean':
			return config.removebr;
		case 'string':
			return config.removebr.toLowerCase() === 'true';
		default:
			throw new Error('Invalid Empty Paragraph Plugin configuration: config.removebr');
		}
	}

	/**
	 * @type {Aloha.Plugin}
	 */
	return Plugin.create(pluginName, {
		/**
		 * Default config: plugin active for all editables
		 */
		config: [pluginName],

		/**
		 * Initialize the plugin
		 */
		init: function () {
			var plugin = this;
			Aloha.bind('aloha-editable-created', function (event, editable) {
				highlightDisallowedElements(plugin, editable);
			});

			Aloha.bind('aloha-smart-content-changed', function (event, data) {
				highlightDisallowedElements(plugin, data.editable);
			});
		},

		/**
		 * @overwrite
		 */
		makeClean: function(obj) {
			var config = this.getEditableConfig(obj);
			if (isPluginActivated(config)) {
				var elements = (config.emptyelements) || DEFAULT_ELEMENTS;

				EmptyParagraph.removeEmptyElements(obj[0], elements);

				if (isRemoveConsecutiveBrActivated(config)) {
					EmptyParagraph.removeConsecutiveBr(obj[0]);
				}
			}
		}
	});
});
