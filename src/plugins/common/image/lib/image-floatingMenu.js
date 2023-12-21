/*global documents: true define: true */
/*!
 * Aloha Editor
 * Author & Copyright (c) 2011 Gentics Software GmbH
 * aloha-sales@gentics.com
 * Licensed under the terms of http://www.aloha-editor.com/license.html
 * 
 * Author : Nicolas Karageuzian - http://nka.me
 */
define([
	'jquery',
    'util/class',
	'i18n!image/nls/i18n',
	'i18n!aloha/nls/i18n',
	'ui/ui',
	'ui/scopes',
    'ui/button',
    'ui/toggleButton',
    'ui/port-helper-attribute-field'
],
function (
	jQuery,
	Class,
	i18n,
	i18nCore,
	Ui,
	Scopes,
	Button,
	ToggleButton,
	AttributeField
) {
	'use strict';

	var $ = jQuery;
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
			plugin.floatingMenuControl = this;
			this.plugin = plugin;

			Scopes.createScope(plugin.name, 'Aloha.empty');

			this._addUIInsertButton();
			this._addUIMetaButtons();
			this._addUIResetButton();
			this._addUIAlignButtons();
			this._addUIMarginButtons();
			this._addUICropButtons();
			this._addUIResizeButtons();
			this._addUIAspectRatioToggleButton();
			this._addFocalPointButton();

//			 TODO fix the function and reenable this button 
//			this._addNaturalSizeButton();
		},

		/**
		 * Adds the aspect ratio toggle button to the floating menu
		 */
		_addUIAspectRatioToggleButton: function () {
			var plugin = this.plugin;

			this._imageCnrRatioButton = Ui.adopt("imageCnrRatio", ToggleButton, {
				tooltip: i18n.t('button.toggle.tooltip'),
				icon: 'aloha-icon-cnr-ratio',
				click: function () {
					plugin.toggleKeepAspectRatio();
				}
			});

			// If the setting has been set to a number or false we need to activate the 
			// toggle button to indicate that the aspect ratio will be preserved.
			if (plugin.settings.fixedAspectRatio !== false) {
				this._imageCnrRatioButton.setState(true);
				plugin.keepAspectRatio = true;
			}
		},
		
		/**
		 * Adds the reset button to the floating menu for the given tab 
		 */
		_addUIResetButton: function () {
			var plugin = this.plugin;

			this._imageCnrResetButton = Ui.adopt("imageCnrReset", Button, {
				tooltip: i18n.t('Reset'),
				icon: 'aloha-icon-cnr-reset',
				click: function () {
					plugin.reset();
				}
			});
		},
		
		/**
		 * Adds the insert button to the floating menu
		 */
		_addUIInsertButton: function () {
			var plugin = this.plugin;

			this._insertImageButton = Ui.adopt("insertImage", Button, {
				tooltip: i18n.t('button.addimg.tooltip'),
				icon: 'aloha-button aloha-image-insert',
				click: function () {
					plugin.insertImg();
				}
			});
		},

		/**
		 * Adds the ui meta fields (search, title) to the floating menu. 
		 */
		_addUIMetaButtons: function () {
			var plugin = this.plugin;

			this.imgSrcField = new AttributeField({
				label: i18n.t('field.img.src.label'),
				labelClass: 'aloha-image-input-label',
				tooltip: i18n.t('field.img.src.tooltip'),
				name: 'imageSource',
			});
			this.imgSrcField.setTemplate('<span><b>{name}</b><br/>{url}</span>');
			this.imgSrcField.setObjectTypeFilter(plugin.objectTypeFilter);

			this.imgTitleField = new AttributeField({
				label: i18n.t('field.img.title.label'),
				labelClass: 'aloha-image-input-label',
				tooltip: i18n.t('field.img.title.tooltip'),
				name: 'imageTitle',
			});
			this.imgTitleField.setObjectTypeFilter();
		},

		/**
		 * Adds the ui align buttons to the floating menu
		 */
		_addUIAlignButtons: function () {
			var plugin = this.plugin;

			this._imageAlignLeftButton = Ui.adopt("imageAlignLeft", Button, {
				tooltip: i18n.t('button.img.align.left.tooltip'),
				icon: 'aloha-img aloha-image-align-left',
				click : function () {
					var el = jQuery(plugin.getPluginFocus());
					el.add(el.parent()).css('float', 'left');
				}
			});

			this._imageAlignRightButton = Ui.adopt("imageAlignRight", Button, {
				tooltip: i18n.t('button.img.align.right.tooltip'),
				icon: 'aloha-img aloha-image-align-right',
				click : function () {
					var el = jQuery(plugin.getPluginFocus());
					el.add(el.parent()).css('float', 'right');
				}
			});

			this._imageAlignNoneButton = Ui.adopt("imageAlignNone", Button, {
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

			this._imageIncPaddingButton = Ui.adopt("imageIncPadding", Button, {
				tooltip: i18n.t('padding.increase'),
				icon: 'aloha-img aloha-image-padding-increase',
				click: function () {
					jQuery(plugin.getPluginFocus()).increase('padding');
				}
			});

			this._imageDecPaddingButton = Ui.adopt("imageDecPadding", Button, {
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

			Scopes.createScope('Aloha.img', ['Aloha.global']);

			this._imageCropButton = Ui.adopt("imageCropButton", ToggleButton, {
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
		},

		/**
		 * Adds the resize buttons to the floating menu
		 */	
		_addUIResizeButtons: function () {
			var plugin = this.plugin;

			// Manual resize fields
			this.imgResizeHeightField = new AttributeField({
				label:  i18n.t('height'),
				labelClass: 'aloha-image-input-label',
				name: "imageResizeHeight",
				width: 50,
			});
			this.imgResizeHeightField.maxValue = plugin.settings.maxHeight;
			this.imgResizeHeightField.minValue = plugin.settings.minHeight;

			this.imgResizeWidthField = new AttributeField({
				label:  i18n.t('width'),				
				labelClass: 'aloha-image-input-label',
				name: "imageResizeWidth",
				width: 50,
			});
			this.imgResizeWidthField.maxValue = plugin.settings.maxWidth;
			this.imgResizeWidthField.minValue = plugin.settings.minWidth;
		},

		_addFocalPointButton: function() {
			var plugin = this.plugin;

			Scopes.createScope('Aloha.img', ['Aloha.global']);

			this._imageFocalPointButton = Ui.adopt("imageFocalPointButton", ToggleButton, {
				tooltip: i18n.t('focalpoint'),
				icon: 'aloha-img aloha-image-set-focalpoint',
				click: function () {
					if (this.getState()) {
						plugin.enableFocalPointMode();
					} else {
						plugin.disableFocalPointMode();
					}
				}
			});

		},

		/**
		 * Adds the natural size button to the floating menu
		 */
		/*
		  TODO currently deactivated see TODO at call site above.
		_addNaturalSizeButton: function () {
			var plugin = this.plugin;

			this._imageNaturalSizeButton = Ui.adopt("imageNaturalSize", Button, {
				icon: 'aloha-img aloha-image-size-natural',
				label: i18n.t('size.natural'),
				click: function () {
					plugin.resetSize();
				}
			});
		},
		*/

		/**
		 * Sets the scope
		 */
		setScope: function () {
			Scopes.setScope(this.plugin.name);
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
