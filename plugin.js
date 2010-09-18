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
 * the defined resource object types to be used for this instance
 */
GENTICS.Aloha.Link.resourceObjectTypes = [];

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
    if (GENTICS.Aloha.Link.settings.resourceObjectTypes != undefined)
        GENTICS.Aloha.Link.resourceObjectTypes = GENTICS.Aloha.Link.settings.resourceObjectTypes;
        
    this.createButtons();
    this.subscribeEvents();
    this.bindInteractions();

};

/**
 * Initialize the buttons
 */
GENTICS.Aloha.Link.createButtons = function () {
    var that = this;

    // format Link Button 
    // this button behaves like a formatting button like (bold, italics, etc)
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
    // always inserts a new link
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

    this.srcField = new GENTICS.Aloha.Link.AttributeField();
   
    this.srcField.setResourceObjectTypes(GENTICS.Aloha.Link.resourceObjectTypes);
    
    // update link object when src changes
    this.srcField.addListener('keyup', function(obj, event) {
    	// TODO this event is never fired. Why?
    	// if the user presses ESC we do a rough check if he has entered a link or searched for something
	    if (event.keyCode == 27) { 
	    	var curval = that.srcField.getQueryValue();
	    	if (
	    		curval[0] == '/' || // local link
	    		curval.match(/^.*\.([a-z]){2,4}$/i) || // local file with extension
	    		curval[0] == '#' || // inner document link
	    		curval.match(/^htt.*/i)  // external link
	    	) {
	    		// could be a link better leave it as it is
	    	} else {
	    		// the user searched for something and aborted restore original value
	    		that.srcField.setValue(that.srcField.getValue());
	    	}
	    }
    	that.srcChange();
    });
    
    // on mark the edited link in order the user has a visual feedback
    this.srcField.addListener('focus', function(obj, event) {
        var obj = that.srcField.getTargetObject();
        if ( obj ) {
        	that.objbgc = jQuery(obj).css('background-color');
        	jQuery(obj).css('background-color','Highlight');
        }
    });

    // on blur check if href is empty. If so remove the a tag
    this.srcField.addListener('blur', function(obj, event) {
        if ( this.getValue() == '' ) {
            that.removeLink();
        }
        // remove the highlighting and restore original color if was set before
        var obj = that.srcField.getTargetObject();
        if ( obj ) {
        	if ( !that.objbgc ) {
        		that.objbgc = '';
        	}
    		jQuery(obj).css('background-color', that.objbgc);
        }
    });
    
    // add the input field for links
    GENTICS.Aloha.FloatingMenu.addButton(
        this.getUID('link'),
        this.srcField,
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
		
		            that.srcField.focus();
		
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
           	 	that.mouseOverLink = null;
           	 	that.updateMousePointer();
            });

            
            // follow link on ctrl or meta + click
            jQuery(this).click( function(e) { 
                if (e.metaKey || e.ctrlKey) {
                	
                	// blur current editable. user is wating for the link to load
                	GENTICS.Aloha.activeEditable.blur();
                	
                	// hack to guarantee a browser history entry :)
                	setTimeout( function() {
                	      location.href = e.target;
                	},0);
                	
                	// stop propagation
       				e.stopPropagation();
                    return false;
                }
            });

        }); 
    }
    
/*  Move cmdkey handler to utils and make jQuery plugin. Then this should be the necessary code... 
 
	jQuery(document).cmdkeydown(function (e) {
		switch( e.which ) {
			case 'meta':
			case 'crtl':
				that.updateMousePointer();
				break;
		}
	});
	jQuery(document).cmdkeyup(function (e) {
		switch( e.which ) {
			case 'meta':
			case 'crtl':
				that.updateMousePointer();
				break;
		}
	});
*/
    
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

    if ( (this.isCrtlDown || this.isMetaDown ) && this.mouseOverLink ) {
		GENTICS.Aloha.Log.debug(GENTICS.Aloha.Link, 'set pointer');
		jQuery(this.mouseOverLink).removeClass('GENTICS_link_text');
		jQuery(this.mouseOverLink).addClass('GENTICS_link_pointer');
    } else {
		jQuery(this.mouseOverLink).removeClass('GENTICS_link_pointer');
		jQuery(this.mouseOverLink).addClass('GENTICS_link_text');
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
            that.srcField.setTargetObject(foundMarkup, 'href');
        } else {
            // no link found
        	that.formatLinkButton.setPressed(false);
        	that.srcField.setTargetObject(null);
        }

        // TODO this should not be necessary here!
        GENTICS.Aloha.FloatingMenu.doLayout();

    });
    
};

/**
 * Check whether inside a link tag 
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

	var range = GENTICS.Aloha.Selection.getRangeObject();
    
    if (GENTICS.Aloha.activeEditable) {
        if ( this.findLinkMarkup( range ) ) {
            this.removeLink();
        } else {
            this.insertLink();
        }
    }
};

/**
 * Insert a new link at the current selection. When the selection is collapsed,
 * the link will have a default link text, otherwise the selected text will be
 * the link text.
 */
GENTICS.Aloha.Link.insertLink = function ( extendToWord ) {
    
    // do not insert a link in a link
    if ( this.findLinkMarkup( range ) ) {
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
        var newLink = jQuery('<a href="">' + linkText + '</a>');
        GENTICS.Utils.Dom.insertIntoDOM(newLink, range, jQuery(GENTICS.Aloha.activeEditable.obj));
        range.startContainer = range.endContainer = newLink.contents().get(0);
        range.startOffset = 0;
        range.endOffset = linkText.length;
    } else {
        var newLink = jQuery('<a href=""></a>');
        GENTICS.Utils.Dom.addMarkup(range, newLink, false);
    }
    range.select();
    this.srcField.focus();
    this.srcChange();
};

/**
 * Remove an a tag.
 */
GENTICS.Aloha.Link.removeLink = function () {

    var range = GENTICS.Aloha.Selection.getRangeObject();
    var foundMarkup = this.findLinkMarkup(); 
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
 * Updates the link object depending on the src field
 */
GENTICS.Aloha.Link.srcChange = function () {
	// For now hard coded attribute handling with regex.
	this.srcField.setAttribute('target', this.target, this.targetregex, this.srcField.getQueryValue());
	this.srcField.setAttribute('class', this.cssclass, this.cssclassregex, this.srcField.getQueryValue());
}

/**
 * Make the given jQuery object (representing an editable) clean for saving
 * Find all links and remove editing objects
 * @param obj jQuery object to make clean
 * @return void
 */
GENTICS.Aloha.Link.makeClean = function (obj) {
	// find all link tags
	obj.find('a').each(function() {
		jQuery(this).removeClass('GENTICS_link_pointer');
		jQuery(this).removeClass('GENTICS_link_text');
	});
};


/**
 * MAKE THIS PLUGIN INDEPOENDENT AND MOVE CODE TO ui.js
 * 
 * 
 * Attribute Handler
 */


 	Ext.data.AlohaProxy = function( ) {
 	    // Must define a dummy api with "read" action to satisfy Ext.data.Api#prepare *before* calling super
 	    var api = {};
 	    api[Ext.data.Api.actions.read] = true;
 	    Ext.data.AlohaProxy.superclass.constructor.call(this, {
 	        api: api
 	    });
 	};
 	
 	Ext.extend(Ext.data.AlohaProxy, Ext.data.DataProxy, {
 		doRequest : function(action, rs, params, reader, cb, scope, arg) {
 	        try {
 	        	var rotypes = this.getResourceObjectTypes();
 	        	GENTICS.Aloha.ResourceRegistry.query(params.query, rotypes, function( resourceResult ) {
 	        		var result = reader.readRecords(resourceResult);
	 	 	        cb.call(scope, result, arg, true);
 	        	});
 	        } catch (e) {
 	            this.fireEvent("loadexception", this, null, arg, e);
 	            this.fireEvent('exception', this, 'response', action, arg, null, e);
 	            return false;
 	        }
 		},
 		resourceObjectTypes : null,
 		setResourceObjectTypes : function (otypes) {
 			this.resourceObjectTypes = otypes;
 		},
 		getResourceObjectTypes : function () {
 			return this.resourceObjectTypes;
 		}
 	});	
 	
	Ext.data.AlohaResourceReader = function(meta, recordType) {
		meta = {};
	    Ext.applyIf(meta, {
			idProperty: 'id',
			root: 'items',
			totalProperty: 'results',
			fields: [
				'id',
				'url',
				'name',
				'resourceObjectType',
				'weight',
				'resourceName'
			]
	    });
	    Ext.data.JsonReader.superclass.constructor.call(this, meta, meta.fields);
    };
 	
 	Ext.extend(Ext.data.AlohaResourceReader, Ext.data.JsonReader, {
 		// extend of necessary
 	});

Ext.ux.AlohaAttributeField = Ext.extend(Ext.form.ComboBox, {
    typeAhead: false,
    mode: 'remote',
    triggerAction: 'all',
	width: 300,
	hideTrigger: true,
	minChars: 3,
	valueField: 'id',
	displayField: 'url',
	enableKeyEvents: true,
	listEmptyText: GENTICS.Aloha.i18n('resource.no_item_found'),
	loadingText: GENTICS.Aloha.i18n('resource.loading') + '...',
	store: new Ext.data.Store({
		proxy: new Ext.data.AlohaProxy(),
		reader: new Ext.data.AlohaResourceReader()
    }),
    tpl: new Ext.XTemplate(
        '<tpl for="."><div class="x-combo-list-item">',
            '<span><b>{name}</b><br />{url}</span><span class="GENTICS_resourceName">{resourceName}</span>',
        '</div></tpl>'
    ),
    onSelect: function (item) { 
		this.setValue(item.data.url);
		// call the resource marker
		GENTICS.Aloha.ResourceRegistry.markObject(this.targetObject, item.data);
		this.collapse();
	},
    listeners: {
		// resource object types could have changed
		'beforequery': function (obj, event) {
			if (this.store != null && this.store.proxy != null) {
				this.store.proxy.setResourceObjectTypes(this.getResourceObjectTypes());
			}
		},
		'afterrender': function (obj, event) {
			var that = this; 
			jQuery(this.wrap.dom.children[0]).blur(function(e){ 		        
				that.triggerBlur();
			});
			
		},
    	'keydown': function (obj, event) {
			// on ENTER or ESC leave the editing
			// just remember here the status and remove cursor on keyup event
			// Otherwise cursor moves to content and no more blur event happens!!??
		    if (event.keyCode == 13 || event.keyCode == 27) {
		    	if ( this.isExpanded() ) {
		    		this.ALOHAwasExpanded = true;
		    	} else {
		    		this.ALOHAwasExpanded = false;
		    	}
		    }
		},
		'keyup': function (obj, event) {
		    if ((event.keyCode == 13 || event.keyCode == 27) && !this.ALOHAwasExpanded) {
		    	// work around stupid behavior when moving focus :/
		    	setTimeout( function() {
			    	// Set focus to link element and select the object
			        GENTICS.Aloha.activeEditable.obj[0].focus();
			        GENTICS.Aloha.Selection.getRangeObject().select();
		    	}, 0);
		        this.triggerBlur();
		    }
		    // update attribute 
			var v = this.wrap.dom.children[0].value;
	        this.setAttribute(this.targetAttribute, v);
		}
    }, 
    // Private hack to allow attribute setting by regex
    setAttribute: function (attr, value, regex, reference) {
    	
        if ( this.targetObject) {
            
        	// set the attribute
        	var setAttr = true;

            // check if a reference value is submitted to check against with a regex
	        if ( typeof reference != 'undefined' ) {
	            var regxp = new RegExp( regex );
	            if ( ! reference.match(regxp) ) {
	                setAttr = false;
	            }
	        }
	        
	        // the no regex was successful or no reference value 
	        // was submitted remove the attribute
            if ( setAttr ) {
        		jQuery(this.targetObject).attr(attr, value);
            } else {
            	jQuery(this.targetObject).removeAttr(attr);
            }
        }
    },
    
    
	/**
	 * Set the anchor
	 */
	setTargetObject : function (obj, attr) {
	    this.targetObject = obj;
	    this.targetAttribute = attr;
        if (this.targetObject && this.targetAttribute) {
            this.setValue(jQuery(this.targetObject).attr(this.targetAttribute));
        } else {
            this.setValue('');
        }
	},
	getTargetObject : function () {
	    return this.targetObject;
	},
	setResourceObjectTypes : function (otypes) {
		this.resourceObjectTypes = otypes;
	},
	getResourceObjectTypes : function () {
		return this.resourceObjectTypes;
	}
});

/**
 * Register the alloh attribute field 
 */
Ext.reg('alohaattributefield', Ext.ux.AlohaAttributeField);


/**
 * This class extends the Button
 */
GENTICS.Aloha.Link.AttributeField = function () {
    GENTICS.Aloha.ui.Button.apply(this, arguments);
};

/**
 * Inherit all methods and properties from GENTICS.Aloha.ui.Button
 */
GENTICS.Aloha.Link.AttributeField.prototype = new GENTICS.Aloha.ui.Button();

/**
 * Create a extjs alohaattributefield
 */
GENTICS.Aloha.Link.AttributeField.prototype.getExtConfigProperties = function() {
    return {
        xtype : 'alohaattributefield',
        id : this.id
    };
};

/**
 * Wrapper for setting the target Object
 */
GENTICS.Aloha.Link.AttributeField.prototype.setTargetObject = function (obj, attr) {
    if (this.extButton) {
        this.extButton.setTargetObject(obj, attr);
    }
};

/**
 * Wrapper for getting the target Object
 */
GENTICS.Aloha.Link.AttributeField.prototype.getTargetObject = function () {
    if (this.extButton) {
        return this.extButton.getTargetObject();
    } else {
    	return null;
    }
};


/**
 * Wrapper for setting the focus to this field
 */
GENTICS.Aloha.Link.AttributeField.prototype.focus = function () {
    if (this.extButton) {
        this.extButton.focus();
        this.extButton.selectText( 0, this.extButton.getValue().length );
    }
};

/**
 * Adding a listener to the field
 */
GENTICS.Aloha.Link.AttributeField.prototype.addListener = function ( eventName, handler, scope, options) {
    if (this.extButton) {
    	this.extButton.addListener(eventName, handler, scope, options);
    } else {
    	// if extButton not yet initialized adding listeners could be a problem
    	// so all events are collected in a queue and added on initalizing
    	listener = {
    			'eventName': eventName,
    			'handler': handler,
    			'scope': scope,
    			'options': options
    	};
    	this.listenerQueue.push(listener);
    }
};

/**
 * Wrapper for setting an attribute optionally based on a regex on reference 
 */
GENTICS.Aloha.Link.AttributeField.prototype.setAttribute = function (attr, value, regex, reference) {
    if (this.extButton) {
    	this.extButton.setAttribute(attr, value, regex, reference);
    }
};

/**
 * Wrapper for setting an attribute optionally based on a regex on reference 
 */
GENTICS.Aloha.Link.AttributeField.prototype.setResourceObjectTypes = function (rotypes) {
    if (this.extButton) {
    	this.extButton.setResourceObjectType(rotypes);
    } else {
    	this.resourceObjectTypes = rotypes;
    }
};

/**
 * Wrapper for getting the current value
 */
GENTICS.Aloha.Link.AttributeField.prototype.getValue = function () {
    if (this.extButton) {
    	return this.extButton.getValue();
    }
    return null;
};
GENTICS.Aloha.Link.AttributeField.prototype.setValue = function (v) {
    if (this.extButton) {
    	this.extButton.setValue(v);
    }
};
/**
 * Wrapper for getting the current query value
 */
GENTICS.Aloha.Link.AttributeField.prototype.getQueryValue = function () {
    if (this.extButton) {
    	//return this.extButton.getValue();
    	return this.extButton.wrap.dom.children[0].value;
    }
    return null;
}