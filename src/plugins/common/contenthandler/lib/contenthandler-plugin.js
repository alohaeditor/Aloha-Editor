/*global define: true */

/*!
* Aloha Editor
* Author & Copyright (c) 2010-2012 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

/**
 * @name contenthandler
 */
define([
	'jquery',
	'aloha/plugin',
	'aloha/contenthandlermanager',
	'contenthandler/wordcontenthandler',
	'contenthandler/genericcontenthandler',
	'contenthandler/sanitizecontenthandler',
	'contenthandler/blockelementcontenthandler'
], function (
	$,
	Plugin,
	ContentHandlerManager,
	WordContentHandler,
	GenericContentHandler,
	SanitizeContentHandler,
	BlockelementContentHandler
) {
	'use strict';

	/**
	 * The default content handlers which will always be loaded with Aloha
	 * when the contenthandler plugin is initialized.
	 *
	 * @object<string, ContentHandler>
	 * @const
	 */
	var DEFAULT_HANDLERS = {
		word: WordContentHandler,
		generic: GenericContentHandler,
		sanitize: SanitizeContentHandler,
		blockelement: BlockelementContentHandler
	};

	var ContentHandler = Plugin.create('contenthandler', {

		/**
		 * Will simply register the default content handlers.
		 *
		 * @override
		 */
		init: function () {
			var handler;
			for (handler in DEFAULT_HANDLERS) {
				if (DEFAULT_HANDLERS.hasOwnProperty(handler)) {
					ContentHandlerManager.register(handler,
							DEFAULT_HANDLERS[handler]);
				}
			}
		}
	});

	return ContentHandler;
});
