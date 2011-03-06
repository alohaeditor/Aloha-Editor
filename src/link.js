/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * register the plugin with unique name
 */
GENTICS.Aloha.Link = new GENTICS.Aloha.Plugin('link');

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
 * the defined object types to be used for this instance
 */
GENTICS.Aloha.Link.objectTypeFilter = [];

/**
 * handle change on href change
 * called function( obj, href, item );
 */
GENTICS.Aloha.Link.onHrefChange = null;


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
    if (GENTICS.Aloha.Link.settings.objectTypeFilter != undefined)
        GENTICS.Aloha.Link.objectTypeFilter = GENTICS.Aloha.Link.settings.objectTypeFilter;
    if (GENTICS.Aloha.Link.settings.onHrefChange != undefined)
        GENTICS.Aloha.Link.onHrefChange = GENTICS.Aloha.Link.settings.onHrefChange;

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

    this.browser = new GENTICS.Aloha.ui.Browser();
    this.browser.setObjectTypeFilter(GENTICS.Aloha.Link.objectTypeFilter);
    this.browser.onSelect = function( item ) {
    	// set href Value
    	that.hrefField.setItem( item );
		// call hrefChange
    	that.hrefChange();
    };
    this.repositoryButton = new GENTICS.Aloha.ui.Button({
        'iconClass' : 'GENTICS_button_big GENTICS_button_tree',
        'size' : 'large',
        'onclick' : function () {
			that.browser.show();
		},
        'tooltip' : this.i18n('button.addlink.tooltip'),
        'toggle' : false
    });

    // COMMENT IN AND TEST THE BROWSER
    GENTICS.Aloha.FloatingMenu.addButton(
        this.getUID('link'),
        this.repositoryButton,
        this.i18n('floatingmenu.tab.link'),
        1
    );

    this.hrefField = new GENTICS.Aloha.ui.AttributeField({
    	'width':320,
    	'valueField': 'url'
    });
    this.hrefField.setTemplate('<span><b>{name}</b><br/>{url}</span>');
    this.hrefField.setObjectTypeFilter(GENTICS.Aloha.Link.objectTypeFilter);
    // add the input field for links
    GENTICS.Aloha.FloatingMenu.addButton(
        this.getUID('link'),
        this.hrefField,
        this.i18n('floatingmenu.tab.link'),
        1
    );

    this.removeLinkButton = new GENTICS.Aloha.ui.Button({
        // TODO use another icon here
        'iconClass' : 'GENTICS_button GENTICS_button_a_remove',
        'size' : 'small',
        'onclick' : function () { that.removeLink(); },
        'tooltip' : this.i18n('button.removelink.tooltip')
    });
    // add a button for removing the currently set link
    GENTICS.Aloha.FloatingMenu.addButton(
        this.getUID('link'),
        this.removeLinkButton,
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

    // update link object when src changes
    this.hrefField.addListener('keyup', function(obj, event) {
    	// TODO this event is never fired. Why?
    	// if the user presses ESC we do a rough check if he has entered a link or searched for something
	    if (event.keyCode == 27) {
	    	var curval = that.hrefField.getQueryValue();
	    	if (
	    		curval[0] == '/' || // local link
	    		curval.match(/^.*\.([a-z]){2,4}$/i) || // local file with extension
	    		curval[0] == '#' || // inner document link
	    		curval.match(/^htt.*/i)  // external link
	    	) {
	    		// could be a link better leave it as it is
	    	} else {
	    		// the user searched for something and aborted restore original value
//	    		that.hrefField.setValue(that.hrefField.getValue());
	    	}
	    }
    	that.hrefChange();
    });

    // on blur check if href is empty. If so remove the a tag
    this.hrefField.addListener('blur', function(obj, event) {
        if ( this.getValue() == '' ) {
            that.removeLink();
        }
    });

    // add to all editables the Link shortcut
    for (var i = 0; i < GENTICS.Aloha.editables.length; i++) {

        // CTRL+L
        GENTICS.Aloha.editables[i].obj.keydown(function (e) {
    		if ( e.metaKey && e.which == 76 ) {
		        if ( that.findLinkMarkup() ) {
		            GENTICS.Aloha.FloatingMenu.userActivatedTab = that.i18n('floatingmenu.tab.link');

		            // TODO this should not be necessary here!
		            GENTICS.Aloha.FloatingMenu.doLayout();

		            that.hrefField.focus();

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
                if (e.metaKey) {

                	// blur current editable. user is wating for the link to load
                	GENTICS.Aloha.activeEditable.blur();

                	// hack to guarantee a browser history entry
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

    jQuery(document).keydown(function (e) {
		GENTICS.Aloha.Log.debug(GENTICS.Aloha.Link, 'Meta key down.');
    	that.metaKey = e.metaKey;
   	 	that.updateMousePointer();
    });

    jQuery(document).keyup(function (e) {
		GENTICS.Aloha.Log.debug(GENTICS.Aloha.Link, 'Meta key up.');
    	that.metaKey = e.metaKey;
   	 	that.updateMousePointer();
    });

};

/**
 * Updates the mouse pointer
 */
GENTICS.Aloha.Link.updateMousePointer = function () {

    if ( this.metaKey && this.mouseOverLink ) {
		GENTICS.Aloha.Log.debug(GENTICS.Aloha.Link, 'set pointer');
		jQuery(this.mouseOverLink).removeClass('GENTICS_link_text');
		jQuery(this.mouseOverLink).addClass('GENTICS_link_pointer');
    } else {
		jQuery(this.mouseOverLink).removeClass('GENTICS_link_pointer');
		jQuery(this.mouseOverLink).addClass('GENTICS_link_text');
    }
};

/**
 * Subscribe for events
 */
GENTICS.Aloha.Link.subscribeEvents = function () {

	var that = this;

    // add the event handler for selection change
    GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'selectionChanged', function(event, rangeObject) {

    	if (GENTICS.Aloha.activeEditable) {
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

    		var foundMarkup = that.findLinkMarkup( rangeObject );
    		if ( foundMarkup ) {
    			// link found
    			that.insertLinkButton.hide();
    			that.formatLinkButton.setPressed(true);
    			GENTICS.Aloha.FloatingMenu.setScope(that.getUID('link'));
    			that.hrefField.setTargetObject(foundMarkup, 'href');
    		} else {
    			// no link found
    			that.formatLinkButton.setPressed(false);
    			that.hrefField.setTargetObject(null);
    		}

    		// TODO this should not be necessary here!
    		GENTICS.Aloha.FloatingMenu.doLayout();
    	}

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
	if ( GENTICS.Aloha.activeEditable ) {
		return range.findMarkup(function() {
	        return this.nodeName.toLowerCase() == 'a';
	    }, GENTICS.Aloha.activeEditable.obj);
	} else {
		return null;
	}
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
    this.hrefField.focus();
    this.hrefChange();
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
GENTICS.Aloha.Link.hrefChange = function () {
	// For now hard coded attribute handling with regex.
	// Avoid creating the target attribute, if it's unnecessary, so
	// that XSS scanners (AntiSamy) don't complain.
	if (this.target !== '') {
		this.hrefField.setAttribute('target', this.target, this.targetregex, this.hrefField.getQueryValue());
	}
	this.hrefField.setAttribute('class', this.cssclass, this.cssclassregex, this.hrefField.getQueryValue());
	if ( typeof this.onHrefChange == 'function' ) {
		this.onHrefChange.call(this, this.hrefField.getTargetObject(),  this.hrefField.getQueryValue(), this.hrefField.getItem() )
	}
	GENTICS.Aloha.EventRegistry.trigger(
			new GENTICS.Aloha.Event('hrefChanged', GENTICS.Aloha, {
				'obj' : this.hrefField.getTargetObject(),
				'href': this.hrefField.getQueryValue(),
				'item': this.hrefField.getItem()
			})
	);
};

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
