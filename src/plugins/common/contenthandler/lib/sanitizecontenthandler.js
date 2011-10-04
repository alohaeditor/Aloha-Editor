/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
define(
[ 'aloha/core', 'aloha/jquery', 'aloha/contenthandlermanager', 'aloha/console',
'util/sanitize',
'contenthandler/config/sanitize-restricted',
'contenthandler/config/sanitize-basic',
'contenthandler/config/sanitize-relaxed'
 ],
function( Aloha, jQuery, ContentHandlerManager, console ) {
	"use strict";
	
	var 
		sanitize;
	
	// needed sanitize configuration
	/*Aloha.defaults.supports = jQuery.merge(Aloha.defaults.supports, {
			elements: [ 'br', 'div', 'p'
						, 'b', 'strong', 'span', 'em', 'i' ]
	});*/

	function initSanitize () {
		var 
			filter = [ 'restricted', 'basic', 'relaxed' ],
			config = Aloha.defaults.supports;

		if ( Aloha.settings.sanitize && jQuery.inArray(Aloha.settings.sanitize, filter) > -1 ) {
			config = eval('Aloha.defaults.sanitize.' + Aloha.settings.sanitize);
		} else {
			// use relaxed filter by default
			config = Aloha.defaults.sanitize.relaxed;
		}

		if ( Aloha.settings.allows ) {
			config = Aloha.settings.allows;
		}

		sanitize = new Sanitize( config );
	}

	var SanitizeContentHandler = ContentHandlerManager.createHandler({
		/**
		 * Handle the content from eg. paste action and sanitize the html
		 * @param pasteDiv
		 */
		handleContent: function( pasteDiv )  {
			if ( typeof sanitize === 'undefined' ) {
			   initSanitize();
			}

			var sc = sanitize.clean_node(pasteDiv.get(0));
			pasteDiv.html( sc );

		},
		
	});
	
	return SanitizeContentHandler;
});