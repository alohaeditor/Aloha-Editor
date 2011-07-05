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
		title: 'Company',
		
		getSchema: function() {
			return {
				symbol: {
					type: 'string'
				}
			};
		},
		render: function(element) {
			
			// Mapping Stock-Symbol -- Company Name (Fake!)
			switch (this.attr('symbol')) {
				case 'MSFT':
					element.html('Microsoft');
					break;
				case 'AAPL':
					element.html('Apple Inc.');
					break;
				default:
					element.html(this.attr('symbol'));
			}
			
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