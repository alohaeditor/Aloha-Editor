/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

/**
 * Aloha wrapper for the ExtJS combobox 
 * @hide
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
	store: new Ext.data.Store({
		proxy: new Ext.data.AlohaProxy(),
		reader: new Ext.data.AlohaObjectReader()
    }),
    tpl: new Ext.XTemplate(
        '<tpl for="."><div class="x-combo-list-item">',
            '<span><b>{displayName}</b><br />{url}</span>',
        '</div></tpl>'
    ),
    onSelect: function (item) {
		this.setItem(item.data);
		if ( typeof this.alohaButton.onSelect == 'function' ) {
			this.alohaButton.onSelect.call(this.alohaButton, item.data);
		}
		this.collapse();
	},
    listeners: {
		// repository object types could have changed
		'beforequery': function (obj, event) {
			if (this.store != null && this.store.proxy != null) {
				this.store.proxy.setParams({
					objectTypeFilter: this.getObjectTypeFilter(),
					queryString: obj.query
				});
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
		    }
		    // update attribute 
			var v = this.wrap.dom.children[0].value;
	        this.setAttribute(this.targetAttribute, v);
		},
	    'focus': function(obj, event) {
			// set background color to give visual feedback which link is modified
	        var target = jQuery(this.getTargetObject());
	        var s = target.css('background-color');
	        if ( target && target.context.style && target.context.style['background-color'] ) {
	        	target.attr('data-original-background-color', target.context.style['background-color']);
	        }
	        target.css('background-color','Highlight');
	    },
	    'blur': function(obj, event) {
	        // remove the highlighting and restore original color if was set before
	        var target = jQuery(this.getTargetObject());
	        if ( target ) {
	        	if ( color = target.attr('data-original-background-color')  ) {
	        		jQuery(target).css('background-color', color);
	        	} else {
	        		jQuery(target).removeCss('background-color');
	        	}
	    		jQuery(target).removeAttr('data-original-background-color');
	        }
	    }
    }, 
    setItem: function( item, displayField ) {
    	console.log('set item: '+item);
    	this.resourceItem = item;
    	if ( item ) {
	    	displayField = (displayField) ? displayField : this.displayField;
			// TODO split display field by '.' and get corresponding attribute, because it could be a properties attribute.
			var v = item[displayField];
	    	this.setValue( v );
			this.setAttribute(this.targetAttribute, v);
			// call the repository marker
			GENTICS.Aloha.RepositoryManager.markObject(this.targetObject, item);
    	}
    },
    getItem: function( ) {
    	return this.resourceItem;
    },
    // Private hack to allow attribute setting by regex
    setAttribute: function (attr, value, regex, reference) {
    	
        if ( this.targetObject) {
            
        	// set the attribute
        	var setAttr = true;

            // check if a reference value is submitted to check against with a regex
	        if ( typeof reference != 'undefined' ) {
	            var regxp = new RegExp( regex );
	            if ( !reference.match(regxp) ) {
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
	setObjectTypeFilter : function (otFilter) {
		this.objectTypeFilter = otFilter;
	},
	getObjectTypeFilter : function () {
		return this.objectTypeFilter;
	}
});

/**
 * Register the Aloha attribute field 
 * @hide
 */
Ext.reg('alohaattributefield', Ext.ux.AlohaAttributeField);


/**
 * Aloha Attribute Field Button
 * @namespace GENTICS.Aloha.ui
 * @class AttributeField
 */
GENTICS.Aloha.ui.AttributeField = function () {

	/**
	 * @cfg Function called when an element is selected
	 */
	this.onSelect = null;

    GENTICS.Aloha.ui.Button.apply(this, arguments);
};

/**
 * Inherit all methods and properties from GENTICS.Aloha.ui.Button
 * @hide
 */
GENTICS.Aloha.ui.AttributeField.prototype = new GENTICS.Aloha.ui.Button();

/**
 * Create a extjs alohaattributefield
 * @hide
 */
GENTICS.Aloha.ui.AttributeField.prototype.getExtConfigProperties = function() {
    return {
    	alohaButton: this,
        xtype : 'alohaattributefield',
        id : this.id
    };
};

/**
 * Sets the target Object of which the Attribute should be modified
 * @param {jQuery} obj the target object
 * @param {String} attr Attribute to be modified ex. "href" of a link
 * @void
 */
GENTICS.Aloha.ui.AttributeField.prototype.setTargetObject = function (obj, attr) {
    if (this.extButton) {
        this.extButton.setTargetObject(obj, attr);
    }
};

/**
 * @return {jQuery} object Returns the current target Object
 */
GENTICS.Aloha.ui.AttributeField.prototype.getTargetObject = function () {
    if (this.extButton) {
        return this.extButton.getTargetObject();
    } else {
    	return null;
    }
};


/**
 * Focus to this field
 * @void
 */
GENTICS.Aloha.ui.AttributeField.prototype.focus = function () {
    if (this.extButton) {
        this.extButton.focus();
        this.extButton.selectText( 0, this.extButton.getValue().length );
    }
};

/**
 * Adding a listener to the field
 * @param {String} eventname The name of the event. Ex. 'keyup'
 * @param {function} handler The function that should be called when the event happens.
 * @param {Object} scope The scope object which the event should be attached
 */
GENTICS.Aloha.ui.AttributeField.prototype.addListener = function ( eventName, handler, scope) {
    if (this.extButton) {
    	this.extButton.addListener(eventName, handler, null);
    } else {
    	// if extButton not yet initialized adding listeners could be a problem
    	// so all events are collected in a queue and added on initalizing
    	listener = {
    			'eventName': eventName,
    			'handler': handler,
    			'scope': scope,
    			'options': null
    	};
    	this.listenerQueue.push(listener);
    }
};

/**
 * Sets an attribute optionally based on a regex on reference
 * @param {String} attr The Attribute name which should be set. Ex. "lang"
 * @param {String} value The value to set. Ex. "de-AT"
 * @param {String} regex The regex when the attribute should be set. The regex is applied to the value of refernece.
 * @param {String} reference The value for the regex.
 */
GENTICS.Aloha.ui.AttributeField.prototype.setAttribute = function (attr, value, regex, reference) {
    if (this.extButton) {
    	this.extButton.setAttribute(attr, value, regex, reference);
    }
};

/**
 * When at least on objectType is set the value in the Attribute field does a query to all registered repositories.
 * @param {Array} objectTypeFilter The array of objectTypeFilter to be searched for.
 * @void
 */
GENTICS.Aloha.ui.AttributeField.prototype.setObjectTypeFilter = function (objectTypeFilter) {
    if (this.extButton) {
    	this.extButton.setObjectType(objectTypeFilter);
    } else {
    	this.objectTypeFilter = objectTypeFilter;
    }
};

/**
 * Sets an item to the link tag.
 * @param {resourceItem} item  
 */
GENTICS.Aloha.ui.AttributeField.prototype.setItem = function ( item , displayField ) {
	console.log(item);
    if (this.extButton) {
    	this.extButton.setItem( item, displayField );
    }
};

/**
 * Gets current item set.
 * @return {resourceItem} item  
 */
GENTICS.Aloha.ui.AttributeField.prototype.getItem = function ( ) {
    if (this.extButton) {
    	return this.extButton.getItem();
    }
    return null;
};

/**
 * Returns the current value
 * @return {String} attributeValue
 */
GENTICS.Aloha.ui.AttributeField.prototype.getValue = function () {
    if (this.extButton) {
    	return this.extButton.getValue();
    }
    return null;
};

/**
 * Sets the current value
 * @param {String} va attributeValue
 */
GENTICS.Aloha.ui.AttributeField.prototype.setValue = function (v) {
    if (this.extButton) {
    	this.extButton.setValue(v);
    }
};

/**
 * Returns the current query value.
 * @return {String} queryValue
 */
GENTICS.Aloha.ui.AttributeField.prototype.getQueryValue = function () {
    if (this.extButton) {
    	//return this.extButton.getValue();
    	return this.extButton.wrap.dom.children[0].value;
    }
    return null;
};

/**
 * Set the display field, which is displayed in the combobox
 * @param {String} displayField name of the field to be displayed
 * @return display field name on success, null otherwise
 */
GENTICS.Aloha.ui.AttributeField.prototype.setDisplayField = function (displayField) {
    if (this.extButton) {
    	return this.extButton.displayField = displayField;
    } else {
    	return this.displayField = displayField;
    }
    return null;
};

/**
 * Set the row template for autocomplete hints. The default template is:
 * <span><b>{name}</b><br />{url}</span>
 * @param {String} tpl template to be rendered for each row
 * @return template on success or null otherwise
 */
GENTICS.Aloha.ui.AttributeField.prototype.setTemplate = function (tpl) {
	if (this.extButton) {
		return this.extButton.tpl = '<tpl for="."><div class="x-combo-list-item">' + tpl + '</div></tpl>';
	} else {
		return this.tpl = '<tpl for="."><div class="x-combo-list-item">' + tpl + '</div></tpl>';
	}
	return null;
};