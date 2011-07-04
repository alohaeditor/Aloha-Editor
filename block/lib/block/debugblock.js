/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define(['block/block/abstractblock'],
function(AbstractBlock) {
	"use strict";

	var DebugBlock = AbstractBlock.extend({
		title: 'Debugging',
		render: function() {
			this.element.css({display: 'block'});
			var renderedAttributes = '<table class="debug-block">';
			$.each(this.attr(), function(k, v) {
				renderedAttributes += '<tr><th>' + k + '</th><td>' + v + '</td></tr>';
			});
			
			renderedAttributes += '</table>';

			return renderedAttributes;
		}
	});

	return DebugBlock;
});