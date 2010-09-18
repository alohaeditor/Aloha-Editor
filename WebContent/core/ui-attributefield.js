/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

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
	listEmptyText: GENTICS.Aloha.i18n( GENTICS.Aloha, 'resource.no_item_found' ),
	loadingText: GENTICS.Aloha.i18n( GENTICS.Aloha, 'resource.loading' ) + '...',
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
		GENTICS.Aloha.ResourceManager.markObject(this.targetObject, item.data);
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
	        
	        // if no regex was successful or no reference value 
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
 * Register the Aloha attribute field 
 */
Ext.reg('alohaattributefield', Ext.ux.AlohaAttributeField);


/**
 * This class extends the Button
 */
GENTICS.Aloha.AttributeField = function () {
    GENTICS.Aloha.ui.Button.apply(this, arguments);
};

/**
 * Inherit all methods and properties from GENTICS.Aloha.ui.Button
 */
GENTICS.Aloha.AttributeField.prototype = new GENTICS.Aloha.ui.Button();

/**
 * Create a extjs alohaattributefield
 */
GENTICS.Aloha.AttributeField.prototype.getExtConfigProperties = function() {
    return {
        xtype : 'alohaattributefield',
        id : this.id
    };
};

/**
 * Wrapper for setting the target Object
 */
GENTICS.Aloha.AttributeField.prototype.setTargetObject = function (obj, attr) {
    if (this.extButton) {
        this.extButton.setTargetObject(obj, attr);
    }
};

/**
 * Wrapper for getting the target Object
 */
GENTICS.Aloha.AttributeField.prototype.getTargetObject = function () {
    if (this.extButton) {
        return this.extButton.getTargetObject();
    } else {
    	return null;
    }
};


/**
 * Wrapper for setting the focus to this field
 */
GENTICS.Aloha.AttributeField.prototype.focus = function () {
    if (this.extButton) {
        this.extButton.focus();
        this.extButton.selectText( 0, this.extButton.getValue().length );
    }
};

/**
 * Adding a listener to the field
 */
GENTICS.Aloha.AttributeField.prototype.addListener = function ( eventName, handler, scope, options) {
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
GENTICS.Aloha.AttributeField.prototype.setAttribute = function (attr, value, regex, reference) {
    if (this.extButton) {
    	this.extButton.setAttribute(attr, value, regex, reference);
    }
};

/**
 * Wrapper for setting an attribute optionally based on a regex on reference 
 */
GENTICS.Aloha.AttributeField.prototype.setResourceObjectTypes = function (rotypes) {
    if (this.extButton) {
    	this.extButton.setResourceObjectType(rotypes);
    } else {
    	this.resourceObjectTypes = rotypes;
    }
};

/**
 * Wrapper for getting the current value
 */
GENTICS.Aloha.AttributeField.prototype.getValue = function () {
    if (this.extButton) {
    	return this.extButton.getValue();
    }
    return null;
};

GENTICS.Aloha.AttributeField.prototype.setValue = function (v) {
    if (this.extButton) {
    	this.extButton.setValue(v);
    }
};
/**
 * Wrapper for getting the current query value
 */
GENTICS.Aloha.AttributeField.prototype.getQueryValue = function () {
    if (this.extButton) {
    	//return this.extButton.getValue();
    	return this.extButton.wrap.dom.children[0].value;
    }
    return null;
}