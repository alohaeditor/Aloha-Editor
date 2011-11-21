/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
define(
['aloha', 'aloha/jquery', 'aloha/contenthandlermanager'],
function(Aloha, jQuery, ContentHandlerManager) {
	"use strict";

	var
		GENTICS = window.GENTICS;

	/**
	 * Register the generic content handler
	 */
	var FormatlessPasteHandler = ContentHandlerManager.createHandler({
		
		/**
		 * Enable/Disable formatless pasting option 
		 */
		enabled: false,

		/**
		 * Handle the pasting. Remove all unwanted stuff.
		 * @param jqPasteDiv
		 */
		/**
		 * Handle the pasting. Remove all unwanted stuff.
		 * @param content
		 */
		handleContent: function( content ) {
			if ( typeof content === 'string' ){
				content = jQuery( '<div>' + content + '</div>' );
			} else if ( content instanceof jQuery ) {
				content = jQuery( '<div>' ).append(content);
			}
			// If we find an aloha-block inside the pasted content,
			// we do not modify the pasted stuff, as it most probably
			// comes from Aloha and not from other sources, and does
			// not need to be cleaned up.
			if (content.find('.aloha-block').length > 0) {
				return;
			};

			  // remove formattings
			  if(this.enabled)
				this.removeFormatting(content);
				
			return content.html();
		},

		/**
		 * Remove formatting
		 * @param jqPasteDiv
		 */
		removeFormatting: function(jqPasteDiv) {
      //Here we removes the text-level semantic and edit elements (http://dev.w3.org/html5/spec/text-level-semantics.html#usage-summary)
      //Skipped br and spans as there usage is not merely for formatting purposes.
      var formatting_elements = [
        "a",
        "em",
        "strong",
        "small",
        "s",
        "cite",
        "q",
        "dfn",
        "abbr",
        "time",
        "code",
        "var",
        "samp",
        "kbd",
        "sub",
        "sup",
        "i",
        "b",
        "u",
        "mark",
        "ruby",
        "rt",
        "rp",
        "bdi",
        "bdo",
        "ins",
        "del" 
      ];

			// find all formattings we will transform
			jqPasteDiv.find(formatting_elements.join(",")).each(function() {
        jQuery(this).contents().unwrap();
			});
		}
  });

	return FormatlessPasteHandler;
});
