/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define(
['paste/abstractpastehandler', 'block/blockmanager'],
function(AbstractPasteHandler, BlockManager) {

	/**
	 * @name block.BlockPasteHandler
	 * @class Special block paste handler
	 *
	 * The blog paste handler handles pasting of blocks in editables. Pasted
	 * block markup will be replaced by a freshly rendered block instance.
	 */
	var BlockPasteHandler = AbstractPasteHandler.extend(
	/** @lends block.BlockPasteHandler */
	{
		/**
		 * Handle the pasting. Remove all unwanted stuff.
		 * @param {jQuery} jqPasteDiv
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
				BlockManager._blockify(newBlock);
			});
		}
	});
	return BlockPasteHandler;
});
