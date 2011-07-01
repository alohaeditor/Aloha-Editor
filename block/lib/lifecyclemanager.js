/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define("block/lifecyclemanager",
	["block/block"],
function(Block) {
	"use strict";
	
	var
		jQuery = window.alohaQuery || window.jQuery, $ = jQuery,
		GENTICS = window.GENTICS,
		Aloha = window.Aloha;

	var LifecycleManager = new (Class.extend({

		defaults: {
			renderer: 'DefaultRenderer',
			something: 'DefaultRenderer'
		},

		// container for all blocks
		// Key: ID, value: Block
		blocks: {},

		renderers: {},

		registerEventHandlers: function() {
			// Register event handlers for activating an Aloha Block
			$('.aloha-block').live('click', function() {
				var block = LifecycleManager.getBlock(this);
				if (!block.isActive()) {
					// We did not click on an active block
					LifecycleManager.deactivateActiveBlocks();
				}
				block.activate();
			});

			// Register event handlers for deactivating an Aloha Block
			$('body').live('click', function(event) {
				// TODO: also check if the user does stuff inside the property panel; as this should also be allowed.
				if (!$(event.target).is('.aloha-block')) {
					// We did not click on a aloha block,
					// so we need to disable the currently active blocks
					LifecycleManager.deactivateActiveBlocks();
				}
			});
		},
		blockify: function(element, instanceDefaults) {
			element = $(element);
			var config = this.getConfig(element, instanceDefaults);
			
			// write back merged configuration
			$.each(config, function(k, v) {
				element.attr('data-' + k, v);
			});
			
			element.contentEditable(false);
			element.addClass('aloha-block');
			if (!element.attr('id')) {
				element.attr('id', GENTICS.Utils.guid());
			}

			var block = new Block(element);
			this.registerBlock(block);

			block.render();
			// TODO: check if object is already Block-ified
		},

		/**
		 * Only internal helper function
		 */
		deactivateActiveBlocks: function() {
			$('.aloha-block-active').each(function(index, element) {
				var block = LifecycleManager.getBlock(element);
				if (block) {
					block.deactivate();
				}
			});
		},
		getConfig: function(blockElement, instanceDefaults) {
			
			// TODO: merge from this.settings
			// TODO: What about double matches / overrides / multiple selectors applying?
			var settingsDefaults = {dummy: 'bar'};

			return $.extend({}, this.defaults, settingsDefaults, instanceDefaults, blockElement.data());
		},
		registerBlock: function(block) {
			// TODO: store with ID
			this.blocks[block.getId()] = block;
		},

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
		
		registerRenderer: function(identifier, renderer) {
			this.renderers[identifier] = renderer;
		},
		
		getRenderer: function(identifier) {
			return this.renderers[identifier];
		},
		
		unregisterRenderer: function() {
			// TODO
		}
	}))();
	
	return LifecycleManager;
});
