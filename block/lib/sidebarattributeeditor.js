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

	/**
	 * @name block.sidebarattributeeditor
	 * @class Sidebar attribute editor singleton
	 */
	return new (Class.extend(
	/** @lends block.sidebarattributeeditor */
	{

		_sidebar: null,

		/**
		 * Initialize the sidebar attribute editor and bind events
		 */
		init: function() {
			var that = this;
			that._initSidebar();
			BlockManager.bind('block-selection-change', this._onBlockSelectionChange, this);
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
					block = this,
					editors = [];

				if (!schema) {
					// If no schema returned, we do not want to add panels.
					return;
				}
				that._sidebar.addPanel({
					title: block.getTitle(),
					expanded: true,
					onInit: function() {
						var $form = $('<form />');
						$form.submit(function() {
							// Disable form submission
							return false;
						});
						$.each(schema, function(attributeName, definition) {
							var editor = EditorManager.createEditor(definition);

							// Editor -> Block binding
							editor.bind('change', function(value) {
								block.attr(attributeName, value);
							});

							// Block -> Editor binding
							block.bind('change', function() {
								editor.setValue(block.attr(attributeName));
							})

							$form.append(editor.render());

							// Set initial value Block -> Editor
							editor.setValue(block.attr(attributeName));

							editors.push(editor);
						});
						this.setContent($form);
					},

					deactivate: function() {
						// On deactivating the panel, we need to tell each editor to deactivate itself,
						// so it can throw another change event.
						$.each(editors, function(index, editor) {
							editor._deactivate();
						});

						// This code is from the superclass
						this.isActive = false;
						this.content.parent('li').hide();
						this.effectiveElement = null;
					}
				});
			});
		}
	}))();
});
