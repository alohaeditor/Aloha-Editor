/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define('block/block-plugin', [
	'block/lifecyclemanager',
	'block/renderer/debugrenderer',
	'block/renderer/defaultrenderer'
], function(BlockLifecycleManager) {
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
			BlockLifecycleManager.registerEventHandlers();
			// find all blocks marked with .aloha-block + this.config.defaults
			// run initializer on this
			// TODO: Extract to new method -> immer wenn content dazu kommt!
			// 
			// in loop
			jQuery('.aloha-block').alohaBlock({});
		}
	}))();
	
	
	/**
	 * @api
	 */
	$.fn.alohaBlock = function(instanceDefaults) {
		$(this).each(function(index, element) {
			BlockLifecycleManager.blockify(element, instanceDefaults);
		});

		// Chain
		return $(this);
	};
	
	// $.fn.mahaloBlock = TODO
	return BlockPlugin;
});
	
	// $.fn.mahaloBlock = TODO