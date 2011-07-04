/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define(['block/blockmanager', 'core/observable', 'core/floatingmenu'],
function(BlockManager, Observable, FloatingMenu) {
	"use strict";
	
	var
		jQuery = window.alohaQuery || window.jQuery, $ = jQuery,
		Aloha = window.Aloha;

	var AbstractBlock = Class.extend(Observable, {
		
		/**
		 * @event change
		 */
		
		/**
		 * @var {String} Title for the block.
		 */
		title: null,
		
		/**
		 * @var string ID of the assigned element. Not sure if it exists.
		 */
		id: null,
		
		/**
		 * @var jQuery element
		 */
		element: null,

		/**
		 * "inline" or "block", will be guessed from the original block dom element
		 */
		_domElementType: null,

		/**
		 * @var jQuery element
		 */
		_constructor: function(element) {
			var that = this;
			this.id = element.attr('id');
			this.element = element;
			

			this._domElementType = GENTICS.Utils.Dom.isBlockLevelElement(element[0]) ? 'block' : 'inline';

			this.element.addClass('aloha-block');
			this.element.addClass('aloha-block-' + this.attr('block-type'));

			// Register event handlers for activating an Aloha Block
			this.element.bind('click', function(event) {
				var previouslyActiveBlocks = BlockManager.getActiveBlocks();
				var activeBlocks = [];
				
				delete previouslyActiveBlocks[that.id];

				that._selectBlock(event);

				// Set scope to current block
				FloatingMenu.setScope('Aloha.Block.' + that.attr('block-type'));

				that.activate();
				activeBlocks.push(that);

				that.element.parents('.aloha-block').each(function() {
					var block = BlockManager.getBlock(this);
					delete previouslyActiveBlocks[block.id];
					
					block._selectBlock();
					block.activate();
					activeBlocks.push(block);
				});
				$.each(previouslyActiveBlocks, function() {
					this.deactivate();
				});
				
				BlockManager.trigger('blockSelectionChange', activeBlocks);

				return false;
			});
			
			// The "contentEditableSelectionChange" event listens on
			// mouseDown and focus, and we need to suppress these events
			// such that the editable does not update its selection.
			this.element.bind('mousedown', function() {
				// TODO: if you right-click on a block, this does not show
				// the context menu. So, we somehow need to handle this differently
				return false;
			}).bind('focus', function() {
				return false;
			}).bind('dblclick', function() {
				return false;
			});
			this.init();
		},

		/**
		 * Template method to initialize the block
		 */
		init: function() {},

		getSchema: function() {
			return {};
		},

		/**
		 * Template Method which should return the block title
		 */
		getTitle: function() {
			return this.title;
		},

		/**
		 * Activated when the block is clicked
		 */
		activate: function() {
			if (this.isActive()) {
				return;
			}
			// TODO: also activate surrounding editable if exists.
			this.element.addClass('aloha-block-active');
		},
		
		_selectBlock: function(event) {
			if (!event || $(event.target).is('.aloha-editable') || $(event.target).parents('.aloha-block, .aloha-editable').first().is('.aloha-editable')) {
				// It was clicked on a Aloha-Editable inside a block; so we do not
				// want to select the whole block and do an early return.
				return;
			}

			var parentDomElement = this.element.parent()[0];
			var offset = GENTICS.Utils.Dom.getIndexInParent(this.element[0]);
			var range = Aloha.Selection.getRangeObject();

			// TODO: do we need the "try" block? Taken from image plugin.
			try {
				range.commonAncestorContainer = range.limitObject = parentDomElement;
				range.startContainer = range.endContainer = parentDomElement;
				range.startOffset = offset;
				range.endOffset = offset+1;
				range.correctRange();
				range.select();
			} catch(err) {
				range = new GENTICS.Utils.RangeObject({
					startContainer: parentDomElement,
					endContainer: parentDomElement,
					startOffset: offset,
					endOffset: offset+1
				});
				range.select();
				Aloha.Selection.updateSelection();
			}
		},
		
		deactivate: function() {
			if (!this.isActive()) {
				return;
			}
			this.element.removeClass('aloha-block-active');
		},
		
		isActive: function() {
			return this.element.hasClass('aloha-block-active');
		},
		
		getId: function() {
			return this.id;
		},

		render: function() {
			// TODO implement render
		},

		_renderAndSetContent: function() {
			var innerElement = $('<' + this._getWrapperElementType() + ' class="aloha-block-inner" />');
			var result = this.render(innerElement);
			// Convenience for simple string content
			if (typeof result === 'string') {
				innerElement.html(result);
			}
			this.element.empty();
			this.element.append(innerElement);

			this.createEditables(innerElement);

			this._renderToolbar();
		},

		_getWrapperElementType: function() {
			return this._domElementType === 'block' ? 'div' : 'span';
		},

		/**
		 * Create editables from the inner content that was
		 * rendered for this block.
		 *
		 * Override to use a custom implementation and to pass
		 * special configuration to .aloha()
		 */
		createEditables: function(innerElement) {
			innerElement.find('.aloha-editable').aloha();
		},

		_renderToolbar: function() {
			this.element.prepend('<span class="aloha-block-draghandle"></span>');
		},

		attr: function(attributeNameOrObject, attributeValue) {
			var that = this, attributeChanged = false;

			if (arguments.length === 2) {
				if (this._getAttribute(attributeNameOrObject) !== attributeValue) {
					attributeChanged = true;
				}
				this._setAttribute(attributeNameOrObject, attributeValue);
			} else if (typeof attributeNameOrObject === 'object') {
				$.each(attributeNameOrObject, function(key, value) {
					if (that._getAttribute(key) !== value) {
						attributeChanged = true;
					}
					that._setAttribute(key, value);
				});
			} else if (typeof attributeNameOrObject === 'string') {
				return this._getAttribute(attributeNameOrObject);
			} else {
				return this._getAttributes();
			}
			if (attributeChanged) {
				this._renderAndSetContent();
				this.trigger('change');
			}
			return this;
		},
		
		_setAttribute: function(name, value) {
			if (name === 'about') {
				this.element.attr('about', value);
			} else {
				this.element.attr('data-' + name, value);	
			}
		},

		_getAttribute: function(name) {
			return this._getAttributes()[name];
		},

		_getAttributes: function() {
			var element = this.element;
			
			// TODO: element.data() not always up-to-date. We need to use the attributes instead.
			return $.extend({}, element.data(), {
				about: element.attr('about')
			});
		},

		setContent: function(content) {
			// TODO adjust to inner element
			this.element.html(content);
		}
	});
	return AbstractBlock;
});
