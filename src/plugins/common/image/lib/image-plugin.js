/*global documents: true define: true*/
/*
* Aloha Image Plugin - Allow image manipulation in Aloha Editor
*
* Author & Copyright (c) 2013 Gentics Software GmbH
* aloha-sales@gentics.com
* Contributors
*		Johannes Schüth - http://jotschi.de
*		Nicolas karageuzian - http://nka.me/
*		Benjamin Athur Lupton - http://www.balupton.com/
*		Thomas Lete
*		Nils Dehl
*		Christopher Hlubek
*		Edward Tsech
*		Haymo Meran
*		Martin Schönberger
*
* Licensed under the terms of http://www.aloha-editor.org/license.php
*/

define([
	// js
	'jquery',
	'aloha/plugin',
	'image/image-floatingMenu',
	'i18n!aloha/nls/i18n',
	'i18n!image/nls/i18n',
	'jqueryui',
	'image/vendor/jcrop/jquery.jcrop.min',
	'image/vendor/mousewheel/mousewheel'
], function AlohaImagePlugin(
	aQuery,
	Plugin,
	ImageFloatingMenu,
	i18nCore,
	i18n
){

	'use strict';

	var jQuery = aQuery;
	var $ = aQuery;
	var GENTICS = window.GENTICS;
	var Aloha = window.Aloha;
	var resizing = false;

	// Attributes manipulation utilities
	// Aloha team may want to factorize, it could be useful for other plugins
	// Prototypes
	String.prototype.toInteger = String.prototype.toInteger || function () {
		return parseInt(String(this).replace(/px$/, '') || 0, 10);
	};
	String.prototype.toFloat = String.prototype.toInteger || function () {
		return parseFloat(String(this).replace(/px$/, '') || 0, 10);
	};
	Number.prototype.toInteger = Number.prototype.toInteger || String.prototype.toInteger;
	Number.prototype.toFloat = Number.prototype.toFloat || String.prototype.toFloat;

	// Insert jQuery Prototypes
	jQuery.extend(true, jQuery.fn, {
		increase: jQuery.fn.increase || function (attr) {
			var	obj = jQuery(this), value, newValue;
			if (!obj.length) {
				return obj;
			}
			value = obj.css(attr).toFloat();
			newValue = Math.round((value || 1) * 1.2);
			// when value is 2, won't increase
			if (value === newValue) {
				newValue++;
			}
			obj.css(attr, newValue);
			return obj;
		},
		decrease: jQuery.fn.decrease || function (attr) {
			var	obj = jQuery(this), value, newValue;
			// Check
			if (!obj.length) {
				return obj;
			}
			// Calculate
			value = obj.css(attr).toFloat();
			newValue = Math.round((value || 0) * 0.8);
			// Apply
			if (value === newValue && newValue > 0) {
				// when value is 2, won't increase
				newValue--;
			}
			obj.css(attr, newValue);
			// Chain
			return obj;
		}
	});

	// Create and register Image Plugin
	return Plugin.create('image', {
		defaultSettings: {
			'maxWidth': 1600,
			'minWidth': 3,
			'maxHeight': 1200,
			'minHeight': 3,
			// This setting will manually correct values that are out of bounds
			'autoCorrectManualInput': true,
			// This setting will define a fixed aspect ratio for all resize actions
			'fixedAspectRatio' : false,
			// When enabled this setting will order the plugin to automatically resize images to given bounds
			'autoResize': false,
			//Image manipulation options - ONLY in default config section
			ui: {
				meta		: true, // If imageResizeWidth and imageResizeHeight are displayed, then you will want to set this to true, so that the width and height text fields are updated automatically.
				crop		: true, // If imageCropButton is displayed, then you have to enable this.
				resizable	: true	// Resizable ui-drag image
			},
			handles     : 'ne, se, sw, nw',   // set handles for resize

			/**
			 * Crop callback is triggered after the user clicked accept to accept his crop
			 * @param image jquery image object reference
			 * @param props cropping properties
			 */
			onCropped: function ($image, props) {
				Aloha.Log.info('Default onCropped invoked', $image, props);
			},

			/**
			 * Reset callback is triggered before the internal reset procedure is applied
			 * if this function returns true, then the reset has been handled by the callback
			 * which means that no other reset will be applied
			 * if false is returned the internal reset procedure will be applied
			 * @param image jquery image object reference
			 * @return true if a reset has been applied, false otherwise
			 */
			onReset: function ($image) {
				Aloha.Log.info('Default onReset invoked', $image);
				return false;
			},

			/**
			 * Example callback method which gets called while the resize process is being executed.
			 */
			onResize: function ($image) {
				Aloha.Log.info('Default onResize invoked', $image);
			},

			/**
			 * Resize callback is triggered after the internal resize procedure is applied.
			 */
			onResized: function ($image) {
				Aloha.Log.info('Default onResized invoked', $image);
			}
		},

		/**
		 * Internal callback hook which gets invoked when cropping has been finished
		 */
		_onCropped: function ($image, props) {

			$('body').trigger('aloha-image-cropped', [$image, props]);

			// After successful cropping, the aspect ratio value has to recalculated
			if (this.keepAspectRatio) {
				this.aspectRatioValue = this.imageObj.width() / this.imageObj.height();
			}

			// Call the custom onCropped function
			this.onCropped($image, props);
		},

		/**
		 * Internal callback hook which gets invoked when resetting images
		 */
		_onReset: function ($image) {

			// No default behaviour defined besides event triggering
			$('body').trigger('aloha-image-reset', $image);

			$('#' + this.ui.imgResizeHeightField.getInputId()).val($image.height());
			$('#' + this.ui.imgResizeWidthField.getInputId()).val($image.width());

			// Call the custom resize function
			return this.onReset($image);
		},

		/**
		 * Internal callback hook which gets invoked while the image is being resized
		 */
		_onResize: function ($image) {

			// No default behaviour defined besides event triggering
			$('body').trigger('aloha-image-resize', $image);

			$('#' + this.ui.imgResizeHeightField.getInputId()).val($image.height());
			$('#' + this.ui.imgResizeWidthField.getInputId()).val($image.width());

			// Call the custom resize function
			this.onResize($image);
		},

		/**
		 * Internal callback hook which gets invoked when the current resizing action has stopped
		 */
		_onResized: function ($image) {

			$('body').trigger('aloha-image-resized', $image);

			$('#' + this.ui.imgResizeHeightField.getInputId()).val($image.height());
			$('#' + this.ui.imgResizeWidthField.getInputId()).val($image.width());

			// Call the custom resize function
			this.onResized($image);
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
		 * State variable for the aspect ratio toggle feature
		 */
		keepAspectRatio: false,

		/**
		 * Variable that will hold the value of the aspect ratio. This ratio will be used once startResize has been called
		 */
		aspectRatioValue: false,

		/**
		 * This will contain an image's original properties to be able to undo previous settings
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
		 * reference, to prevent double entries
		 */
		restoreProps: [],

		/**
		 * the defined object types to be used for this instance
		 */
		objectTypeFilter: [],

		/**
		 * Plugin initialization method
		 */
		init: function () {

			var plugin = this;

			var imagePluginUrl = Aloha.getPluginUrl('image');

			if ( typeof this.settings.objectTypeFilter != 'undefined' ) {
				this.objectTypeFilter = this.settings.objectTypeFilter;
			}

			// Extend the default settings with the custom ones (done by default)
			plugin.config = plugin.defaultSettings;
			plugin.settings = jQuery.extend(true, plugin.defaultSettings, plugin.settings);

			// Determine the flag and the value of the aspect ratio depending on settings
			if ( typeof this.settings.fixedAspectRatio === 'number' ) {
				this.aspectRatioValue = this.settings.fixedAspectRatio;
				plugin.keepAspectRatio = true;
			} else {
				if ((plugin.settings.fixedAspectRatio) === true) {
					plugin.keepAspectRatio = true;
				} else {
					plugin.keepAspectRatio = false;
				}
			}

			plugin.initializeUI();
			plugin.bindInteractions();
			plugin.subscribeEvents();

		},

		/**
		* Create buttons
		*/
		initializeUI: function () {

			var that = this;

			this.ui = new ImageFloatingMenu();
			this.ui.init(this);
		},
		/**
		 * Bind plugin interactions
		 */
		bindInteractions: function () {
			var	plugin = this;

			if (plugin.settings.ui.resizable) {
				try {
					// this will disable mozillas image resizing facilities
					document.execCommand('enableObjectResizing', false, false);
				} catch (e) {
					Aloha.Log.info(e, 'Could not disable enableObjectResizing');
					// this is just for internet explorer, which will not support disabling enableObjectResizing
				}
			}

			if (plugin.settings.ui.meta) {
				// update image object when src changes
				plugin.ui.imgSrcField.addListener('keyup', function (event) {
					plugin.srcChange();
				});

				plugin.ui.imgSrcField.addListener('blur', function (event) {
					// TODO remove image or do something useful if the user leaves the
					// image without defining a valid image src
					var img = jQuery(plugin.ui.imgSrcField.getTargetObject());
					if (img.attr('src') === '') {
						img.remove();
					} // image removal when src field is blank
				});
			}

			// Override the default method by using the given one
			if (plugin.settings.onCropped && typeof plugin.settings.onCropped === "function") {
				plugin.onCropped = plugin.settings.onCropped;
			}

			// Override the default method by using the given one
			if (plugin.settings.onReset && typeof plugin.settings.onReset === "function") {
				plugin.onReset = plugin.settings.onReset;
			}

			// Override the default method by using the given one
			if (plugin.settings.onResized && typeof plugin.settings.onResized === "function") {
				plugin.onResized = plugin.settings.onResized;
			}

			// Override the default method by using the given one
			if (plugin.settings.onResize && typeof plugin.settings.onResize === "function") {
				plugin.onResize = this.settings.onResize;
			}

		},

		/**
		 * Subscribe to Aloha events and DragAndDropPlugin Event
		 */
		subscribeEvents: function () {
			var	plugin = this;
			var config = this.settings;

			jQuery('img').filter(config.globalselector).unbind();
			jQuery('img').filter(config.globalselector).click(function (event) {
				plugin.clickImage(event);
			});

			Aloha.bind('aloha-drop-files-in-editable', function (event, data) {
				var img, len = data.filesObjs.length, fileObj, config;

				while (--len >= 0) {
					fileObj = data.filesObjs[len];
					if (fileObj.file.type.match(/image\//)) {
						config = plugin.getEditableConfig(data.editable);
						// Prepare
						img = jQuery('<img/>');
						img.css({
							"max-width": that.maxWidth,
							"max-height": that.maxHeight
						});
						img.attr('id', fileObj.id);
						if (typeof fileObj.src === 'undefined') {
							img.attr('src', fileObj.data);
							//fileObj.src = fileObj.data ;
						} else {
							img.attr('src', fileObj.src);
						}
						GENTICS.Utils.Dom.insertIntoDOM(img, data.range, jQuery(Aloha.activeEditable.obj));
					}
				}

			});
			/*
			 * Add the event handler for selection change
			 */
			Aloha.bind('aloha-selection-changed', function (event, rangeObject, originalEvent) {
				var config, foundMarkup;

				if (originalEvent && originalEvent.target) {
					// Check if the element is currently being resized
					if (plugin.settings.ui.resizable && !jQuery(originalEvent.target).hasClass('ui-resizable-handle')) {
						plugin.endResize();
						plugin.imageObj = null;
						Aloha.trigger('aloha-image-unselected');
					}
				}

				if (Aloha.activeEditable !== null) {
					foundMarkup = plugin.findImgMarkup(rangeObject);
					config = plugin.getEditableConfig(Aloha.activeEditable.obj);

					if (typeof config !== 'undefined') {
						plugin.ui._insertImageButton.show();
					} else {
						plugin.ui._insertImageButton.hide();
						return;
					}

					// Enable image specific ui components if the element is an image
					if (foundMarkup) { // TODO : this is always null (below is dead code, moving it to clickImage)
						plugin.ui._insertImageButton.show();
						plugin.ui.setScope();
						if (plugin.settings.ui.meta) {
							plugin.ui.imgSrcField.setTargetObject(foundMarkup, 'src');
							plugin.ui.imgTitleField.setTargetObject(foundMarkup, 'title');
						}
						plugin.ui.imgSrcField.foreground();
						plugin.ui.imgSrcField.focus();
					} else {
						if (plugin.settings.ui.meta) {
							plugin.ui.imgSrcField.setTargetObject(null);
						}
					}
					// TODO this should not be necessary here!
					plugin.ui.doLayout();
				}

			});

			Aloha.bind('aloha-editable-created', function (event, editable) {
				try {
					// this disables mozillas image resizing facilities
					document.execCommand('enableObjectResizing', false, false);
				} catch (e) {
					Aloha.Log.info(e, 'Could not disable enableObjectResizing');
					// this is just for other browsers, which do not support disabling enableObjectResizing
				}

				// Inital click on images will be handled here
				// editable.obj.find('img').attr('_moz_resizing', false);
				// editable.obj.find('img').contentEditable(false);

				editable.obj.delegate('img', 'mouseup', function (event) {
					if (!resizing) {
						plugin.clickImage(event);
						event.stopPropagation();
					}
				});
			});

			plugin._subscribeToResizeFieldEvents();

		},


		/**
		 * Automatically resize the image to fit into defined bounds.
		 * @param doScaleUp if true, small images are scaled up to fit minimum size
		 */
		autoResize: function(doScaleUp) {
			// @todo handle ratio mismatches (eg 4:3 is set but image is 16:9 --> image needs to be cut)

			var that = this;

			var widthField = jQuery("#" + that.ui.imgResizeWidthField.getInputId());
			var heightField = jQuery("#" + that.ui.imgResizeHeightField.getInputId());

			var width = that.imageObj.width();
			var height = that.imageObj.height();
			var resize = false;

			// Only normalize the field values if the image exceeds the defined bounds
			if (width < that.settings.minWidth ||
				width > that.settings.maxWidth ||
				height < that.settings.minHeight ||
				height > that.settings.maxHeight) {
				resize = true;
			}

			var aspectRatio = width / height;

			if (resize) {
				if (width > that.settings.maxWidth) {
					width = that.settings.maxWidth;
					height = width / aspectRatio;
				}

				if (height > that.settings.maxHeight) {
					height = that.settings.maxHeight;
					width = height * aspectRatio;
				}

				if ((width < that.settings.minWidth) && doScaleUp) {
					width = that.settings.minWidth;
					height = width / aspectRatio;
				}

				if ((height < that.settings.minHeight) && doScaleUp) {
					height = that.settings.minHeight;
					width = width * aspectRatio;
				}

				widthField.val(width);
				heightField.val(height);

				that.setSizeByFieldValue();
				return true;
			}
			return false;
		},

		/**
		 * Toggle the keep aspect ratio functionality
		 */
		toggleKeepAspectRatio: function() {

			this.keepAspectRatio = !this.keepAspectRatio;

			if (typeof this.jcAPI !== 'undefined' && this.jcAPI !== null) {
				//toggling keepaspectratio during crop is deactivated until implemented
				//this.ui._imageCnrRatioButton.setState(false);

			} else {


				this.endResize();
				if (!this.keepAspectRatio) {
					this.aspectRatioValue = false;
				} else {
					// If no fixed aspect ratio was given a new start aspect ratio is calculated
					// that will be used for the next startResize action

					if ( typeof this.settings.fixedAspectRatio !== 'number' ) {
						this.aspectRatioValue = this.imageObj.width() / this.imageObj.height();
					} else {
						this.aspectRatioValue = this.settings.fixedAspectRatio;
					}
				}
				this.startResize();
			}
		},

		/**
		 * Bind interaction events that are invoked on the resize fields
		 */
		_subscribeToResizeFieldEvents: function () {
			var plugin = this;

			/**
			 * Handle the keyup event on the field
			 */
			function handleKeyUpEventOnField(e) {

				// Load the max/min from the data properties of this event
				var minValue = e.data.minValue;
				var maxValue = e.data.maxValue;
				var fieldName = e.data.fieldName;

				// Allow backspace and delete
				if (e.keyCode === 8 || e.keyCode === 46) {

					// Only resize if field values are ok
					if (plugin._updateFields(fieldName, $(this).val(), false)) {
						// Check if we are currently in cropping mode
						if (typeof plugin.jcAPI !== 'undefined' && plugin.jcAPI !== null) {
							plugin.setCropAreaByFieldValue();
						} else {
							plugin.setSizeByFieldValue();
						}
					}
				// 0-9 keys
				} else if (e.keyCode <= 57 && e.keyCode >= 48 || e.keyCode <= 105 && e.keyCode >= 96 ) {

					// Only resize if field values are ok
					if (plugin._updateFields(fieldName, $(this).val(), false)) {
						// Check if we are currently in cropping mode
						if (typeof plugin.jcAPI !== 'undefined' && plugin.jcAPI !== null) {
							plugin.setCropAreaByFieldValue();
						} else {
							plugin.setSizeByFieldValue();
						}
					}
				} else {
					var delta = 0;
					if (e.keyCode === 38 || e.keyCode === 107) {
						delta = +1;
					} else if (e.keyCode === 40 || e.keyCode === 109) {
						delta = -1;
					}
					// Handle key combinations
					if (e.shiftKey || e.metaKey || e.ctrlKey) {
						delta = delta * 10;
					}

					var isDecrement = false;
					if (delta < 0) {
						isDecrement = true;
					}
					var newValue = parseInt($(this).val(), 10) + delta;

					// Only resize if field values are ok
					if (plugin._updateFields(fieldName, newValue, isDecrement)) {
						// Check if we are currently in cropping mode
						if (typeof plugin.jcAPI !== 'undefined' && plugin.jcAPI !== null) {
							plugin.setCropAreaByFieldValue();
						} else {
							plugin.setSizeByFieldValue();
						}
					}
				}

				e.preventDefault();
				return false;
			}

			/**
			 * Handle the mouse wheel event on the field
			 */
			function handleMouseWheelEventOnField(e, delta) {
				var minValue = e.data.minValue;
				var maxValue = e.data.maxValue;
				var fieldName = e.data.fieldName;

				// Handle key combinations
				if (e.shiftKey || e.metaKey || e.ctrlKey) {
					delta = delta * 10;
				}

				var newValue = parseInt($(this).val(), 10) + delta;
				var decrement = false;
				if (delta < 0) {
					decrement = true;
				}

				// Only resize if field values are ok
				if (plugin._updateFields(fieldName, newValue, decrement)) {
					// Check if we are currently in cropping mode
					if (typeof plugin.jcAPI !== 'undefined' && plugin.jcAPI !== null) {
						plugin.setCropAreaByFieldValue();
					} else {
						plugin.setSizeByFieldValue();
					}
				}
				return false;
			}

			/**
			 * Handle mousewheel,keyup actions on both fields
			 */
			var $heightField = $('#' + plugin.ui.imgResizeHeightField.getInputId());
			var heightEventData = {fieldName: 'height', maxValue: plugin.ui.imgResizeHeightField.maxValue, minValue: plugin.ui.imgResizeHeightField.minValue };
			$heightField.live('keyup', heightEventData, handleKeyUpEventOnField);
			$heightField.live('mousewheel', heightEventData, handleMouseWheelEventOnField);

			var $widthField = $('#' + plugin.ui.imgResizeWidthField.getInputId());
			var widthEventData = {fieldName: 'width', maxValue: plugin.ui.imgResizeWidthField.maxValue, minValue: plugin.ui.imgResizeWidthField.minValue};
			$widthField.live('keyup', widthEventData, handleKeyUpEventOnField);
			$widthField.live('mousewheel', widthEventData, handleMouseWheelEventOnField);

		},

		/**
		 * Manually set the given size for the current image
		 */
		setSize: function (width, height) {

			var plugin = this;
			plugin.imageObj.width(width);
			plugin.imageObj.height(height);
			var $wrapper = plugin.imageObj.closest('.Aloha_Image_Resize');
			$wrapper.height(height);
			$wrapper.width(width);

			plugin._onResize(plugin.imageObj);
			plugin._onResized(plugin.imageObj);
		},

		/**
		 * This method will handle the mouseUp event on images (eg. within editables).
		 * It will if enabled activate the resizing action.
		 */
		clickImage: function (e) {

			var plugin = this;
			plugin.endResize(); // removes previous resize handler
			plugin.imageObj = jQuery(e.target);
			var currentImage = plugin.imageObj;

			// Ignore any images that are part of the ui (e.g. block edit and delete icons)
			if (currentImage.hasClass('aloha-ui')) {
				return;
			}

			plugin.ui.setScope();

			var editable = currentImage.closest('.aloha-editable');

			this.ui._imageCnrRatioButton.setState(this.keepAspectRatio);

			// Disabling the content editable. This will disable the resizeHandles in internet explorer
			// already done in resize on a smaller scope, this block next aloha-selection-change event
			// to be thrown
			// editable.contentEditable(false);

			//Store the current props of the image
			this.restoreProps.push({
				obj : e.srcElement,
				src : plugin.imageObj.attr('src'),
				width : plugin.imageObj.width(),
				height : plugin.imageObj.height()
			});

			// Update the resize input fields with the new width and height
			var heightField = $('#' + plugin.ui.imgResizeHeightField.getInputId());
			heightField.val(plugin.imageObj.height());
			heightField.css('background-color', '');

			var widthField = $('#' + plugin.ui.imgResizeWidthField.getInputId());
			widthField.val(plugin.imageObj.width());
			widthField.css('background-color', '');

			if (plugin.settings.ui.meta) {
				plugin.ui.imgSrcField.setTargetObject(plugin.imageObj, 'src');
				plugin.ui.imgTitleField.setTargetObject(plugin.imageObj, 'title');
			}
			Aloha.Selection.preventSelectionChanged();
			try {
				plugin.ui.imgSrcField.focus();
			} catch(e) {
				// FIXME for some reason execution breaks at this point
			}

			//to handle switching between images, aspect ratio is recalculated on click
			plugin.aspectRatioValue = plugin.imageObj.width() / plugin.imageObj.height();

			if (plugin.settings.ui.resizable) {
				plugin.startResize();
			}

			if (plugin.settings.autoResize) {
				plugin.autoResize(true);
			}
			Aloha.Selection.preventSelectionChangedFlag = false;
			Aloha.trigger('aloha-image-selected');
		},

		/**
		 * This method extracts determins if the range selection contains an image
		 *
		 * UNUSED as long as clickImage don't change the selection
		 * @see getPluginFocus instead
		 */
		findImgMarkup: function (range) {

			var plugin = this;
			var config = this.config;
			var result, targetObj;

			if (typeof range === 'undefined') {
				range = Aloha.Selection.getRangeObject();
			}

			targetObj = jQuery(range.startContainer);

			try {
				if (Aloha.activeEditable) {
					if ((typeof range.startContainer !== 'undefined' &&
						typeof range.startContainer.childNodes !== 'undefined' &&
						typeof range.startOffset !== 'undefined' &&
						typeof range.startContainer.childNodes[range.startOffset] !== 'undefined' &&
						range.startContainer.childNodes[range.startOffset].nodeName.toLowerCase() === 'img' &&
						range.startOffset + 1 === range.endOffset) ||
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
		 * Gets the plugin focus target
		 */
		getPluginFocus: function () {
			return this.imageObj;
		},

		/**
		 * Helper function that checks a field-input (of height or width), adjusts
		 * its value to conform to minimum/maximum values, and corrects the other field
		 * if the aspect ratio is to be kept
		 * @param primaryFieldName the field which is currently edited ('height' or 'width')
		 * @param newValue the value as it was entered into the primary field
		 * @param isDecrement true if value is being decreased (by key or mousewheel); prevents decreasing below minimum
		 * @return true if values are correct or have been corrected, and image can be resized
		 */
		_updateFields: function (primaryFieldName, newValue, isDecrement) {
			var plugin = this;

			var primaryField = null;
			var secondaryField = null;

			var adjustedAspectRatio = null;
			var primaryMin = null;
			var primaryMax = null;
			var secondaryMin = null;
			var secondaryMax = null;

			//depending on the field that is edited, primary and secondary values are set
			if (primaryFieldName == 'width') {
				primaryField = jQuery("#" + plugin.ui.imgResizeWidthField.getInputId());
				secondaryField = jQuery("#" + plugin.ui.imgResizeHeightField.getInputId());
				adjustedAspectRatio = ( 1 / plugin.aspectRatioValue );

				primaryMin = plugin.settings.minWidth;
				primaryMax = plugin.settings.maxWidth;
				secondaryMin = plugin.settings.minHeight;
				secondaryMax = plugin.settings.maxHeight;

			} else if (primaryFieldName == 'height') {
				primaryField = jQuery("#" + plugin.ui.imgResizeHeightField.getInputId());
				secondaryField = jQuery("#" + plugin.ui.imgResizeWidthField.getInputId());
				adjustedAspectRatio = plugin.aspectRatioValue;

				primaryMin = plugin.settings.minHeight;
				primaryMax = plugin.settings.maxHeight;
				secondaryMin = plugin.settings.minWidth;
				secondaryMax = plugin.settings.maxWidth;
			} else {
				//if primaryFieldName is neither width nor height, don't update the fields
				return false;
			}

			if (isNaN(newValue)) {
				primaryField.css('background-color', 'red');
				// If the current value of the field can't be parsed it is not updated
				return false;
			}
			else {
				primaryField.val(newValue);
			}

			var correctPrimary = true;

			if (newValue > primaryMax) {
				// Auto correct out of bounds values
				if (plugin.settings.autoCorrectManualInput) {
					primaryField.val(primaryMax);
					newValue = primaryField.val();
					primaryField.css('background-color', '');
					correctPrimary = true;
				// Just notify the user, do nothing
				} else {
					primaryField.css('background-color', 'red');
					correctPrimary = false;
				}
			} else if (newValue < primaryMin) {
				// Don't let the user decrement values below minimum
				if (isDecrement) {
					primaryField.val(primaryMin);
					newValue = primaryField.val();
					correctPrimary = true;
				// Auto correct out of bounds values
				} else if (plugin.settings.autoCorrectManualInput) {
					primaryField.css('background-color', 'wheat');
					correctPrimary = false;
				// Just notify the user, do nothing
				} else {
					primaryField.css('background-color', 'red');
					correctPrimary = false;
				}
			} else {
				primaryField.css('background-color', '');
				correctPrimary = true;
			}

			var correctSecondary = true;

			// if keep aspect ratio is enabled, the field that is not edited is updated as well
			if ( plugin.keepAspectRatio ) {
				var secondary = Math.round(newValue * adjustedAspectRatio);

				if (secondary > secondaryMax) {
					// Auto correct out of bounds values
					if (plugin.settings.autoCorrectManualInput) {
						secondaryField.val(secondaryMax);
						primaryField.val(secondaryField.val() / adjustedAspectRatio);
						newValue = primaryField.val();
						primaryField.css('background-color', '');
						secondaryField.css('background-color', '');
						correctSecondary = true;
					// Just notify the user, do nothing
					} else {
						secondary.css('background-color', 'red');
						correctSecondary = false;
					}
				} else if (secondary < secondaryMin) {
					// Don't let the user decrement values below minimum
					if (isDecrement) {
						secondaryField.val(secondaryMin);
						primaryField.val(secondaryField.val() / adjustedAspectRatio);
						newValue = primaryField.val();
						correctPrimary = true;
					// Auto correct out of bounds values
					} else if (plugin.settings.autoCorrectManualInput) {
						secondaryField.val(secondary);
						secondaryField.css('background-color', 'wheat');
						correctSecondary = false;
					// Just notify the user, do nothing
					} else {
						secondaryField.css('background-color', 'red');
						correctSecondary = false;
					}
				} else {
					secondaryField.val(secondary);
					secondaryField.css('background-color', '');
					correctSecondary = true;
				}
			}

			//Success if values are correct or have been adjusted accordingly
			if (correctPrimary && correctSecondary) {
				return true;
			}
			return false;
		},

		/**
		 * Helper function that will set the new image size using the field values
		 */
		setSizeByFieldValue: function () {
			var plugin = this;
			var width =  $('#' + plugin.ui.imgResizeWidthField.getInputId()).val();
			var height = $('#' + plugin.ui.imgResizeHeightField.getInputId()).val();
			plugin.setSize(width, height);
		},

		/**
		 * Helper function that will set the new crop area width and height using the field values
		 */
		setCropAreaByFieldValue: function () {
			var plugin = this;
			var currentCropArea = plugin.jcAPI.tellSelect();

			var width =  $('#' + plugin.ui.imgResizeWidthField.getInputId()).val();
			width = parseInt(width, 10);
			var height = $('#' + plugin.ui.imgResizeHeightField.getInputId()).val();
			height = parseInt(height, 10);

			var selection = [currentCropArea['x'], currentCropArea['y'], currentCropArea['x'] + width,currentCropArea['y'] + height];
			plugin.jcAPI.setSelect(selection);
		},

		/**
		* This method will insert a new image dom element into the dom tree
		*/
		insertImg: function () {
				var range = Aloha.Selection.getRangeObject(),
				config = this.getEditableConfig(Aloha.activeEditable.obj),
				imagePluginUrl = Aloha.getPluginUrl('image'),
				imagestyle, imagetag, newImg;

				if (range.isCollapsed()) {
					// TODO I would suggest to call the srcChange method. So all image src
					// changes are on one single point.
					imagestyle = "max-width: " + config.maxWidth + "; max-height: " + config.maxHeight;
					imagetag = '<img style="' + imagestyle + '" src="' + imagePluginUrl + '/img/blank.jpg" title="" />';
					newImg = jQuery(imagetag);
					// add the click selection handler
					//newImg.click( Aloha.Image.clickImage ); - Using delegate now
					GENTICS.Utils.Dom.insertIntoDOM(newImg, range, jQuery(Aloha.activeEditable.obj));

			} else {
				Aloha.Log.error('img cannot markup a selection');
				// TODO the desired behavior could be me the selected content is
				// replaced by an image.
				// TODO it should be editor's choice, with an NON-Ext Dialog instead of alert

			}
		},

		srcChange: function () {
			// TODO the src changed. I suggest :
			// 1. set an loading image (I suggest set src base64 enc) to show the user
			// we are trying to load an image
			// 2. start a request to get the image
			// 3a. the image is ok change the src
			// 3b. the image is not availbable show an error.
			 this.imageObj.attr('src', this.ui.imgSrcField.getValue()); // (the img tag)
//			 jQuery(img).attr('src', this.imgSrcField.getQueryValue()); // (the query value in the inputfield)
//			 this.imgSrcField.getItem(); // (optinal a selected resource item)
			// TODO additionally implement an srcChange Handler to let implementer
			// customize
		},

		/**
		 * Reposition the crop buttons below the crop area
		 */
		positionCropButtons: function() {

			var jt = jQuery('.jcrop-tracker:first'),
				off = jt.offset(),
				jtt = off.top,
				jtl = off.left,
				jth = jt.height(),
				jtw = jt.width();

			var oldLeft = 0,
				oldTop = 0;

			var btns = jQuery('#aloha-CropNResize-btns');

			// Hack to hide the buttons when the user just clicked into the image
			if (jtt === 0 && jtl === 0) {
				btns.hide();
			}

			// move the icons to the bottom right side
			jtt = parseInt(jtt + jth + 3, 10);
			jtl = parseInt(jtl + (jtw / 2) - (btns.width() / 2) + 10, 10);

			// comparison to old values hinders flickering bug in FF
			if (oldLeft != jtl || oldTop != jtt) {
				btns.offset({top: jtt, left: jtl});
			}

			oldLeft = jtl;
			oldTop = jtt;
		},

		/**
		 * Code imported from CropnResize Plugin
		 *
		 */
		initCropButtons: function() {
			var that = this,
				btns;

			jQuery('body').append(
				'<div id="aloha-CropNResize-btns" display="none">' +
					'<button class="cnr-crop-apply" title="' + i18n.t('Accept') + '"></button>' +
					'<button class="cnr-crop-cancel" title="' + i18n.t('Cancel') + '"></button>' +
				'</div>'
			);

			btns = jQuery('#aloha-CropNResize-btns');

			btns.find('.cnr-crop-apply').click(function () {
				that.acceptCrop();
			});

			btns.find('.cnr-crop-cancel').click(function () {
				that.endCrop();
			});

			this.interval = setInterval(function () {
				that.positionCropButtons();
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
		 * Helper function that will disable selectability of elements
		 */
		_disableSelection: function (el) {
			el.find('*').attr('unselectable', 'on')
					.css({
					'-moz-user-select':'none',
					'-webkit-user-select':'none',
					'user-select':'none'
					});
				/*
					.each(function() {
					this.onselectstart = function () { return false; };
					});
					*/

		},

		/**
		 * Initiate a crop action
		 */
		crop: function () {
			var plugin = this;
			var config = this.config;

			plugin.initCropButtons();
			if (plugin.settings.ui.resizable) {
				plugin.endResize();
			}

			plugin.jcAPI = jQuery.Jcrop(plugin.imageObj, {
				onSelect : function () {
					plugin._onCropSelect();
					// ugly hack to keep scope :(
					window.setTimeout(function () {
						plugin.ui.setScope();
					}, 10);
				}
			});

			plugin._disableSelection($('.jcrop-holder'));
			plugin._disableSelection($('#imageContainer'));
			plugin._disableSelection($('#aloha-CropNResize-btns'));
			$('body').trigger('aloha-image-crop-start', [plugin.imageObj]);
		},

		/**
		 * Internal on crop select method
		 */
		_onCropSelect: function () {
			var plugin = this;

			jQuery('#aloha-CropNResize-btns').fadeIn('slow');

			// Hide the crop buttons when the one of the handles is clicked
			jQuery('.jcrop-handle').mousedown(function () {
				jQuery('#aloha-CropNResize-btns').hide();
			});

			jQuery('.jcrop-tracker').mousedown(function () {
				jQuery('#aloha-CropNResize-btns').hide();
			});

			// Update the width and height field using the initial active crop area values
			if (typeof plugin.jcAPI !== 'undefined' && plugin.jcAPI !== null) {

				plugin.positionCropButtons();
				var currentCropArea = plugin.jcAPI.tellSelect();

				var widthField = jQuery("#" + plugin.ui.imgResizeWidthField.getInputId()).val(currentCropArea['w']);
				var heightField = jQuery("#" + plugin.ui.imgResizeHeightField.getInputId()).val(currentCropArea['h']);

			}

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
			this.ui._imageCropButton.setState(false);

			if (this.settings.ui.resizable) {
				this.startResize();
			}

			$('body').trigger('aloha-image-crop-stop', [this.imageObj]);

			//after cropping, field values are set to (once again) contain image width/height
			$('#' + this.ui.imgResizeHeightField.getInputId()).val(this.imageObj.height());
			$('#' + this.ui.imgResizeWidthField.getInputId()).val(this.imageObj.width());

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
			var plugin = this;
			var currentImageObj = this.imageObj;
			var ratio = plugin.keepAspectRatio ? plugin.aspectRatioValue : false;

			currentImageObj = this.imageObj.css({
				height		: this.imageObj.height(),
				width		: this.imageObj.width(),
				position	: 'relative',
				'max-height': '',
				'max-width'	: ''
			});

			currentImageObj.resizable({
				maxHeight : plugin.settings.maxHeight,
				minHeight : plugin.settings.minHeight,
				maxWidth  : plugin.settings.maxWidth,
				minWidth  : plugin.settings.minWidth,
				aspectRatio : ratio,
				handles: plugin.settings.handles,
				grid : plugin.settings.grid,
				resize: function (event, ui) {
					resizing = true;
					plugin._onResize(plugin.imageObj);
				},
				stop : function (event, ui) {
					resizing = false;

					plugin._onResized(plugin.imageObj);

					// Workaround to finish cropping
					if (this.enableCrop) {
						window.setTimeout(function () {
							plugin.ui.setScope();
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
					'float': plugin.imageObj.css('float')
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
				//this.imageObj.contentEditable(true);
			}

			if (this.imageObj && this.imageObj.is(":ui-resizable")) {
				this.imageObj
					.resizable('destroy')
					.css({
						top	 : 0,
						left : 0
					});
			}
		},

		resetSize: function () {
			var	plugin = this,
				img = new Image();
			img.onload = function () {
				var myimage = plugin.getPluginFocus();
				if (plugin.settings.ui.resizable) {
					plugin.endResize();
				}
				jQuery(myimage).add(myimage.parent()).css({
						'width': img.width + 'px',
						'height': img.height + 'px',
						'max-width': '',
						'max-height': ''
					});
				if (plugin.settings.ui.resizable) {
					plugin.resize();
				}
			};
			img.src = plugin.getPluginFocus().attr('src');
		},
		/**
		 * Reset the image to its original properties
		 */
		reset: function () {
			if (this.settings.ui.crop) {
				this.endCrop();
			}

			if (this.settings.ui.resizable) {
				this.endResize();
			}

			if (this._onReset(this.imageObj)) {
				// the external reset procedure has already performed a reset, so there is no need to apply an internal reset
				return;
			}

			for (var i = 0;i < this.restoreProps.length;i++) {
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
