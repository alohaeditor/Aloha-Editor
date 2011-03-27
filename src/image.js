/*
* Aloha Image Plugin - Allow image manipulation in Aloha Editor
* Copyright (C) 2010 by Nicolas Karageuzian - http://nka.me/
*	Copyright (C) 2010 by Benjamin Athur Lupton - http://www.balupton.com
* Licensed unter the terms of AGPL http://www.gnu.org/licenses/agpl-3.0.html
*
* do not require anymore IKS Loader
*/

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

jQuery.extend(true,jQuery.fn, {
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

GENTICS.Aloha.Image = new GENTICS.Aloha.Plugin('image');
jQuery.extend(true,GENTICS.Aloha.Image,{
	languages: ['en', 'fr', 'de'],
	config: {
		'img': {
			'max_width': '50px',
			'max_height': '50px',
			'ui': {'align': true,       // Menu elements to show/hide in menu - ONLY in default config section
				'resize': true,
				'meta': true,
				'margin': true,
				'crop':true},
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
	jcAPI:null,
	/**
	 * this will contain an image's original properties to be able to undo previous settings
	 *
	 * when an image is clicked for the first time, a new object will be added to the array
	 * {
	 * 		obj : [the image object reference],
	 * 		src : [the original src url],
	 * 		width : [initial width],
	 * 		height : [initial height]
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
		// Prepare
		var
			me = this,
			Aloha = GENTICS.Aloha,
			imagePluginUrl = GENTICS.Aloha.getPluginUrl('image');

		// Settings
		if (typeof Aloha.Image.settings.objectTypeFilter !== 'undefined') {
			Aloha.Image.objectTypeFilter = Aloha.Image.settings.objectTypeFilter;
		}
		if (typeof Aloha.Image.settings.dropEventHandler !== 'undefined') {
			Aloha.Image.dropEventHandler = Aloha.Image.settings.dropEventHandler;
		}

		// Files
		Aloha
			.loadCss(imagePluginUrl+'/dep/ui/ui-lightness/jquery-ui-1.8.10.custom.css')
			.loadCss(imagePluginUrl+'/dep/ui/ui-lightness/jquery-ui-1.8.10.cropnresize.css')
			.loadCss(imagePluginUrl+'/dep/jcrop/jquery.jcrop.css')
			.loadJs(imagePluginUrl+'/dep/ui/jquery-ui-1.8.10.custom.min.js')
			.loadJs(imagePluginUrl+'/dep/jcrop/jquery.jcrop.min.js');

		// Initialise
		this.initImage();
		this.bindInteractions();
		this.subscribeEvents();

   }, // init


   /**
	 * Do the UI/buttons Initialization
	 */
   initImage: function() {
		// Prepare
		var
			me = this, config = this.config,
			Aloha = GENTICS.Aloha;

		this.insertImgButton = new GENTICS.Aloha.ui.Button({
			'iconClass': 'GENTICS_button GENTICS_img_insert',
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
		if (!config.img) {
			config.img = this.config.img;
		}
		if (!config.img.ui) {
			config.img.ui = this.config.img.ui;
		}
		if (config.img.ui.meta) {
			var imgSrcLabel = new GENTICS.Aloha.ui.Button({
				'label': me.i18n('field.img.src.label'),
				'tooltip': me.i18n('field.img.src.tooltip'),
				'size': 'small'
			});
			this.imgSrcField = new GENTICS.Aloha.ui.AttributeField({});
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
				'iconClass': 'GENTICS_button GENTICS_img_align_left',
				'size': 'small',
				'onclick' : function() {
					jQuery(me.findImgMarkup()).css('float', 'left');
				},
				'tooltip': me.i18n('button.img.align.left.tooltip')
			});
			var alignRightButton = new GENTICS.Aloha.ui.Button({
				'iconClass': 'GENTICS_button GENTICS_img_align_right',
				'size': 'small',
				'onclick' : function() {
					jQuery(me.findImgMarkup()).css('float', 'right');
				},
				'tooltip': me.i18n('button.img.align.right.tooltip')
			});
			var alignNoneButton = new GENTICS.Aloha.ui.Button({
				'iconClass': 'GENTICS_button GENTICS_img_align_none',
				'size': 'small',
				'onclick' : function() {
				var img = me.findImgMarkup();
					jQuery(img).css('float', '');
				},
				'tooltip': me.i18n('button.img.align.none.tooltip')
			});
			GENTICS.Aloha.FloatingMenu.addButton(
					this.getUID('image'),
					alignRightButton,
					this.i18n('floatingmenu.tab.img'),
					1
			);
			GENTICS.Aloha.FloatingMenu.addButton(
				this.getUID('image'),
				alignLeftButton,
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
				iconClass: 'GENTICS_button GENTICS_img_padding_increase',
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
				iconClass: 'GENTICS_button GENTICS_img_padding_decrease',
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
				iconClass: 'GENTICS_button GENTICS_img_size_increase',
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
				iconClass: 'GENTICS_button GENTICS_img_size_decrease',
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

		// Handle
		if (config.img.ui.meta) {
			// update image object when src changes
			this.imgSrcField.addListener('keyup', function(obj, event) {
				me.srcChange();
			});

			this.imgSrcField.addListener('blur', function(obj, event) {
				// TODO remove image or do something usefull if the user leaves the
				// image without defining a valid image src.
				var img = jQuery(obj.getTargetObject());
				if (img.attr('src') == '') {
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
			len = data.filesObjs.length;
			while (--len >= 0) {
					var fileObj = data.filesObjs[len];
					if (fileObj.file.type.match(/image\//)) {
						var reader = new FileReader();
						reader.config = me.getEditableConfig(data.editable);
						reader.attachedData = data;
						reader.attachedFile = fileObj;
						reader.onloadend = function(readEvent) {
							var imagestyle = "width: " + config.img.max_width + "; height: " + this.config.img.max_height;
							var img = jQuery('<img id="'+this.attachedFile.id+'" style="'+imagestyle+'" title="" src="" />');
							//img.click( Aloha.Image.clickImage ); - Using delegate now
							if (typeof this.attachedFile.src === 'undefined') {
								this.attachedFile.src = readEvent.target.result;
							}
							img.attr('src', this.attachedFile.src );
							GENTICS.Utils.Dom.insertIntoDOM(img, this.attachedData.range, jQuery(Aloha.activeEditable.obj));
						};
						reader.readAsDataURL(fileObj.file);
					}
			}
		});
		// add the event handler for selection change
		Aloha.EventRegistry.subscribe(Aloha, 'selectionChanged', function(event, rangeObject) {
			var foundMarkup = me.findImgMarkup( rangeObject ),
				config = me.getEditableConfig(Aloha.activeEditable.obj);

			if (typeof config.img !== 'undefined' ) {
				me.insertImgButton.show();
				Aloha.FloatingMenu.doLayout();
			} else {
				me.insertImgButton.hide();
				// TODO this should not be necessary here!
				Aloha.FloatingMenu.doLayout();
				// leave if img is not allowed
				return;
			}
			if ( foundMarkup ) {
				// img found
				me.insertImgButton.hide();
				Aloha.FloatingMenu.setScope(me.getUID('image'));
				me.imgSrcField.setTargetObject(foundMarkup, 'src');
				me.imgTitleField.setTargetObject(foundMarkup, 'title');
				//me.imgSrcField.focus();
				Aloha.FloatingMenu.userActivatedTab = me.i18n('floatingmenu.tab.img');
			} else {
				me.imgSrcField.setTargetObject(null);
			}
			// TODO this should not be necessary here!
			Aloha.FloatingMenu.doLayout();
		});
		Aloha.EventRegistry.subscribe(Aloha, 'editableCreated', function(event, editable) {
		// add to editable the image click
			editable.obj.delegate('img', 'click', Aloha.Image.clickImage);
		});
	},

	clickImage: function ( e ) {
		// Prepare
		var
			me = this, config = this.config,
			Aloha = GENTICS.Aloha;

		Aloha.Image.obj = jQuery(e.target);
		Aloha.Image.restoreProps.push({
			obj : e.srcElement,
			src : Aloha.Image.obj.attr('src'),
			width : Aloha.Image.obj.width(),
			height : Aloha.Image.obj.height()
		});
		var thisimg = jQuery(this),
			editable = thisimg.parents('.GENTICS_editable');
		Aloha.getEditableById(editable.attr('id')).activate();
		var offset = GENTICS.Utils.Dom.getIndexInParent(this);
		var imgRange = Aloha.Selection.getRangeObject();
		imgRange.startContainer = imgRange.endContainer = thisimg.parent()[0];
		imgRange.startOffset = offset;
		imgRange.endOffset = offset+1;
//		imgRange.update();
		imgRange.select();
//		Aloha.EventRegistry.trigger(
//            new Aloha.Event(
//                'selectionChanged',
//                Aloha,
//                [ imgRange, e ]
//            )
//        );

		if (e.preventDefault)
			e.preventDefault();
		else
			e.cancelBubble = true;
		if (e.stopPropagation)
			 e.stopPropagation();
		 else
			 e.returnValue = false;
		return false;
	},

	findImgMarkup: function ( range ) {
		// Prepare
		var
			me = this, config = this.config,
			Aloha = GENTICS.Aloha;

		if ( typeof range === 'undefined' ) {
			var range = Aloha.Selection.getRangeObject();
		}
		try {
			if (   typeof range.startContainer !== 'undefined'
				&& typeof range.startContainer.childNodes !== 'undefined'
				&& typeof range.startOffset !== 'undefined'
				&& typeof range.startContainer.childNodes[range.startOffset] !== 'undefined'
				&& range.startContainer.childNodes[range.startOffset].nodeName.toLowerCase() === 'img'
				&& range.startOffset+1 === range.endOffset)
			{
				result = range.startContainer.childNodes[range.startOffset];
				if (! result.css) result.css = '';
				if (! result.title) result.title = '';
				if (! result.src) result.src = '';
				return result;
			} else {
				Aloha.Log.debug(e, "Error finding img markup.");
			}
		} catch (e) {
			Aloha.Log.debug(e, "Error finding img markup.");
		}
		return null;

	},
	insertImg: function() {
		// Prepare
		var
			me = this, config = this.config,
			Aloha = GENTICS.Aloha;

		var range = Aloha.Selection.getRangeObject(),
			config = this.getEditableConfig(Aloha.activeEditable.obj);
		if ( range.isCollapsed() ) {
			// TODO I would suggest to call the srcChange method. So all image src
			// changes are on one single point.
			var imagestyle = "width: " + config.img.max_width + "; height: " + config.img.max_height,
				imagetag = '<img style="'+imagestyle+'" src="' + GENTICS_Aloha_base + 'plugin/image/images/blank.jpeg" title="" />',
				newImg = jQuery(imagetag);
			// add the click selection handler
			//newImg.click( Aloha.Image.clickImage ); - Using delegate now
			GENTICS.Utils.Dom.insertIntoDOM(newImg, range, jQuery(Aloha.activeEditable.obj));

		} else {
			Aloha.Log.error('img cannot markup a selection');
			// TODO the desired behavior could be that the selected content is
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
			off.top = parseInt(off.top + jt.height() + 3);
			off.left = parseInt(off.left + jt.width() - 55);

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
		if(this.enableResize) {
			this.resize();
		}
	},
	/**
	 * Reset the image to it's original properties
	 */
	reset: function() {
		if(this.enableCrop) {
			this.endCrop();
		}
		if(this.enableResize) {
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
	}

}); // End of extend

