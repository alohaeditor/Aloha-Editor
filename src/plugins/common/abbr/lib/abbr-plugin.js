/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
define([
	'aloha',
	'jquery',
	'aloha/plugin',
	'ui/component',
	'ui/componentState',
	'ui/toggleButton',
	'ui/button',
	'ui/scopes',
	'ui/port-helper-attribute-field',
	'i18n!abbr/nls/i18n',
	'i18n!aloha/nls/i18n'
], function (
	Aloha,
	jQuery,
	Plugin,
	Component,
	ComponentState,
	ToggleButton,
	Button,
	Scopes,
	AttributeField,
	i18n,
	i18nCore
) {
	'use strict';
	var GENTICS = window.GENTICS;

	/**
	 * register the plugin with unique name
	 */
	return Plugin.create( 'abbr', {
		/**
		 * Configure the available languages
		 */
		languages: [ 'en', 'de' ],

		/**
		 * default button configuration
		 */
		config: [ 'abbr' ],

		/**
		 * Initialize the plugin and set initialize flag on true
		 */
		init: function () {
			this.createButtons();
		    this.subscribeEvents();
		    this.bindInteractions();
		},

		/**
		 * Initialize the buttons
		 */
		createButtons: function () {
		    var me = this;

			Component.define("formatAbbr", ToggleButton, {
				tooltip: i18n.t("button.abbr.tooltip"),
				icon: "aloha-icon aloha-icon-abbr",
				scope: 'Aloha.continuoustext',
				click: function(){
					me.formatAbbr();
				}
			});

		    //this.formatAbbrButton = Component.getGlobalInstance("formatAbbr");

			Component.define("insertAbbr", Button, {
				tooltip: i18n.t('button.addabbr.tooltip'),
				icon: 'aloha-icon aloha-icon-abbr',
				scope: 'Aloha.continuoustext',
				click: function(){
					me.insertAbbr( false );
				}
			});

		    //this.insertAbbrButton = Component.getGlobalInstance("insertAbbr");

		    Scopes.createScope('abbr', 'Aloha.continuoustext');

		    this.abbrField = AttributeField({
		    	width: 320,
		    	name: 'abbrText',
		        scope: 'abbr'
		    });
		},

		/**
		 * Parse a all editables for abbreviations
		 * Add the abbr shortcut to all edtiables
		 */
		bindInteractions: function () {
			var me = this;
			
		    // on blur check if abbr title is empty. If so remove the a tag
		    this.abbrField.addListener( 'blur', function ( obj, event ) {
		        if ( this.getValue() == '' ) {
		            me.removeAbbr();
		        }
		    } );

		    // add to all editables the abbr shortcut
		    for ( var i = 0; i < Aloha.editables.length; i++ ) {
		        // CTRL+G
		        Aloha.editables[ i ].obj.keydown( function ( e ) {
		    		if ( e.metaKey && e.which == 71 ) {
				        if ( me.findAbbrMarkup() ) {
				        	Scopes.activateTabOfButton( 'abbrText' );
				            me.abbrField.focus();
				        } else {
				        	me.insertAbbr();
				        }
						
				        // prevent from further handling
			            // on a MAC Safari cursor would jump to location bar. Use ESC then META+L
				        e.stopPropagation();
				        e.preventDefault();
						
			            return false;
		    		}
		        } );
		    }
		},

		/**
		 * Subscribe for events
		 */
		subscribeEvents: function () {
			var me = this;

		    // add the event handler for selection change
			Aloha.bind( 'aloha-selection-changed', function ( event, rangeObject ) {
		        if ( Aloha.activeEditable ) {
		        	// show/hide the button according to the configuration
					// @todo this part should be done at aloha-editable-activated event
		        	var config = me.getEditableConfig( Aloha.activeEditable.obj );

		        	if ( jQuery.inArray( 'abbr', config ) != -1 ) {
						ComponentState.setState('formatAbbr', 'show', true);
						ComponentState.setState('insertAbbr', 'show', true);
		        	} else {
						ComponentState.setState('formatAbbr', 'show', false);
						ComponentState.setState('insertAbbr', 'show', false);
		        		return;
		        	}

		        	var foundMarkup = me.findAbbrMarkup(rangeObject);
		        	if (foundMarkup) {
		        		// abbr found
						ComponentState.setState('insertAbbr', 'show', false);
						ComponentState.setState('formatAbbrButton', 'state', true);
						Scopes.setScope('abbr');
						me.abbrField.setTargetObject(foundMarkup, 'title');
		        	} else {
		        		// no abbr found
						ComponentState.setState('formatAbbrButton', 'state', false);
						me.abbrField.setTargetObject(null);
		        	}
		        }
		    });
		},

		/**
		 * Check whether inside a abbr tag
		 * @param {GENTICS.Utils.RangeObject} range range where to insert the object (at start or end)
		 * @return markup
		 * @hide
		 */
		findAbbrMarkup: function ( range ) {
			if ( typeof range == 'undefined' ) {
		        var range = Aloha.Selection.getRangeObject();
		    }
			
			if ( Aloha.activeEditable ) {
			    return range.findMarkup( function() {
			        return this.nodeName.toLowerCase() == 'abbr';
			    }, Aloha.activeEditable.obj );
			} else {
				return null;
			}
		},

		/**
		 * Format the current selection or if collapsed the current word as abbr.
		 * If inside a abbr tag the abbr is removed.
		 */
		formatAbbr: function () {
			var range = Aloha.Selection.getRangeObject();

		    if ( Aloha.activeEditable ) {
		        if ( this.findAbbrMarkup( range ) ) {
		            this.removeAbbr();
		        } else {
		            this.insertAbbr();
		        }
		    }
		},

		/**
		 * Insert a new abbr at the current selection. When the selection is collapsed,
		 * the abbr will have a default abbr text, otherwise the selected text will be
		 * the abbr text.
		 */
		insertAbbr: function ( extendToWord ) {
		    // current selection or cursor position
		    var range = Aloha.Selection.getRangeObject();

		    // do not insert a abbr in a abbr
		    if ( this.findAbbrMarkup( range ) ) {
		        return;
		    }

		    // if selection is collapsed then extend to the word.
		    if ( range.isCollapsed() && extendToWord != false ) {
		        GENTICS.Utils.Dom.extendToWord( range );
		    }
			
		    if ( range.isCollapsed() ) {
		        // insert a abbr with text here
		        var abbrText = i18n.t( 'newabbr.defaulttext' );
		        var newAbbr = jQuery( '<abbr title="">' + abbrText + '</abbr>' );
		        GENTICS.Utils.Dom.insertIntoDOM( newAbbr, range, jQuery( Aloha.activeEditable.obj ) );
		        range.startContainer = range.endContainer = newAbbr.contents().get( 0 );
		        range.startOffset = 0;
		        range.endOffset = abbrText.length;
		    } else {
		        var newAbbr = jQuery( '<abbr title=""></abbr>' );
		        GENTICS.Utils.Dom.addMarkup( range, newAbbr, false );
		    }
			
		    range.select();

		    Scopes.activateTabOfButton('abbrText');
		    this.abbrField.focus();
		},

		/**
		 * Remove an a tag.
		 */
		removeAbbr: function () {
		    var range = Aloha.Selection.getRangeObject();
		    var foundMarkup = this.findAbbrMarkup();
		    if ( foundMarkup ) {
		        // remove the abbr
		        GENTICS.Utils.Dom.removeFromDOM( foundMarkup, range, true );
		        // select the (possibly modified) range
		        range.select();
		    }
		},

		/**
		 * Make the given jQuery object (representing an editable) clean for saving
		 * Find all abbrs and remove editing objects
		 * @param obj jQuery object to make clean
		 * @return void
		 */
		makeClean: function ( obj ) {
			// nothing to do...
		},

		/**
		* toString method
		* @return string
		*/
		toString: function () {
			return 'abbr';
		}

	} );
	
} );
