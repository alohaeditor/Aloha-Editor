/*
* Aloha Align Plugin - Allow text alignment in Aloha Editor
* Copyright (C) 2010 by Thomas Lété - http://twitter.com/taoma_k
* Licensed unter the terms of LGPL http://www.gnu.org/copyleft/lesser.html
*
*/

// Start Closure
(function(window, undefined) {
	"use strict";

	var
		jQuery = window.alohaQuery, $ = jQuery,
		GENTICS = window.GENTICS,
		Aloha = window.Aloha;
	
	/**
	 * register the plugin with unique name
	 */
	Aloha.Align = new (Aloha.Plugin.extend({
		_constructor: function() {
			this._super('align');
		},

		/**
		 * Configure the available languages
		 */
		languages: ['en', 'fr'],
		
		/**
		 * Configuration (available align options)
		 */
		config: ['right','left','center','justify'],
		
		/**
		 * Alignment wanted by the user
		 */
		alignment: '',

		/**
		 * Alignment of the selection before modification
		 */
		lastAlignment: '',
		
		/**
		 * Initialize the plugin and set initialize flag on true
		 */
		init: function () {
			this.createButtons();

			var that = this;

			// apply specific configuration if an editable has been activated
			Aloha.bind('aloha-editable-activated', function (e, params) {
				that.applyButtonConfig(params.editable.obj);
			});

			// add the event handler for selection change
		    Aloha.bind('aloha-selection-changed', function(event, rangeObject) {
		    	if (Aloha.activeEditable) {
		    		that.buttonPressed(rangeObject);
		    	}
		    });
		},

		buttonPressed: function (rangeObject) {

			var that = this;

			rangeObject.findMarkup(function() {
		        that.alignment = jQuery(this).css('text-align');
		    }, Aloha.activeEditable.obj);

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
		},

		/**
		 * applys a configuration specific for an editable
		 * buttons not available in this configuration are hidden
		 * @param {Object} id of the activated editable
		 * @return void
		 */
		applyButtonConfig: function (obj) {
			
			if (typeof this.settings === 'undefined') {
				config = this.config;
			} else {
				config = this.settings;
			}

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
		},

		createButtons: function () {
		    var that = this;

		    // create a new button
		    this.alignLeftButton = new Aloha.ui.Button({
		      'iconClass' : 'aloha-button-align aloha-button-align-left',
		      'size' : 'small',
		      'onclick' : function () { that.align('left'); },
		      'tooltip' : that.i18n('button.alignleft.tooltip'),
		      'toggle' : true
		    });

		    // add it to the floating menu
		    Aloha.FloatingMenu.addButton(
		      'Aloha.continuoustext',
		      this.alignLeftButton,
		      that.i18n('floatingmenu.tab.format'),
		      1
		    );

		    // create a new button
		    this.alignCenterButton = new Aloha.ui.Button({
		      'iconClass' : 'aloha-button-align aloha-button-align-center',
		      'size' : 'small',
		      'onclick' : function () { that.align('center'); },
		      'tooltip' : that.i18n('button.aligncenter.tooltip'),
		      'toggle' : true
		    });

		    // add it to the floating menu
		    Aloha.FloatingMenu.addButton(
		      'Aloha.continuoustext',
		      this.alignCenterButton,
		      that.i18n('floatingmenu.tab.format'),
		      1
		    );

		    // create a new button
		    this.alignRightButton = new Aloha.ui.Button({
		      'iconClass' : 'aloha-button-align aloha-button-align-right',
		      'size' : 'small',
		      'onclick' : function () { that.align('right'); },
		      'tooltip' : that.i18n('button.alignright.tooltip'),
		      'toggle' : true
		    });

		    // add it to the floating menu
		    Aloha.FloatingMenu.addButton(
		      'Aloha.continuoustext',
		      this.alignRightButton,
		      that.i18n('floatingmenu.tab.format'),
		      1
		    );

		    // create a new button
		    this.alignJustifyButton = new Aloha.ui.Button({
		      'iconClass' : 'aloha-button-align aloha-button-align-justify',
		      'size' : 'small',
		      'onclick' : function () { that.align('justify'); },
		      'tooltip' : that.i18n('button.alignjustify.tooltip'),
		      'toggle' : true
		    });

		    // add it to the floating menu
		    Aloha.FloatingMenu.addButton(
		      'Aloha.continuoustext',
		      this.alignJustifyButton,
		      that.i18n('floatingmenu.tab.format'),
		      1
		    );

		},

		/**
		 * Check whether inside a align tag 
		 * @param {GENTICS.Utils.RangeObject} range range where to insert the object (at start or end)
		 * @return markup
		 * @hide
		 */
		findAlignMarkup: function ( range ) {

			var that = this;

			if ( typeof range === 'undefined' ) {
		        var range = Aloha.Selection.getRangeObject();   
		    }
			if ( Aloha.activeEditable ) {
				return range.findMarkup(function() {
					return jQuery(this).css('text-align') == that.alignment;
			    }, Aloha.activeEditable.obj);
			} else {
				return null;
			}
		},

		/**
		 * Align the selection or remove it
		 */
		align: function ( tempAlignment ) {

			var range = Aloha.Selection.getRangeObject();

			this.lastAlignment = this.alignment;
			this.alignment = tempAlignment;

		    if (Aloha.activeEditable) {
		        if ( this.findAlignMarkup( range ) ) {
		            this.removeAlign();
		        } else {
		        	this.insertAlign();
		        }
		    }
		},

		/**
		 * Align the selection
		 */
		insertAlign: function () {

			var that = this;

			// do not align the range
		    if ( this.findAlignMarkup( range ) ) {
		        return;
		    }
		    // current selection or cursor position
		    var range = Aloha.Selection.getRangeObject();

		    // Iterates the whole selectionTree and align
			jQuery.each(Aloha.Selection.getRangeObject().getSelectionTree(), function () {
				if(this.selection !== 'none' && this.domobj.nodeType !== 3) {
					jQuery(this.domobj).css('text-align', that.alignment);
				}
			});

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
		},

		/**
		 * Remove the alignment
		 */
		removeAlign: function () {

		    var range = Aloha.Selection.getRangeObject();

		    if ( this.findAlignMarkup( range ) ) {

		    	// Remove the alignment
		    	range.findMarkup(function() {
		            jQuery(this).css('text-align', '');
		        }, Aloha.activeEditable.obj);

		        // set focus back to editable
		        Aloha.activeEditable.obj[0].focus();

		        // select the (possibly modified) range
		        range.select();
		    }
		}
		
	}))();
	
})(window);
