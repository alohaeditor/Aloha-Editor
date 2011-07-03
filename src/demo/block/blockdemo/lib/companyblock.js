/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define([
	'block/block/abstractblock'
], function(AbstractBlock) {
	"use strict";

	var CompanyBlock = AbstractBlock.extend({
		render: function(element) {
			
			// Mapping Stock-Symbol -- Company Name (Fake!)
			if (this.attr('symbol') === 'MSFT') {
				element.html('Microsoft');
			};
			
			var that = this;
			element.mouseover(function() {
				that.element.append('<span class="stock-quote-overlay company-' + that.attr('symbol') + '"></span>');
			});
			element.mouseout(function() {
				that.element.find('.stock-quote-overlay').remove();
			});
		}
	});

	return CompanyBlock;
});