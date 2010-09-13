/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * register the plugin with unique name
 */
GENTICS.Aloha.Link = new GENTICS.Aloha.Plugin('com.gentics.aloha.plugins.Link');

/**
 * Configure the available languages
 */
GENTICS.Aloha.Link.languages = ['en', 'de', 'fr', 'ru', 'pl'];

/**
 * Default configuration allows links everywhere
 */
GENTICS.Aloha.Link.config = ['a'];

// TODO register those parameters for Link plug-in. 
// Update code then where settings.

/**
 * all links that match the targetregex will get set the target
 * e.g. ^(?!.*aloha-editor.com).* matches all href except aloha-editor.com
 */
GENTICS.Aloha.Link.targetregex = '';

/**
  * this target is set when either targetregex matches or not set
  * e.g. _blank opens all links in new window
  */
GENTICS.Aloha.Link.target = '';

/**
 * all links that match the cssclassregex will get set the css class
 * e.g. ^(?!.*aloha-editor.com).* matches all href except aloha-editor.com
 */
GENTICS.Aloha.Link.cssclassregex = '';

/**
  * this target is set when either cssclassregex matches or not set
  */
GENTICS.Aloha.Link.cssclass = '';

/**
 * this target is set when either cssclassregex matches or not set
 */
GENTICS.Aloha.Link.mouseOverLink = null;

/**
 * when a ressource is set the autocompletion is activated
 */
GENTICS.Aloha.Link.ressource = null;

/**
 * Initialize the plugin
 */
GENTICS.Aloha.Link.init = function () {
    if (GENTICS.Aloha.Link.settings.targetregex != undefined)
        GENTICS.Aloha.Link.targetregex = GENTICS.Aloha.Link.settings.targetregex;
    if (GENTICS.Aloha.Link.settings.target != undefined)
        GENTICS.Aloha.Link.target = GENTICS.Aloha.Link.settings.target;
    if (GENTICS.Aloha.Link.settings.cssclassregex != undefined)
        GENTICS.Aloha.Link.cssclassregex = GENTICS.Aloha.Link.settings.cssclassregex;
    if (GENTICS.Aloha.Link.settings.cssclass != undefined)
        GENTICS.Aloha.Link.cssclass = GENTICS.Aloha.Link.settings.cssclass;
    if (GENTICS.Aloha.Link.settings.ressource != undefined)
        GENTICS.Aloha.Link.ressource = GENTICS.Aloha.Link.settings.ressource;
        
    this.initButtons();
    this.subscribeEvents();
    this.bindInteractions();
    
};

/**
 * Initialize the buttons
 */
GENTICS.Aloha.Link.initButtons = function () {
    var that = this;

    // format Button
    this.formatLinkButton = new GENTICS.Aloha.ui.Button({
        'iconClass' : 'GENTICS_button GENTICS_button_a',
        'size' : 'small',
        'onclick' : function () { that.formatLink(); },
        'tooltip' : this.i18n('button.addlink.tooltip'),
        'toggle' : true
    });
    GENTICS.Aloha.FloatingMenu.addButton(
        'GENTICS.Aloha.continuoustext',
        this.formatLinkButton,
        GENTICS.Aloha.i18n(GENTICS.Aloha, 'floatingmenu.tab.format'),
        1
    );

    // insert Link
    this.insertLinkButton = new GENTICS.Aloha.ui.Button({
        'iconClass' : 'GENTICS_button GENTICS_button_a',
        'size' : 'small',
        'onclick' : function () { that.insertLink( false ); },
        'tooltip' : this.i18n('button.addlink.tooltip'),
        'toggle' : false
    });
    GENTICS.Aloha.FloatingMenu.addButton(
        'GENTICS.Aloha.continuoustext',
        this.insertLinkButton,
        GENTICS.Aloha.i18n(GENTICS.Aloha, 'floatingmenu.tab.insert'),
        1
    );

    // add the new scope for links
    GENTICS.Aloha.FloatingMenu.createScope(this.getUID('link'), 'GENTICS.Aloha.continuoustext');

    this.srcFieldButton = new GENTICS.Aloha.Link.SrcField();

    // add the input field for links
    GENTICS.Aloha.FloatingMenu.addButton(
        this.getUID('link'),
        this.srcFieldButton,
        this.i18n('floatingmenu.tab.link'),
        1
    );

    // add a button for removing the currently set link
    GENTICS.Aloha.FloatingMenu.addButton(
        this.getUID('link'),
        new GENTICS.Aloha.ui.Button({
            // TODO use another icon here
            'iconClass' : 'GENTICS_button GENTICS_button_a_remove',
            'size' : 'small',
            'onclick' : function () { that.removeLink(); },
            'tooltip' : this.i18n('button.removelink.tooltip')
        }),
        this.i18n('floatingmenu.tab.link'),
        1
    );

};

/**
 * Parse a all editables for links and bind an onclick event
 * Add the link short cut to all edtiables 
 */
GENTICS.Aloha.Link.bindInteractions = function () {
    var that = this;

    // add to all editables the Link shortcut
    for (var i = 0; i < GENTICS.Aloha.editables.length; i++) {

        // CTRL+L
        GENTICS.Aloha.editables[i].obj.keydown(function (e) {
    		if ( (that.isCrtlDown || that.isMetaDown ) && e.which == 76 ) {
		        if ( that.findLinkMarkup() ) {
		            GENTICS.Aloha.FloatingMenu.userActivatedTab = that.i18n('floatingmenu.tab.link');
		
		            // TODO this should not be necessary here!
		            GENTICS.Aloha.FloatingMenu.doLayout();
		
		            that.srcFieldButton.focus();
		
		        } else {
		            that.insertLink();
		        }
	            // prevent from further handling
	            // on a MAC Safari cursor would jump to location bar. Use ESC then META+L
	            return false; 
    		}
        });
    	
        GENTICS.Aloha.editables[i].obj.find('a').each( function( i ) {
            
            // show pointer on mouse over
            jQuery(this).mouseenter( function(e) {
    			GENTICS.Aloha.Log.debug(GENTICS.Aloha.Link, 'mouse over link.');
    			that.mouseOverLink = this;
           	 	that.updateMousePointer();
            });
            
            // in any case on leave show text cursor
            jQuery(this).mouseleave( function(e) {
    			GENTICS.Aloha.Log.debug(GENTICS.Aloha.Link, 'mouse left link.');
           	 	that.moseOverLink = null;
           	 	that.updateMousePointer();
            });

            
            // follow link on ctrl or meta + click
            jQuery(this).click(function(e) { 
                if (e.metaKey || e.ctrlKey) {
                	
                	// blur current editable. user is wating for the link to load
                	GENTICS.Aloha.activeEditable.blur();
                	
                	// hack to guarantee a browser history entry :)
                	setTimeout(function(){
                	      location.href = e.target;
                	},0)
                	// stop propagation
       				e.stopPropagation();
                    return false;
                }
            });

        }); 
    }
    
	jQuery(document).keyup(function (e) {
		switch( e.which ) {
			case 17:
    			GENTICS.Aloha.Log.debug(GENTICS.Aloha.Link, 'ctrl up');
				that.isCtrlDown = false;
				that.updateMousePointer();
				break;
			case 91:
				that.isMetaLDown = false;
				if ( !that.isMetaRDown ) {
					that.isMetaDown = false;
	    			GENTICS.Aloha.Log.debug(GENTICS.Aloha.Link, 'meta up');
				}
				that.updateMousePointer();
				break;
			case 93:
				that.isMetaRDown = false;
				if ( !that.isMetaLDown ) {
					that.isMetaDown = false;
	    			GENTICS.Aloha.Log.debug(GENTICS.Aloha.Link, 'meta up');
				}
				that.updateMousePointer();
				break;
		}
	});
    
	jQuery(document).keydown(function (e) {
		switch( e.which ) {
			case 17:
				GENTICS.Aloha.Log.debug(GENTICS.Aloha.Link, 'meta ctrl');
				that.isCtrlDown = true;
				that.updateMousePointer();
				break;
			case 91:
    			GENTICS.Aloha.Log.debug(GENTICS.Aloha.Link, 'meta down');
				that.isMetaLDown = true;
				that.isMetaDown = true;
				that.updateMousePointer();
				break;
			case 93:
    			GENTICS.Aloha.Log.debug(GENTICS.Aloha.Link, 'meta down');
				that.isMetaRDown = true;
				that.isMetaDown = true;
				that.updateMousePointer();
				break;
		}
	});

}


/**
 * Updates the mouse pointer
 */
GENTICS.Aloha.Link.updateMousePointer = function () {
    var that = this;

    if ( (that.isCrtlDown || that.isMetaDown ) && that.mouseOverLink != null) {
		GENTICS.Aloha.Log.debug(GENTICS.Aloha.Link, 'set pointer');
		jQuery(that.mouseOverLink).removeClass('GENTICS_link_text');
		jQuery(that.mouseOverLink).addClass('GENTICS_link_pointer');
    } else {
		jQuery(that.mouseOverLink).removeClass('GENTICS_link_pointer');
		jQuery(that.mouseOverLink).addClass('GENTICS_link_text');
    }
}


/**
 * Subscribe for events
 */
GENTICS.Aloha.Link.subscribeEvents = function () {
    var that = this;

    // add the event handler for selection change
    GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'selectionChanged', function(event, rangeObject) {
        
        // show/hide the button according to the configuration
    	if (GENTICS.Aloha.activeEditable) {
    		var config = that.getEditableConfig(GENTICS.Aloha.activeEditable.obj);
    		if ( jQuery.inArray('a', config) != -1) {
    			that.formatLinkButton.show();
    			that.insertLinkButton.show();
    		} else {
    			that.formatLinkButton.hide();
    			that.insertLinkButton.hide();
    			// leave if a is not allowed
    			return;
    		}
    		
    		var foundMarkup = that.findLinkMarkup( rangeObject )
    		if ( foundMarkup ) {
    			// link found
    			that.insertLinkButton.hide();
    			that.formatLinkButton.setPressed(true);
    			GENTICS.Aloha.FloatingMenu.setScope(that.getUID('link'));
    			that.srcFieldButton.setAnchor(foundMarkup);
    		} else {
    			// no link found
    			that.formatLinkButton.setPressed(false);
    			that.srcFieldButton.setAnchor(null);
    		}
    		
    		// TODO this should not be necessary here!
    		GENTICS.Aloha.FloatingMenu.doLayout();
    	}
    });
    
};

/**
 * Check wheter inside a link tag 
 * @param {GENTICS.Utils.RangeObject} range range where to insert the object (at start or end)
 * @return markup
 * @hide
 */
GENTICS.Aloha.Link.findLinkMarkup = function ( range ) {
    if ( typeof range == 'undefined' ) {
        var range = GENTICS.Aloha.Selection.getRangeObject();   
    }
    return range.findMarkup(function() {
        return this.nodeName.toLowerCase() == 'a';
    }, GENTICS.Aloha.activeEditable.obj);
};

/**
 * Format the current selection or if collapsed the current word as link.
 * If inside a link tag the link is removed.
 */
GENTICS.Aloha.Link.formatLink = function () {
    var that = this;
    var range = GENTICS.Aloha.Selection.getRangeObject();
    
    if (GENTICS.Aloha.activeEditable) {
        if ( that.findLinkMarkup( range ) ) {
            that.removeLink();
        } else {
            that.insertLink();
        }
    }
};

/**
 * Insert a new link at the current selection. When the selection is collapsed,
 * the link will have a default link text, otherwise the selected text will be
 * the link text.
 */
GENTICS.Aloha.Link.insertLink = function ( extendToWord ) {
    var that = this;
    
    // do not insert a link in a link
    if ( that.findLinkMarkup( range ) ) {
        return;
    }
    
    // activate floating menu tab
    GENTICS.Aloha.FloatingMenu.userActivatedTab = this.i18n('floatingmenu.tab.link');

    // current selection or cursor position
    var range = GENTICS.Aloha.Selection.getRangeObject();

    // if selection is collapsed then extend to the word.
    if (range.isCollapsed() && extendToWord != false) {
        GENTICS.Utils.Dom.extendToWord(range);
    }
    if ( range.isCollapsed() ) {
        // insert a link with text here
        var linkText = this.i18n('newlink.defaulttext');
        var newLink = jQuery('<a href="#">' + linkText + '</a>');
        // TODO attach click handler
        GENTICS.Utils.Dom.insertIntoDOM(newLink, range, jQuery(GENTICS.Aloha.activeEditable.obj));
        range.startContainer = range.endContainer = newLink.contents().get(0);
        range.startOffset = 0;
        range.endOffset = linkText.length;
    } else {
        var newLink = jQuery('<a href="#"></a>');
        // TODO attach click handler
        GENTICS.Utils.Dom.addMarkup(range, newLink, false);
    }
    range.select();
    this.srcFieldButton.focus();
};

/**
 * Remove an a tag.
 */
GENTICS.Aloha.Link.removeLink = function () {
    var that = this;

    var range = GENTICS.Aloha.Selection.getRangeObject();
    var foundMarkup = that.findLinkMarkup(); 
    if ( foundMarkup ) {
        // remove the link
        GENTICS.Utils.Dom.removeFromDOM(foundMarkup, range, true);
        // set focus back to editable
        GENTICS.Aloha.activeEditable.obj[0].focus();
        // select the (possibly modified) range
        range.select();
    }
};


/**
 * Make the given jQuery object (representing an editable) clean for saving
 * Find all links and remove editing objects
 * @param obj jQuery object to make clean
 * @return void
 */
GENTICS.Aloha.Link.makeClean = function (obj) {
	// find all table tags
	obj.find('a').each(function() {
		// do something with link
		
	});
};


/**
 * For now, we create our own extJS button implementation
 * TODO: move this into a 'generic' button in ui.js and use this generic button here to make the plugin independent from extJS
 */
Ext.ux.LinkSrcButton = Ext.extend(Ext.Component, {
    /**
     * the jQuery object of the dom element of this button
     */
    wrapper : null,

    /**
     * the input field
     */
    input : null,

    /**
     * the anchor DOM object which is currently modified
     */
    anchor : null,

    /**
     * The onrender function renders a simple input field
     */
    onRender : function () {
        var that = this;

        Ext.ux.LinkSrcButton.superclass.onRender.apply(this, arguments);
        this.wrapper = jQuery(this.el.dom);
        this.input = jQuery('<input id="GENTICS_Aloha_plugin_Link" type="text" style="width:300px">');
        
        // activate autocomplete when a ressource is available
        if ( GENTICS.Aloha.Link.settings.ressource || 1==1 ) {
        	var data = [ 
        	            {id: 1, text:'Link A', url:'/page1'},
        	            {id: 2, text:'Link B', url:'/page2'},
        	            {id: 3, text:'Link C', url:'/page3'},
        	            {id: 4, text:'Link D', url:'/page4'}
        	];
	        this.input.autocomplete(data, {
	        	formatItem: function(item) {
	            	return item.text + '<br /><i style="font-size:75%;color:#555">' + item.url + '</i>';
	          	}
	        }).result(function(event, item) {
	        	// call the ressource handler
	        	that.input.val(item.url);
	        	jQuery(that.anchor).attr('id', item.id);
	        });
        };
        // add a key handler for processing the input data
        this.input.keyup(function (event) {
            
            // update link href in any case 
            if (that.anchor) {
                                
                // Let's check if this is an link or a search term
                // Update links immediately other wise call a resource query
                // Only update if more than 2 chars
                if ( that.input.val().length >= 2 ) { 
                    
                    /* FOR RESSOURCE IMPLEMENTATION
                    if (  
                    that.input.val()[0] == '/'          // inner domain link
                    // could be a external link http
                    || (that.input.val()[0] == 'h' && that.input.val()[0] == 'i' )      
                    // could be a local link file
                    || (that.input.val()[0] == 'f' && that.input.val()[0] == 'i' )      
                    || that.input.val()[0] == '//'       // could be a windows share link
                    || that.input.val()[0] == '#'       // could be a document internal link 
                    || that.input.val()[0] == '?'       // could be a script link 
                    ){
                        // update href
                        jQuery(that.anchor).attr('href', that.input.val());
                    } else {
                        // call resource query and do not update. 
                        // Must be handled by the ressource
                    }
                    */
                    jQuery(that.anchor).attr('href', that.input.val());
                
                } else {
                
                    // 1 character cannot be a valid link
                    jQuery(that.anchor).attr('href', '#');
                
                }
            }
            
            // on ENTER or ESC leave the editing
            if (event.keyCode == 13 || event.keyCode == 27) {
                
                // Set focus to link element and select the object
                GENTICS.Aloha.activeEditable.obj[0].focus();
                GENTICS.Aloha.Selection.getRangeObject().select();
            
            } else {
                
                // For now hardcoded attribute handling with regex.
                that.setAttribute(that.input.val(), 'target', GENTICS.Aloha.Link.targetregex, GENTICS.Aloha.Link.target);
                that.setAttribute(that.input.val(), 'class', GENTICS.Aloha.Link.cssclassregex, GENTICS.Aloha.Link.cssclass);
            }
        });

        // onblur check if link should be deleted
        this.input.blur(function (event) {          

            // in case the input is href 
            // this is an non sense link remove the link
            if ( that.input.val() == '' ) {
                GENTICS.Aloha.Link.removeLink();
            }
        });
        
        this.wrapper.append(this.input);

        if (this.getFocus) {
            this.getFocus = undefined;
            this.input.select();
            this.input.focus();
        }
    },

    // Private hack to allow attribute setting by regex
    setAttribute: function (input, attr, regex, value) {
        var that = this;

        if ( typeof value != 'undefined' ) {
            var setTarget = true;
            if ( typeof regex  != 'undefined' ) {
                var regex = new RegExp( regex );
                if ( input.match(regex) ) {
                    setTarget = true;
                } else {
                    setTarget = false;
                }
            }
            if ( setTarget ) {
                jQuery(that.anchor).attr(attr, value);
            } else {
                jQuery(that.anchor).removeAttr(attr);                                   
            }
        }

    },
    
    /**
     * Set the anchor
     */
    setAnchor : function (anchor) {
        this.anchor = anchor;
        if (this.input) {
            if (this.anchor) {
                this.input.val(jQuery(this.anchor).attr('href'));
            } else {
                this.input.val('');
            }
        }
    },

    /**
     * focus the input field
     */
    focus : function () {
        if (this.input) {
            this.input.select();
            this.input.focus();
        } else {
            this.getFocus = true;
        }
    }
});
/**
 * Register the button
 */
Ext.reg('linksrcbutton', Ext.ux.LinkSrcButton);

/**
 * This class extends the Button
 */
GENTICS.Aloha.Link.SrcField = function () {
    GENTICS.Aloha.ui.Button.apply(this, arguments);
};

//Inherit all methods and properties from GENTICS.Aloha.ui.Button
GENTICS.Aloha.Link.SrcField.prototype = new GENTICS.Aloha.ui.Button();

/**
 * Create a linksrcbutton
 */
GENTICS.Aloha.Link.SrcField.prototype.getExtConfigProperties = function() {
    return {
        xtype : 'linksrcbutton',
        id : this.id
    };
};

/**
 * Wrapper for setting the anchor
 */
GENTICS.Aloha.Link.SrcField.prototype.setAnchor = function (anchor) {
    if (this.extButton) {
        this.extButton.setAnchor(anchor);
    }
};

/**
 * Wrapper for setting the focus
 */
GENTICS.Aloha.Link.SrcField.prototype.focus = function () {
    if (this.extButton) {
        this.extButton.focus();
    }
};
