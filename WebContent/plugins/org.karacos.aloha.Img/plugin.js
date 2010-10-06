/*!
* Aloha Img plugin
* This plugin is a contribution of Nicolas Karageuzian
* Licensed unter the terms of AGPL http://www.gnu.org/licenses/agpl-3.0.html
* Requires IKS Loader
*/

if(typeof KaraCos=="undefined"||!KaraCos)
    {
    var KaraCos={};
    }

KaraCos.Img=new GENTICS.Aloha.Plugin("org.karacos.aloha.Img");
eu.iksproject.LoaderPlugin.loadAsset('org.karacos.aloha.Img', 'style', 'css');
KaraCos.Img.languages=["en","fr"];
KaraCos.Img.config = ['img'];
/*
 * Initalize plugin
 */
KaraCos.Img.init=function(){
	
	var that=this;
	that.initImage();
	that.bindInteractions();
	that.subscribeEvents();
   }; // END INIT

KaraCos.Img.resourceObjectTypes = [];
KaraCos.Img.PropsWindow = 
KaraCos.Img.initImage = function() {
	var that = this;
	this.insertImgButton = new GENTICS.Aloha.ui.Button({
		'label' : 'IMG',
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
	
	GENTICS.Aloha.FloatingMenu.createScope(this.getUID('img'), 'GENTICS.Aloha.continuoustext');
	
	
	var alignLeftButton = new GENTICS.Aloha.ui.Button({
        'iconClass': 'GENTICS_button karacos_img_align_left',
        'size': 'small',
        'onclick' : function() {
            var img = that.findImgMarkup();
            jQuery(img).css('float', 'left');
        },
        'tooltip': that.i18n('button.img.align.left.tooltip')
    });
	var alignRightButton = new GENTICS.Aloha.ui.Button({
        'iconClass': 'GENTICS_button karacos_img_align_right',
        'size': 'small',
        'onclick' : function() {
            var img = that.findImgMarkup();
            jQuery(img).css('float', 'right');
        },
        'tooltip': that.i18n('button.img.align.right.tooltip')
    });
    var alignNoneButton = new GENTICS.Aloha.ui.Button({
        'iconClass': 'GENTICS_button karacos_img_align_none',
        'size': 'small',
        'onclick' : function() {
    	var img = that.findImgMarkup();
        jQuery(img).css('float', '');
        },
        'tooltip': that.i18n('button.img.align.none.tooltip')
    });
    
    var imgSrcLabel = new GENTICS.Aloha.ui.Button({
    	'label': that.i18n('field.img.src.label'),
    	'tooltip': that.i18n('field.img.src.tooltip'),
    	'size': 'small',
    });
    this.imgSrcField = new GENTICS.Aloha.ui.AttributeField({	
    });
    this.imgSrcField.setObjectTypeFilter(KaraCos.Img.resourceObjectTypes);
    // add the input field for links
    var imgTitleLabel = new GENTICS.Aloha.ui.Button({
    	'label': that.i18n('field.img.title.label'),
    	'tooltip': that.i18n('field.img.title.tooltip'),
    	'size': 'small',
    });
    this.imgTitleField = new GENTICS.Aloha.ui.AttributeField({
    });
    this.imgTitleField.setObjectTypeFilter([KaraCos.Img.resourceObjectTypes]);

    GENTICS.Aloha.FloatingMenu.addButton(
    		this.getUID('img'),
    		this.imgSrcField,
    		this.i18n('floatingmenu.tab.img'),
    		1
    );
    GENTICS.Aloha.FloatingMenu.addButton(
    		this.getUID('img'),
    		alignRightButton,
    		this.i18n('floatingmenu.tab.img'),
    		1
    );
    GENTICS.Aloha.FloatingMenu.addButton(
    		this.getUID('img'),
    		alignLeftButton,
    		this.i18n('floatingmenu.tab.img'),
    		1
    );
    GENTICS.Aloha.FloatingMenu.addButton(
    		this.getUID('img'),
    		alignNoneButton,
    		this.i18n('floatingmenu.tab.img'),
    		1
    );
    GENTICS.Aloha.FloatingMenu.addButton(
    		this.getUID('img'),
    		this.imgTitleField,
    		this.i18n('floatingmenu.tab.img'),
    		1
    );
    

    
    
}

KaraCos.Img.bindInteractions = function () {
    var that = this;

    // update link object when src changes
    this.imgSrcField.addListener('keyup', function(obj, event) {
    	
    	that.srcChange();
    });

    // on blur check if href is empty. If so remove the a tag
    this.imgSrcField.addListener('blur', function(obj, event) {
        if ( this.getValue() == '' ) {
            //that.removeLink();
        }
    });
     
}

KaraCos.Img.subscribeEvents = function () {
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
        	//img found
        	that.insertImgButton.hide();
        	GENTICS.Aloha.FloatingMenu.setScope(that.getUID('img'));
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
    	
	
}
KaraCos.Img.findImgMarkup = function ( range ) {
	if ( typeof range == 'undefined' ) {
        var range = GENTICS.Aloha.Selection.getRangeObject();   
    }
	try {
		if (range.startContainer)
			if (range.startContainer.childNodes)
				if (range.startOffset)
					if (range.startContainer.childNodes[range.startOffset])
	    if (range.startContainer.childNodes[range.startOffset].nodeName.toLowerCase() == 'img') {
			//console.log(range);
			result = range.startContainer.childNodes[range.startOffset];
			if (! result.css) result.css = "";
			if (! result.title) result.title = "";
			if (! result.src) result.src = "";
			return result;
		}
	} catch (e) {}
    return null;
    
};
KaraCos.Img.insertImg = function() {
	var range = GENTICS.Aloha.Selection.getRangeObject();
	
    // if selection is collapsed then extend to the word.
    //if (range.isCollaps//ed()) {
    //    GENTICS.Utils.Dom.extendToWord(range);
    //}
    if ( range.isCollapsed() ) {
    	//rangeb4 = range;
    	//console.log(rangeb4);
    	var newImg = jQuery('<img src="" title="" style=""></img>');
    	GENTICS.Utils.Dom.insertIntoDOM(newImg, range, jQuery(GENTICS.Aloha.activeEditable.obj));
    	//range.correctRange();
    	//this.findImgMarkup(range).click();
    	//console.log(range);
        
        //range.select();
        //this.imgSrcField.focus();
        // linkText.length;
    } else {
    	alert('img cannot markup a selection');
    }
}



KaraCos.Img.srcChange = function () {
	// For now hard coded attribute handling with regex.
	//this.imgField.setAttribute('target', this.target, this.targetregex, this.hrefField.getQueryValue());
	//this.imgField.setAttribute('class', this.cssclass, this.cssclassregex, this.hrefField.getQueryValue());
}
