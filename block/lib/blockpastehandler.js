/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define(
['paste/abstractpastehandler', 'block/blockmanager'],
function(AbstractPasteHandler, BlockManager) {
	"use strict";

	var BlockPasteHandler = AbstractPasteHandler.extend({
		/**
		 * Handle the pasting. Remove all unwanted stuff.
		 * @param jqPasteDiv
		 */
		handlePaste: function(jqPasteDiv) {
			jqPasteDiv.find('.aloha-block').each(function() {
				var oldBlock = $(this);
				
				var dataAttributes = {};
				$.each(oldBlock.data(), function(k, v) {
					dataAttributes['data-' + k] = v;
				})

				var newBlock = $('<' + this.tagName + '/>')
					.attr($.extend({
							about: oldBlock.attr('about'),
							'class': oldBlock.attr('class')
						}, dataAttributes))
					.removeClass('aloha-block-active');
				
				oldBlock.replaceWith(newBlock);
				BlockManager.blockify(newBlock);
			});
		}
	});
	return BlockPasteHandler;
});
