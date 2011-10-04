/*!
 * Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH
 * aloha-sales@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

define(
['aloha/registry'],
function(Registry) {
	"use strict";

	/**
	 * Create an contentHandler from the given definition. Acts as a factory method
	 * for contentHandler.
	 *
	 * @param {Object} definition
	 */
	return new ( Registry.extend({

		createHandler: function( definition ) {
			
			if ( typeof definition.handleContent != 'function' ) {
				throw 'ContentHandler has no function handleContent().';
			}

			var AbstractContentHandler = Class.extend({
				handleContent: function( content ) {
					// Implement in subclass!
				}
			}, definition);
			
			return new AbstractContentHandler();
		}
	}))();
});