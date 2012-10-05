/* listenforcer-plugin.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2012 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 * 
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 * 
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
 */
/* Aloha List Enforcer
 * -------------------
 * Enforces a one top-level list per editable policy ;-)
 * This plugin will register editables and enforce lists in them. List enforced
 * editables will be permitted to contain, exactly one top-level element which
 * must be a (OL or a UL) list element.
 */
define( [
	'aloha',
	'jquery',
	'aloha/plugin',
	'aloha/console'
], function( Aloha, jQuery, Plugin, console ) {
	'use strict';

	/**
	 * An internal array of all editables inwhich to enforce lists.
	 *
	 * @private
	 */
	var listEnforcedEditables = [];

	/**
	 * Given an editable which has been configured to enforce lists,
	 * ensures that there is exactly one top-level list in the editable.
	 * If there are no lists, one will be added, using the
	 * placeHolderListString. If there is more than one list, they will be
	 * merged into the first list.
	 * If there is any other content in the editable it will be removed.
	 *
	 * @private
	 * @param {jQuery} $editable
	 * @param {String} placeHolderListString
	 */
	function enforce ( $editable, placeHolderListString ) {
		// Check if this editable is configured to enforce lists
		if ( jQuery.inArray( $editable[ 0 ], listEnforcedEditables ) === -1 ) {
			return;
		}

		// Remove all temporary <br>s in the editable, which we may have
		// inserted when we activated this editable and found it empty. These
		// <br>s are needed to make the otherwise empty <li> visible (in IE).
		//
		// Note: We no longer insert  temporary <br>s with the "aloha-end-br"
		// class on them.  But we should leave this removal here to ensure that
		// content that was generated with legacy Aloha Editor is cleaned
		// correctly.
		$editable.find('.aloha-end-br').remove();

		// Check for the presence of at least one non-empty list. We consider
		// a list to be not empty if it has atleast one item whose contents are
		// more than a single (propping) <br> tag.

		var hasList = false;

		$editable.find( 'li' ).each( function(){
			// nb: jQuery text() method returns the text contents of the
			// element without <br>s being rendered.
			if ( jQuery.trim( jQuery( this ).text() ) !== '' ) {
				hasList = true;
				// Stop looking for lists as soon as we find our first
				// non-empty list
				return false;
			}
		} );

		// If we found no non-empty list, then we add our empty dummy list that
		// the user can work with.
		if ( !hasList ) {
			$editable.html( placeHolderListString );
		}

		// Concatinate all top-level lists into the first, before, thereby
		// merging all top-level lists into one.
		var $lists = $editable.find( '>ul,>ol' ),
		    j = $lists.length,
		    i;
		if ( j > 1 ) {
			var $firstList = jQuery( $lists[0] );
			for ( i = 1; i < j; ++i ) {
				$firstList.append( jQuery( $lists[ i ] ).find( '>li' ) );
				jQuery( $lists[ i ] ).remove();
			}
		}

		// Remove all top-level elements which are not lists
		$editable.find( '>*:not(ul,ol)' ).remove();
	};

	return Plugin.create( 'listenforcer', {

		_constructor: function() {
			this._super( 'listenforcer' );
		},

		/**
		 * Initializes the listenforcer plugin:
		 * We read the aloha configuration settings to determine which
		 * editables are to have list enforced in them.
		 * We bind handlers to 3 events (aloha-editable-activated,
		 * aloha-editable-deactivated, and aloha-smart-content-changed) on
		 * which we will process the current active editable and enfore lists
		 * in it.
		 */
		init: function() {
			var that = this,
			    elemsToEnforce = this.settings.editables || [],
				elemToEnforce,
				i,
				j = elemsToEnforce.length;

			// Register all editables that are to enforce lists.
			// The following types of items can be used as jQuery selectors:
			// String, DOMElement, and jQuery
			for ( i = 0; i < j; i++ ) {
				elemToEnforce = elemsToEnforce[ i ];
				if ( typeof elemToEnforce === 'string' ||
						elemToEnforce.nodeName ||
							elemToEnforce instanceof jQuery ) {
					jQuery(elemToEnforce).each(function(){
						that.addEditableToEnforcementList( this );
					});
				} else {
					console.warn(
						'Aloha List Enforcer Plugin',
						'Object "' + elemToEnforce.toString() + '" can not ' +
						'be used as a jQuery selector with which to register' +
						' an editable to be list enforced.'
					);
				}
			}

			Aloha.bind('aloha-editable-activated', function ($event, params) {
				enforce(params.editable.obj,
					'<ul><li><br /></li></ul>');
			});

			Aloha.bind('aloha-editable-deactivated', function ($event, params) {
				enforce(params.editable.obj, '');
			});

			Aloha.bind('aloha-smart-content-changed', function ($event, params) {
				//We only want to do this is if the editable is actually active
			 	if (Aloha.activeEditable && Aloha.activeEditable.isActive === true) {
			 		enforce( params.editable.obj,
			 			'<ul><li><br /></li></ul>');
			 	}
			});
		},

		/**
		 * Registers the given editable to be list-enforced.
		 *
		 * @param {DOMElement} editable
		 */
		addEditableToEnforcementList: function( editable ) {
			if ( editable ) {
				listEnforcedEditables.push( editable );
			}
		}

	} );
} );
