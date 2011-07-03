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
		render: function() {
			return '<span class="aloha-editable">' + this.attr('title') + '</span> <strong class="price">(' + this.attr('price') + ')</strong>';
		}
	});

	return ProductTeaserBlock;
});