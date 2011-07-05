/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define([
	'block/block',
	'text!blockdemo/res/vcard.html',
	'blockdemo/vendor/underscore'
], function(block, vcardTemplate) {
	"use strict";

	var CompanyBlock = block.AbstractBlock.extend({
		title: 'Company',

		getSchema: function() {
			return {
				symbol: {
					type: 'string',
					label: 'Stock Quote Name'
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

	var EditableProductTeaserBlock = block.AbstractBlock.extend({

		title: 'product teaser',

		render: function() {
			return '<span class="aloha-editable">' + this.attr('title') + '</span> <strong class="price">(' + this.attr('price') + ')</strong>';
		}
	});

	var ProductTeaserBlock = block.AbstractBlock.extend({
		title: 'product teaser',

		getSchema: function() {
			return {
				'title': {
					type: 'string',
					label: 'Product Title'
				},
				'price': {
					type: 'number',
					label: 'Price'
				}
			}
		},

		render: function() {
			return this.attr('title') + ' <strong class="price">(' + this.attr('price') + ')</strong>';
		}
	});


	// Compile the template through underscore
	var template = _.template(vcardTemplate);

	var VCardBlock = block.AbstractBlock.extend({
		title: 'vCard',

		getSchema: function() {
			return {
				firstname: {
					type: 'string',
					label: 'First Name'
				},
				lastname: {
					type: 'string',
					label: 'Last Name'
				},
				url: {
					type: 'url',
					label: 'URL'
				},
				org: {
					type: 'string',
					label: 'Organization'
				},
				email: {
					type: 'email',
					label: 'E-Mail'
				}
			};
		},

		render: function() {
			return template($.extend(
				{
					url: '',
					org: '',
					email: '',
					firstname: '',
					lastname: ''
				}, this.attr()));
		}
	});

	var CustomHandleBlock = block.DefaultBlock.extend({
		renderToolbar: function() {
			var that = this;
			var deleteHandle = $('<span class="block-draghandle-topright">Delete</span>');
			this.element.prepend(deleteHandle);
			deleteHandle.click(function() {
				that.destroy();
			});
		}
	});

	return {
		CompanyBlock: CompanyBlock,
		EditableProductTeaserBlock: EditableProductTeaserBlock,
		ProductTeaserBlock: ProductTeaserBlock,
		VCardBlock: VCardBlock,
		CustomHandleBlock: CustomHandleBlock
	};
});