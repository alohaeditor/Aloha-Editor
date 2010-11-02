/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * register the plugin with unique name
 */
GENTICS.Aloha.Abbr = new GENTICS.Aloha.Plugin('com.gentics.aloha.plugins.Abbr');

/**
 * Configure the available languages
 */
GENTICS.Aloha.Abbr.languages = ['en', 'de'];

/**
 * Default configuration allows abbrs everywhere
 */
GENTICS.Aloha.Abbr.config = ['abbr'];


/**
 * Initialize the plugin
 */
GENTICS.Aloha.Abbr.init = function () {
    
    this.createButtons();
    this.subscribeEvents();
    this.bindInteractions();

};

/**
 * Initialize the buttons
 */
GENTICS.Aloha.Abbr.createButtons = function () {
    var that = this;

    // format Abbr Button 
    // this button behaves like a formatting button like (bold, italics, etc)
    this.formatAbbrButton = new GENTICS.Aloha.ui.Button({
        'iconClass' : 'GENTICS_button GENTICS_button_abbr',
        'size' : 'small',
        'onclick' : function () { that.formatAbbr(); },
        'tooltip' : this.i18n('button.abbr.tooltip'),
        'toggle' : true
    });
    GENTICS.Aloha.FloatingMenu.addButton(
        'GENTICS.Aloha.continuoustext',
        this.formatAbbrButton,
        GENTICS.Aloha.i18n(GENTICS.Aloha, 'floatingmenu.tab.format'),
        1
    );

    // insert Abbr
    // always inserts a new abbr
    this.insertAbbrButton = new GENTICS.Aloha.ui.Button({
        'iconClass' : 'GENTICS_button GENTICS_button_abbr',
        'size' : 'small',
        'onclick' : function () { that.insertAbbr( false ); },
        'tooltip' : this.i18n('button.addabbr.tooltip'),
        'toggle' : false
    });
    GENTICS.Aloha.FloatingMenu.addButton(
        'GENTICS.Aloha.continuoustext',
        this.insertAbbrButton,
        GENTICS.Aloha.i18n(GENTICS.Aloha, 'floatingmenu.tab.insert'),
        1
    );

    // add the new scope for abbr
    GENTICS.Aloha.FloatingMenu.createScope(this.getUID('abbr'), 'GENTICS.Aloha.continuoustext');
    
    this.abbrField = new GENTICS.Aloha.ui.AttributeField({
    	'width':320
    });
    // add the input field for abbr
    GENTICS.Aloha.FloatingMenu.addButton(
        this.getUID('abbr'),
        this.abbrField,
        this.i18n('floatingmenu.tab.abbr'),
        1
    );

};

/**
 * Parse a all editables for abbreviations 
 * Add the abbr shortcut to all edtiables 
 */
GENTICS.Aloha.Abbr.bindInteractions = function () {
    var that = this;

    // on blur check if abbr title is empty. If so remove the a tag
    this.abbrField.addListener('blur', function(obj, event) {
        if ( this.getValue() == '' ) {
            that.removeAbbr();
        }
    });
    
    // add to all editables the abbr shortcut
    for (var i = 0; i < GENTICS.Aloha.editables.length; i++) {

        // CTRL+G
        GENTICS.Aloha.editables[i].obj.keydown(function (e) {
    		if ( e.metaKey && e.which == 71 ) {
		        if ( that.findAbbrMarkup() ) {
		            GENTICS.Aloha.FloatingMenu.userActivatedTab = that.i18n('floatingmenu.tab.abbr');
		
		            // TODO this should not be necessary here!
		            GENTICS.Aloha.FloatingMenu.doLayout();
		
		            that.abbrField.focus();
		
		        } else {
		            that.insertAbbr();
		        }
	            // prevent from further handling
	            // on a MAC Safari cursor would jump to location bar. Use ESC then META+L
	            return false; 
    		}
        });
    }
};

/**
 * Subscribe for events
 */
GENTICS.Aloha.Abbr.subscribeEvents = function () {

	var that = this;
	
    // add the event handler for selection change
    GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'selectionChanged', function(event, rangeObject) {
        if (GENTICS.Aloha.activeEditable) {
        	// show/hide the button according to the configuration
        	var config = that.getEditableConfig(GENTICS.Aloha.activeEditable.obj);
        	
        	if ( jQuery.inArray('abbr', config) != -1) {
        		that.formatAbbrButton.show();
        		that.insertAbbrButton.show();
        	} else {
        		that.formatAbbrButton.hide();
        		that.insertAbbrButton.hide();
        		// leave if a is not allowed
        		return;
        	}
        	
//        if ( !GENTICS.Aloha.Selection.mayInsertTag('abbr') ) {
//        	that.insertAbbrButton.hide();
//        }
        	
        	var foundMarkup = that.findAbbrMarkup( rangeObject );
        	if ( foundMarkup ) {
        		// abbr found
        		that.insertAbbrButton.hide();
        		that.formatAbbrButton.setPressed(true);
        		GENTICS.Aloha.FloatingMenu.setScope(that.getUID('abbr'));
        		that.abbrField.setTargetObject(foundMarkup, 'title');
        	} else {
        		// no abbr found
        		that.formatAbbrButton.setPressed(false);
        		that.abbrField.setTargetObject(null);
        	}
        	
        	// TODO this should not be necessary here!
        	GENTICS.Aloha.FloatingMenu.doLayout();
        }

    });
    
};

/**
 * Check whether inside a abbr tag 
 * @param {GENTICS.Utils.RangeObject} range range where to insert the object (at start or end)
 * @return markup
 * @hide
 */
GENTICS.Aloha.Abbr.findAbbrMarkup = function ( range ) {
    
	if ( typeof range == 'undefined' ) {
        var range = GENTICS.Aloha.Selection.getRangeObject();   
    }
	if ( GENTICS.Aloha.activeEditable ) {
	    return range.findMarkup(function() {
	        return this.nodeName.toLowerCase() == 'abbr';
	    }, GENTICS.Aloha.activeEditable.obj);
	} else {
		return null;
	}
};

/**
 * Format the current selection or if collapsed the current word as abbr.
 * If inside a abbr tag the abbr is removed.
 */
GENTICS.Aloha.Abbr.formatAbbr = function () {
	
	var range = GENTICS.Aloha.Selection.getRangeObject();
    
    if (GENTICS.Aloha.activeEditable) {
        if ( this.findAbbrMarkup( range ) ) {
            this.removeAbbr();
        } else {
            this.insertAbbr();
        }
    }
};

/**
 * Insert a new abbr at the current selection. When the selection is collapsed,
 * the abbr will have a default abbr text, otherwise the selected text will be
 * the abbr text.
 */
GENTICS.Aloha.Abbr.insertAbbr = function ( extendToWord ) {
    
    // do not insert a abbr in a abbr
    if ( this.findAbbrMarkup( range ) ) {
        return;
    }
    
    // activate floating menu tab
    GENTICS.Aloha.FloatingMenu.userActivatedTab = this.i18n('floatingmenu.tab.abbr');

    // current selection or cursor position
    var range = GENTICS.Aloha.Selection.getRangeObject();

    // if selection is collapsed then extend to the word.
    if (range.isCollapsed() && extendToWord != false) {
        GENTICS.Utils.Dom.extendToWord(range);
    }
    if ( range.isCollapsed() ) {
        // insert a abbr with text here
        var abbrText = this.i18n('newabbr.defaulttext');
        var newAbbr = jQuery('<abbr title="">' + abbrText + '</abbr>');
        GENTICS.Utils.Dom.insertIntoDOM(newAbbr, range, jQuery(GENTICS.Aloha.activeEditable.obj));
        range.startContainer = range.endContainer = newAbbr.contents().get(0);
        range.startOffset = 0;
        range.endOffset = abbrText.length;
    } else {
        var newAbbr = jQuery('<abbr title=""></abbr>');
        GENTICS.Utils.Dom.addMarkup(range, newAbbr, false);
    }
    range.select();
    this.abbrField.focus();
//    this.abbrChange();
};

/**
 * Remove an a tag.
 */
GENTICS.Aloha.Abbr.removeAbbr = function () {

    var range = GENTICS.Aloha.Selection.getRangeObject();
    var foundMarkup = this.findAbbrMarkup(); 
    if ( foundMarkup ) {
        // remove the abbr
        GENTICS.Utils.Dom.removeFromDOM(foundMarkup, range, true);
        // set focus back to editable
        GENTICS.Aloha.activeEditable.obj[0].focus();
        // select the (possibly modified) range
        range.select();
    }
};

/**
 * Make the given jQuery object (representing an editable) clean for saving
 * Find all abbrs and remove editing objects
 * @param obj jQuery object to make clean
 * @return void
 */
GENTICS.Aloha.Abbr.makeClean = function (obj) {
// nothing to do...
};
