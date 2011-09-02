/*
* Aloha Image Plugin - Allow image manipulation in Aloha Editor
* 
* Author & Copyright (c) 2011 Gentics Software GmbH
* aloha-sales@gentics.com
* Contributors 
*       Johannes Schüth - http://jotschi.de
* 		Nicolas karageuzian - http://nka.me/
* 		Benjamin Athur Lupton - http://www.balupton.com/
* 		Thomas Lete
* 		Nils Dehl
* 		Christopher Hlubek
* 		Edward Tsech
* 		Haymo Meran
*
* Licensed under the terms of http://www.aloha-editor.com/license.html
*/

define([
	// js
	'aloha/jquery',
	'aloha/plugin',
	'aloha/floatingmenu',
	'i18n!aloha/nls/i18n',
	'i18n!image/nls/i18n',
	'jquery-plugin!image/vendor/ui/jquery-ui-1.8.10.custom.min',
	'jquery-plugin!image/vendor/jcrop/jquery.jcrop.min',
	'jquery-plugin!image/vendor/mousewheel/mousewheel',
	// css
	'css!image/css/image.css',
	'css!image/vendor/ui/ui-lightness/jquery-ui-1.8.10.cropnresize.css',
	'css!image/vendor/jcrop/jquery.jcrop.css'
],
function AlohaImagePlugin (aQuery, Plugin, FloatingMenu, i18nCore, i18n) {
	
	'use strict';
	
	var jQuery = aQuery;
	var $ = aQuery;
	var GENTICS = window.GENTICS,	Aloha = window.Aloha;
	
	// Attributes manipulation utilities
	// Aloha team may want to factorize, it could be useful for other plugins
	// Prototypes
	String.prototype.toInteger = String.prototype.toInteger || function() {
		return parseInt(String(this).replace(/px$/,'')||0,10);
	};
	String.prototype.toFloat = String.prototype.toInteger || function() {
		return parseFloat(String(this).replace(/px$/,'')||0,10);
	};
	Number.prototype.toInteger = Number.prototype.toInteger || String.prototype.toInteger;
	Number.prototype.toFloat = Number.prototype.toFloat || String.prototype.toFloat;

	// Insert jQuery Prototypes
	jQuery.extend(true, jQuery.fn, {
		increase: jQuery.fn.increase || function(attr) {
			var	obj = jQuery(this), value, newValue;
			// Check
			if ( !obj.length ) {
				return obj;
			}
			// Calculate
			value = obj.css(attr).toFloat();
			newValue = Math.round((value||1)*1.2);
			// Apply
			if (value == newValue) { // when value is 2, won't increase
				newValue++;
			}
			// Apply
			obj.css(attr,newValue);
			// Chain
			return obj;
		},
		decrease: jQuery.fn.decrease || function(attr) {
			var	obj = jQuery(this), value, newValue;
			// Check
			if ( !obj.length ) {
				return obj;
			}
			// Calculate
			value = obj.css(attr).toFloat();
			newValue = Math.round((value||0)*0.8);
			// Apply
			if (value == newValue && newValue >0) { // when value is 2, won't increase
				newValue--;
			}
			obj.css(attr,newValue);
			// Chain
			return obj;
		}
	});

	// Create and register Image Plugin
	return Plugin.create('image', {

		languages: ['en', 'fr', 'de', 'ru', 'cz'],

		config: {
			img: {
				'maxWidth': 800,
				'minWidth': 10,
				'maxHeight': 800,
				'minHeight': 10,
				//Image manipulation options - ONLY in default config section
				ui: {
					align		: true,	// Menu elements to show/hide in menu
					resize		: true,	//resize buttons
					meta		: true,
					margin		: true,
					crop		: true,
					resizable	: true,	//resizable ui-drag image
					aspectRatio : true,
					handles     : 'ne, se, sw, nw'   
				},
				
				/**
				 * Crop callback is triggered after the user clicked accept to accept his crop
				 * @param image jquery image object reference
				 * @param props cropping properties
				 */
				onCropped: function (image, props) {},
				
				/**
				 * Reset callback is triggered before the internal reset procedure is applied
				 * if this function returns true, then the reset has been handled by the callback
				 * which means that no other reset will be applied
				 * if false is returned the internal reset procedure will be applied
				 * @param image jquery image object reference
				 * @return true if a reset has been applied, false otherwise
				 */
				onReset: function (image) { return false; },
				
				/**
				 * Resize callback is triggered after the internal resize procedure is applied.  
				 */
				onResized: function(image) {}
				
			}
		},
		
		/**
		 * Default implementation for crop using canvas
		 */
		_onCropped: function (image, props) {

			var canvas = document.createElement('canvas'),
			 	context = canvas.getContext("2d"),
			 	img = image.get(0),
			 	finalprops = {},
			 	ratio = {img:{}, disp: {}};
			
			ratio.img.h = img.height;// image natural height
			ratio.img.w = img.width;// image natural width
			ratio.disp.h = image.height(); // image diplay heigth
			ratio.disp.w = image.width(); // image diplay width
			ratio.h = (ratio.img.h / ratio.disp.h);
			ratio.w = (ratio.img.w / ratio.disp.w);
			
			/* 
			var sourceX = 150;
	        var sourceY = 0;
	        var sourceWidth = 150;
	        var sourceHeight = 150;
	        var destWidth = sourceWidth;
	        var destHeight = sourceHeight;
	        var destX = canvas.width / 2 - destWidth / 2;
	        var destY = canvas.height / 2 - destHeight / 2;
			context.drawImage(imageObj, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);
			 */
			 
			// props are related to displayed size of image.
			// apply w/h ratio to props to get fprops which will be related to 'real' image dimensions
			finalprops.x = props.x * ratio.w;
			finalprops.y = props.y * ratio.h;
			finalprops.w = props.w * ratio.w;
			finalprops.h = props.h * ratio.h;
			context.drawImage(img,
					finalprops.x, finalprops.y,
					finalprops.w, finalprops.h,
					0,0,
//					props.x2, props.y2,
					props.w, props.h);
			$('body').append(canvas);
			
			jQuery('#' + this.imgResizeHeightField.id).val($image.height());
			jQuery('#' + this.imgResizeWidthField.id).val($image.width());
			
			
			$('body').trigger('aloha-image-cropped', [image, props]);
			
		},

		/**
		 * Default implementation for resetting images
		 */
		_onReset: function ($image) {
			
			jQuery('#' + this.imgResizeHeightField.id).val($image.height());
			jQuery('#' + this.imgResizeWidthField.id).val($image.width());
			
			// No default behaviour defined besides event triggering
			
			$('body').trigger('aloha-image-reset', $image);
			return false; 
		},
		
		/**
		 * Default implementation for callback hook which gets invoked while the image is beeing resized
		 */
		_onResize: function ($image) {
			
			jQuery('#' + this.imgResizeHeightField.id).val($image.height());
			jQuery('#' + this.imgResizeWidthField.id).val($image.width());
			
			
			// No default behaviour defined besides event triggering
			$('body').trigger('aloha-image-resize', $image);
		},

		/**
		 * Default implementation for callback hook which get invoked when the current resizing action has stopped
		 */
		_onResized: function ($image) {
			
			jQuery('#' + this.imgResizeHeightField.id).val($image.height());
			jQuery('#' + this.imgResizeWidthField.id).val($image.width());
			

			// No default behaviour defined besides event triggering

			$('body').trigger('aloha-image-resized', $image);
		},
		
		/**
		 * The image that is currently edited
		 */
		imageObj: null,
		
		/**
		 * The Jcrop API reference
		 * this is needed to be able to destroy the cropping frame later on
		 * the variable is linked to the api object whilst cropping, or set to null otherwise
		 * strange, but done as documented http://deepliquid.com/content/Jcrop_API.html
		 */
		jcAPI: null,
		
		/**
		 * this will contain an image's original properties to be able to undo previous settings
		 *
		 * when an image is clicked for the first time, a new object will be added to the array
		 * {
		 *		obj : [the image object reference],
		 *		src : [the original src url],
		 *		width : [initial width],
		 *		height : [initial height]
		 * }
		 *
		 * when an image is clicked the second time, the array will be checked for the image object
		 * referenct, to prevent for double entries
		 */
		restoreProps: [],

		objectTypeFilter: [],

		/**
		 * Plugin initialization method
		 */
		init: function() {
			
			var that = this;
			var	imagePluginUrl = Aloha.getPluginUrl('image');

			this.settings.config = this.settings.config || {};

			if (typeof this.settings === 'undefined') {
				this.settings = Aloha.settings.plugins.image;
				this.settings = jQuery.extend(true,this.settings,this.config);
				// ensure an aggregate of all confs
				jQuery.each(this.settings.editables, function(i,e){
					this.settings = jQuery.extend(true,this.settings,e);
				});
			}
			
			if (!this.settings.config.img) {
				this.settings.config.img = this.config.img;
			}
			if (!this.settings.config.img.ui) {
				this.settings.config.img.ui = this.config.img.ui;
			}
			
			this.settings.maxHeight = this.settings.config.img.maxHeight;
			this.settings.minHeight = this.settings.config.img.minHeight;

			this.settings.minWidth = this.settings.config.img.minWidth;
			this.settings.maxWidth = this.settings.config.img.maxWidth;
			
			if (Aloha.Image && Aloha.Image.settings) {
				if (typeof Aloha.Image.settings.objectTypeFilter !== 'undefined') {
					Aloha.Image.objectTypeFilter = Aloha.Image.settings.objectTypeFilter;
				}
				if (typeof Aloha.Image.settings.dropEventHandler !== 'undefined') {
					Aloha.Image.dropEventHandler = Aloha.Image.settings.dropEventHandler;
				}
			}
			
			that.initializeButtons();
			that.bindInteractions();
			that.subscribeEvents();
		},

		/**
		* Create buttons
		*/
		initializeButtons: function() {
			var	config = this.settings.config;
			var that = this;

			this.insertImgButton = new Aloha.ui.Button({
				'iconClass': 'aloha-button aloha-image-insert',
				'size' : 'small',
				'onclick' : function () { that.insertImg(); },
				'tooltip' : i18n.t('button.addimg.tooltip'),
				'toggle' : false
			});
			
			FloatingMenu.addButton(
				'Aloha.continuoustext',
				this.insertImgButton,
				i18nCore.t('floatingmenu.tab.insert'),
				1
			);
			
			FloatingMenu.createScope(this.getUID('image'), 'Aloha.empty');
			
			if (config.img.ui.meta) {
				that._addUIMetaButtons();
			}
			
			if (config.img.ui.align) {
				that._addUIAlignButtons();
			}
			
			if (config.img.ui.margin) {
				that._addUIMarginButtons();
			}
			
			if (config.img.ui.crop) {
				that._addUICropButtons();
			}
			
			if (config.img.ui.resize) {
				that._addUIResizeButtons();
			}

			// TODO fix the function and reenable this button 
			//that._addNaturalSizeButton();
		},

		/**
	 	 * Adds the ui meta fields (search, title) to the floating menu. 
		 */
		_addUIMetaButtons: function() {
			var that = this;
			var imgSrcLabel = new Aloha.ui.Button({
				'label': i18n.t('field.img.src.label'),
				'tooltip': i18n.t('field.img.src.tooltip'),
				'size': 'small'
			});
			this.imgSrcField = new Aloha.ui.AttributeField();
			this.imgSrcField.setObjectTypeFilter( this.objectTypeFilter );
			
			// add the title field for images
			var imgTitleLabel = new Aloha.ui.Button({
				'label': i18n.t('field.img.title.label'),
				'tooltip': i18n.t('field.img.title.tooltip'),
				'size': 'small'
			});
			
			this.imgTitleField = new Aloha.ui.AttributeField();
			this.imgTitleField.setObjectTypeFilter();
			FloatingMenu.addButton(
				this.getUID('image'),
				this.imgSrcField,
				'Image',	//i18n.t('floatingmenu.tab.img'),
				1
			);
			
			// Reset button
			var resetButton = new Aloha.ui.Button({
				'size' : 'small',
				'tooltip' : i18n.t('Reset'),
				'toggle' : false,
				'iconClass' : 'cnr-reset',
				'onclick' : function (btn, event) {
					that.reset();
				}
			});

			FloatingMenu.addButton(
				this.getUID('image'),
				resetButton,
					'Image',	//i18n.t('floatingmenu.tab.img'),
					3
				);

		},
		
		/**
		 * Adds the ui align buttons to the floating menu
		 */
		_addUIAlignButtons: function() {
			var that = this;
		
			var	alignLeftButton = new Aloha.ui.Button({
				'iconClass': 'aloha-img aloha-image-align-left',
				'size': 'small',
				'onclick' : function() {
					var el = jQuery(that.findImgMarkup());
					el.add(el.parent()).css('float', 'left');
				},
				'tooltip': i18n.t('button.img.align.left.tooltip')
			});
			
			FloatingMenu.addButton(
				this.getUID('image'),
				alignLeftButton,
				'Formatting',	//i18n.t('floatingmenu.tab.img'),
				1
			);
			
			var alignRightButton = new Aloha.ui.Button({
				'iconClass': 'aloha-img aloha-image-align-right',
				'size': 'small',
				'onclick' : function() {
					var el = jQuery(that.findImgMarkup());
					el.add(el.parent()).css('float', 'right');
				},
				'tooltip': i18n.t('button.img.align.right.tooltip')
			});
			
			FloatingMenu.addButton(
				this.getUID('image'),
				alignRightButton,
				'Formatting',	//i18n.t('floatingmenu.tab.img'),
				1
			);
			
			var alignNoneButton = new Aloha.ui.Button({
				'iconClass': 'aloha-img aloha-image-align-none',
				'size': 'small',
				'onclick' : function() {
					var el = jQuery(that.findImgMarkup());
					el.add(el.parent()).css({
						'float': 'none',
						display: 'inline-block'
					});
				},
				'tooltip': i18n.t('button.img.align.none.tooltip')
			});
			
			FloatingMenu.addButton(
				this.getUID('image'),
				alignNoneButton,
				'Formatting',	//i18n.t('floatingmenu.tab.img'),
				1
			);
		
		},
		
		_addUIMarginButtons: function() {
			var that = this;
			var incPadding = new Aloha.ui.Button({
				iconClass: 'aloha-img aloha-image-padding-increase',
				toggle: false,
				size: 'small',
				onclick: function() {
					// Apply
					jQuery(that.findImgMarkup()).increase('padding');
				},
				tooltip: i18n.t('padding.increase')
			});
			FloatingMenu.addButton(
				this.getUID('image'),
				incPadding,
				'Formatting',	//i18n.t('floatingmenu.tab.img'),
				2
			);
			
			var decPadding = new Aloha.ui.Button({
				iconClass: 'aloha-img aloha-image-padding-decrease',
				toggle: false,
				size: 'small',
				onclick: function() {
					// Apply
					jQuery(that.findImgMarkup()).decrease('padding');
				},
				tooltip: i18n.t('padding.decrease')
			});
			FloatingMenu.addButton(
				this.getUID('image'),
				decPadding,
				'Formatting',	//i18n.t('floatingmenu.tab.img'),
				2
			);
		},

		/**
		 * Adds the crop buttons to the floating menu
		 */		
 		_addUICropButtons: function () {
 			var that = this;
 			
 			FloatingMenu.createScope('Aloha.img', ['Aloha.global']);

			this.cropButton = new Aloha.ui.Button({
				'size' : 'small',
				'tooltip' : i18n.t('Crop'),
				'toggle' : true,
				'iconClass' : 'cnr-crop',
				'onclick' : function (btn, event) {
					if (btn.pressed) {
						that.crop();
					} else {
						that.endCrop();
					}
				}
			});

			FloatingMenu.addButton(
				this.getUID('image'),
				this.cropButton,
				'Crop',	//i18n.t('floatingmenu.tab.img'),
				3
			);
	
 		},
 	
 		/**
 		 * Adds the resize buttons to the floating menu
 		 */	
 		_addUIResizeButtons: function () {
	 		var that = this;
	 		
	 		var incSize = new Aloha.ui.Button({
				iconClass: 'aloha-img aloha-image-size-increase',
				size: 'small',
				toggle: false,
				onclick: function() {
					// Apply
					jQuery(that.findImgMarkup()).increase('height').increase('width');
				},
				tooltip: i18n.t('size.increase')
			});
			
			FloatingMenu.addButton(
				this.getUID('image'),
				incSize,
				'Resize',	//i18n.t('floatingmenu.tab.img'),
				2
			);

			var	naturalSize = new Aloha.ui.Button({
				iconClass: 'aloha-img aloha-image-size-decrease',
				size: 'small',
				toggle: false,
				onclick: function() {
					// Apply
					jQuery(that.findImgMarkup()).decrease('height').decrease('width');
				},
				tooltip: i18n.t('size.decrease')
			});

			// Manual resize fields
			this.imgResizeHeightField = new Aloha.ui.AttributeField();
			this.imgResizeHeightField.maxValue = that.settings.maxHeight;
			this.imgResizeHeightField.minValue = that.settings.minHeight;
			
			this.imgResizeWidthField = new Aloha.ui.AttributeField();
			this.imgResizeWidthField.maxValue = that.settings.maxWidth;
			this.imgResizeWidthField.minValue = that.settings.minWidth;

			this.imgResizeWidthField.width=50;
			this.imgResizeHeightField.width=50;
			
			var heightLabel = new Aloha.ui.Button({
				'label':  i18n.t('height'),
				'tooltip': i18n.t('height'),
				'size': 'small'
			});
			
			FloatingMenu.addButton(
					this.getUID('image'),
					heightLabel,
					'Resize',	//i18n.t('floatingmenu.tab.img'),
					3
			);
			
			FloatingMenu.addButton(
						this.getUID('image'),
						this.imgResizeHeightField,
						'Resize',	//i18n.t('floatingmenu.tab.img'),
						4
			);
			
			var widthLabel = new Aloha.ui.Button({
				'label':  i18n.t('width'),
				'tooltip': i18n.t('width'),
				'size': 'small'
			});
			
			FloatingMenu.addButton(
					this.getUID('image'),
					widthLabel,
					'Resize',	//i18n.t('floatingmenu.tab.img'),
					5
			);
			
			
			FloatingMenu.addButton(
					this.getUID('image'),
					this.imgResizeWidthField,
					'Resize',	//i18n.t('floatingmenu.tab.img'),
					6
			);
			
			/*	
			TODO: desSize never set - obsolet code?
			FloatingMenu.addButton(
				this.getUID('image'),
				decSize,
				'Crop &amp; Resize',	//i18n.t('floatingmenu.tab.img'),
				2
			);
			*/
 		},
 		
 		/**
		 * Adds the natural size button to the floating menu
		 */
		 _addNaturalSizeButton: function () {
	    	var that = this;
			var naturalSize = new Aloha.ui.Button({
				iconClass: 'aloha-img aloha-image-size-natural',
				size: 'small',
				toggle: false,
				onclick: function() {
					var	img = new Image();
					img.onload = function() {
						var myimage = that.findImgMarkup();
						if (that.settings.config.img.ui.resizable) {
							that.endResize();
						}
						jQuery(myimage)
							.css({
								'width': img.width + 'px',
								'height': img.height + 'px',
								'max-width': '',
								'max-height': ''
							});
						if (that.settings.config.img.ui.resizable) {
							that.resize();
						}
					};
					img.src = that.findImgMarkup().src;
						
				},
				tooltip: i18n.t('size.natural')
			});
			FloatingMenu.addButton(
				this.getUID('image'),
				naturalSize,
				'Resize',	//i18n.t('floatingmenu.tab.img'),
				2
			);
		},

		/**
		 * Bind plugin interactions
		 */
		bindInteractions: function () {
			var	that = this;
			var config = this.settings.config;
			
			if(config.img.ui.resizable) {
				try {
					// this will disable mozillas image resizing facilities
					document.execCommand('enableObjectResizing', false, 'false');
				} catch (e) {
					// this is just for internet explorer, who will not support disabling enableObjectResizing
				}
			}

			if (config.img.ui.meta) {
				// update image object when src changes
				this.imgSrcField.addListener('keyup', function(obj, event) {
					that.srcChange();
				});

				this.imgSrcField.addListener('blur', function(obj, event) {
					// TODO remove image or do something usefull if the user leaves the
					// image without defining a valid image src.
					var img = jQuery(obj.getTargetObject());
					if ( img.attr('src') === '' ) {
						img.remove();
					} // image removal when src field is blank
				});
			}
			
			// Override the default method by using the given one
			if (config.img.onCropped && typeof config.img.onCropped === "function") {
				this._onCropped = config.img.onCropped;
			}
			
			// Override the default method by using the given one
			if (config.img.onReset && typeof config.img.onReset === "function") {
				this._onReset = config.img.onReset;
			}

			// Override the default method by using the given one
			if (config.img.onResized && typeof config.img.onResized === "function") {
				this._onResized = config.img.onResized;
			}
			
			// Override the default method by using the given one
			if (config.img.onResize && typeof config.img.onResize === "function") {
				this._onResize = config.img.onResize;
			}

			if (config.img.aspectRatio && typeof config.img.aspectRatio !== "boolean") {
				this.settings.aspectRatio = true;
			}
			
		},

	
		
		applyButtonConfig: function(editable) {
			var	config;
		},

		/**
		 * Subscribe to Aloha events and DragAndDropPlugin Event
		 */
		subscribeEvents: function() {
			var	that = this;
			var config = this.settings;
			
			jQuery('img').filter(config.globalselector).unbind();
			jQuery('img').filter(config.globalselector).click(function(event) {
				that.clickImage(event);
			});
			
			Aloha.bind('aloha-editable-activated', function (e, params) {
				try {
					//TODO Check this.. it looks like this does nothing..
					that.applyButtonConfig(params.editable.obj);
				} catch (err) {
					Aloha.Log.error(that, "Button configuration failed");
				}

			});
						
			Aloha.bind('aloha-drop-files-in-editable', function(event, data) {
				var	that = this;
				var img, len = data.filesObjs.length, fileObj, config;
				
				while (--len >= 0) {
					fileObj = data.filesObjs[len];
					if (fileObj.file.type.match(/image\//)) {
						// Prepare
						
						config = that.getEditableConfig(data.editable);
						// Prepare
						img = jQuery('<img/>');
						img.css({
							"max-width": that.config.img.max_width,
							"max-height": that.config.img.max_height
						});
						img.attr('id',fileObj.id);
						if (typeof fileObj.src === 'undefined') {
							img.attr('src', fileObj.data );
							//fileObj.src = fileObj.data ;
						} else {
							img.attr('src',fileObj.src );
						}
						GENTICS.Utils.Dom.insertIntoDOM(img, data.range, jQuery(Aloha.activeEditable.obj));
					}
				}
				
			});
			
			/*
			 * Add the event handler for selection change
			 */
			Aloha.bind('aloha-selection-changed', function(event, rangeObject, originalEvent) {
		
				if (originalEvent && originalEvent.target) {
					// Check if the element is currently beeing resized
					if (that.settings.config.img.ui.resizable && !jQuery(originalEvent.target).hasClass('ui-resizable-handle')) {
						that.endResize();
					}
				}
				

				if(Aloha.activeEditable !== null) {
					var foundMarkup = that.findImgMarkup( rangeObject );
					var	config = that.getEditableConfig(Aloha.activeEditable.obj);
					
					if (typeof config.img !== 'undefined' ) {
						that.insertImgButton.show();
						FloatingMenu.doLayout();
					} else {
						that.insertImgButton.hide();
						// TODO this should not be necessary here!
						FloatingMenu.doLayout();
						// leave if img is not allowed
						return;
					}

					// Enable image specific ui components if the element is an image
					if ( foundMarkup ) {
						that.insertImgButton.hide();
						FloatingMenu.setScope(that.getUID('image'));
						if(that.settings.config.img.ui.meta) {
							that.imgSrcField.setTargetObject(foundMarkup, 'src');
							that.imgTitleField.setTargetObject(foundMarkup, 'title');
						}
						that.imgSrcField.focus();
						FloatingMenu.userActivatedTab = i18n.t('floatingmenu.tab.img');
					} else {
						if(that.settings.config.img.ui.meta) {
							that.imgSrcField.setTargetObject(null);
						}
					}
					// TODO this should not be necessary here!
					FloatingMenu.doLayout();
				}
						
			});
			
			Aloha.bind('aloha-editable-created', function(event, editable) {
				

				try {
					// this will disable mozillas image resizing facilities
					document.execCommand('enableObjectResizing', false, 'false');
				} catch (e) {
					Aloha.Log.error(e, 'Could not disable enableObjectResizing');
					// this is just for others, who will not support disabling enableObjectResizing
				}

				// Inital click on images will be handled here
				// editable.obj.find('img').attr('_moz_resizing', false);
				// editable.obj.find('img').contentEditable(false);
				editable.obj.delegate('img', 'mouseup', function (event) {
					that.clickImage(event);
					event.stopPropagation();
				});
				
			});

			
			that._subscribeToResizeFieldEvents();

		},
		
		/**
		 * Bind interaction events that are invoked on the resize fields
		 */
		_subscribeToResizeFieldEvents: function() {
			
			var that = this;
			
			/**
			 * Helper function that will update the fields
			 */
			function updateField($field, delta, maxValue, minValue) {
				
				if ( typeof minValue === 'undefined' ) {
					minValue=0;	
				}
				
				if ( typeof maxValue === 'undefined' ) {
					maxValue=8000;	
				}

				// If the current value of the field can't be parses we set it to 100px
				var oldValue = parseInt($field.val());
				if (isNaN(oldValue)) {
					oldValue = 100;
				}

				var newValue = oldValue + delta;
				// Exit if the newValue is above the maxValue limit (only if the user tries to increment) 
				if (delta>0 && newValue > maxValue) { 
					return;
					// Exit if the newValue is below the minValue (only if the user tries to decrement)
				} else if (newValue<minValue && delta<0) {
					$field.css('background-color','red');
					return;
				} else {
					$field.css('background-color','');
				}
				$field.val(oldValue + delta);
			};

			/**
			 * Handle the keyup event on the field
			 */
			function handleKeyUpEventOnField(e) {
				var minValue = e.data.minValue;
				var maxValue = e.data.maxValue;
				console.log(maxValue);
				if(e.keyCode == 38 || e.keyCode == 107) {
					updateField($(this), +1, maxValue, minValue);
				} else if (e.keyCode == 40 || e.keyCode == 109) {
					updateField($(this), -1, maxValue, minValue);
				}
				setSizeByFieldValue();
				e.preventDefault();
				return false;
			};
			
			/**
			 * Handle the mouse wheel event on the field
			 */
			function handleMouseWheelEventOnField(e, delta) {
				var minValue = e.data.minValue;
				var maxValue = e.data.maxValue;
				updateField($(this), delta, maxValue, minValue);
				setSizeByFieldValue();
		        return false;
			};
			
			/**
			 * Helper function that will set the new image size using the field values
			 */
			function setSizeByFieldValue() {
				var width =  $('#' + that.imgResizeWidthField.id ).val();
				var height = $('#' + that.imgResizeHeightField.id ).val();
				that.setSize(width, height);
			};
			
			/**
			 * Handle mousewheel,keyup actions on both fields
			 */
			var $heightField = $('#' + that.imgResizeHeightField.id );
			var heightEventData= {maxValue: that.imgResizeHeightField.maxValue, minValue: that.imgResizeHeightField.minValue };
			$heightField.live('keyup', heightEventData, handleKeyUpEventOnField);
			$heightField.live('mousewheel', heightEventData, handleMouseWheelEventOnField);
			
			var $widthField = $('#' + that.imgResizeWidthField.id );
			var widthEventData= {maxValue: that.imgResizeWidthField.maxValue , minValue: that.imgResizeWidthField.minValue };
			$widthField.live('keyup',widthEventData , handleKeyUpEventOnField);
			$widthField.live('mousewheel', widthEventData, handleMouseWheelEventOnField);
			
		},
		 
		
		/**
		 * Manually set the given size for the current image
		 */
		setSize: function( width, height) {
			this.imageObj.width(width);
			this.imageObj.height(height);
			
			$('.Aloha_Image_Resize').height(height);
			$('.Aloha_Image_Resize').width(width);
		},

		/**
		 * This method will handle the mouseUp event on images (eg. within editables). 
		 * It will if enabled activate the resizing action.
		 */
		clickImage: function( e ) {

			var that = this;
			that.imageObj = jQuery(e.target);
			var currentImage = that.imageObj;

			
			FloatingMenu.setScope(that.getUID('image'));
			//TODO: This destroys the editing within chrome and seems to be not necessary
			//			if (this.settings.config.img.ui.resizable) {
			//				this.endResize();
			//			}
			
			var editable = currentImage.closest('.aloha-editable');
			
			// Disabling the content editable. This will disable the resizeHandles in internet explorer
			jQuery(editable).contentEditable(false);
			
			//Store the current props of the image
			this.restoreProps.push({
				obj : e.srcElement,
				src : that.imageObj.attr('src'),
				width : that.imageObj.width(),
				height : that.imageObj.height()
			});
			
			// Update the resize input fields with the new width and height
			$('#' + that.imgResizeHeightField.id).val(that.imageObj.height());
			$('#' + that.imgResizeWidthField.id).val(that.imageObj.width());
			
			
			if (this.settings.config.img.ui.resizable) {
				this.startResize();
			}
			
			//TODO: This segment will create a selection around the image. We should avoid this since it disturbs image visibility
			/*
			var offset = GENTICS.Utils.Dom.getIndexInParent(e.target);
			var imgRange = Aloha.Selection.getRangeObject();
			
			try {
				imgRange.commonAncestorContainer = imgRange.limitObject = editable[0];
				imgRange.startContainer = imgRange.endContainer = thisimg.parent()[0];
				imgRange.startOffset = offset;
				imgRange.endOffset = offset+1;
				imgRange.correctRange();
				imgRange.select();
			} catch(err) {
				var startTag = currentImage.parent()[0];
				imgRange = new GENTICS.Utils.RangeObject({
					startContainer: startTag,
					endContainer: startTag,
					startOffset: offset,
					endOffset: offset+1
				});
				imgRange.select();
			}
			this.imageObj.css({'background-color': ''});
			*/
			
		},
		
		/**
		 * This method extracts determins if the range selection contains an image
		 */
		findImgMarkup: function ( range ) {

			var that = this;
			var config = this.config;
			var result, targetObj;

			if ( typeof range === 'undefined' ) {
				range = Aloha.Selection.getRangeObject();
			}
			
			targetObj = jQuery(range.startContainer);
			
			try {
				if ( Aloha.activeEditable ) {
					if ((  typeof range.startContainer !== 'undefined'
						&& typeof range.startContainer.childNodes !== 'undefined'
						&& typeof range.startOffset !== 'undefined'
						&& typeof range.startContainer.childNodes[range.startOffset] !== 'undefined'
						&& range.startContainer.childNodes[range.startOffset].nodeName.toLowerCase() === 'img'
						&& range.startOffset+1 === range.endOffset) ||
						(targetObj.hasClass('Aloha_Image_Resize')))
					{
						result = targetObj.find('img')[0];
						if (! result.css) {
							result.css = '';
						}
						
						if (! result.title) {
  							result.title = '';
						}
						
						if (! result.src) {
							result.src = ''; 
						}
						return result;
					}
					else {
						return null;
					}
				}
			} catch (e) {
				Aloha.Log.debug(e, "Error finding img markup.");
			}
			return null;

		},

		/**
		* This method will insert a new image dom element into the dom tree
		*/		
		insertImg: function() {
				var range = Aloha.Selection.getRangeObject(),
				config = this.getEditableConfig(Aloha.activeEditable.obj),
				imagePluginUrl = Aloha.getPluginUrl('image'),
				imagestyle, imagetag, newImg;

			if ( range.isCollapsed() ) {
				// TODO I would suggest to call the srcChange method. So all image src
				// changes are on one single point.
				imagestyle = "max-width: " + config.img.max_width + "; max-height: " + config.img.max_height;
				imagetag = '<img style="'+ imagestyle + '" src="' + imagePluginUrl + '/img/blank.jpg" title="" />';
				newImg = jQuery(imagetag);
				// add the click selection handler
				//newImg.click( Aloha.Image.clickImage ); - Using delegate now
				GENTICS.Utils.Dom.insertIntoDOM(newImg, range, jQuery(Aloha.activeEditable.obj));

			} else {
				Aloha.Log.error('img cannot markup a selection');
				// TODO the desired behavior could be me the selected content is
				// replaced by an image.
				// TODO it should be editor's choice, with an NON-Ext Dialog instead of
				// alert.
			}
		},

		srcChange: function () {
			// TODO the src changed. I suggest :
			// 1. set an loading image (I suggest set src base64 enc) to show the user
			// we are trying to load an image
			// 2. start a request to get the image
			// 3a. the image is ok change the src
			// 3b. the image is not availbable show an error.
			// this.imgSrcField.getTargetObject(), (the img tag)
			// this.imgSrcField.getQueryValue(), (the query value in the inputfield)
			// this.imgSrcField.getItem() (optinal a selected resource item)
			// TODO additionally implement an srcChange Handler to let implementer
			// customize
		},
			
		/**
		 * Code imported from CropnResize Plugin
		 *
		 */
		initCropButtons: function() {
			var that = this,
				btns,
				oldLeft = 0,
				oldTop = 0;
			
			jQuery('body').append(
				'<div id="aloha-CropNResize-btns">\
					<button class="cnr-crop-apply" title="' + i18n.t('Accept') + '">&#10004;</button>\
					<button class="cnr-crop-cancel" title="' + i18n.t('Cancel') + '">&#10006;</button>\
				</div>'
			);
			
			btns = jQuery('#aloha-CropNResize-btns')
			
			btns.find('.cnr-crop-apply').click(function () {
				that.acceptCrop();
			});
			
			btns.find('.cnr-crop-cancel').click(function () {
				that.endCrop();
			});
			
			this.interval = setInterval(function () {
				var jt = jQuery('.jcrop-tracker:first'),
					off = jt.offset(),
					jtt = off.top,
					jtl = off.left,
					jth = jt.height(),
					jtw = jt.width();
				
				if (jth && jtw) {
					btns.fadeIn('slow');
				}
				
				// move the icons to the bottom right side
				jtt = parseInt(jtt + jth + 3, 10);
				jtl = parseInt(jtl + jtw - 55, 10);
		
				// comparison to old values hinders flickering bug in FF
				if (oldLeft != jtl || oldTop != jtt) {
					btns.offset({top: jtt, left: jtl});
				}
				
				oldLeft = jtl;
				oldTop = jtt;
			}, 10);
		},

		/**
		 * Destroy crop confirm and cancel buttons
		 */
		destroyCropButtons: function () {
			jQuery('#aloha-CropNResize-btns').remove();
			clearInterval(this.interval);
		},
		
		/**
		 * Initiate a crop action
		 */
		crop: function () {
			var that = this;
			var config = this.config;

			this.initCropButtons();
			if (this.settings.config.img.ui.resizable) {
				this.endResize();
			}
			this.jcAPI = jQuery.Jcrop(this.imageObj, {
				onSelect : function () {
					// ugly hack to keep scope :(
					setTimeout(function () {
						FloatingMenu.setScope(that.getUID('image'));
					}, 10);
				}
			});
		},

		/**
		 * Terminates a crop
		 */
		endCrop: function () {
			if (this.jcAPI) {
				this.jcAPI.destroy();
				this.jcAPI = null;
			}

			this.destroyCropButtons();
			this.cropButton.extButton.toggle(false);
			if (this.settings.config.img.ui.resizable) {
				this.startResize();
			}
		},
		
		/**
		 * Accept the current cropping area and apply the crop
		 */
		acceptCrop: function () {
			this._onCropped(this.imageObj, this.jcAPI.tellSelect());
			this.endCrop();
		},
		
		/**
		 * This method will activate the jquery-ui resize functionality for the current image
		 */
		startResize: function () {
			var that = this;
			var currentImageObj = this.imageObj;
			
			currentImageObj = this.imageObj.css({
				height		: this.imageObj.height(),
				width		: this.imageObj.width(),
				position	: 'relative',
				'max-height': '',
				'max-width'	: ''
			});
			
			currentImageObj.resizable({
				
				maxHeight : that.settings.maxHeight,
				minHeight : that.settings.minHeight,
				maxWidth  : that.settings.maxWidth,
				minWidth  : that.settings.minWidth,
				aspectRatio : that.settings.aspectRatio,
				handles: that.settings.handles,
				grid : that.settings.grid,
  			    resize: function(event, ui) { 
					that._onResize(that.imageObj);
				},
				stop : function (event, ui) {
					that._onResized(that.imageObj);
					
					// Workaround to finish cropping
					if (this.enableCrop) {
						setTimeout(function () {
							FloatingMenu.setScope(that.getUID('image'));
							that.done(event);
						}, 10);
					}
				}

			});
			
			
			
			currentImageObj.css('display', 'inline-block');
		
			// this will prevent the user from resizing an image
			// using IE's resize handles
			// however I could not manage to hide them completely
			jQuery('.ui-wrapper')
				.attr('contentEditable', false)
				.addClass('aloha-image-box-active Aloha_Image_Resize aloha')
				.css({
					position: 'relative',
					display: 'inline-block',
					'float': that.imageObj.css('float')
				})
				.bind('resizestart', function (e) {
					e.preventDefault();
				})
				.bind('mouseup', function (e) {
					e.originalEvent.stopSelectionUpdate = true;
				});
		},
		
		/**
		 * This method will end resizing and toggle buttons accordingly and remove all markup that has been added for cropping
		 */
		endResize: function () {

			// Find the nearest contenteditable and reenable it since resizing is finished
			if (this.imageObj) {
				var editable = this.imageObj.closest('.aloha-editable');
				jQuery(editable).contentEditable(true);
			}
			
			if (this.imageObj) {
				this.imageObj
					.resizable('destroy')
					.css({
						top	 : 0,
						left : 0
					});
			}
		},
		
		/**
		 * Reset the image to it's original properties
		 */
		reset: function() {
			
			if (this.settings.config.img.ui.crop) {
				this.endCrop();
			}
			
			if (this.settings.config.img.ui.resizable) {
				this.endResize();
			}

			if (this._onReset(this.imageObj)) {
				// the external reset procedure has already performed a reset, so there is no need to apply an internal reset
				return;
			}

			for (var i=0;i<this.restoreProps.length;i++) {
				// restore from restoreProps if there is a match
				if (this.imageObj.get(0) === this.restoreProps[i].obj) {
					this.imageObj.attr('src', this.restoreProps[i].src);
					this.imageObj.width(this.restoreProps[i].width);
					this.imageObj.height(this.restoreProps[i].height);
					return;
				}
			}
		}
		

	});

});
