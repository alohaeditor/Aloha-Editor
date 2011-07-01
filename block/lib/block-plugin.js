/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define([
	'block/lifecyclemanager',
	'block/block/defaultblock'
], function(LifecycleManager) {
	"use strict";
	var
		jQuery = window.alohaQuery || window.jQuery, $ = jQuery,
		Aloha = window.Aloha;

	/**
	 * register the plugin with unique name
	 */
	var BlockPlugin = new (Aloha.Plugin.extend({
		settings: {},
		_constructor: function(){
			this._super('block');
		},

		init: function () {
			LifecycleManager.registerEventHandlers();
			// find all blocks marked with .aloha-block + this.config.defaults
			// run initializer on this
			// TODO: Extract to new method -> immer wenn content dazu kommt!
			// 
			// in loop
			jQuery('.aloha-block').alohaBlock();
		}
	}))();
	
	
	/**
	 * @api
	 */
	$.fn.alohaBlock = function(instanceDefaults) {
		instanceDefaults = instanceDefaults || {};
		$(this).each(function(index, element) {
			LifecycleManager.blockify(element, instanceDefaults);
		});

		// Chain
		return $(this);
	};
	
	// $.fn.mahaloBlock = TODO
	return BlockPlugin;
});