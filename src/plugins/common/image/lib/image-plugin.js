/* image-plugin.js is part of the Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2018 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * License http://aloha-editor.org/license.php
 */
define([
	'jquery',
	'PubSub',
	'aloha/core',
	'aloha/plugin',
	'aloha/content-rules',
	'util/dom',
	'image/image-floatingMenu',
	'image/vendor/jcrop',
	'jqueryui'
], function (
	$,
	PubSub,
	Aloha,
	Plugin,
	ContentRules,
	Dom,
	ImageFloatingMenu,
	Jcrop
) {
	'use strict';

	var jQuery = $;
	var resizing = false;
	var aspectRatioValue = false;
	var cropRatioValue = false;
	var configurations = {};

	// Insert jQuery Prototypes
	jQuery.extend(true, jQuery.fn, {
		increase: jQuery.fn.increase || function (attr) {
			var obj = jQuery(this), value, newValue;
			if (!obj.length) {
				return obj;
			}
			value = parseFloat(obj.css(attr));
			newValue = Math.round((value || 1) * 1.2);
			// when value is 2, won't increase
			if (value === newValue) {
				newValue++;
			}
			obj.css(attr, newValue);
			return obj;
		},
		decrease: jQuery.fn.decrease || function (attr) {
			var obj = jQuery(this), value, newValue;
			// Check
			if (!obj.length) {
				return obj;
			}
			// Calculate
			value = parseFloat(obj.css(attr));
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
			'fixedAspectRatio': false,
			// When enabled this setting will order the plugin to automatically resize images to given bounds
			'autoResize': false,
			//Image manipulation options - ONLY in default config section
			ui: {
				meta: true, // If imageResizeWidth and imageResizeHeight are displayed, then you will want to set this to true, so that the width and height text fields are updated automatically.
				crop: true, // If imageCropButton is displayed, then you have to enable this.
				resizable: true,	// Resizable ui-drag image
				focalpoint: true  // Whether to display the focalpoint button or not
			},
			handles: 'ne, se, sw, nw',   // set handles for resize

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

			// After successful cropping, the aspect ratio value has to be recalculated
			if (this.keepAspectRatio) {
				aspectRatioValue = parseInt(this.imageObj.css("width")) / parseInt(this.imageObj.css("height"));
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

			// Call the custom reset function
			return this.onReset($image);
		},

		/**
		 * Internal callback hook which gets invoked while the image is being resized
		 */
		_onResize: function ($image) {

			// No default behaviour defined besides event triggering
			$('body').trigger('aloha-image-resize', $image);

			this._applyValuesToFields(parseInt($image.css("width"), 10), parseInt($image.css("height"), 10));

			// Call the custom resize function
			this.onResize($image);
		},

		/**
		 * Internal callback hook which gets invoked when the current resizing action has stopped
		 */
		_onResized: function ($image) {

			$('body').trigger('aloha-image-resized', $image);

			this._applyValuesToFields(parseInt($image.css("width"), 10), parseInt($image.css("height"), 10));

			// Call the custom resize function
			this.onResized($image);
		},

		/**
		 * The image that is currently edited
		 */
		imageObj: null,
		/** Temporary image wrapper so JCrop doesn't go out of bounds */
		imageWrapper: null,

		/**
		 * The Jcrop API reference
		 * this is needed to be able to destroy the cropping frame later on
		 * the variable is linked to the api object whilst cropping, or set to null otherwise
		 * strange, but done as documented http://deepliquid.com/content/Jcrop_API.html
		 */
		jcAPI: null,
		/** JCrop Rect instance. */
		jcRect: null,

		/**
		 * State variable for the aspect ratio toggle feature
		 */
		keepAspectRatio: false,

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

			if (typeof this.settings.objectTypeFilter != 'undefined') {
				this.objectTypeFilter = this.settings.objectTypeFilter;
			}

			// Extend the default settings with the custom ones (done by default)
			plugin.config = plugin.defaultSettings;
			plugin.settings = jQuery.extend(true, plugin.defaultSettings, plugin.settings);

			// Determine the flag and the value of the aspect ratio depending on settings
			if (typeof this.settings.fixedAspectRatio === 'number') {
				aspectRatioValue = cropRatioValue = this.settings.fixedAspectRatio;
				plugin.keepAspectRatio = true;
			} else {
				if ((plugin.settings.fixedAspectRatio) === true) {
					plugin.keepAspectRatio = true;
				} else {
					plugin.keepAspectRatio = false;
				}
			}

			plugin.initializeUI()
			plugin.bindInteractions();
			plugin.subscribeEvents();

		},

		/**
		* Create buttons
		*/
		initializeUI: function () {
			this.ui = new ImageFloatingMenu();
			this.ui.init(this);
		},
		/**
		 * Bind plugin interactions
		 */
		bindInteractions: function () {
			var plugin = this;

			if (plugin.settings.ui.resizable) {
				try {
					// this will disable mozillas image resizing facilities
					document.execCommand('enableObjectResizing', false, false);
				} catch (e) {
					Aloha.Log.info(e, 'Could not disable enableObjectResizing');
					// this is just for internet explorer, which will not support disabling enableObjectResizing
				}
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
			var plugin = this;
			var config = this.settings;

			jQuery('img').filter(config.globalselector).unbind();
			jQuery('img').filter(config.globalselector).click(function (event) {
				plugin.clickImage(event);
			});

			PubSub.sub('aloha.editable.created', function (message) {
				var enabled = false;
				var config = plugin.getEditableConfig(message.editable.obj);

				if (config && config.enabled && ContentRules.isAllowed(message.editable.obj[0], 'img')) {
					enabled = true;
				}

				configurations[message.editable.getId()] = enabled;
			});

			PubSub.sub('aloha.editable.destroyed', function (message) {
				delete configurations[message.editable.getId()];
			});

			Aloha.bind('aloha-drop-files-in-editable', function (event, data) {
				var img, len = data.filesObjs.length, fileObj, config;

				while (--len >= 0) {
					fileObj = data.filesObjs[len];
					if (!fileObj.file.type.match(/image\//)) {
						continue;
					}
					config = plugin.getEditableConfig(data.editable.obj);
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
					Dom.insertIntoDOM(img, data.range, Aloha.activeEditable.obj);
				}
			});

			Aloha.bind('aloha-selection-changed', function (event, rangeObject, originalEvent) {
				if (originalEvent && originalEvent.target) {
					// Check if the element is currently being resized
					if (plugin.settings.ui.resizable && !jQuery(originalEvent.target).hasClass('ui-resizable-handle')) {
						plugin._unwrapImage();
						plugin.endResize();
						plugin.imageObj = null;
						Aloha.trigger('aloha-image-unselected');
					}
				}

				if (!Aloha.activeEditable) {
					plugin._unwrapImage();
					return;
				}

				if (!configurations[Aloha.activeEditable.getId()]) {
					plugin.ui._insertImageButton.hide();
					return;
				}

				plugin.ui._insertImageButton.show();

				// TODO this should not be necessary here!
				plugin.ui.doLayout();
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

				editable.obj.on('mouseup', 'img', function (event) {
					if (!resizing) {
						plugin.clickImage(event);
						event.stopPropagation();
					}
				});
			});

		},

		/**
		 * Automatically resize the image to fit into defined bounds.
		 * @param doScaleUp if true, small images are scaled up to fit minimum size
		 */
		autoResize: function (doScaleUp) {
			// @todo handle ratio mismatches (eg 4:3 is set but image is 16:9 --> image needs to be cut)

			var that = this;

			var widthField = jQuery("#" + that.ui.imgResizeWidthField.getInputId());
			var heightField = jQuery("#" + that.ui.imgResizeHeightField.getInputId());

			var width = parseInt(that.imageObj.css("width"), 10);
			var height = parseInt(that.imageObj.css("height"), 10);
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

				that._applyValuesToFields(width, height);

				that.setSizeByFieldValue();
				return true;
			}
			return false;
		},

		/**
		 * Toggle the keep aspect ratio functionality
		 */
		toggleKeepAspectRatio: function (active) {

			this.keepAspectRatio = active;

			// while cropping: calculate the new aspect ratio value for the crop
			if (this.jcAPI != null) {
				var selection = this._getCropSize();

				if (!this.keepAspectRatio) {
					cropRatioValue = false;
				} else {
					if (typeof this.settings.fixedAspectRatio !== 'number') {
						if (selection.w / selection.h > 0) {
							cropRatioValue = selection.w / selection.h;
						} else {
							cropRatioValue = parseInt(this.imageObj.css("width"), 10) / parseInt(this.imageObj.css("height"), 10);
						}
					} else {
						cropRatioValue = this.settings.fixedAspectRatio;
					}
				}

				this.jcAPI.setOptions(this.keepAspectRatio ? { aspectRatio: cropRatioValue } : { aspectRatio: 0 });
				this.jcAPI.focus();

				// if not in cropping mode: calculate the new aspect ratio value for image resizing
			} else {
				this.endResize();
				if (!this.keepAspectRatio) {
					aspectRatioValue = false;
				} else {
					if (typeof this.settings.fixedAspectRatio !== 'number') {
						aspectRatioValue = parseInt(this.imageObj.css("width"), 10) / parseInt(this.imageObj.css("height"), 10);
					} else {
						aspectRatioValue = this.settings.fixedAspectRatio;
					}
				}
				this.startResize();
			}
		},

		/**
		 * Manually set the given size for the current image
		 */
		setSize: function (width, height) {

			var plugin = this;
			plugin.imageObj.css("width", width + "px");
			plugin.imageObj.css("height", height + "px");
			var $wrapper = plugin.imageObj.closest('.Aloha_Image_Resize');
			$wrapper.css("height", height + "px");
			$wrapper.css("width", width + "px");

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

			plugin.ui._imageCnrRatioButton.setActive(this.keepAspectRatio);

			// Disabling the content editable. This will disable the resizeHandles in internet explorer
			// already done in resize on a smaller scope, this block next aloha-selection-change event
			// to be thrown
			// editable.contentEditable(false);

			var width = parseInt(plugin.imageObj.css("width"), 10);
			var height = parseInt(plugin.imageObj.css("height"), 10);

			// Store the current props of the image
			plugin.restoreProps.push({
				obj: plugin.imageObj,
				src: plugin.imageObj.attr('src'),
				width: width,
				height: height
			});

			// Update the resize input fields with the new width and height
			plugin._applyValuesToFields(width, height);

			plugin.ui.src = plugin.imageObj.attr('src')
			plugin.ui.title = plugin.imageObj.attr('title')

			Aloha.Selection.preventSelectionChanged();

			//to handle switching between images, aspect ratio is recalculated on click
			cropRatioValue = aspectRatioValue = width / height;

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
			if (range == null) {
				range = Aloha.Selection.getRangeObject();
			}

			var targetObj = jQuery(range.startContainer);

			try {
				if (!Aloha.activeEditable) {
					return null;
				}
				if (!targetObj.hasClass('Aloha_Image_Resize')
					&& !(
						range.startContainer != null
						&& range.startContain != null
						&& range.startContainer.childNodes[range.startOffset] != null
						&& range.startContainer.childNodes[range.startOffset].nodeName.toLowerCase() === 'img'
						&& range.startOffset + 1 === range.endOffset
					)
				) {
					return null;
				}

				var result = targetObj.find('img')[0];
				if (!result.css) {
					result.css = '';
				}

				if (!result.title) {
					result.title = '';
				}

				if (!result.src) {
					result.src = '';
				}

				return result;
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

			var $primaryField = null;
			var $secondaryField = null;

			var adjustedAspectRatio = null;
			var primaryMin = null;
			var primaryMax = null;
			var secondaryMin = null;
			var secondaryMax = null;

			// If the aspect-ratio for cropping has been changed from the standard aspect-ratio,
			// it is used for updating the fields (if keeping ratio is activated)
			if (typeof plugin.jcAPI !== 'undefined' && plugin.jcAPI !== null) {
				adjustedAspectRatio = cropRatioValue ? cropRatioValue : aspectRatioValue;
			} else {
				adjustedAspectRatio = aspectRatioValue;
			}

			// Depending on the field that is edited, primary and secondary values are set
			if (primaryFieldName == 'width') {
				$primaryField = $("#" + plugin.ui.imgResizeWidthField.getInputId());
				$secondaryField = $("#" + plugin.ui.imgResizeHeightField.getInputId());
				adjustedAspectRatio = (1 / adjustedAspectRatio);

				primaryMin = plugin.settings.minWidth;
				primaryMax = plugin.settings.maxWidth;
				secondaryMin = plugin.settings.minHeight;
				secondaryMax = plugin.settings.maxHeight;

			} else if (primaryFieldName == 'height') {
				$primaryField = $("#" + plugin.ui.imgResizeHeightField.getInputId());
				$secondaryField = $("#" + plugin.ui.imgResizeWidthField.getInputId());
				adjustedAspectRatio = adjustedAspectRatio;

				primaryMin = plugin.settings.minHeight;
				primaryMax = plugin.settings.maxHeight;
				secondaryMin = plugin.settings.minWidth;
				secondaryMax = plugin.settings.maxWidth;
			} else {
				// If primaryFieldName is neither width nor height, don't update the fields
				return false;
			}

			if (isNaN(newValue)) {
				$primaryField.css('background-color', 'red');
				// If the current value of the field can't be parsed it is not updated
				return false;
			}
			else {
				$primaryField.val(newValue);
			}

			var correctPrimary = true;

			if (newValue > primaryMax) {
				// Auto-correct out of bounds values
				if (plugin.settings.autoCorrectManualInput) {
					$primaryField.val(primaryMax);
					newValue = $primaryField.val();
					$primaryField.css('background-color', '');
					correctPrimary = true;
					// Just notify the user, do nothing
				} else {
					$primaryField.css('background-color', 'red');
					correctPrimary = false;
				}
			} else if (newValue < primaryMin) {
				// Don't let the user decrement values below minimum
				if (isDecrement) {
					$primaryField.val(primaryMin);
					newValue = $primaryField.val();
					correctPrimary = true;
					// Auto-correct out of bounds values
				} else if (plugin.settings.autoCorrectManualInput) {
					$primaryField.css('background-color', 'wheat');
					correctPrimary = false;
					// Just notify the user, do nothing
				} else {
					$primaryField.css('background-color', 'red');
					correctPrimary = false;
				}
			} else {
				$primaryField.css('background-color', '');
				correctPrimary = true;
			}

			var correctSecondary = true;

			// If keep aspect ratio is enabled, the field that is not edited is updated as well
			if (plugin.keepAspectRatio) {
				var secondary = Math.round(newValue * adjustedAspectRatio);

				if (secondary > secondaryMax) {
					// Auto-correct out of bounds values
					if (plugin.settings.autoCorrectManualInput) {
						$secondaryField.val(secondaryMax);
						$primaryField.val($secondaryField.val() / adjustedAspectRatio);
						newValue = $primaryField.val();
						$primaryField.css('background-color', '');
						$secondaryField.css('background-color', '');
						correctSecondary = true;
						// Just notify the user, do nothing
					} else {
						secondary.css('background-color', 'red');
						correctSecondary = false;
					}
				} else if (secondary < secondaryMin) {
					// Don't let the user decrement values below minimum
					if (isDecrement) {
						$secondaryField.val(secondaryMin);
						$primaryField.val($secondaryField.val() / adjustedAspectRatio);
						newValue = $primaryField.val();
						correctPrimary = true;
						// Auto-correct out of bounds values
					} else if (plugin.settings.autoCorrectManualInput) {
						$secondaryField.val(secondary);
						$secondaryField.css('background-color', 'wheat');
						correctSecondary = false;
						// Just notify the user, do nothing
					} else {
						$secondaryField.css('background-color', 'red');
						correctSecondary = false;
					}
				} else {
					$secondaryField.val(secondary);
					$secondaryField.css('background-color', '');
					correctSecondary = true;
				}
			}

			// Final check for value of secondary field, in case focus was changed
			if ($secondaryField.val() < secondaryMin) {
				correctSecondary = false;
			}

			// Success if values are correct or have been adjusted accordingly
			if (correctPrimary && correctSecondary) {
				return true;
			}
			return false;
		},

		/**
		 * Helper function that will set the new image size using the field values
		 */
		setSizeByFieldValue: function () {
			var width = this.ui.width;
			var height = this.ui.height;
			this.setSize(width, height);
		},

		/**
		 * Helper function that sets field values to specified parameters and resets background of fields
		 * @param width new image-width in pixels
		 * @param height new image-height in pixels
		 */
		_applyValuesToFields: function (width, height) {
			this.ui.width = width;
			this.ui.height = height;
		},

		/**
		 * Helper function that will set the new crop area width and height using the field values
		 *
		 * note: because the _updateFields function does not consider the x and y of the croparea yet,
		 * the value of the secondary field shown after setting croparea with manual input may be incorrect;
		 * while this has no influence on the actual crop size, a future implementation should consider this
		 * when calculating the field values
		 */
		setCropAreaByFieldValue: function () {
			var currentCropArea = this._getCropSize();

			var width = parseInt(this.ui.width, 10);
			var height = parseInt(this.ui.height, 10);

			this.jcAPI.active.pos.x = currentCropArea.x;
			this.jcAPI.active.pos.y = currentCropArea.y;
			this.jcAPI.active.pos.w = width;
			this.jcAPI.active.pos.h = height;

			this.jcAPI.enable();
		},

		/**
		* This method will insert a new image dom element into the dom tree
		*/
		insertImg: function () {
			var range = Aloha.Selection.getRangeObject(),
				config = this.getEditableConfig(Aloha.activeEditable.obj),
				imagePluginUrl = Aloha.getPluginUrl('image'),
				imagestyle,
				imagetag,
				newImg;

			if (range.isCollapsed()) {
				// TODO I would suggest to call the srcChange method. So all image src
				// changes are on one single point.
				imagestyle = "max-width: " + config.maxWidth + "; max-height: " + config.maxHeight;
				imagetag = '<img style="' + imagestyle + '" src="' + imagePluginUrl + '/img/blank.jpg" title="" />';
				newImg = jQuery(imagetag);
				// add the click selection handler
				//newImg.click( Aloha.Image.clickImage ); - Using delegate now
				Dom.insertIntoDOM(newImg, range, Aloha.activeEditable.obj);

			} else {
				Aloha.Log.error('img cannot markup a selection');
				// TODO the desired behavior could be me the selected content is
				// replaced by an image.
				// TODO it should be editor's choice, with an NON-Ext Dialog instead of alert
			}
		},

		srcChange: function () {
			this.imageObj.attr('src', this.ui.src);
		},

		/**
		 * Helper function that will disable selectability of elements
		 */
		_disableSelection: function (el) {
			el.find('*').attr('unselectable', 'on')
				.css({
					'-moz-user-select': 'none',
					'-webkit-user-select': 'none',
					'user-select': 'none'
				});
			/*
				.each(function () {
				this.onselectstart = function () { return false; };
				});
				*/
		},

		/**
		 * Initiate a crop action
		 */
		crop: function () {
			var plugin = this;
			var ratio = plugin.keepAspectRatio ? aspectRatioValue : false;

			if (this.settings.ui.focalpoint) {
				this.disableFocalPointMode();
			}
			this.ui._imageCropButton.setActive(true);

			if (plugin.settings.ui.resizable) {
				plugin.endResize();
			}

			plugin._wrapImage();

			plugin.jcAPI = Jcrop.attach(plugin.imageObj[0], {
				aspectRatio: ratio,
				multiMin: plugin.settings.minWidth,
				multiMax: plugin.settings.maxWidth
			});
			plugin.jcRect = Jcrop.Rect.from(plugin.imageObj[0]);
			plugin.jcAPI.newWidget(plugin.jcRect, {});

			plugin.jcAPI.listen('crop.change', function () {
				// ugly hack to keep scope :(
				window.setTimeout(function () {
					plugin.ui.setScope();
				}, 10);
			});

			// plugin._disableSelection($('.jcrop-holder'));
			plugin._disableSelection($('#imageContainer'));
			plugin._disableSelection($('#aloha-CropNResize-btns'));
			$('body').trigger('aloha-image-crop-start', [plugin.imageObj]);
		},

		_drawFocalPoint: function (fpX, fpY) {
			var lineX = jQuery(".aloha-image-box-active").find('.fpx-line')[0];
			var lineY = jQuery(".aloha-image-box-active").find('.fpy-line')[0];
			jQuery(lineX).attr("x1", fpX - 10);
			jQuery(lineX).attr("y1", fpY);

			jQuery(lineX).attr("x2", fpX + 10);
			jQuery(lineX).attr("y2", fpY);

			jQuery(lineY).attr("x1", fpX);
			jQuery(lineY).attr("y1", fpY - 10);

			jQuery(lineY).attr("x2", fpX);
			jQuery(lineY).attr("y2", fpY + 10);
		},

		setFocalPoint: function (fpXFactor, fpYFactor) {
			var svg = jQuery(".img-overlay-wrap").find('svg')[0];
			if (svg != undefined) {
				var height = svg.getBoundingClientRect().height;
				var width = svg.getBoundingClientRect().width;
				var fpX = width * fpXFactor;
				var fpY = height * fpYFactor;
				this._drawFocalPoint(fpX, fpY);
			}
		},

		_setFocalPoint: function (event) {
			var fpX = event.offsetX;
			var fpY = event.offsetY;
			var svg = jQuery(".img-overlay-wrap").find('svg')[0];

			this._drawFocalPoint(fpX, fpY);

			// Calculate the focal point factors
			var height = svg.getBoundingClientRect().height;
			var width = svg.getBoundingClientRect().width;
			var fpXFactor = fpX / width;
			var fpYFactor = fpY / height;
			$('body').trigger('aloha-image-focalpoint', [{ "fpx": fpXFactor, "fpy": fpYFactor }]);

		},

		enableFocalPointMode: function () {
			var plugin = this;
			var ratio = plugin.keepAspectRatio ? aspectRatioValue : false;

			jQuery(".ui-resizable-handle").hide();
			if (!jQuery(".aloha-image-box-active").find(".img-overlay-wrap").length) {
				jQuery(".aloha-image-box-active")
					.append("<div class=\"img-overlay-wrap\">" +
						"<svg width=\"100%\" height=\"100%\">" +
						"<line class=\"fpx-line\"/>" +
						"<line class=\"fpy-line\"/>" +
						"</svg></div>");
			}
			$('body').trigger('aloha-image-focalpoint-start');
			jQuery(".img-overlay-wrap").click(this._setFocalPoint.bind(this))
		},

		disableFocalPointMode: function () {
			jQuery(".ui-resizable-handle").show();
			jQuery(".img-overlay-wrap").remove();
			this.ui._imageFocalPointButton.setActive(false);
			$('body').trigger('aloha-image-focalpoint-stop');
		},

		/**
		 * Terminates a crop
		 */
		endCrop: function () {
			if (this.jcAPI) {
				this.jcAPI.destroy();
				this.jcRect = null;
				this.jcAPI = null;
			}

			this.ui._imageCropButton.setActive(false);

			if (this.settings.ui.resizable) {
				this.startResize();
			}

			$('body').trigger('aloha-image-crop-stop', [this.imageObj]);

			//after cropping, field values are set to (once again) contain image width/height
			this._applyValuesToFields(this.imageObj.css("width"), 10), parseInt(this.imageObj.css("height"), 10);
		},

		_wrapImage: function() {
			var plugin = this;

			// Already wrapped
			if (plugin.imageWrapper != null) {
				return;
			}

			// Create the wrapper element
			plugin.imageWrapper = $('<div>', {
				class: 'aloha aloha-image-jcrop-wrapper',
			});
			// Insert the wrapper before the image-object
			plugin.imageWrapper.insertBefore(plugin.imageObj);
			// move the image object into the wrapper
			plugin.imageWrapper.append(plugin.imageObj);

			// Create the buttons for confirm/cancel  
			plugin.imageWrapper.append($('<div>', {
				class: 'aloha-image-crop-controls-container',
			}).append(
				// Confirm button
				$('<button>', {
					class: 'aloha-button ui-widget aloha-crop-confirm',
					attr: {
						type: 'button',
						role: 'button',
					},
				}).append($('<i>', {
					class: 'aloha-button-icon material-symbols-outlined',
					text: 'check_circle'
				})).on('click', function() {
					plugin._unwrapImage();
					plugin.acceptCrop();
				}),

				// Cancel button
				$('<button>', {
					class: 'aloha-button ui-widget aloha-crop-cancel',
					attr: {
						type: 'button',
						role: 'button',
					},
				}).append($('<i>', {
					class: 'aloha-button-icon material-symbols-outlined',
					text: 'cancel'
				})).on('click', function() {
					plugin._unwrapImage();
					plugin.endCrop();
				}),
			));
		},
		_unwrapImage: function() {
			var plugin = this;

			// Already unwrapped
			if (plugin.imageWrapper == null) {
				return;
			}

			plugin.imageObj.parent().insertBefore(plugin.imageWrapper);
			plugin.imageWrapper.remove();
			plugin.imageWrapper = null;
		},

		_getCropSize: function() {
			if (!this.jcAPI) {
				return null;
			}
			return this.jcAPI.active.pos;
		},

		/**
		 * Accept the current cropping area and apply the crop
		 */
		acceptCrop: function () {
			this._onCropped(this.imageObj, this._getCropSize());
			this.endCrop();
		},

		/**
		 * This method will activate the jquery-ui resize functionality for the current image
		 */
		startResize: function () {
			var plugin = this;
			var currentImageObj = this.imageObj;
			var ratio = plugin.keepAspectRatio ? aspectRatioValue : false;

			currentImageObj = this.imageObj.css({
				height: parseInt(this.imageObj.css("height")),
				width: parseInt(this.imageObj.css("width")),
				position: 'relative',
				'max-height': '',
				'max-width': ''
			});

			currentImageObj.resizable({
				maxHeight: plugin.settings.maxHeight,
				minHeight: plugin.settings.minHeight,
				maxWidth: plugin.settings.maxWidth,
				minWidth: plugin.settings.minWidth,
				aspectRatio: ratio,
				handles: plugin.settings.handles,
				grid: plugin.settings.grid,
				resize: function (event, ui) {
					resizing = true;
					plugin._onResize(plugin.imageObj);
				},
				stop: function (event, ui) {
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
				.on('resizestart', function (e) {
					e.preventDefault();
				})
				.on('mouseup', function (e) {
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
						top: 0,
						left: 0
					});
			}
		},

		resetSize: function () {
			var plugin = this,
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
			var externalReset;

			if (this.settings.ui.crop) {
				this.endCrop();
			}

			if (this.settings.ui.resizable) {
				this.endResize();
			}

			if (this.settings.ui.focalpoint) {
				this.disableFocalPointMode();
			}

			externalReset = this._onReset(this.imageObj);

			// if the external reset procedure has already performed a reset, there is no need to apply an internal reset
			if (!externalReset) {
				for (var i = 0; i < this.restoreProps.length; i++) {

					// restore from restoreProps if there is a match
					if (this.imageObj.get(0) === this.restoreProps[i].obj.get(0)) {
						this.imageObj.attr('src', this.restoreProps[i].src);
						this.imageObj.css("width", this.restoreProps[i].width + "px");
						this.imageObj.css("height", this.restoreProps[i].height + "px");
						break;
					}
				}
			}

			// readjust inputfields to show correct height/width
			this._applyValuesToFields(parseInt(this.imageObj.css("width"), 10), parseInt(this.imageObj.css("height"), 10));
		}
	});

});
