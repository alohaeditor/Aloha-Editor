/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

/**
 * @name block
 * @namespace Block plugin
 */
define([
	'aloha/plugin',
	'block/blockmanager',
	'block/sidebarattributeeditor',
	'block/block',
	'block/editormanager',
	'block/editor',
	'css!block/css/block.css'
], function(Plugin, BlockManager, SidebarAttributeEditor, block, EditorManager, editor) {
	"use strict";

	var
		jQuery = window.alohaQuery || window.jQuery, $ = jQuery,
		Aloha = window.Aloha;

	/**
	 * Register the plugin with unique name
	 */
	var BlockPlugin = Plugin.create('block', {
		settings: {},
		dependencies: ['paste'],

		init: function () {
			var that = this;
			// Register default block types
			BlockManager.registerBlockType('DebugBlock', block.DebugBlock);
			BlockManager.registerBlockType('DefaultBlock', block.DefaultBlock);

			// Register default editors
			EditorManager.register('string', editor.StringEditor);
			EditorManager.register('number', editor.NumberEditor);
			EditorManager.register('url', editor.UrlEditor);
			EditorManager.register('email', editor.EmailEditor);

			require(
				['block/blockpastehandler', 'paste/paste-plugin'],
				function(BlockPasteHandler, PastePlugin) {
					PastePlugin.register(new BlockPasteHandler());
				});

			BlockManager.registerEventHandlers();

			Aloha.bind('aloha', function() {
				// When Aloha is fully loaded, we initialize the blocks.
				that._createBlocks();
				if (that.settings['sidebarAttributeEditor'] !== false) {
					SidebarAttributeEditor.init();
				}
			});
		},
		_createBlocks: function() {
			var defaultBlockSettings;

			if (!this.settings.defaults) {
				this.settings.defaults = {};
			}
			$.each(this.settings.defaults, function(selector, instanceDefaults) {
				$(selector).alohaBlock(instanceDefaults);
			});
		}
	});

	/**
	 * See (http://jquery.com/).
	 * @name jQuery
	 * @class
	 * See the jQuery Library  (http://jquery.com/) for full details.  This just
	 * documents the function and classes that are added to jQuery by this plug-in.
	 */

	/**
	 * See (http://jquery.com/).
	 * @name jQuery.fn
	 * @class
	 * See the jQuery Library  (http://jquery.com/) for full details.  This just
	 * documents the function and classes that are added to jQuery by this plug-in.
	 */

	/**
	 * Create Aloha blocks from the matched elements
	 * @api
	 * @param {Object} instanceDefaults
	 */
	jQuery.fn.alohaBlock = function(instanceDefaults) {
		instanceDefaults = instanceDefaults || {};
		$(this).each(function(index, element) {
			BlockManager._blockify(element, instanceDefaults);
		});

		// Chain
		return jQuery(this);
	};

	// $.fn.mahaloBlock = TODO
	return BlockPlugin;
});