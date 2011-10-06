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
				handler, cc, i,
				contentHandler = [ 'generic', 'word', 'oembed', 'sanitize' ];

			// Register configured content handler
			for ( i = 0; i < contentHandler.length; i++ ) {
				handler = contentHandler[ i ];
				cc = handler.charAt(0).toUpperCase() + handler.slice(1);
				ContentHandlerManager.register( handler, eval(cc + 'ContentHandler') );
			}
		},
	});

	return ContentHandlerPlugin;
});