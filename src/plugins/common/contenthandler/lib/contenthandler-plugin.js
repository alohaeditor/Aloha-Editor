/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

/**
 * @name contenthandler
 * @namespace Content handler plugin
 */
define( [
	'aloha',
	'aloha/plugin',
	'aloha/jquery',
	'aloha/contenthandlermanager',
	'contenthandler/wordcontenthandler',
	'contenthandler/genericcontenthandler',
	'contenthandler/oembedcontenthandler',
	'contenthandler/sanitizecontenthandler'
], function( Aloha,
			 Plugin,
			 jQuery,
			 ContentHandlerManager,
			 WordContentHandler,
			 GenericContentHandler, 
			 OembedContentHandler,
			 SanitizeContentHandler ) {
	'use strict';

	/**
	 * Register the plugin with unique name
	 */
	var ContentHandlerPlugin = Plugin.create( 'contenthandler', {
		settings : {},
		dependencies : [],
		init : function () {
			var that = this,
				handler, cc,
				contentHandler = [ 'word', 'generic', 'sanitize' ], //  'oembed' deactivated
				i, j = contentHandler.length;

			// Register available content handler
			for ( i = 0; i < j; i++ ) {
				handler = contentHandler[ i ];
				cc = handler.charAt( 0 ).toUpperCase() + handler.slice( 1 );
				ContentHandlerManager
					.register( handler, eval( cc + 'ContentHandler' ) );
			}
			
			Aloha.bind( 'aloha-editable-activated', function( event, params) {
				var config = that.getEditableConfig( params.editable.obj );
				window.console.log('contenthandler config', config);
				
				if ( !jQuery.isEmpty(config) ) {
					window.console.log('ContentHandlerManager.getEntries', ContentHandlerManager.getEntries());
					
					jQuery.each(ContentHandlerManager.getEntries(), function(handler) {
						window.console.log('handler: ', handler);
						if ( jQuery.inArray( handler, config ) < 0 ) {
							window.console.log('unregister handler: ', handler);
							ContentHandlerManager.unregister(handler);
						}
					});
				}
			});
		}
	} );

	return ContentHandlerPlugin;
});