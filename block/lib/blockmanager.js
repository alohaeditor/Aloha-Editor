/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define(['core/floatingmenu', 'core/observable', 'core/registry'],
function(FloatingMenu, Observable, Registry) {
	"use strict";

	var
		jQuery = window.alohaQuery || window.jQuery, $ = jQuery,
		GENTICS = window.GENTICS,
		Aloha = window.Aloha;

	/**
	 * @name block.blockmanager
	 * @class Block manager singleton
	 */
	var BlockManager = new (Class.extend(Observable,
	/** @lends block.blockmanager */
	{

		/**
		 * @name block.blockmanager#block-selection-change
		 * @event
		 * @param {Array} selectedBlocks Array of AbstractBlock objects, containing selected blocks. The first element in the array is the innermost block, and the other elements are the parent blocks.
		 */

		/**
		 * @name block.blockmanager#block-delete
		 * @event fired directly before a block is deleted
		 * @param {AbstractBlock} the block to be deleted
		 */

		defaults: {
			'block-type': 'DefaultBlock'
		},

		/**
		 * Registry of block types
		 * @type Registry
		 */
		blockTypes: null,

		/**
		 * Registry of blocks
		 * @type Registry
		 */
		blocks: null,

		activeBlocks: null,

		/**
		 * @constructor
		 */
		_constructor: function() {
			FloatingMenu.createScope('Aloha.Block');
			this.blockTypes = new Registry();
			this.blocks = new Registry();
			this.activeBlocks = {};
		},

		/**
		 * Register initial event handlers
		 *
		 * @private
		 */
		registerEventHandlers: function() {
			var that = this;

			// Register event handlers for deactivating an Aloha Block
			$(document).bind('click', function(event) {
				if (that.activeBlocks == {}) return;
				if ($(event.target).parents('.aloha-sidebar-bar, .aloha-block-do-not-deactivate').length > 0
					|| $(event.target).is('.aloha-sidebar-bar, .aloha-block-do-not-deactivate')) {
					// If we are inside the sidebar, we do not want to deactivate active blocks...
					return;
				}
				BlockManager._deactivateActiveBlocks();
			});

			Aloha.bind('aloha-selection-changed', function() {
				// TODO: the following line is needed to de-select blocks when navigating over them
				// using the mouse cursors.
				// However, including this line breaks behavior when clicking into an editable
				// INSIDE a block.
				that._deactivateActiveBlocks();
			});
		},

		/**
		 * Blockify a given element with the instance defaults
		 * Directly called when one does $.alohaBlock(instanceDefaults)
		 *
		 * @private
		 */
		_blockify: function(element, instanceDefaults) {
			var attributes, block;
			element = $(element);

			// TODO: check if object is already Block-ified

			attributes = this.getConfig(element, instanceDefaults);

			element.contentEditable(false);

			if (!this.blockTypes.has(attributes['block-type'])) {
				Aloha.Log.error('block/blockmanager', 'Block Type ' + attributes['block-type'] + ' not found!');
				return;
			}

			block = new (this.blockTypes.get(attributes['block-type']))(element);
			block.element.addClass('aloha-block-' + attributes['block-type']);

			// Save attributes on block, but ignore jquery attribute.
			$.each(attributes, function(k, v) {
				if (k.indexOf('jQuery') === 0) return;

				block.attr(k, v, true);
			});

			$.each(element.data(), function(k, v) {
				element.removeAttr('data-' + k);
			});

			// Register block
			this.blocks.register(block.getId(), block);

			block._renderAndSetContent();
		},

		/**
		 * Deactivate all active blocks
		 *
		 * @private
		 */
		_deactivateActiveBlocks: function() {
			$.each($.extend({}, this.activeBlocks), function(id) {
				var block = BlockManager.getBlock(id);
				if (block) {
					block.deactivate();
				}
			});
		},

		/**
		 * Merges the config from different places, and return the merged config.
		 *
		 * @private
		 */
		getConfig: function(blockElement, instanceDefaults) {
			// TODO: merge from plugin settings
			// TODO: What about double matches / overrides / multiple selectors applying?
			var settingsDefaults = {};

			return $.extend(
				{},
				this.defaults,
				settingsDefaults,
				instanceDefaults,
				blockElement.data(),
				{	// Override the "about" property
					about: blockElement.attr('about')
				}
			);
		},

		/**
		 * Get a Block instance by id or DOM node
		 *
		 * @param {String|DOMNode} idOrDomNode
		 * @return {block.block.AbstractBlock} Block instance
		 */
		getBlock: function(idOrDomNode) {
			var id;
			if (typeof idOrDomNode === 'object') {
				id = jQuery(idOrDomNode).attr('id');
			} else {
				id = idOrDomNode;
			}

			return this.blocks.get(id);
		},

		/**
		 * Unregister (e.g. remove) the given block
		 *
		 * @param {Object|String} blockOrBlockId Block or block id
		 */
		_unregisterBlock: function(blockOrBlockId) {
			var id;
			if (typeof blockOrBlockId === 'object') {
				id = blockOrBlockId.getId();
			} else {
				id = blockOrBlockId;
			}
			this.blocks.unregister(blockOrBlockId);
		},

		/**
		 * Register the given block type
		 *
		 * @param {String} Identifier
		 * @param {Class} A class that extends block.block.AbstractBlock
		 */
		registerBlockType: function(identifier, blockType) {
			FloatingMenu.createScope('Aloha.Block.' + identifier, 'Aloha.Block');
			this.blockTypes.register(identifier, blockType);
		},

		/**
		 * Get all active blocks indexed by block id
		 *
		 * @return {Object}
		 */
		getActiveBlocks: function() {
			var activeBlocks = {};
			$.each(this.blocks.getEntries(), function(blockId, block) {
				if (block.isActive()) {
					activeBlocks[blockId] = block;
				}
			});
			return activeBlocks;
		},

		_setActive: function(block) {
			this.activeBlocks[block.id] = true;
		},

		_setInactive: function(block) {
			delete this.activeBlocks[block.id];
		}
	}))();

	Aloha.Block = Aloha.Block || {};
	Aloha.Block.BlockManager = BlockManager;

	return BlockManager;
});
