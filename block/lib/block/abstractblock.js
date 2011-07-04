/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define(['block/blockmanager', 'core/floatingmenu'],
function(BlockManager, FloatingMenu) {
	"use strict";
	
	var
		jQuery = window.alohaQuery || window.jQuery, $ = jQuery,
		Aloha = window.Aloha;

	var AbstractBlock = Class.extend({
		
		/**
		 * @var string ID of the assigned element. Not sure if it exists.
		 */
		id: null,
		
		/**
		 * @var jQuery element
		 */
		element: null,
		
		/**
		 * @var jQuery element
		 */
		_constructor: function(element) {
			var that = this;
			this.id = element.attr('id');
			this.element = element;

			// Register event handlers for activating an Aloha Block
			this.element.bind('click', function(event) {
				var activeBlocks = BlockManager.getActiveBlocks();
				delete activeBlocks[that.id];

				that._selectBlock(event);

				// Set scope to current block
				FloatingMenu.setScope('Aloha.Block.' + that.attr('block-type'));

				that.activate();
				that.element.parents('.aloha-block').each(function() {
					var block = BlockManager.getBlock(this);
					delete activeBlocks[block.id];
					
					block._selectBlock();
					block.activate();
				});
				$.each(activeBlocks, function() {
					this.deactivate();
				});

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
			var innerElement = $('<span class="aloha-block-inner" />');
			var result = this.render(innerElement);
			// Convenience for simple string content
			if (typeof result === 'string') {
				innerElement.html(result);
			}
			this.element.empty();
			this.element.append(innerElement);
			
			innerElement.find('.aloha-editable').aloha();
			this._renderToolbar();
		},

		_renderToolbar: function() {
			this.element.prepend('<span class="aloha-block-draghandle"></span>');
		},

		attr: function(attributeNameOrObject, attributeValue) {
			var me = this;
			if (arguments.length == 2) {
				this.setAttribute(attributeNameOrObject, attributeValue);
			} else if (typeof attributeNameOrObject === 'object') {
				$.each(attributeNameOrObject, function(key, value) {
					me.setAttribute(key, value);
				})
			} else if (typeof attributeNameOrObject === 'string') {
				return this.getAttribute(attributeNameOrObject);
			} else {
				return this.getAttributes();
			}
		},
		
		setAttribute: function(name, value) {
			if (name === 'about') {
				this.element.attr('about', value);
			} else {
				this.element.attr('data-' + name, value);	
			}
		},

		getAttribute: function(name) {
			return this.getAttributes()[name];
		},

		getAttributes: function() {
			var element = this.element;

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
