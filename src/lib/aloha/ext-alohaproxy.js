/*!
* This file is part of Aloha Editor Project http://aloha-editor.org
* Copyright © 2010-2011 Gentics Software GmbH, aloha@gentics.com
* Contributors http://aloha-editor.org/contribution.php 
* Licensed unter the terms of http://www.aloha-editor.org/license.html
*//*
* Aloha Editor is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.*
*
* Aloha Editor is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

define(
[ 'aloha/jquery', 'aloha/ext', 'aloha/repositorymanager', 'i18n!aloha/nls/i18n' ],
function ( jQuery, Ext, RepositoryManager ) {
	'use strict';
	
	Ext.data.AlohaProxy = function () {
		// Must define a dummy api with "read" action to satisfy
		// Ext.data.Api#prepare *before* calling super
		var api = {};
		api[ Ext.data.Api.actions.read ] = true;
		Ext.data.AlohaProxy.superclass.constructor.call( this, {
			api: api
		} );
		
		this.params = {
			queryString: null,
			objectTypeFilter: null,
			filter: null,
			inFolderId: null,
			orderBy: null,
			maxItems: null,
			skipCount: null,
			renditionFilter: null,
			repositoryId: null
		};
	};
	
	Ext.extend( Ext.data.AlohaProxy, Ext.data.DataProxy, {
		
		doRequest: function ( action, rs, params, reader, cb, scope, arg ) {
			jQuery.extend( this.params, params );
			
			try {
				var numReposQueried = 0;
				
				RepositoryManager.query( this.params, function ( items ) {
					// Update the combo list (and thereby remove the loading
					// message) only it we have results or if there are no more
					// repositories to query
					++numReposQueried;
					if ( items.results ||
							numReposQueried == RepositoryManager.repositories.length ) {
						cb.call( scope, reader.readRecords( items ), arg, true );
					} else {
						var i18n = Aloha.require( 'i18n!aloha/nls/i18n' );
						if ( i18n && i18n[ 'repository.no_items_found_yet' ] ) {
							jQuery( '.x-combo-list-inner .loading-indicator' )
								.html( i18n[ 'repository.no_items_found_yet' ] );
						}
					}
				} );
			} catch ( e ) {
				this.fireEvent( 'loadexception', this, null, arg, e );
				this.fireEvent( 'exception', this, 'response', action, arg, null, e );
				
				return false;
			}
		},
		
		setObjectTypeFilter: function ( otFilter ) {
			this.params.objectTypeFilter = otFilter;
		},
		
		getObjectTypeFilter: function () {
			return this.params.objectTypeFilter;
		},
		
		setParams: function ( p ) {
			jQuery.extend( this.params, p );
		}
		
	} );
	
} );
