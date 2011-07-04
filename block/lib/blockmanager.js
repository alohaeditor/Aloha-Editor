/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define(['core/floatingmenu', 'core/observable'],
function(FloatingMenu, Ovservable) {
	"use strict";
	
	var
		jQuery = window.alohaQuery || window.jQuery, $ = jQuery,
		GENTICS = window.GENTICS,
		Aloha = window.Aloha;

	var BlockManager = new (Class.extend(Observable, {

		/**
		 * @event blockSelectionChange
		 * @param {Array} Array of AbstractBlock objects, containing  selectedBlocks
		 */

		defaults: {
			'block-type': 'DefaultBlock'
		},
		blockTypes: {},
		
		// container for all blocks
		// Key: ID, value: Block
		blocks: {},

		_construct: function() {
			FloatingMenu.createScope('Aloha.Block');
		},

		registerEventHandlers: function() {
			// Register event handlers for deactivating an Aloha Block
			$(document).bind('click', function() {
				BlockManager.deactivateActiveBlocks();
			});
		},
		
		/**
		 * Blockify a given element with the instance defaults
		 * Directly called when one does $.alohaBlock(instanceDefaults)
		 *
		 * @hide
		 */
		blockify: function(element, instanceDefaults) {
			var attributes, block;
			element = $(element);
			
			// TODO: check if object is already Block-ified
			
			attributes = this.getConfig(element, instanceDefaults);

			element.contentEditable(false);
			if (!element.attr('id')) {
				element.attr('id', GENTICS.Utils.guid());
			}

			if (!this.blockTypes[attributes['block-type']]) {
				Aloha.Log.error('block/blockmanager', 'Block Type ' + attributes['block-type'] + ' not found!');
				return;
			}

			block = new (this.blockTypes[attributes['block-type']])(element);

			// Save attributes on block, but ignore jquery attribute.
			$.each(attributes, function(k, v) {
				if (k.indexOf('jQuery') === 0) return;

				block.attr(k, v);
			});

			// Register block
			this.blocks[block.getId()] = block;

			block._renderAndSetContent();
		},

		/**
		 * Only internal helper function
		 */
		deactivateActiveBlocks: function() {
			$('.aloha-block-active').each(function(index, element) {
				var block = BlockManager.getBlock(element);
				if (block) {
					block.deactivate();
				}
			});
		},
		
		/**
		 * Merges the config from different places, and return the merged config.
		 *
		 * @hide
		 */
		getConfig: function(blockElement, instanceDefaults) {
			// TODO: merge from plugin settings
			// TODO: What about double matches / overrides / multiple selectors applying?
			var settingsDefaults = {dummy: 'bar'};

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
		 * Receive the Block instance, when ID or DOM node is given.
		 * 
		 * @param {String}|{DOMNode}
		 * @return {Block} Block instance
		 */
		getBlock: function(idOrDomNode) {
			var id;
			if (typeof idOrDomNode === 'object') {
				id = jQuery(idOrDomNode).attr('id');
			} else {
				id = idOrDomNode;
			}

			return this.blocks[id];
		},
		
		unregisterBlock: function(blockOrBlockId) {
			// TODO
		},
		
		registerBlockType: function(identifier, blockType) {
			FloatingMenu.createScope('Aloha.Block.' + identifier, 'Aloha.Block');
			this.blockTypes[identifier] = blockType;
		},

		getActiveBlocks: function() {
			var activeBlocks = {};
			$.each(this.blocks, function(blockId, block) {
				if (block.isActive()) {
					activeBlocks[blockId] = block;
				}
			});
			return activeBlocks;
		}
	}))();
	
	return BlockManager;
});
