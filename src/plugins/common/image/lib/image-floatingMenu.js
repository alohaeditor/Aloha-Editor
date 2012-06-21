/*global documents: true define: true */
/*!
 * Aloha Editor
 * Author & Copyright (c) 2011 Gentics Software GmbH
 * aloha-sales@gentics.com
 * Licensed under the terms of http://www.aloha-editor.com/license.html
 * 
 * Author : Nicolas Karageuzian - http://nka.me
 */
define(['jquery',
        'util/class',
		'i18n!image/nls/i18n',
		'i18n!aloha/nls/i18n',
		'ui/component',
		'ui/toolbar',
	    'ui/button',
	    'ui/toggleButton',
	    'ui/port-helper-attribute-field'],
function (aQuery, Class, i18n, i18nCore, Component, Toolbar, Button, ToggleButton, AttributeField) {
	'use strict';
	var jQuery = aQuery;
	var $ = aQuery;
	var GENTICS = window.GENTICS;
	var Aloha = window.Aloha;
	/**
     * Toolbar elements for Image plugin
     *
     * @class MyClass
     */
	return Class.extend({
        /**
         * Empty constructor
         *
         * @method
         * @constructor
         */
		_constructor: function () {
 
		},

         /**
          * Initialize Floating menu buttons according to plugin config
          */
        init: function (plugin) {
			var imageFloatingMenu = this,
				tabInsert = i18nCore.t('floatingmenu.tab.insert'),
				tabImage = i18n.t('floatingmenu.tab.img'),
				tabFormatting = i18n.t('floatingmenu.tab.formatting'),
				tabCrop = i18n.t('floatingmenu.tab.crop'),
				tabResize = i18n.t('floatingmenu.tab.resize');

			imageFloatingMenu.plugin = plugin;
			plugin.floatingMenuControl = imageFloatingMenu;

			Toolbar.createScope(plugin.name, 'Aloha.empty');

			imageFloatingMenu._addUIInsertButton();
			imageFloatingMenu._addUIMetaButtons();
			imageFloatingMenu._addUIResetButton();
			imageFloatingMenu._addUIAlignButtons();
			imageFloatingMenu._addUIMarginButtons();
			imageFloatingMenu._addUICropButtons();
			imageFloatingMenu._addUIResizeButtons();
			imageFloatingMenu.__addUIAspectRatioToggleButton();

//			 TODO fix the function and reenable this button 
//			imageFloatingMenu._addNaturalSizeButton();
		},

		/**
		 * Adds the aspect ratio toggle button to the floating menu
		 */
		__addUIAspectRatioToggleButton: function () {
			var plugin = this.plugin;

			Component.define("imageCnrRatio", ToggleButton, {
				tooltip: i18n.t('button.toggle.tooltip'),
				icon: 'aloha-icon-cnr-ratio',
				click: function(){
					plugin.toggleKeepAspectRatio();
				}
			});

			// If the setting has been set to a number or false we need to activate the 
			// toggle button to indicate that the aspect ratio will be preserved.
			if (plugin.settings.fixedAspectRatio !== false) {
				var toggleButton = Component.getGlobalInstance("imageCnrRatio");
				toggleButton.setState(true);
				plugin.keepAspectRatio = true;
			}
		},
		
		/**
		 * Adds the reset button to the floating menu for the given tab 
		 */
		_addUIResetButton: function () {
			var plugin = this.plugin;

			Component.define("imageCnrReset", Button, {
				tooltip: i18n.t('Reset'),
				icon: 'aloha-icon-cnr-reset',
				click: function(){
					plugin.reset();
				}
			});
		},
		
		/**
		 * Adds the insert button to the floating menu
		 */
		_addUIInsertButton: function () {
			var plugin = this.plugin;

			Component.define("insertImage", Button, {
				tooltip: i18n.t('button.addimg.tooltip'),
				icon: 'aloha-button aloha-image-insert',
				click: function(){
					plugin.insertImg();
				}
			});

			this.insertImgButton = Component.getGlobalInstance("insertImage");
		},

        /**
         * Adds the ui meta fields (search, title) to the floating menu. 
         */
		_addUIMetaButtons: function () {
			var plugin = this.plugin;
			
			this.imgSrcField = new AttributeField({
				label: i18n.t('field.img.src.label'),
				tooltip: i18n.t('field.img.src.tooltip'),
				name: 'imageSource'
			});
			this.imgSrcField.setObjectTypeFilter(plugin.objectTypeFilter);
			
			this.imgTitleField = new AttributeField({
				label: i18n.t('field.img.title.label'),
				tooltip: i18n.t('field.img.title.tooltip'),
				name: 'imageTitle'
			});
			this.imgTitleField.setObjectTypeFilter();
		},
		
		/**
		 * Adds the ui align buttons to the floating menu
		 */
		_addUIAlignButtons: function () {
			var plugin = this.plugin;
		
			Component.define("imageAlignLeft", Button, {
				tooltip: i18n.t('button.img.align.left.tooltip'),
				icon: 'aloha-img aloha-image-align-left',
				click : function () {
					var el = jQuery(plugin.getPluginFocus());
					el.add(el.parent()).css('float', 'left');
				}
			});
			
			Component.define("imageAlignRight", Button, {
				tooltip: i18n.t('button.img.align.right.tooltip'),
				icon: 'aloha-img aloha-image-align-right',
				click : function () {
					var el = jQuery(plugin.getPluginFocus());
					el.add(el.parent()).css('float', 'right');
				}
			});

			Component.define("imageAlignNone", Button, {
				tooltip: i18n.t('button.img.align.none.tooltip'),
				icon: 'aloha-img aloha-image-align-none',
				click : function () {
					var el = jQuery(plugin.getPluginFocus());
					el.add(el.parent()).css({
						'float': 'none',
						display: 'inline-block'
					});
				}
			});
		},
		
		/**
		 * Adds the ui margin buttons to the floating menu
		 */
		_addUIMarginButtons: function () {
			var plugin = this.plugin;

			Component.define("imageIncPadding", Button, {
				tooltip: i18n.t('padding.increase'),
				icon: 'aloha-img aloha-image-padding-increase',
				click: function () {
					jQuery(plugin.getPluginFocus()).increase('padding');
				}
			});
			
			Component.define("imageDecPadding", Button, {
				tooltip: i18n.t('padding.decrease'),
				icon: 'aloha-img aloha-image-padding-decrease',
				click: function () {
					jQuery(plugin.getPluginFocus()).decrease('padding');
				}
			});
		},
		
		/**
		 * Adds the crop buttons to the floating menu
		 */		
		_addUICropButtons: function () {
			var plugin = this.plugin;

			Toolbar.createScope('Aloha.img', ['Aloha.global']);

			Component.define("imageCropButton", ToggleButton, {
				tooltip: i18n.t('Crop'),
				icon: 'aloha-icon-cnr-crop',
				click: function () {
					if (this.getState()) {
						plugin.crop();
					} else {
						plugin.endCrop();
					}
				}
			});

			this.cropButton = Component.getGlobalInstance("imageCropButton");
		},

        /**
         * Adds the resize buttons to the floating menu
         */	
		_addUIResizeButtons: function () {
			var plugin = this.plugin;

			// Manual resize fields
			this.imgResizeHeightField = new AttributeField({
				label:  i18n.t('height'),
				name: "imageResizeHeight",
				width: 50
			});
			this.imgResizeHeightField.maxValue = plugin.settings.maxHeight;
			this.imgResizeHeightField.minValue = plugin.settings.minHeight;
			
			this.imgResizeWidthField = new AttributeField({
				label:  i18n.t('width'),				
				name: "imageResizeWidth",
				width: 50
			});
			this.imgResizeWidthField.maxValue = plugin.settings.maxWidth;
			this.imgResizeWidthField.minValue = plugin.settings.minWidth;
 		},

		/**
		 * Adds the natural size button to the floating menu
		 */
		/*
		  TODO currently deactivated see TODO at call site above.
		_addNaturalSizeButton: function () {
			var plugin = this.plugin;

			Component.define("imageNaturalSize", Button, {
				icon: 'aloha-img aloha-image-size-natural',
				label: i18n.t('size.natural'),
				click: function () {
					plugin.resetSize();
				}
			});
		},
		*/

		/**
		 * Sets Toolbar scope
		 */
		setScope: function () {
			Toolbar.setScope(this.plugin.name);
		},

		/**
		 * 
		 */
		activateView: function (name) {
			Toolbar.activateTabOfButton(name);
		},

		/**
		 * Redraws UI
		 */
		doLayout: function () {
			// Implementation was removed while porting this plugin to
			// the jqueryui toolbar because it seems to be a hack that
			// is not needed with the new implementation.
		}
    });
});
	
