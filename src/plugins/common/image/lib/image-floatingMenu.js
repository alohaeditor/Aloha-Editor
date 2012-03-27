/*global documents: true define: true */
/*!
 * Aloha Editor
 * Author & Copyright (c) 2011 Gentics Software GmbH
 * aloha-sales@gentics.com
 * Licensed under the terms of http://www.aloha-editor.com/license.html
 * 
 * Author : Nicolas Karageuzian - http://nka.me
 */
define(['aloha/jquery', 'i18n!image/nls/i18n', 'i18n!aloha/nls/i18n', 'aloha/floatingmenu'],
function (aQuery, i18n, i18nCore, FloatingMenu) {
	'use strict';
	var jQuery = aQuery;
	var $ = aQuery;
	var GENTICS = window.GENTICS;
	var Aloha = window.Aloha;
	/**
     * FloatingMenu elements for Image plugin
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

			FloatingMenu.createScope(plugin.name, 'Aloha.empty');

			if (plugin.settings.ui.insert) {
				var tabId = plugin.settings.ui.oneTab ? tabImage : tabInsert; 
				imageFloatingMenu._addUIInsertButton(tabId);
			}
				
			if (plugin.settings.ui.meta) {
				var tabId = plugin.settings.ui.oneTab ? tabImage : tabImage;
				imageFloatingMenu._addUIMetaButtons(tabId);
			}
				
			if (plugin.settings.ui.reset) {
				var tabId = plugin.settings.ui.reset ? tabImage : tabImage;
				imageFloatingMenu._addUIResetButton(tabId);
			}
					
			if (plugin.settings.ui.align) {
				var tabId = plugin.settings.ui.oneTab ? tabImage : tabFormatting;
				imageFloatingMenu._addUIAlignButtons(tabId);
			}

			if (plugin.settings.ui.margin) {
				var tabId = plugin.settings.ui.oneTab ? tabImage : tabFormatting;
				imageFloatingMenu._addUIMarginButtons(tabId);
			}

			if (plugin.settings.ui.crop) {
				var tabId = plugin.settings.ui.oneTab ? tabImage : tabCrop;
				imageFloatingMenu._addUICropButtons(tabId);
			}
				
			if (plugin.settings.ui.resize) {
				var tabId = plugin.settings.ui.oneTab ? tabImage : tabResize;
				imageFloatingMenu._addUIResizeButtons(tabId);
			}
				
			if (plugin.settings.ui.aspectRatioToggle) {
				var tabId = plugin.settings.ui.oneTab ? tabImage : tabResize;
				imageFloatingMenu.__addUIAspectRatioToggleButton(tabId);
			}

//			 TODO fix the function and reenable this button 
//			var tabId = plugin.settings.ui.oneTab ? tabImage : tabResize;
//			imageFloatingMenu._addNaturalSizeButton(tabId);
		},

		/**
		 * Adds the aspect ratio toggle button to the floating menu
		 */
		__addUIAspectRatioToggleButton: function (tabId) {
			var plugin = this.plugin;
			var toggleButton = new Aloha.ui.Button({
				'size' : 'small',
				'tooltip' : i18n.t('button.toggle.tooltip'),
				'toggle' : true,
				'iconClass' : 'cnr-ratio',
				'onclick' : function (btn, event) {
					plugin.toggleKeepAspectRatio();
				}
			});
			

			// If the setting has been set to a number or false we need to activate the 
			// toggle button to indicate that the aspect ratio will be preserved.
			if (plugin.settings.fixedAspectRatio !== false) {
				toggleButton.pressed = true;
				plugin.keepAspectRatio = true;
			}
			
			FloatingMenu.addButton(
					plugin.name,
					toggleButton,
					tabId,
					20
			);
		},
		
		/**
		 * Adds the reset button to the floating menu for the given tab 
		 */
		_addUIResetButton: function (tabId) {
			var plugin = this.plugin;
			// Reset button
			var resetButton = new Aloha.ui.Button({
				'size' : 'small',
				'tooltip' : i18n.t('Reset'),
				'toggle' : false,
				'iconClass' : 'cnr-reset',
				'onclick' : function (btn, event) {
					plugin.reset();
				}
			});

			FloatingMenu.addButton(
				plugin.name,
				resetButton,
				tabId,
				2
			);
		},
		
		/**
		 * Adds the insert button to the floating menu
		 */
		_addUIInsertButton: function (tabId) {
			var plugin = this.plugin;
			this.insertImgButton = new Aloha.ui.Button({
				'name' : 'insertimage',
				'iconClass': 'aloha-button aloha-image-insert',
				'size' : 'small',
				'onclick' : function () {
					plugin.insertImg(); 
				},
				'tooltip' : i18n.t('button.addimg.tooltip'),
				'toggle' : false
			});
			
			FloatingMenu.addButton(
				'Aloha.continuoustext',
				this.insertImgButton,
				tabId,
				1
			);
		},

        /**
         * Adds the ui meta fields (search, title) to the floating menu. 
         */
		_addUIMetaButtons: function (tabId) {
			var plugin = this.plugin;
			var imgSrcLabel = new Aloha.ui.Button({
				'label': i18n.t('field.img.src.label'),
				'tooltip': i18n.t('field.img.src.tooltip'),
				'size': 'small'
			});
			this.imgSrcField = new Aloha.ui.AttributeField({'name' : 'imgsrc'});
			this.imgSrcField.setObjectTypeFilter(plugin.objectTypeFilter);
			
			// add the title field for images
			var imgTitleLabel = new Aloha.ui.Button({
				'label': i18n.t('field.img.title.label'),
				'tooltip': i18n.t('field.img.title.tooltip'),
				'size': 'small'
			});
			
			this.imgTitleField = new Aloha.ui.AttributeField();
			this.imgTitleField.setObjectTypeFilter();
			FloatingMenu.addButton(
				plugin.name,
				this.imgSrcField,
				tabId,
				1
			);
			
		},
		
		/**
		 * Adds the ui align buttons to the floating menu
		 */
		_addUIAlignButtons: function (tabId) {
			var plugin = this.plugin;
		
			var alignLeftButton = new Aloha.ui.Button({
				'iconClass': 'aloha-img aloha-image-align-left',
				'size': 'small',
				'onclick' : function () {
					var el = jQuery(plugin.getPluginFocus());
					el.add(el.parent()).css('float', 'left');
				},
				'tooltip': i18n.t('button.img.align.left.tooltip')
			});
			
			FloatingMenu.addButton(
				plugin.name,
				alignLeftButton,
				tabId,
				1
			);
			
			var alignRightButton = new Aloha.ui.Button({
				'iconClass': 'aloha-img aloha-image-align-right',
				'size': 'small',
				'onclick' : function () {
					var el = jQuery(plugin.getPluginFocus());
					el.add(el.parent()).css('float', 'right');
				},
				'tooltip': i18n.t('button.img.align.right.tooltip')
			});
			
			FloatingMenu.addButton(
				plugin.name,
				alignRightButton,
				tabId,
				1
			);
			
			var alignNoneButton = new Aloha.ui.Button({
				'iconClass': 'aloha-img aloha-image-align-none',
				'size': 'small',
				'onclick' : function () {
					var el = jQuery(plugin.getPluginFocus());
					el.add(el.parent()).css({
						'float': 'none',
						display: 'inline-block'
					});
				},
				'tooltip': i18n.t('button.img.align.none.tooltip')
			});
			
			FloatingMenu.addButton(
				plugin.name,
				alignNoneButton,
				tabId,
				1
			);
		
		},
		
		/**
		 * Adds the ui margin buttons to the floating menu
		 */
		_addUIMarginButtons: function (tabId) {
			var plugin = this.plugin;
			var incPadding = new Aloha.ui.Button({
				iconClass: 'aloha-img aloha-image-padding-increase',
				toggle: false,
				size: 'small',
				onclick: function () {
					jQuery(plugin.getPluginFocus()).increase('padding');
				},
				tooltip: i18n.t('padding.increase')
			});
			FloatingMenu.addButton(
				plugin.name,
				incPadding,
				tabId,
				2
			);
			
			var decPadding = new Aloha.ui.Button({
				iconClass: 'aloha-img aloha-image-padding-decrease',
				toggle: false,
				size: 'small',
				onclick: function () {
					jQuery(plugin.getPluginFocus()).decrease('padding');
				},
				tooltip: i18n.t('padding.decrease')
			});
			FloatingMenu.addButton(
				plugin.name,
				decPadding,
				tabId,
				2
			);
		},
		
		/**
		 * Adds the crop buttons to the floating menu
		 */		
		_addUICropButtons: function (tabId) {
			var plugin = this.plugin;

			FloatingMenu.createScope('Aloha.img', ['Aloha.global']);

			this.cropButton = new Aloha.ui.Button({
				'size' : 'small',
				'tooltip' : i18n.t('Crop'),
				'toggle' : true,
				'iconClass' : 'cnr-crop',
				'onclick' : function (btn, event) {
					if (btn.pressed) {
						plugin.crop();
					} else {
						plugin.endCrop();
					}
				}
			});

			FloatingMenu.addButton(
				plugin.name,
				this.cropButton,
				tabId,
				3
			);
	
		},

        /**
         * Adds the resize buttons to the floating menu
         */	
		_addUIResizeButtons: function (tabId) {
			var plugin = this.plugin;

			// Manual resize fields
			this.imgResizeHeightField = new Aloha.ui.AttributeField();
			this.imgResizeHeightField.maxValue = plugin.settings.maxHeight;
			this.imgResizeHeightField.minValue = plugin.settings.minHeight;
			
			this.imgResizeWidthField = new Aloha.ui.AttributeField();
			this.imgResizeWidthField.maxValue = plugin.settings.maxWidth;
			this.imgResizeWidthField.minValue = plugin.settings.minWidth;

			this.imgResizeWidthField.width = 50;
			this.imgResizeHeightField.width = 50;
			
			var widthLabel = new Aloha.ui.Button({
				'label':  i18n.t('width'),
				'tooltip': i18n.t('width'),
				'size': 'small'
			});
			
			FloatingMenu.addButton(
					plugin.name,
					widthLabel,
					tabId,
					30
			);
			
			FloatingMenu.addButton(
					plugin.name,
					this.imgResizeWidthField,
					tabId,
					40
			);
			
			
			var heightLabel = new Aloha.ui.Button({
				'label':  i18n.t('height'),
				'tooltip': i18n.t('height'),
				'size': 'small'
			});
			
			FloatingMenu.addButton(
					plugin.name,
					heightLabel,
					tabId,
					50
			);
			
			FloatingMenu.addButton(
					plugin.name,
					this.imgResizeHeightField,
					tabId,
					60
			);
 		},

		/**
		 * Adds the natural size button to the floating menu
		 */
		_addNaturalSizeButton: function (tabId) {
			var plugin = this.plugin;
			var naturalSize = new Aloha.ui.Button({
				iconClass: 'aloha-img aloha-image-size-natural',
				size: 'small',
				toggle: false,
				onclick: function () {
					plugin.resetSize();
						
				},
				tooltip: i18n.t('size.natural')
			});
			FloatingMenu.addButton(
				plugin.name,
				naturalSize,
				tabId,
				2
			);
		},

		/**
		 * Sets FloatingMenu scope
		 * 
		 * 
		 */
		setScope: function () {
			FloatingMenu.setScope(this.plugin.name);
		},

		/**
		 * 
		 */
		activateView: function (name) {
			FloatingMenu.activateTabOfButton(name);
		},

		/**
		 * Redraws UI
		 */
		doLayout: function () {
			FloatingMenu.doLayout();
		}
    });
});
	