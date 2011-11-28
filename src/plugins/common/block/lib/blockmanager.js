/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define(['aloha', 'aloha/jquery', 'aloha/floatingmenu', 'aloha/observable', 'aloha/registry'],
function(Aloha, jQuery, FloatingMenu, Observable, Registry) {
	"use strict";

	var
		GENTICS = window.GENTICS;

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
			'aloha-block-type': 'DefaultBlock'
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

		_highlightedBlocks: null,

		/**
		 * Reference to the currently active block, if any
		 */
		_activeBlock: null,

		/**
		 * @constructor
		 */
		_constructor: function() {
			FloatingMenu.createScope('Aloha.Block');
			this.blockTypes = new Registry();
			this.blocks = new Registry();
			this._highlightedBlocks = {};
		},

		/**
		 * Register initial event handlers. Called from block-plugin.
		 *
		 * @private
		 */
		registerEventHandlers: function() {
			var that = this;

			// Register event handlers for deactivating an Aloha Block
			jQuery(document).bind('click', function(event) {
				if (that._highlightedBlocks == {}) return;
				if (jQuery(event.target).closest('.aloha-sidebar-bar, .aloha-block-do-not-deactivate, .aloha-floatingmenu, .aloha-block').length > 0) {
					// If we are inside the sidebar, the floating menu or other elements which should not trigger the block deactivation, we do an early return.
					return;
				}
				BlockManager._deactivate_highlightedBlocks();
			});

			Aloha.bind('aloha-selection-changed', function(evt, selection, originalEvent) {
				// the following line is needed to de-select blocks when navigating over them using the mouse cursors.
				// We only want to execute it though, if we are not inside a block, as it would otherwise
				// directly deselect the block we just selected. This is just a hotfix and not the final solution yet.
				if (selection && jQuery(selection.getCommonAncestorContainer()).parents('.aloha-block').length > 0) {
					return;
				}
				that._deactivate_highlightedBlocks();
			});

			this.bind('block-selection-change', function(highlightedBlocks) {
				if (highlightedBlocks.length > 0) {
					that._activeBlock = highlightedBlocks[0];
				} else {
					that._activeBlock = null;
				}
			});


			// Implementation of block deletions, both when the block is the only selected element, and when the block is part of a bigger selection which should be deleted.
			Aloha.bind('aloha-command-will-execute', function(e, commandId) {


				// Internet Explorer *magically* sets the range to the "Body" object after deselecting everything. yeah :-D
				var onlyBlockSelected = (Aloha.getSelection().getRangeCount() === 0) // Firefox / Chrome
					|| (Aloha.getSelection().getRangeCount() === 1 && Aloha.getSelection().getRangeAt(0).endContainer === Aloha.getSelection().getRangeAt(0).startContainer && Aloha.getSelection().getRangeAt(0).endContainer === jQuery('body')[0]); // Internet explorer
				if (that._activeBlock && (commandId === 'delete' || commandId === 'forwarddelete') && onlyBlockSelected) {
					// Deletion when a block is currently selected
					that._activeBlock.destroy();
				} else if ((commandId === 'delete' || commandId === 'forwarddelete') && Aloha.getSelection().getRangeCount() === 1) {
					// Deletion when a block is inside a bigger selection currently
					// In this case, we check if we find an aloha-block. If yes, we delete it right away as the browser does not delete it correctly by default
					var traverseSelectionTree;
					traverseSelectionTree = function(selectionTree) {
						var el;
						for (var i=0, l=selectionTree.length; i<l; i++) {
							el = selectionTree[i];
							if (el.domobj.nodeType === 1) { // DOM node
								var $el = jQuery(el.domobj);
								if (el.selection === 'full' && $el.is('.aloha-block')) {
									$el.remove();
								} else {
									traverseSelectionTree(el.children);
								}
							}
						}
					};
					traverseSelectionTree(Aloha.Selection.getSelectionTree());
				}
			});


			// Enabling copies of the active block
			var currentlyCopying = false;
			var currentlyCutting = false;
			var selectionBeforeCopying = null;
			jQuery(window.document).keydown(function(e) {
				// IF: Ctrl/Command C pressed -- COPY
				if (that._activeBlock && (e.ctrlKey || e.metaKey) && e.which === 67) {
					currentlyCopying = true;
					//selectionBeforeCopying = new GENTICS.Utils.RangeObject(true);
					that._activeBlock.$element.attr('data-aloha-block-copy-only-block', 'true');
					GENTICS.Utils.Dom.selectDomNode(that._activeBlock.$element[0]);
				}

				// IF: Ctrl/Command X pressed -- CUT
				if (that._activeBlock && (e.ctrlKey || e.metaKey) && e.which === 88) {
					currentlyCutting = true;
					//selectionBeforeCopying = new GENTICS.Utils.RangeObject(true);
					that._activeBlock.$element.attr('data-aloha-block-copy-only-block', 'true');
					GENTICS.Utils.Dom.selectDomNode(that._activeBlock.$element[0]);
				}
			});
			jQuery(window.document).keyup(function(e) {
				// IF: Release of ctrl / command C
				if (!currentlyCutting && currentlyCopying && (e.which === 67 || e.which === 18 || e.which === 91)) {
					currentlyCopying = false;
					that._activeBlock.$element.removeAttr('data-aloha-block-copy-only-block');
					if (selectionBeforeCopying) {
						//selectionBeforeCopying.select();
						selectionBeforeCopying = null;
					}
				}
				// IF: Release of ctrl / command X
				if (currentlyCutting  && (e.which === 67 || e.which === 18 || e.which === 88)) {
					currentlyCutting = false;
				}
			});
		},

		_setActiveBlock: function() {

		},

		/**
		 * Blockify a given element with the instance defaults
		 * Directly called when one does jQuery.alohaBlock(instanceDefaults)
		 *
		 * @private
		 */
		_blockify: function(element, instanceDefaults) {
			var attributes, block, $element;
			$element = jQuery(element);

			var tagName = $element[0].tagName.toLowerCase();
			if (tagName !== 'span' && tagName !== 'div') {
				Aloha.Log.error('block/blockmanager', 'Blocks can only be created from <div> or <span> element. You passed ' + tagName + '.');
				return;
			}

			// TODO: check if object is already Block-ified

			attributes = this.getConfig($element, instanceDefaults);

			if (!this.blockTypes.has(attributes['aloha-block-type'])) {
				Aloha.Log.error('block/blockmanager', 'Block Type ' + attributes['aloha-block-type'] + ' not found!');
				return;
			}

			block = new (this.blockTypes.get(attributes['aloha-block-type']))($element);
			block.$element.addClass('aloha-block-' + attributes['aloha-block-type']);
			jQuery.each(attributes, function(k, v) {
				// We use the private API here, as we need to be able to set internal properties as well
				block._setAttribute(k, v);
			});


			// Register block
			this.blocks.register(block.getId(), block);
		},

		/**
		 * Deactivate all active blocks
		 *
		 * @private
		 */
		_deactivate_highlightedBlocks: function() {
			jQuery.each(jQuery.extend({}, this._highlightedBlocks), function(id) {
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
			return jQuery.extend(
				{},
				this.defaults,
				instanceDefaults,
				blockElement.data()
			);
		},

		/**
		 * Get a Block instance by id or DOM node. The DOM node can be either
		 * the DOM node of the wrapping element ($_element), the jQuery object of it,
		 * or the ID string.
		 *
		 * @param {String|DOMNode} idOrDomNode
		 * @return {block.block.AbstractBlock} Block instance
		 * @api
		 */
		getBlock: function(idOrDomNode) {
			var id, domNode;
			if (typeof idOrDomNode === 'object') {
				domNode = jQuery(idOrDomNode);
				if (domNode.hasClass('aloha-block-inner')) {
					// We are at the inner block wrapper, so we have to go up one level,
					// to find the block itself
					domNode = domNode.parent();
				}
				id = domNode.attr('id');
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
		 * Get all highlighted blocks indexed by block id
		 *
		 * @return {Object}
		 */
		_getHighlightedBlocks: function() {
			var _highlightedBlocks = {};
			jQuery.each(this.blocks.getEntries(), function(blockId, block) {
				if (block.isActive()) {
					_highlightedBlocks[blockId] = block;
				}
			});
			return _highlightedBlocks;
		},

		_setHighlighted: function(block) {
			this._highlightedBlocks[block.id] = true;
		},

		_setUnhighlighted: function(block) {
			delete this._highlightedBlocks[block.id];
		}
	}))();

	Aloha.Block = Aloha.Block || {};
	Aloha.Block.BlockManager = BlockManager;

	return BlockManager;
});
