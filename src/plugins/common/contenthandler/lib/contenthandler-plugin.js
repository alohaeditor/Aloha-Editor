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
define([
	'aloha',
	'aloha/plugin',
	'aloha/jquery',
	'aloha/contenthandlermanager',
	'contenthandler/genericcontenthandler',
	'contenthandler/wordcontenthandler',
	'contenthandler/oembedcontenthandler',
	'contenthandler/sanitizecontenthandler'
], function( Aloha, Plugin, jQuery, ContentHandlerManager, GenericContentHandler, WordContentHandler, OembedContentHandler, SanitizeContentHandler ) {
	"use strict";

	/**
	 * Register the plugin with unique name
	 */
	var ContentHandlerPlugin = Plugin.create( 'contenthandler', {
		settings: {},
		dependencies: [],

		init: function () {
			var that = this,
				contenthandler = [ 'generic', 'word', 'oembed', 'sanitize' ],
				handler,
				enabled,
				handlercc,
				cc,
				i;
			
			if ( jQuery.isArray( Aloha.settings.contenthandler ) ) {
				enabled = Aloha.settings.contenthandler;
			} else {
				enabled = contenthandler;
			}
			
			// Register configured content handler
			for ( i = 0; i < enabled.length; i++ ) {
				handler = enabled[ i ];
				if ( jQuery.inArray( handler, contenthandler ) > -1) {
					cc = handler.charAt(0).toUpperCase() + handler.slice(1);
					handlercc = eval( cc + 'ContentHandler' );
					ContentHandlerManager.register( handler, handlercc );
				}
			}
		},
	});

	return ContentHandlerPlugin;
});