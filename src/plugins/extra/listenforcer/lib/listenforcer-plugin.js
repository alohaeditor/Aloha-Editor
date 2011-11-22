/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
define(
['aloha/plugin', 'aloha/floatingmenu', 'aloha/jquery'],
function(Plugin, FloatingMenu, jQuery, i18n, i18nCore) {
	"use strict";

	var $ = jQuery,
		GENTICS = window.GENTICS,
		Aloha = window.Aloha;

     return Plugin.create('listenforcer', {
		_constructor: function(){
			this._super('listenforcer');
		},
		
		config: ['false'],
		/**
		 * Configure the available languages
		 */
		languages: ['en', 'de'],

		/**
		 * Initialize the plugin
		 */
		init: function () {
			var that = this;
	
			// mark active Editable with a css class
			Aloha.bind("aloha-editable-activated", function(jEvent, params) { 
				that.onEditableActivated(params.editable.obj); 
			});
			Aloha.bind("aloha-editable-deactivated", function(jEvent, params) {
				that.onEditableDeactivated(params.editable.obj); 
			});
		},
		
		/**
		 * @param {jQuery} editable
		 */
		onEditableActivated: function ( editable ) {
			this.check(	editable, '<ul><li><br class="GENTICS_temporary"/></li></ul>');	
		},

		/**
		 * @param {jQuery} editable
		 */
		onEditableDeactivated: function ( editable ) {
			this.check(	editable, '');	
		},

		/**
		 * This method ensures that there is exactly one top-level list in the editable. 
		 * If there are no lists, one will be added, using the placeHolderListString. 
		 * If there are more than one, list they will be merged into the first list.
		 *  
		 * @param {jQuery} editable
		 * @param {String} placeHolderListString 
		 */
		check: function ( editable, placeHolderListString ) {
			var config = this.getEditableConfig( editable );
			
			if(jQuery.inArray( 'true', config ) == -1 ) {
				// Return if the plugin should do nothing in this editable
				return;
			}

			// Remove all temporary br's which we inserted when we activated the editable. 
			// Breaks are needed to make the list appear in ie. 
			jQuery(editable).find('.GENTICS_temporary').remove();
			
			//check for the presence of at least one list
			var foundlist = false;
			var checkBRRegex = /<br( [^\/]*?)?\/?>/i;
			
			jQuery(editable).find('li').each(function(){
				var text = jQuery(this).text();
				var html = jQuery(this).html();
				
				// FIXME why is this check needed?
				if ( jQuery.trim( text ) != '' || ( html != '' && !checkBRRegex.test( html ) ) ) {
					foundlist = true;
					return false;
				}
			});
		    			
			// We found no list so we add our empty dummy list that we can work with.
			if ( !foundlist ) {
				jQuery(editable).html( placeHolderListString );
			}
			
			// If the editable contains more than one list, we concatinate the
			// elements of all subsequent sibling lists into the first, before
			// removing that list. We in effect are merging all top-level lists
			// into one.
			var $lists = jQuery( editable ).find( '>ul' );
			if ( $lists.length > 1 ) {
				var $firstList = jQuery( $lists[ 0 ] );
				for ( var i = 1; i < $lists.length; i++ ) {
					$firstList.append( jQuery( $lists[ i ] ).find( '>li' ) );
					jQuery( $lists[ i ] ).remove();
				}
			}
		}
	});
});