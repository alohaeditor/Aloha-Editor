/*
* Aloha Image Plugin - Allow image manipulation in Aloha Editor
* Copyright (C) 2010 by Nicolas Karageuzian - http://nka.me/
*	Copyright (C) 2010 by Benjamin Athur Lupton - http://www.balupton.com
* Licensed unter the terms of AGPL http://www.gnu.org/licenses/agpl-3.0.html
*
* do not require anymore IKS Loader
*/

// Start Closure
(function(window, undefined) {
	var
		jQuery = window.alohaQuery, $ = jQuery,
		GENTICS = window.GENTICS,
		Aloha = GENTICS.Aloha;

	// Attributes manipulation utilities
	// Aloha team may want to factorize, it could be useful for other plugins
	// Prototypes
	String.prototype.toInteger = String.prototype.toInteger || function(){
		return parseInt(String(this).replace(/px$/,'')||0,10);
	};
	String.prototype.toFloat = String.prototype.toInteger || function(){
		return parseFloat(String(this).replace(/px$/,'')||0,10);
	};
	Number.prototype.toInteger = Number.prototype.toInteger || String.prototype.toInteger;
	Number.prototype.toFloat = Number.prototype.toFloat || String.prototype.toFloat;

	// Insert jQuery Prototypes
	jQuery.extend(true, jQuery.fn, {
		increase: jQuery.fn.increase || function(attr){
			var	obj = jQuery(this),
				value = obj.css(attr).toFloat(),
				newValue = Math.round((value||1)*1.2);
			if (value == newValue) { // when value is 2, won't increase
				newValue++;
			}
			// Apply
			obj.css(attr,newValue);
			// Chain
			return obj;
		},
		decrease: jQuery.fn.decrease || function(attr){
			var	obj = jQuery(this),
				value = obj.css(attr).toFloat(),
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

	// Create our Image Plugin
	GENTICS.Aloha.Image = new GENTICS.Aloha.Plugin('image');
	jQuery.extend(true, GENTICS.Aloha.Image,{
		languages: ['en', 'fr', 'de', 'ru', 'cz'],
		config: {
			'img': {
				'max_width': '50px',
				'max_height': '50px',
				//Image manipulation options - ONLY in default config section
				'ui': {
					'align': true,       // Menu elements to show/hide in menu
					'resize': true,		 //resize buttons
					'meta': true,
					'margin': true,
					'crop':true,
					'resizable': true,   //resizable ui-drag image
					'aspectRatio': true
				},
				/**
				 * crop callback is triggered after the user clicked accept to accept his crop
				 * @param image jquery image object reference
				 * @param props cropping properties
				 */
				'onCropped':function (image, props) {},
				/**
				 * reset callback is triggered before the internal reset procedure is applied
				 * if this function returns true, then the reset has been handled by the callback
				 * which means that no other reset will be applied
				 * if false is returned the internal reset procedure will be applied
				 * @param image jquery image object reference
				 * @return true if a reset has been applied, flase otherwise
				 */
				'onReset': function (image) { return false; }
			}
		},
		onCropped: function (image, props) {},
		onReset: function (image) { return false; },
		onResized: function (image) {},
		/**
		 * The image that is currently edited
		 */
		obj: null,
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
		init: function(){
			// get settings
			var config = this.config,
				me = this,
				Aloha = GENTICS.Aloha,
				imagePluginUrl = GENTICS.Aloha.getPluginUrl('image');
			if (!this.settings.config.img) {
				this.settings.config.img = this.config.img;
			}
			if (!this.settings.config.img.ui) {
				this.settings.config.img.ui = this.config.img.ui;
			}
			if (typeof GENTICS.Aloha.Image.settings.objectTypeFilter !== 'undefined')
				GENTICS.Aloha.Image.objectTypeFilter = GENTICS.Aloha.Image.settings.objectTypeFilter;
			if (typeof GENTICS.Aloha.Image.settings.dropEventHandler !== 'undefined')
				GENTICS.Aloha.Image.dropEventHandler = GENTICS.Aloha.Image.settings.dropEventHandler;

			if (typeof window.jQuery.ui === "undefined") {

				Aloha
				.loadCss(imagePluginUrl+'/dep/ui/ui-lightness/jquery-ui-1.8.10.custom.css')
				.loadJs(imagePluginUrl+'/dep/ui/jquery-ui-1.8.10.custom.min.js')
				;
			}
			if (this.settings.config.img.ui.crop) {
				 Aloha
						.loadCss(imagePluginUrl+'/dep/ui/ui-lightness/jquery-ui-1.8.10.cropnresize.css')
						.loadCss(imagePluginUrl+'/dep/jcrop/jquery.jcrop.css')
						.loadJs(imagePluginUrl+'/dep/jcrop/jquery.jcrop.min.js')
					;
			}

			me.initImage();
			me.bindInteractions();
			me.subscribeEvents();

		 }, // END INIT

		 /**
		 * Do the UI/buttons Initialization
		 */
		 initImage: function() {
			// Prepare
			var
				me = this, config = this.config,
				Aloha = GENTICS.Aloha;

			this.insertImgButton = new GENTICS.Aloha.ui.Button({
				'iconClass': 'GENTICS_button GENTICS_img AlohaImage_insert',
				'size' : 'small',
				'onclick' : function () { me.insertImg(); },
				'tooltip' : me.i18n('button.addimg.tooltip'),
				'toggle' : false
			});
			GENTICS.Aloha.FloatingMenu.addButton(
				'GENTICS.Aloha.continuoustext',
				this.insertImgButton,
				GENTICS.Aloha.i18n(GENTICS.Aloha, 'floatingmenu.tab.insert'),
				1
			);

			GENTICS.Aloha.FloatingMenu.createScope(this.getUID('image'), 'GENTICS.Aloha.empty');

			// add the src field for images
			if (this.settings.config.img.ui.meta) {
				var imgSrcLabel = new GENTICS.Aloha.ui.Button({
					'label': me.i18n('field.img.src.label'),
					'tooltip': me.i18n('field.img.src.tooltip'),
					'size': 'small'
				});
				this.imgSrcField = new GENTICS.Aloha.ui.AttributeField();
				this.imgSrcField.setObjectTypeFilter( this.objectTypeFilter );

				// add the title field for images
				var imgTitleLabel = new GENTICS.Aloha.ui.Button({
					'label': me.i18n('field.img.title.label'),
					'tooltip': me.i18n('field.img.title.tooltip'),
					'size': 'small'
				});
				this.imgTitleField = new GENTICS.Aloha.ui.AttributeField();
				this.imgTitleField.setObjectTypeFilter();
				GENTICS.Aloha.FloatingMenu.addButton(
						this.getUID('image'),
						this.imgSrcField,
						this.i18n('floatingmenu.tab.img'),
						1
				);
			}
			if (config.img.ui.align) {
				var alignLeftButton = new GENTICS.Aloha.ui.Button({
					'iconClass': 'GENTICS_img AlohaImage_align_left',
					'size': 'small',
					'onclick' : function() {
						jQuery(me.findImgMarkup()).css('float', 'left');
					},
					'tooltip': me.i18n('button.img.align.left.tooltip')
				});
				var alignRightButton = new GENTICS.Aloha.ui.Button({
					'iconClass': 'GENTICS_img AlohaImage_align_right',
					'size': 'small',
					'onclick' : function() {
						jQuery(me.findImgMarkup()).css('float', 'right');
					},
					'tooltip': me.i18n('button.img.align.right.tooltip')
				});
				var alignNoneButton = new GENTICS.Aloha.ui.Button({
					'iconClass': 'GENTICS_img AlohaImage_align_none',
					'size': 'small',
					'onclick' : function() {
					var img = me.findImgMarkup();
						jQuery(img).css('float', '');
					},
					'tooltip': me.i18n('button.img.align.none.tooltip')
				});
				GENTICS.Aloha.FloatingMenu.addButton(
					this.getUID('image'),
					alignLeftButton,
					this.i18n('floatingmenu.tab.img'),
					1
				);
				GENTICS.Aloha.FloatingMenu.addButton(
						this.getUID('image'),
						alignRightButton,
						this.i18n('floatingmenu.tab.img'),
						1
				);
				GENTICS.Aloha.FloatingMenu.addButton(
					this.getUID('image'),
					alignNoneButton,
					this.i18n('floatingmenu.tab.img'),
					1
				);
			}
			if (config.img.ui.meta && !(config.img.ui.align)) {
				//TODO some hacking to get ui well when only meta fields
			}
			if (config.img.ui.meta) {
				GENTICS.Aloha.FloatingMenu.addButton(
						this.getUID('image'),
						this.imgTitleField,
						this.i18n('floatingmenu.tab.img'),
						1
				);
			}
			if (config.img.ui.margin) {

				var incPadding = new GENTICS.Aloha.ui.Button({
					iconClass: 'GENTICS_img AlohaImage_padding_increase',
					size: 'small',
					onclick: function() {
						// Apply
						jQuery(me.findImgMarkup()).increase('padding');
					},
					tooltip: this.i18n('padding.increase')
				});
				GENTICS.Aloha.FloatingMenu.addButton(
						this.getUID('image'),
						incPadding,
						this.i18n('floatingmenu.tab.img'),
						2
				);
				var decPadding = new GENTICS.Aloha.ui.Button({
					iconClass: 'GENTICS_img AlohaImage_padding_decrease',
					size: 'small',
					onclick: function() {
						// Apply
						jQuery(me.findImgMarkup()).decrease('padding');
					},
					tooltip: this.i18n('padding.decrease')
				});
				GENTICS.Aloha.FloatingMenu.addButton(
						this.getUID('image'),
						decPadding,
						this.i18n('floatingmenu.tab.img'),
						2
				);
			}
			if(config.img.ui.crop) {
				// create image scope
				GENTICS.Aloha.FloatingMenu.createScope('GENTICS.Aloha.img', ['GENTICS.Aloha.global']);

				this.cropButton = new GENTICS.Aloha.ui.Button({
					'size' : 'small',
					'tooltip' : this.i18n('Crop'),
					'toggle' : true,
					'iconClass' : 'cnr_crop',
					'onclick' : function (btn, event) {
						if (btn.pressed) {
							me.crop();
						} else {
							me.endCrop();
						}
					}
				});

				// add to floating menu
				GENTICS.Aloha.FloatingMenu.addButton(
					this.getUID('image'),
					this.cropButton,
					this.i18n('floatingmenu.tab.img'),
					3
				);

				/*
				 * add a reset button
				 */
				GENTICS.Aloha.FloatingMenu.addButton(
						this.getUID('image'),
					new GENTICS.Aloha.ui.Button({
						'size' : 'small',
						'tooltip' : this.i18n('Reset'),
						'toggle' : false,
						'iconClass' : 'cnr_reset',
						'onclick' : function (btn, event) {
							me.reset();
						}
					}),
					this.i18n('floatingmenu.tab.img'),
					3
				);
			}
			if (config.img.ui.resize) {
				var incSize = new GENTICS.Aloha.ui.Button({
					iconClass: 'GENTICS_img AlohaImage_size_increase',
					size: 'small',
					onclick: function() {
						// Apply
						jQuery(me.findImgMarkup()).increase('height').increase('width');
					},
					tooltip: this.i18n('size.increase')
				});
				GENTICS.Aloha.FloatingMenu.addButton(
						this.getUID('image'),
						incSize,
						this.i18n('floatingmenu.tab.img'),
						2
				);
				var decSize = new GENTICS.Aloha.ui.Button({
					iconClass: 'GENTICS_img AlohaImage_size_decrease',
					size: 'small',
					onclick: function() {
						// Apply
						jQuery(me.findImgMarkup()).decrease('height').decrease('width');
					},
					tooltip: me.i18n('size.decrease')
				});
				GENTICS.Aloha.FloatingMenu.addButton(
						this.getUID('image'),
						decSize,
						this.i18n('floatingmenu.tab.img'),
						2
				);
			}
		}, // end of InitImage

		/**
		 * Bind plugin interactions
		 */
		bindInteractions: function () {
			// Prepare
			var
				me = this, config = this.config,
				Aloha = GENTICS.Aloha;

			if(this.settings.config.img.ui.resizable) {
				try {
					// this will disable mozillas image resizing facilities
					document.execCommand('enableObjectResizing', false, 'false');
				} catch (e) {
					// this is just for internet explorer, who will not support disabling enableObjectResizing
				}
			}

			if (this.settings.config.img.ui.meta) {
				// update image object when src changes
				this.imgSrcField.addListener('keyup', function(obj, event) {
					me.srcChange();
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
			if (config.img.onCropped && typeof config.img.onCropped === "function") {
				this.onCropped = this.settings.onCropped;
			}
			if (config.img.onReset && typeof config.img.onReset === "function") {
				this.onReset = this.settings.onReset;
			}
			if (config.img.aspectRatio && typeof config.img.aspectRatio !== "boolean") {
				this.settings.aspectRatio = true;
			}
		},

		/**
		 * Subscribe to Aloha events and DragAndDropPlugin Event
		 */
		subscribeEvents: function () {
			// Prepare
			var
				me = this, config = this.config,
				Aloha = GENTICS.Aloha;

			//handles dropped files
			Aloha.EventRegistry.subscribe(Aloha, 'UploadSuccess', function(event,data) {
				if (data.file.type.match(/image\//)) {
					var imgObj = jQuery('#'+data.id);
					imgObj.attr("src",data.src);
					imgObj.removeAttr('id');
				}
			});
			Aloha.EventRegistry.subscribe(Aloha, 'UploadFailure', function(event,data) {
				if (data.file.type.match(/image\//)) {
					jQuery('#'+data.id).remove();
				}
			});
			Aloha.EventRegistry.subscribe(Aloha, 'dropFilesInEditable', function(event,data) {
				//console.log(data.file);
				// Prepare
				var
					me = this,
					len = data.filesObjs.length,
					reader, fileObj,
					onloadendHandler = function(readEvent,reader) {
						// Prepare
						var
							imagestyle = "width: "+me.config.img.max_width+"; height: "+me.config.img.max_height,
							img = jQuery('<img id="'+me.attachedFile.id+'" style="'+imagestyle+'" title="" src="" />');

						//img.click( GENTICS.Aloha.Image.clickImage ); - Using delegate now
						if (typeof me.attachedFile.src === 'undefined') {
							me.attachedFile.src = readEvent.target.result;
						}
						img.attr('src', me.attachedFile.src );
						GENTICS.Utils.Dom.insertIntoDOM(img, me.attachedData.range, jQuery(Aloha.activeEditable.obj));
					};

				// Loop
				while (--len >= 0) {
					fileObj = data.filesObjs[len];
					if (fileObj.file.type.match(/image\//)) {
						// Prepare
						reader = new FileReader();
						reader.config = me.getEditableConfig(data.editable);
						reader.attachedData = data;
						reader.attachedFile = fileObj;
						reader.onloadend = onloadendHandler;
					}
					reader.readAsDataURL(fileObj.file);
				}
			});

			// add the event handler for selection change
			GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'selectionChanged', function(event, rangeObject, originalEvent) {
				if (originalEvent && originalEvent.target) {
					if (me.settings.config.img.ui.resizable && !jQuery(originalEvent.target).hasClass('ui-resizable-handle')) {
						me.endResize();
					}
				}

				if(GENTICS.Aloha.activeEditable !== null) {
					var foundMarkup = me.findImgMarkup( rangeObject ),
						config = me.getEditableConfig(GENTICS.Aloha.activeEditable.obj);

					if (typeof config.img !== 'undefined' ) {
						me.insertImgButton.show();
						GENTICS.Aloha.FloatingMenu.doLayout();
					} else {
						me.insertImgButton.hide();
						// TODO this should not be necessary here!
						GENTICS.Aloha.FloatingMenu.doLayout();
						// leave if img is not allowed
						return;
					}
					if ( foundMarkup ) {
						// img found
						me.insertImgButton.hide();
						GENTICS.Aloha.FloatingMenu.setScope(me.getUID('image'));
						if(me.settings.config.img.ui.meta) {
							me.imgSrcField.setTargetObject(foundMarkup, 'src');
							me.imgTitleField.setTargetObject(foundMarkup, 'title');
						}
						me.imgSrcField.focus();
						GENTICS.Aloha.FloatingMenu.userActivatedTab = me.i18n('floatingmenu.tab.img');
					} else {
						if(me.settings.config.img.ui.meta) {
							me.imgSrcField.setTargetObject(null);
						}
					}
					// TODO this should not be necessary here!
					GENTICS.Aloha.FloatingMenu.doLayout();
				}
			});
			GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'editableCreated', function(event, editable) {
				// add to editable the image click
				//editable.obj.find('img').attr('_moz_resizing', false);
	//			editable.obj.find('img').contentEditable(false);
				editable.obj.delegate('img', 'mouseup', function (event) {
					me.clickImage(event);
					event.stopPropagation();
				});
			});
		},

		clickImage: function ( e ) {
			if (this.settings.config.img.ui.resizable) {
				this.endResize();
			}
			var thisimg = this.obj = jQuery(e.target),
				editable = thisimg.closest('.GENTICS_editable');
			this.restoreProps.push({
				obj : e.srcElement,
				src : this.obj.attr('src'),
				width : this.obj.width(),
				height : this.obj.height()
			});
			if (this.settings.config.img.ui.resizable) {
				this.resize();
			}
			GENTICS.Aloha.getEditableById(editable.attr('id')).activate();
			var offset = GENTICS.Utils.Dom.getIndexInParent(e.target),
				imgRange = GENTICS.Aloha.Selection.getRangeObject();

			try {
				imgRange.startContainer = imgRange.endContainer = thisimg.parent()[0];
				imgRange.startOffset = offset;
				imgRange.endOffset = offset+1;
				imgRange.select();
			} catch(err) {
				var startTag = thisimg.parent()[0];
				imgRange = new GENTICS.Utils.RangeObject({
					startContainer: startTag,
					endContainer: startTag,
					startOffset: offset,
					endOffset: offset+1
				});
				imgRange.select();
			}
		},

		// Find img markup
		findImgMarkup: function ( range ) {
			// Prepare
			var
				me = this, config = this.config,
				Aloha = GENTICS.Aloha;

			if ( typeof range === 'undefined' ) {
				range = Aloha.Selection.getRangeObject();
			}
			var targetObj = jQuery(range.startContainer);
			try {
				if ( GENTICS.Aloha.activeEditable ) {
					if ((  typeof range.startContainer !== 'undefined'
						&& typeof range.startContainer.childNodes !== 'undefined'
						&& typeof range.startOffset !== 'undefined'
						&& typeof range.startContainer.childNodes[range.startOffset] !== 'undefined'
						&& range.startContainer.childNodes[range.startOffset].nodeName.toLowerCase() === 'img'
						&& range.startOffset+1 === range.endOffset) ||
						 (targetObj.hasClass('Aloha_Image_Resize')))
					{
						var result = targetObj.find('img')[0];
						if (! result.css) result.css = '';
						if (! result.title) result.title = '';
						if (! result.src) result.src = '';
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

		insertImg: function() {
			var range = GENTICS.Aloha.Selection.getRangeObject(),
				config = this.getEditableConfig(GENTICS.Aloha.activeEditable.obj),
				imagePluginUrl = GENTICS.Aloha.getPluginUrl('image');
			if ( range.isCollapsed() ) {
				// TODO I would suggest to call the srcChange method. So all image src
				// changes are on one single point.
				var imagestyle = "width: " + config.img.max_width + "; height: " + config.img.max_height,
					imagetag = '<img style="'+imagestyle+'" src="' + imagePluginUrl + '/img/blank.jpg" title="" />',
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
			jQuery('body').append(
					'<div id="GENTICS_CropNResize_btns">' +
					'<button class="cnr_crop_apply" title="' + this.i18n('Accept') +
						'" onclick="GENTICS.Aloha.Image.acceptCrop();">&#10004;</button>' +
					'<button class="cnr_crop_cancel" title="' + this.i18n('Cancel') +
						'" onclick="GENTICS.Aloha.Image.endCrop();">&#10006;</button>' +
					'</div>'
			);

			var btns = jQuery('#GENTICS_CropNResize_btns'),
				oldLeft = 0,
				oldTop = 0;
			this.interval = setInterval(function () {
				var jt = jQuery('.jcrop-tracker:first'),
					off = jt.offset();
				if (jt.css('height') != '0px' && jt.css('width') != '0px') {
					btns.fadeIn('slow');
				}

				// move the icons to the bottom right side
				off.top = parseInt(off.top + jt.height() + 3,10);
				off.left = parseInt(off.left + jt.width() - 55,10);

				// comparison to old values hinders flickering bug in FF
				if (oldLeft != off.left || oldTop != off.top) {
					btns.offset(off);
				}

				oldLeft = off.left;
				oldTop = off.top;
			}, 10);
		},

		/**
		 * destroy crop confirm and cancel buttons
		 */
		destroyCropButtons: function () {
			jQuery('#GENTICS_CropNResize_btns').remove();
			clearInterval(this.interval);
		},

		/**
		 * Initiate a crop action
		 */
		crop: function () {
			// Prepare
			var
				me = this, config = this.config,
				Aloha = GENTICS.Aloha;

			this.initCropButtons();
			if (this.settings.config.img.ui.resizable) {
				this.endResize();
			}
			this.jcAPI = jQuery.Jcrop(this.obj, {
				onSelect : function () {
					// ugly hack to keep scope :(
					setTimeout(function () {
						GENTICS.Aloha.FloatingMenu.setScope(me.getUID('image'));
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
				this.resize();
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

			if (this.onReset(this.obj)) {
				// the external reset procedure has already performed a reset, so there is no need to apply an internal reset
				return;
			}

			for (var i=0;i<this.restoreProps.length;i++) {
				// restore from restoreProps if there is a match
				if (this.obj.get(0) === this.restoreProps[i].obj) {
					this.obj.attr('src', this.restoreProps[i].src);
					this.obj.width(this.restoreProps[i].width);
					this.obj.height(this.restoreProps[i].height);
					return;
				}
			}
		},

		/**
		 * accept the current cropping area and apply the crop
		 */
		acceptCrop: function () {
				this.onCropped(this.obj, this.jcAPI.tellSelect());
				this.endCrop();
		},

		resize: function () {
			var me = this;
			try {
				// this will disable mozillas image resizing facilities
				document.execCommand('enableObjectResizing', false, 'false');
			} catch (e) {
				// this is just for others, who will not support disabling enableObjectResizing
			}
			this.obj.resizable({
				stop : function (event, ui) {
					me.onResized(me.obj);

					// this is so ugly, but I could'nt figure out how to do it better...
					if(this.enableCrop) {
						setTimeout(function () {
							GENTICS.Aloha.FloatingMenu.setScope(me.getUID('image'));
							me.done(event);
						}, 10);
					}
				},
				// the rest of the settings is directly set through the plugin settings object
				aspectRatio : me.settings.aspectRatio,
				maxHeight : me.settings.maxHeight,
				minHeight : me.settings.minHeight,
				maxWidth : me.settings.maxWidth,
				minWidth : me.settings.minWidth,
				grid : me.settings.grid
			});

			// this will prevent the user from resizing an image
			// using IE's resize handles
			// however I could not manage to hide them completely
			jQuery('.ui-wrapper')
				.attr('contentEditable', false)
				.addClass('Aloha_Image_Resize')
				.bind('resizestart', function (e) {
					e.preventDefault();
				});
		},

		/**
		 * end resizing
		 * will toggle buttons accordingly and remove all markup that has been added for cropping
		 */
		endResize: function () {
			if (this.obj) {
				this.obj.resizable('destroy');
			}
		}


	}); // End of extend

})(window);
