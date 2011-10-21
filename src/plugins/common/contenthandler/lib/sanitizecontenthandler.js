/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
define(
[ 'aloha/core', 'aloha/jquery', 'aloha/contenthandlermanager', 'aloha/console', 'vendor/sanitize' ],
function( Aloha, jQuery, ContentHandlerManager, console ) {
	"use strict";
	
	var sanitize;
	
	// needed minimum sanitize configuration for Aloha itselft
	/*Aloha.defaults.supports = jQuery.merge(Aloha.defaults.supports, {
			elements: [ 'br', 'div', 'p', 'span' ]
	});*/
	
	// predefined set of sanitize options if no dynamic or custom config is used
	if( !Aloha.defaults.sanitize ) {
		Aloha.defaults.sanitize = {}
	}

	// very restricted sanitize config
	Aloha.defaults.sanitize.restricted = {
		elements: [ 'b', 'em', 'i', 'strong', 'u', 'p', 'span', 'div', 'br' ]
	}

	// sanitize  config allowing a bit more (no tables)
	Aloha.defaults.sanitize.basic = {
		elements: [
			'a', 'abbr', 'b', 'blockquote', 'br', 'cite', 'code', 'dd', 'dl', 'dt', 'em',
			'i', 'li', 'ol', 'p', 'pre', 'q', 'small', 'strike', 'strong', 'sub',
			'sup', 'u', 'ul' ],

		attributes: {
			'a' : ['href'],
			'blockquote' : ['cite'],
			'q' : ['cite'],
			'abbr': ['title']
		},

		//add_attributes: {
			//  'a': {'rel': 'nofollow'}
		//},

		protocols: {
			'a' : {'href': ['ftp', 'http', 'https', 'mailto', '__relative__']},
			'blockquote' : {'cite': ['http', 'https', '__relative__']},
			'q' : {'cite': ['http', 'https', '__relative__']}
		}
	}

	// relaxed sanitize config allows also tables
	Aloha.defaults.sanitize.relaxed = {
		elements: [
			'a', 'abbr', 'b', 'blockquote', 'br', 'caption', 'cite', 'code', 'col',
			'colgroup', 'dd', 'dl', 'dt', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
			'i', 'img', 'li', 'ol', 'p', 'pre', 'q', 'small', 'strike', 'strong',
			'sub', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'u',
			'ul', 'span', 'hr', 'object'
		],

		attributes: {
			'a': ['href', 'title'],
			'abbr': ['title'],
			'blockquote': ['cite'],
			'br': ['class'],
			'col': ['span', 'width'],
			'colgroup': ['span', 'width'],
			'img': ['align', 'alt', 'height', 'src', 'title', 'width'],
			'ol': ['start', 'type'],
			'q': ['cite'],
			'table': ['summary', 'width'],
			'td': ['abbr', 'axis', 'colspan', 'rowspan', 'width'],
			'th': ['abbr', 'axis', 'colspan', 'rowspan', 'scope', 'width'],
			'ul': ['type']
		},

		protocols: {
			'a': {'href': ['ftp', 'http', 'https', 'mailto', '__relative__']},
			'blockquote': {'cite': ['http', 'https', '__relative__']},
			'img': {'src' : ['http', 'https', '__relative__']},
			'q': {'cite': ['http', 'https', '__relative__']}
		}
	}

	function initSanitize () {
		var 
			filter = [ 'restricted', 'basic', 'relaxed' ],
			config = Aloha.defaults.supports; // @TODO: needs to be implemented into all plugins
		
		// @TODO think about Aloha.settings.contentHandler.sanitize name/options
		if ( Aloha.settings.contentHandler.sanitize && jQuery.inArray(Aloha.settings.contentHandler.sanitize, filter) > -1 ) {
			config = eval('Aloha.defaults.sanitize.' + Aloha.settings.contentHandler.sanitize);
		} else {
			// use relaxed filter by default
			config = Aloha.defaults.sanitize.relaxed;
		}
		
		// @TODO move to Aloha.settings.contentHandler.sanitize.allows ?
		if ( Aloha.settings.contentHandler.allows ) {
			config = Aloha.settings.contentHandler.allows;
		}

		sanitize = new Sanitize( config );
	}

	var SanitizeContentHandler = ContentHandlerManager.createHandler({
		/**
		 * Handle the content from eg. paste action and sanitize the html
		 * @param content
		 */
		handleContent: function( content )  {
			if ( typeof sanitize === 'undefined' ) {
			   initSanitize();
			}

			if ( typeof content === 'string' ){
				content = jQuery( '<div>' + content + '</div>' ).get(0);
			} else if ( content instanceof jQuery ) {
				content = jQuery( '<div>' ).append(content).get(0);
			}

			return jQuery('<div>').append(sanitize.clean_node(content)).html();
		}
	});
	
	return SanitizeContentHandler;
});