/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define(['block/blockmanager'],
function(BlockManager) {
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
				that.activate();
				that.element.parents('.aloha-block').each(function() {
					var block = BlockManager.getBlock(this);
					delete activeBlocks[block.id];
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
			});
			
			this.element.bind('focus', function() {
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


			var domElement =this.element[0];
			var parentDomElement = this.element.parent()[0];
			var offset = GENTICS.Utils.Dom.getIndexInParent(domElement);
			var range = Aloha.Selection.getRangeObject();

			try {
				range.commonAncestorContainer = range.limitObject = editable[0];
				range.startContainer = range.endContainer = thisimg.parent()[0];
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

			// TODO: move to blockmanager or so
			Aloha.FloatingMenu.setScope('Aloha.Block.' + this.attr('block-type'));
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