/*!
 * Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH
 * aloha-sales@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */
define(
[],
function() {
	"use strict";

	var AbstractPasteHandler = Class.extend({
		/**
		 * Method that handles the pasted content
		 */
		handlePaste: function(jqPasteDiv) {
			// Implement in subclass!
		}
	});
	
	return AbstractPasteHandler;
});