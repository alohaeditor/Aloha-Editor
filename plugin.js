/**
 * register the plugin with unique name
 */
GENTICS.Aloha.Align = new GENTICS.Aloha.Plugin('com.gentics.aloha.plugins.Align');

/**
 * Configure the available languages
 */
GENTICS.Aloha.Align.languages = ['en','fr'];

/**
 * Default configuration allows align in paragraphs
 */
GENTICS.Aloha.Align.config = ['right','left','center','justify'];

/**
 * Alignment wanted by the user
 */
GENTICS.Aloha.Align.alignment = '';

/**
 * Alignment of the selection before modification
 */
GENTICS.Aloha.Align.lastAlignment = '';

/**
 * Initialize the plugin and set initialize flag on true
 */
GENTICS.Aloha.Align.init = function () {
	this.createButtons();
	
	var that = this;
	
	// apply specific configuration if an editable has been activated
	GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'editableActivated', function (e, params) {
		that.applyButtonConfig(params.editable.obj);
	});
	
	// add the event handler for selection change
    GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'selectionChanged', function(event, rangeObject) {
    	if (GENTICS.Aloha.activeEditable) {
    		that.buttonPressed(rangeObject);
    	}
    });
};

GENTICS.Aloha.Align.buttonPressed = function (rangeObject) {
	
	var that = this;

	rangeObject.findMarkup(function() {
        that.alignment = jQuery(this).css('text-align');
    }, GENTICS.Aloha.activeEditable.obj);
	
	if(this.alignment != this.lastAlignment)
	{
		switch(this.lastAlignment)
		{
			case 'right':
				this.alignRightButton.setPressed(false);
				break;
				
			case 'left':
				this.alignLeftButton.setPressed(false);
				break;
				
			case 'center':
				this.alignCenterButton.setPressed(false);
				break;
				
			case 'justify':
				this.alignJustifyButton.setPressed(false);
				break;
		}
		
		switch(this.alignment)
		{
			case 'right':
				this.alignRightButton.setPressed(true);
				break;
				
			case 'center':
				this.alignCenterButton.setPressed(true);
				break;
				
			case 'justify':
				this.alignJustifyButton.setPressed(true);
				break;
				
			default:
				this.alignLeftButton.setPressed(true);
				this.alignment  = 'left';
				break;
		}
	}
	
	this.lastAlignment = this.alignment;
}

/**
 * applys a configuration specific for an editable
 * buttons not available in this configuration are hidden
 * @param {Object} id of the activated editable
 * @return void
 */
GENTICS.Aloha.Align.applyButtonConfig = function (obj) {

	config = this.getEditableConfig(obj);

	if ( jQuery.inArray('right', config) != -1) {
		this.alignRightButton.show();
	} else {
		this.alignRightButton.hide();
	}
	
	if ( jQuery.inArray('left', config) != -1) {
		this.alignLeftButton.show();
	} else {
		this.alignLeftButton.hide();
	}
	
	if ( jQuery.inArray('center', config) != -1) {
		this.alignCenterButton.show();
	} else {
		this.alignCenterButton.hide();
	}
	
	if ( jQuery.inArray('justify', config) != -1) {
		this.alignJustifyButton.show();
	} else {
		this.alignJustifyButton.hide();
	}
}

GENTICS.Aloha.Align.createButtons = function () {
    var that = this;

    // create a new button
    this.alignLeftButton = new GENTICS.Aloha.ui.Button({
      'iconClass' : 'GENTICS_button_align GENTICS_button_align_left',
      'size' : 'small',
      'onclick' : function () { that.align('left'); },
      'tooltip' : that.i18n('button.alignleft.tooltip'),
      'toggle' : true
    });
    
    // add it to the floating menu
    GENTICS.Aloha.FloatingMenu.addButton(
      'GENTICS.Aloha.continuoustext',
      this.alignLeftButton,
      that.i18n('floatingmenu.tab.format'),
      1
    );
    
    // create a new button
    this.alignCenterButton = new GENTICS.Aloha.ui.Button({
      'iconClass' : 'GENTICS_button_align GENTICS_button_align_center',
      'size' : 'small',
      'onclick' : function () { that.align('center'); },
      'tooltip' : that.i18n('button.aligncenter.tooltip'),
      'toggle' : true
    });
    
    // add it to the floating menu
    GENTICS.Aloha.FloatingMenu.addButton(
      'GENTICS.Aloha.continuoustext',
      this.alignCenterButton,
      that.i18n('floatingmenu.tab.format'),
      1
    );
    
    // create a new button
    this.alignRightButton = new GENTICS.Aloha.ui.Button({
      'iconClass' : 'GENTICS_button_align GENTICS_button_align_right',
      'size' : 'small',
      'onclick' : function () { that.align('right'); },
      'tooltip' : that.i18n('button.alignright.tooltip'),
      'toggle' : true
    });
    
    // add it to the floating menu
    GENTICS.Aloha.FloatingMenu.addButton(
      'GENTICS.Aloha.continuoustext',
      this.alignRightButton,
      that.i18n('floatingmenu.tab.format'),
      1
    );
    
    // create a new button
    this.alignJustifyButton = new GENTICS.Aloha.ui.Button({
      'iconClass' : 'GENTICS_button_align GENTICS_button_align_justify',
      'size' : 'small',
      'onclick' : function () { that.align('justify'); },
      'tooltip' : that.i18n('button.alignjustify.tooltip'),
      'toggle' : true
    });
    
    // add it to the floating menu
    GENTICS.Aloha.FloatingMenu.addButton(
      'GENTICS.Aloha.continuoustext',
      this.alignJustifyButton,
      that.i18n('floatingmenu.tab.format'),
      1
    );
    
};

/**
 * Check whether inside a align tag 
 * @param {GENTICS.Utils.RangeObject} range range where to insert the object (at start or end)
 * @return markup
 * @hide
 */
GENTICS.Aloha.Align.findAlignMarkup = function ( range ) {
	
	var that = this;
		
	if ( typeof range === 'undefined' ) {
        var range = GENTICS.Aloha.Selection.getRangeObject();   
    }
	if ( GENTICS.Aloha.activeEditable ) {
		return range.findMarkup(function() {
			return jQuery(this).css('text-align') == that.alignment;
	    }, GENTICS.Aloha.activeEditable.obj);
	} else {
		return null;
	}
};

/**
 * Align the selection or remove it
 */
GENTICS.Aloha.Align.align = function ( tempAlignment ) {
	
	var range = GENTICS.Aloha.Selection.getRangeObject();
	
	this.lastAlignment = this.alignment;
	this.alignment = tempAlignment;
    
    if (GENTICS.Aloha.activeEditable) {
        if ( this.findAlignMarkup( range ) ) {
            this.removeAlign();
        } else {
        	this.insertAlign();
        }
    }
};

/**
 * Align the selection
 */
GENTICS.Aloha.Align.insertAlign = function () {
	
	var that = this;
    
	// do not align the range
    if ( this.findAlignMarkup( range ) ) {
        return;
    }
    // current selection or cursor position
    var range = GENTICS.Aloha.Selection.getRangeObject();
    
    range.findMarkup(function() {
        jQuery(this).css('text-align', that.alignment);
    }, GENTICS.Aloha.activeEditable.obj);
	
	if(this.alignment != this.lastAlignment)
	{
		switch(this.lastAlignment)
		{
			case 'right':
				this.alignRightButton.setPressed(false);
				break;
				
			case 'left':
				this.alignLeftButton.setPressed(false);
				break;
				
			case 'center':
				this.alignCenterButton.setPressed(false);
				break;
				
			case 'justify':
				this.alignJustifyButton.setPressed(false);
				break;
		}
	}
    
    // select the (possibly modified) range
    range.select();
};

/**
 * Remove the alignment
 */
GENTICS.Aloha.Align.removeAlign = function () {

    var range = GENTICS.Aloha.Selection.getRangeObject();
    
    if ( this.findAlignMarkup( range ) ) {
    	
    	// Remove the alignment
    	range.findMarkup(function() {
            jQuery(this).css('text-align', '');
        }, GENTICS.Aloha.activeEditable.obj);
    	
        // set focus back to editable
        GENTICS.Aloha.activeEditable.obj[0].focus();
        
        // select the (possibly modified) range
        range.select();
    }
};
