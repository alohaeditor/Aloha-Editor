/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define(['block/block/abstractblock', 'block/lifecyclemanager'],
function(AbstractBlock, LifecycleManager) {
	"use strict";

	var DebugBlock = AbstractBlock.extend({
		render: function() {
			var renderedAttributes = '<dl class="debug-block">';
			$.each(this.attr(), function(k, v) {
				renderedAttributes += '<dt>' + k + '</dt><dd>' + v + '</dd>'
			});
			
			renderedAttributes += '</dl><div class="clear"></div>';

			this.getElement().html(renderedAttributes);
		}
	});
	LifecycleManager.registerBlockType('DebugBlock', DebugBlock);

	return DebugBlock;
});