/* block-plugin.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2012 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 * 
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 * 
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
 */
/**
 * @name block
 * @namespace Block plugin
 */
define([
	'aloha',
	'aloha/plugin',
	'jquery',
	'aloha/contenthandlermanager',
	'block/blockmanager',
	'block/sidebarattributeeditor',
	'block/block',
	'block/editormanager',
	'block/blockcontenthandler',
	'block/editor',
	'ui/ui',
	'ui/toggleButton',
	'i18n!block/nls/i18n',
	'i18n!aloha/nls/i18n',
	'jqueryui'
], function(
	Aloha,
 	Plugin,
 	jQuery,
 	ContentHandlerManager, 
	BlockManager,
 	SidebarAttributeEditor,
 	block,
 	EditorManager,
 	BlockContentHandler,
 	editor,
 	Ui,
 	ToggleButton, 
	i18n,
	i18nCore
) {
	"use strict";

	var defaultRootTags = ['div', 'span'];

	/**
	 * Register the 'block' plugin
	 */
	var BlockPlugin = Plugin.create( 'block', {
		
		/**
		 * default button configuration
		 */
		config: [], 

		settings: {},

		init: function () {
			var that = this;

			// set default root tags
			if (!this.settings.rootTags) {
				this.settings.rootTags = defaultRootTags;
			}

			// Register default block types			
			BlockManager.registerBlockType('DebugBlock', block.DebugBlock);
			BlockManager.registerBlockType('DefaultBlock', block.DefaultBlock);
			BlockManager.registerBlockType('EmptyBlock', block.EmptyBlock);

			// Register default editors
			EditorManager.register('string', editor.StringEditor);
			EditorManager.register('number', editor.NumberEditor);
			EditorManager.register('url', editor.UrlEditor);
			EditorManager.register('email', editor.EmailEditor);
			EditorManager.register('select', editor.SelectEditor);
			EditorManager.register('button', editor.ButtonEditor);

			// register content handler for block plugin
			ContentHandlerManager.register('block', BlockContentHandler);

			BlockManager.setDragDropState(that.isDragDropEnabled());
			BlockManager.registerEventHandlers();
			BlockManager.initializeBlockLevelDragDrop();

			Aloha.bind('aloha-plugins-loaded', function () {
				that._createBlocks();
				if (false !== that.settings['sidebarAttributeEditor']) {
					SidebarAttributeEditor.init();
				}
			});

			// create the toolbar buttons
			this.createButtons();

			// set the dropzones for the initialized editable
			Aloha.bind('aloha-editable-created', function (e, editable) {
				that.setDropzones(editable.obj);
 			});

			// apply specific configuration if an editable has been activated
			Aloha.bind('aloha-editable-activated', function (e, params) {
				that.applyButtonConfig(params.editable);
			});

		},

		/**
		 * Applies a configuration specific for an editable buttons not
		 * available in this configuration are hidden
		 *
		 * @param {!Object}
		 *        The editable which has become active and for which to
		 *        apply the button config.
		 */
		applyButtonConfig: function (editable) {
			if (this._isDragdropToggleEnabled(editable)) {
				this._toggleDragDropButton.show();
				this._toggleDragDropButton.setState(this._getDragdropState(editable));
			} else {
				this._toggleDragDropButton.hide();
			}
		},

		/**
		 * Test whether toggleability of the dragndrop feature is turned on.
		 *
		 * @param {!Aloha.Editable} editable
		 *        The editable for which toggling may be turned on, if
		 *        toggling of the dragndrop feature is configured
		 *        per-editable.
		 *        Only used if !toggleDragdropGlobal.
		 * @return {boolean}
		 *        Whether the toggleability of the dragndrop feature is
		 *        turned on either globally, or for the given editable.
		 */
		_isDragdropToggleEnabled: function (editable) {
			var config = this.getEditableConfig(editable.obj);

			// toggle drag & drop option can be set as
			// config: {'toggeleDragdrop': true} or
			// config: ['toggleDragdrop']
			var toggleDragdropConfigured = function() {
				return (config[0] === "toggleDragdrop") ||
								config.toggleDragdrop == true   ||
								config.toggleDragdrop == 'true' ||
								config.toggleDragdrop == 1      ||
								config.toggleDragdrop == '1'
			};

			var toggleGloballyOrPerEditable =
				((this.settings && this.settings.config && this.settings.config.toggleDragdropGlobal) ||
				 toggleDragdropConfigured());
			return toggleGloballyOrPerEditable && this.isDragDropEnabled();
		},

		/**
		 * Gets the current toggle state of the dragndrop feature.
		 *
		 * @param {!Aloha.Editable} editable
		 *        The editable that is used to track the per-editable
		 *        dragdrop toggled state.
		 *        Only used if !toggleDragdropGlobal.
		 * @return {boolean}
		 *        Whether the dragdrop feature is turned on either
		 *        globally, or for the given editable.
		 */
		_getDragdropState: function (editable) {
			return ((this.settings && this.settings.config && this.settings.config.toggleDragdropGlobal) ?
					BlockManager.getDragDropState() :
					editable.obj.data("block-dragdrop"));
		},

		/**
		 * Toggles the dragndrop state.
		 *
		 * If toggleDragdropGlobal is turned on, will toggle the
		 * dragndrop state on each existing editable.
		 *
		 * If toggleDragdropGlobal is not turned on, will toggle the
		 * dragndrop state only for the given editable.
		 *
		 * @param {!Aloha.Editable} editable
		 *        The editable that is used to track the per-editable
		 *        dragdrop toggled state.
		 *        Only used if !toggleDragdropGlobal.
		 */
		_toggleDragdropState: function (editable) {
			if (this.settings && this.settings.config && this.settings.config.toggleDragdropGlobal) {
				var dragdropState = !BlockManager.getDragDropState();
				// Setting the dragdrop state in the block manager
				// ensures that newly created editables will receive the
				// correct "block-dragdrop" data attribute.
				BlockManager.setDragDropState(dragdropState);
				for (var i = 0; i < Aloha.editables.length; i++) {
					var editable = Aloha.editables[i];
					this._setDragDropStateForEditable(editable.obj, dragdropState);
				}
			} else {
				var toggleState = !editable.obj.data("block-dragdrop");
				this._setDragDropStateForEditable(editable.obj, toggleState);
			}
		},

		createButtons: function () {
			var that = this;

			this._toggleDragDropButton = Ui.adopt( "toggleDragDrop", ToggleButton, {
				tooltip: i18n.t( 'button.toggledragdrop.tooltip' ),
				icon: 'aloha-icon aloha-icon-toggledragdrop',
				scope: 'Aloha.continuoustext',
				click: function() {
					that._toggleDragdropState(Aloha.activeEditable);
				}
			});
		},

		/**
		 * Set available dropzones for the given editable.
		 * @return void 
		 */
		setDropzones: function (editable) {
			var that = this;
			var config = that.getEditableConfig(editable);
			var dropzones = (config && config.dropzones) || that.settings.dropzones;

			if ( dropzones ) {
				editable.data( 'block-dropzones', dropzones );	
			} else {
				// if dropzones are undefined all editables should be dropzones
				editable.data( 'block-dropzones', [".aloha-editable"] );	
			}
		},

		/**
		 * Checks whether drag & drop is enabled for blocks.
		 * @return boolean 
		 */
		isDragDropEnabled: function() {
			if ( this.settings && typeof this.settings.dragdrop !== "undefined" ) {
				// Normalize config
				return (
					this.settings.dragdrop === true   ||
					this.settings.dragdrop === 'true' ||
					this.settings.dragdrop === 1      ||
					this.settings.dragdrop === '1'
				);
			} else {
				return true; // by default dragdrop is activated 
			}
		},

		/**
		 * Create blocks from default settings
		 */
		_createBlocks: function() {
			if (!this.settings.defaults) {
				this.settings.defaults = {};
			}
			jQuery.each( this.settings.defaults, function(selector, instanceDefaults) {
				jQuery( selector ).alohaBlock( instanceDefaults );
			});
		},

		/**
		 * Set the drag & drop state for the given editable.
		 */
		_setDragDropStateForEditable: function($editable, state) {
			$editable.data( "block-dragdrop", state );

			if ( $editable.hasClass("ui-sortable") ) {
				$editable.sortable( "option", "disabled", !state );	
			}

			$editable.find( ".aloha-block.ui-draggable" ).each( function() {
				jQuery( this ).draggable( "option", "disabled", !state );	
			});

			$editable.find( ".aloha-block-handle" ).each( function() {
				if (state) {
					jQuery( this ).addClass( "aloha-block-draghandle" );	
				} else {
					jQuery( this ).removeClass( "aloha-block-draghandle" );	
				}
			});
		}
	});

	/**
	 * See (http://jquery.com/).
	 * @name jQuery.fn
	 * @class
	 * See the jQuery Library  (http://jquery.com/) for full details.  This just
	 * documents the function and classes that are added to jQuery by this plug-in.
	 */

	/**
	 * Create Aloha blocks from the matched elements
	 * @api
	 * @param {Object} instanceDefaults
	 */
	jQuery.fn.alohaBlock = function(instanceDefaults) {
		instanceDefaults = instanceDefaults || {};
		jQuery( this ).each( function(index, element) {
			BlockManager._blockify( element, instanceDefaults );
		});

		// Chain
		return jQuery( this );
	};

	/**
	 * Un"block" the matched elements. If matched elements were made blocks
	 * (by calling alohaBlock() on them), they will no longer be blocks.
	 * 
	 * @api
	 */
	jQuery.fn.mahaloBlock = function() {
		jQuery(this).each(function (index, element) {
			BlockManager._unblockify(element);
		});
	};

	// jQuery.fn.mahaloBlock = TODO
	return BlockPlugin;
});
