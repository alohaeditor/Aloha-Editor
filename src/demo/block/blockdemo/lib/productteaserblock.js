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

	var ProductTeaserBlock = AbstractBlock.extend({
		title: 'product teaser',
		
		getSchema: function() {
			return {
				'title': {
					type: 'string',
					options: {
						maxLength: 30,
						size: 30
					}
					//editor: '....'
				},
				'price': {
					type: 'decimal',
					options: {
						size: 5
					}
				}
			}
		},

		render: function() {
			return this.attr('title') + ' <strong class="price">(' + this.attr('price') + ')</strong>';
		}
	});

	return ProductTeaserBlock;
});