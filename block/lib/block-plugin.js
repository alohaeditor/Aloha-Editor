/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define([
	'core/plugin',
	'block/blockmanager',
	'block/sidebarattributeeditor',
	'block/block/defaultblock',
	'block/block/debugblock',
	'css!block/css/block.css'
], function(Plugin, BlockManager, SidebarAttributeEditor, DefaultBlock, DebugBlock) {
	"use strict";
	var
		jQuery = window.alohaQuery || window.jQuery, $ = jQuery,
		Aloha = window.Aloha;

	/**
	 * register the plugin with unique name
	 */
	var BlockPlugin = Plugin.create('block', {
		settings: {},
		dependencies: ['paste'],

		init: function () {
			var that = this;
			// Register default block types
			BlockManager.registerBlockType('DebugBlock', DebugBlock);
			BlockManager.registerBlockType('DefaultBlock', DefaultBlock);

			require(
				['block/blockpastehandler', 'paste/paste-plugin'],
				function(BlockPasteHandler, PastePlugin) {
					PastePlugin.register(new BlockPasteHandler());
				});

			BlockManager.registerEventHandlers();
			
			Aloha.bind('aloha', function() {
				// When Aloha is fully loaded, we initialize the blocks.
				that._createBlocks();
				SidebarAttributeEditor.init();
			});
		},
		_createBlocks: function() {
			var defaultBlockSettings;

			if (!this.settings.defaults) {
				this.settings.defaults = {};
			}
			if (!this.settings.defaults['.aloha-block']) {
				this.settings.defaults['.aloha-block'] = {};
			}

			defaultBlockSettings = this.settings.defaults['.aloha-block'];
			delete this.settings.defaults['.aloha-block'];
			$.each(this.settings.defaults, function(selector, instanceDefaults) {
				$(selector).alohaBlock(instanceDefaults);
			});
			$('.aloha-block').alohaBlock(defaultBlockSettings);
		}
	});

	/**
	 * @api
	 */
	$.fn.alohaBlock = function(instanceDefaults) {
		instanceDefaults = instanceDefaults || {};
		$(this).each(function(index, element) {
			BlockManager.blockify(element, instanceDefaults);
		});

		// Chain
		return $(this);
	};

	// $.fn.mahaloBlock = TODO
	return BlockPlugin;
});