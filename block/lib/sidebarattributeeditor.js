/*!
 * Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH
 * aloha-sales@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */
 
define(['block/blockmanager', 'core/sidebar', 'block/editormanager'],
function(BlockManager, Sidebar, EditorManager) {
	"use strict";

	// Prepare
	var
		jQuery = window.alohaQuery || window.jQuery,
		$ = jQuery;

	return new (Class.extend({
		
		_sidebar: null,

		init: function() {
			var that = this;
			that._initSidebar();
			BlockManager.bind('blockSelectionChange', this._onBlockSelectionChange, this);
		},
		_initSidebar: function() {
			this._sidebar = new Sidebar({
				position: 'right',
				width: 250,
				isOpen: true,
				panels: []
			});
		},
		
		/**
		 * @param {Array} selectedBlocks
		 */
		_onBlockSelectionChange: function(selectedBlocks) {
			var that = this;
			
			// TODO: Clearing the whole sidebar might not be what we want; instead we might only want
			// to clear certain panels.
			that._sidebar.container.find('.aloha-sidebar-panels').children().remove();
			that._sidebar.panels = {};

			$.each(selectedBlocks, function() {
				var schema = this.getSchema(),
					block = this;

				that._sidebar.addPanel({
					title: block.getTitle(),
					onInit: function() {
						var $form = $('<form />');
						$.each(schema, function(attributeName, definition) {
							var editor = EditorManager.createEditor(definition);
							editor.bind('change', function(value) {
								block.attr(attributeName, value);
							});
							$form.append(editor.render());
						});
						this.setContent($form);
					}
				});
			});
		}
	}))();
});