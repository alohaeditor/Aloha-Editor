/*
* Aloha Image Plugin - Allow image manipulation in Aloha Editor
* 
*   Copyright (C) 2010 by Nicolas Karageuzian - http://nka.me/
*	Copyright (C) 2010 by Benjamin Athur Lupton - http://www.balupton.com
* Licensed unter the terms of AGPL http://www.gnu.org/licenses/agpl-3.0.html
*
* do not require anymore IKS Loader
*/

if(typeof KaraCos=="undefined"||!KaraCos)
    {
    var KaraCos={};
    }

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

	// jQuery
	jQuery.fn.increase = jQuery.fn.increase || function(attr){
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
	}
	jQuery.fn.decrease = jQuery.fn.decrease || function(attr){
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

/**
 *  Attach drag and drop listeners to document body
 * this prevents incorrect drops, reloading the page with the dropped item
 * This may or may not be helpful
 */
KaraCos.sinkBodyEvent = function() {
	 if (!document.body.BodyDragSinker){
		 //console.log("Processing body event sink");
		 document.body.BodyDragSinker = true;
		 
		 var body = Ext.fly(document.body);
		 body.on({
			dragenter:function(event){
				return true;
			}
			,dragleave:function(event){
				return true;
			}
			,dragover:function(event){				
				event.stopEvent();
				return false;
			}
			,drop:function(event){
				try {
					//console.log('ext event');
					//console.log(event);
					//alert("drop event, body sinker");
					if (event.browserEvent.originalEvent.sink) { // is event maked to be sinked
						event.stopEvent(); // this prevents default browser comportment
					}
				} catch (error) {
					//TODO : log error
					//console.log(error);
				}
				return true;
			}
		});

	} // if
	// end body events
	//================== 
};

GENTICS.Aloha.Image=new GENTICS.Aloha.Plugin("com.gentics.aloha.plugins.Image");

GENTICS.Aloha.Image.languages=["en","fr","de"];
GENTICS.Aloha.Image.config = ['img'];
/*
 * Initalize plugin
 */
GENTICS.Aloha.Image.init=function(){
	// get settings
    if (GENTICS.Aloha.Image.settings.objectTypeFilter != undefined)
    	GENTICS.Aloha.Image.objectTypeFilter = GENTICS.Aloha.Image.settings.objectTypeFilter;	
    if (GENTICS.Aloha.Image.settings.dropEventHandler != undefined)
    	GENTICS.Aloha.Image.dropEventHandler = GENTICS.Aloha.Image.settings.dropEventHandler;	
    //this.addEvents('dropImage');
    console.log(this);
    var that=this;
	that.initImage();
	that.bindInteractions();
	that.subscribeEvents();
	stylePath = GENTICS_Aloha_base + '/plugins/com.gentics.aloha.plugins.Image/style.css';
	jQuery('<link rel="stylesheet" />').attr('href', stylePath).appendTo('head');
	
   }; // END INIT

GENTICS.Aloha.Image.objectTypeFilter = [];

/**
 * Default behaviour for dropped image
 * car be overriden in settings
 */
GENTICS.Aloha.Image.dropEventHandler = function(event){
	var e = event;
    event.sink = true;
    var files = e.dataTransfer.files;
    var count = files.length;
    // if no files where dropped, use default handler
    if (count < 1) {
    	event.sink = false;
        return true;
    }
    var len = files.length;
    
    // parameter for event handler :
    // {'file': file, 'img': img}
    var objects = [];
    while(--len >= 0) {
    	
        //alert("testing " + files[i].name);
        var reader = new FileReader();
        reader.linkedFile = files[len];
        reader.onloadend = function(readEvent) {
        	var img = jQuery('<img src="" alt="xyz" />');
            img.attr('src', readEvent.target.result);
            //GENTICS.Aloha.Selection.changeMarkupOnSelection(img);
            GENTICS.Utils.Dom.insertIntoDOM(
                img,
                GENTICS.Aloha.Selection.getRangeObject(),
                GENTICS.Aloha.activeEditable.obj);
            objects.push({'file':this.linkedFile,'img': img})
        };
        reader.readAsDataURL(files[len]);
    } //while
    GENTICS.Aloha.EventRegistry.trigger(
    		  new GENTICS.Aloha.Event('dropFiles', GENTICS.Aloha, {'objects': objects})
    		);
    return false;
};

// GENTICS.Aloha.Image.PropsWindow =
GENTICS.Aloha.Image.initImage = function() {
	var that = this;
	this.insertImgButton = new GENTICS.Aloha.ui.Button({
		'iconClass': 'GENTICS_button GENTICS_img_insert',
		'size' : 'small',
		'onclick' : function () { that.insertImg(); },
		'tooltip' : that.i18n('button.addimg.tooltip'),
		'toggle' : false
	});
	GENTICS.Aloha.FloatingMenu.addButton(
			'GENTICS.Aloha.continuoustext',
			this.insertImgButton,
			GENTICS.Aloha.i18n(GENTICS.Aloha, 'floatingmenu.tab.insert'),
			1
	);
	
// GENTICS.Aloha.FloatingMenu.createScope(this.getUID('img'),
// 'GENTICS.Aloha.continuoustext');
	GENTICS.Aloha.FloatingMenu.createScope(this.getUID('image'), 'global');
	
	var alignLeftButton = new GENTICS.Aloha.ui.Button({
        'iconClass': 'GENTICS_button GENTICS_img_align_left',
        'size': 'small',
        'onclick' : function() {
            var img = that.findImgMarkup();
            jQuery(img).css('float', 'left');
        },
        'tooltip': that.i18n('button.img.align.left.tooltip')
    });
	var alignRightButton = new GENTICS.Aloha.ui.Button({
        'iconClass': 'GENTICS_button GENTICS_img_align_right',
        'size': 'small',
        'onclick' : function() {
            var img = that.findImgMarkup();
            jQuery(img).css('float', 'right');
        },
        'tooltip': that.i18n('button.img.align.right.tooltip')
    });
    var alignNoneButton = new GENTICS.Aloha.ui.Button({
        'iconClass': 'GENTICS_button GENTICS_img_align_none',
        'size': 'small',
        'onclick' : function() {
	    	var img = that.findImgMarkup();
	        jQuery(img).css('float', '');
        },
        'tooltip': that.i18n('button.img.align.none.tooltip')
    });
    
    // add the src field for images
    var imgSrcLabel = new GENTICS.Aloha.ui.Button({
    	'label': that.i18n('field.img.src.label'),
    	'tooltip': that.i18n('field.img.src.tooltip'),
    	'size': 'small',
    });
    this.imgSrcField = new GENTICS.Aloha.ui.AttributeField({});
    this.imgSrcField.setObjectTypeFilter( this.objectTypeFilter );

    // add the title field for images
    var imgTitleLabel = new GENTICS.Aloha.ui.Button({
    	'label': that.i18n('field.img.title.label'),
    	'tooltip': that.i18n('field.img.title.tooltip'),
    	'size': 'small',
    });
    this.imgTitleField = new GENTICS.Aloha.ui.AttributeField();
    this.imgTitleField.setObjectTypeFilter();

    GENTICS.Aloha.FloatingMenu.addButton(
    		this.getUID('image'),
    		this.imgSrcField,
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
    GENTICS.Aloha.FloatingMenu.addButton(
    		this.getUID('image'),
    		this.imgTitleField,
    		this.i18n('floatingmenu.tab.img'),
    		1
    );
    
    var incPadding = new GENTICS.Aloha.ui.Button({
    	iconClass: 'GENTICS_button GENTICS_img_padding_increase',
    	size: 'small',
    	onclick: function() {
    	var image = that.findImgMarkup();
    	Image = jQuery(image);
    	// Apply
    	Image.increase('padding');
    	},
    	tooltip: this.i18n('padding.increase'),
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
    	var image = that.findImgMarkup();
    	Image = jQuery(image);
    	// Apply
    	Image.decrease('padding');
    	},
    	tooltip: this.i18n('padding.decrease'),
    	});
   GENTICS.Aloha.FloatingMenu.addButton(
   		this.getUID('image'),
   		decPadding,
   		this.i18n('floatingmenu.tab.img'),
   		2
   );
   var  incSize = new GENTICS.Aloha.ui.Button({
	   iconClass: 'GENTICS_button GENTICS_img_size_increase',
	   size: 'small',
	   onclick: function() {
	   var image = that.findImgMarkup();
	   Image = jQuery(image);
	   // Apply
		   Image.increase('height').increase('width');
	   },
	   tooltip: this.i18n('size.increase'),
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
	   var image = that.findImgMarkup();
	   Image = jQuery(image);
	   // Apply
	   Image.decrease('height').decrease('width');
	   },
	   tooltip: that.i18n('size.decrease'),
	   });
   GENTICS.Aloha.FloatingMenu.addButton(
	   		this.getUID('image'),
	   		decSize,
	   		this.i18n('floatingmenu.tab.img'),
	   		2
	   );
};

GENTICS.Aloha.Image.bindInteractions = function () {
    var that = this;

    // update image object when src changes
    this.imgSrcField.addListener('keyup', function(obj, event) {  	
    	that.srcChange();
    });

    this.imgSrcField.addListener('blur', function(obj, event) {
    	console.log();
       	// TODO remove image or do something usefull if the user leaves the
    	// image without defining a valid image src.
    });
     
};

GENTICS.Aloha.Image.subscribeEvents = function () {
	var that = this;
	
    // add the event handler for selection change
    GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'selectionChanged', function(event, rangeObject) {
    	var foundMarkup = that.findImgMarkup( rangeObject );
    	var config = that.getEditableConfig(GENTICS.Aloha.activeEditable.obj);
        if ( jQuery.inArray('img', config) != -1) {
        	that.insertImgButton.show();
        } else {
        	that.insertImgButton.hide();
            // leave if img is not allowed
            return;
        }
        if ( foundMarkup ) {
        	// img found
        	that.insertImgButton.hide();
        	GENTICS.Aloha.FloatingMenu.setScope(that.getUID('image'));
            that.imgSrcField.setTargetObject(foundMarkup, 'src');
            that.imgTitleField.setTargetObject(foundMarkup, 'title');
            that.imgSrcField.focus();
            GENTICS.Aloha.FloatingMenu.userActivatedTab = that.i18n('floatingmenu.tab.img');
        } else {
        	that.imgSrcField.setTargetObject(null);
        }
    	// TODO this should not be necessary here!
    	GENTICS.Aloha.FloatingMenu.doLayout();
    });
    
    // add to all editables the image click
    for (var i = 0; i < GENTICS.Aloha.editables.length; i++) {

	    // add a click (=select) event to all image.
	    GENTICS.Aloha.editables[i].obj.find('img').each( function( i ) {
	        // select the image when clicked
	        jQuery(this).click( GENTICS.Aloha.Image.clickImage );
	    });
    }
    KaraCos.sinkBodyEvent();
    GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'editableCreated', function(event, editable) {
        editable.obj[0].addEventListener('drop', that.dropEventHandler, false);
    });
    
};

GENTICS.Aloha.Image.clickImage = function ( e ) { 
	// select the image
// var offset = GENTICS.Utils.Dom.getIndexInParent(this);
// var imgRange = new GENTICS.Utils.RangeObject({
// startContainer: jQuery(this).parent(),
// endContainer: jQuery(this).parent(),
// startOffset: offset,
// endOffset: offset+1
// });
// imgRange.select();
};



GENTICS.Aloha.Image.findImgMarkup = function ( range ) {
	if ( typeof range == 'undefined' ) {
        var range = GENTICS.Aloha.Selection.getRangeObject();   
    }
	try {
		if (range.startContainer)
			if (range.startContainer.childNodes)
				if (range.startOffset)
					if (range.startContainer.childNodes[range.startOffset])
	    if (range.startContainer.childNodes[range.startOffset].nodeName.toLowerCase() == 'img') {
			// console.log(range);
			result = range.startContainer.childNodes[range.startOffset];
			if (! result.css) result.css = "";
			if (! result.title) result.title = "";
			if (! result.src) result.src = "";
			return result;
		}
	} catch (e) {
		GENTICS.Aloha.Log.debug(e,"Error finding img markup.");
	}
    return null;
    
};

GENTICS.Aloha.Image.insertImg = function() {
	var range = GENTICS.Aloha.Selection.getRangeObject();
	
    if ( range.isCollapsed() ) {
    	// TODO I would suggest to call the srcChange method. So all image src
		// changes are on one single point.
    	imagetag = '<img src="' + GENTICS_Aloha_base + 'plugins/com.gentics.aloha.plugins.Image/images/blank.jpeg" title="" style=""></img>'
    	var newImg = jQuery(imagetag);
    	// add the click selection handler
    	newImg.click( GENTICS.Aloha.Image.clickImage );
    	GENTICS.Utils.Dom.insertIntoDOM(newImg, range, jQuery(GENTICS.Aloha.activeEditable.obj));
    	// select the image when inserted
// var offset = GENTICS.Utils.Dom.getIndexInParent(newImg.get(0));
// var imgRange = new GENTICS.Utils.RangeObject({
// startContainer: newImg.parent(),
// endContainer: newImg.parent(),
// startOffset: offset,
// endOffset: offset+1
// });
// imgRange.select();
    	
    } else {
    	// TODO NEVER alert!! i18n !! Instead log. We have a messaging stack on
    	// the roadmap which will offer you the possibility to push messages.
    	alert('img cannot markup a selection');
    	// TODO the desired behavior could be that the selected content is
		// replaced by an image.
    	// TODO it should be editor's choice, with an Ext Dialog instead of
		// alert.
    }
}


GENTICS.Aloha.Image.srcChange = function () {
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
}
