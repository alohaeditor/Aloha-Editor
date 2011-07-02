/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define([
	'block/blockmanager',
	'block/block/defaultblock',
	'block/block/debugblock',
	'css!block/css/block.css'
], function(BlockManager, DefaultBlock, DebugBlock) {
	"use strict";
	var
		jQuery = window.alohaQuery || window.jQuery, $ = jQuery,
		Aloha = window.Aloha;

	/**
	 * register the plugin with unique name
	 */
	var BlockPlugin = new (Aloha.Plugin.extend({
		settings: {},

		_constructor: function() {
			this._super('block');
		},

		init: function () {
			BlockManager.registerEventHandlers();
			if (!this.settings.defaults) {
				this.settings.defaults = {};
			}
			if (!this.settings.defaults['.aloha-block']) {
				this.settings.defaults['.aloha-block'] = {};
			}
			$.each(this.settings.defaults, function(selector, instanceDefaults) {
				$(selector).alohaBlock(instanceDefaults);
			})
		}
	}))();
	
	
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

	// Register default block types
	BlockManager.registerBlockType('DebugBlock', DebugBlock);
	BlockManager.registerBlockType('DefaultBlock', DefaultBlock);

	// $.fn.mahaloBlock = TODO
	return BlockPlugin;
});