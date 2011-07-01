/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define("block/block", ['require'],
function(require) {
	"use strict";
	
	var
		jQuery = window.alohaQuery || window.jQuery, $ = jQuery,
		Aloha = window.Aloha;

	var Block = Class.extend({
		
		/**
		 * @var string ID of the assigned element. Not sure if it exists.
		 */
		id: null,
		
		/**
		 * @var jQuery element
		 * Only used for caching; always use getElement() to access it!
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
		
		getElement: function() {
			if (this.element.parent().length === 0) {
				// this.element has been disconnected from the current page (i.e. by copy/paste)
				// so we need to find the current instance on the page again
				this.element = $('#' + this.id);
			}
			return this.element;
		},
		
		// TODO: we need a helper which updates "element", e.g. on move
		
		render: function() {
			var LifecycleManager = require("block/lifecyclemanager"); // Circular dependency, that's why we need to load it differently.
			
			var rendererName, renderer, element;
			
			element = this.getElement();
			
			rendererName = element.data('renderer');
			renderer = LifecycleManager.getRenderer(rendererName);
			if (!renderer) {
				// TODO: use message subsystem later
				Aloha.Log.error('Aloha.Block', 'Renderer "' + rendererName + '" not found');
				return;
			}
			element.html(renderer.render(element.data()));
		}
	});
	
	return Block;
});