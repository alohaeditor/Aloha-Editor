/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define(['block/lifecyclemanager'],
function(LifecycleManager) {
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
		 * Only used for caching; always use getElement() to access it!
		 * @hide
		 */
		element: null,
		
		/**
		 * @var jQuery element
		 */
		_constructor: function(element) {
			this.id = element.attr('id');
			this.element = element;
			
		},
		
		/**
		 * Activated when the block is clicked
		 */
		activate: function() {
			this.getElement().addClass('aloha-block-active');
		},
		
		deactivate: function() {
			this.getElement().removeClass('aloha-block-active');
		},
		
		isActive: function() {
			return this.getElement().hasClass('aloha-block-active');
		},
		
		getId: function() {
			return this.id;
		},
		
		/**
		 * Get the element
		 * @return
		 */
		getElement: function() {
			if (this.element.parent().length === 0) {
				// this.element has been disconnected from the current page (i.e. by copy/paste)
				// so we need to find the current instance on the page again
				this.element = $('#' + this.id);
			}
			return this.element;
		},

		render: function() {
			// TODO implement render
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
				this.getElement().attr('about', value);
			} else {
				this.getElement().attr('data-' + name, value);	
			}
		},
		getAttribute: function(name) {
			return this.getAttributes()[name];
		},
		getAttributes: function() {
			var element = this.getElement();

			return $.extend({}, element.data(), {
				about: element.attr('about')
			});
		}
	});
	return AbstractBlock;
});