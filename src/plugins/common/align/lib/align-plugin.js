/*
* Aloha Align Plugin - Allow text alignment in Aloha Editor
* Copyright (C) 2010 by Thomas Lété - http://twitter.com/taoma_k
* Licensed unter the terms of LGPL http://www.gnu.org/copyleft/lesser.html
*
*/

define(
['aloha',
 'aloha/plugin',
 'ui/component',
 'ui/toggleButton',
 'i18n!align/nls/i18n',
 'i18n!aloha/nls/i18n',
 'aloha/jquery',
 'css!align/css/align.css'],
function(Aloha, Plugin, Component, ToggleButton, i18n, i18nCore, jQuery) {
	"use strict";

	var
		GENTICS = window.GENTICS;

	/**
	 * register the plugin with unique name
	 */
	 return Plugin.create('align', {
		_constructor: function(){
			this._super('align');
		},

		/**
		 * Configure the available languages
		 */
		languages: ['en', 'fr'],

		/**
		 * Configuration (available align options)
		 */
		config: {
			alignment: ['right','left','center','justify']
		},

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
						this.alignRightButton.setState(false);
						break;

					case 'left':
						this.alignLeftButton.setState(false);
						break;

					case 'center':
						this.alignCenterButton.setState(false);
						break;

					case 'justify':
						this.alignJustifyButton.setState(false);
						break;
				}

				switch(this.alignment)
				{
					case 'right':
						this.alignRightButton.setState(true);
						break;

					case 'center':
						this.alignCenterButton.setState(true);
						break;

					case 'justify':
						this.alignJustifyButton.setState(true);
						break;

					default:
						this.alignLeftButton.setState(true);
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
			
			var config = this.getEditableConfig(obj);

			if ( config && config.alignment && !this.settings.alignment ) {
				config = config;
			} else if ( config[0] && config[0].alignment) {
				config = config[0];
			} else if ( this.settings.alignment ) {
				config.alignment = this.settings.alignment;
			}

			if (typeof config.alignment === 'undefined') {
				config = this.config;
			}

			if ( jQuery.inArray('right', config.alignment) != -1) {
				this.alignRightButton.show();
			} else {
				this.alignRightButton.hide();
			}

			if ( jQuery.inArray('left', config.alignment) != -1) {
				this.alignLeftButton.show();
			} else {
				this.alignLeftButton.hide();
			}

			if ( jQuery.inArray('center', config.alignment) != -1) {
				this.alignCenterButton.show();
			} else {
				this.alignCenterButton.hide();
			}

			if ( jQuery.inArray('justify', config.alignment) != -1) {
				this.alignJustifyButton.show();
			} else {
				this.alignJustifyButton.hide();
			}
		},

		createButtons: function () {
		    var that = this;

			Component.define("alignLeft", ToggleButton, {
				tooltip: i18n.t('button.alignleft.tooltip'),
				icon: 'aloha-icon aloha-icon-align aloha-icon-align-left',
				click: function(){ that.align('left'); }
			});

		    this.alignLeftButton = Component.getGlobalInstance("alignLeft");

			Component.define("alignCenter", ToggleButton, {
				tooltip: i18n.t('button.aligncenter.tooltip'),
				icon: 'aloha-icon aloha-icon-align aloha-icon-align-center',
				click: function(){ that.align('center'); }
			});

		    this.alignCenterButton = Component.getGlobalInstance("alignCenter");

			Component.define("alignRight", ToggleButton, {
				tooltip: i18n.t('button.alignright.tooltip'),
				icon: 'aloha-icon aloha-icon-align aloha-icon-align-right',
				click: function(){ that.align('right'); }
			});

		    this.alignRightButton = Component.getGlobalInstance("alignRight");

			Component.define("alignJustify", ToggleButton, {
				tooltip: i18n.t('button.alignjustify.tooltip'),
				icon: 'aloha-icon aloha-icon-align aloha-icon-align-justify',
				click: function(){ that.align('justify'); }
			});

		    this.alignJustifyButton = Component.getGlobalInstance("alignJustify");
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

			// Check if the parent node is not the main editable node and align
			// OR iterates the whole selectionTree and align
			if (!GENTICS.Utils.Dom.isEditingHost(range.getCommonAncestorContainer()))
				jQuery(range.getCommonAncestorContainer()).css('text-align', this.alignment);
			else
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
						this.alignRightButton.setState(false);
						break;

					case 'left':
						this.alignLeftButton.setState(false);
						break;

					case 'center':
						this.alignCenterButton.setState(false);
						break;

					case 'justify':
						this.alignJustifyButton.setState(false);
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

		        // select the (possibly modified) range
		        range.select();
		    }
		}

	});

});
