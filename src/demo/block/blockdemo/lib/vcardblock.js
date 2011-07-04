/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define([
	'block/block/abstractblock',
	'text!blockdemo/res/vcard.html',
	'blockdemo/vendor/underscore'
], function(AbstractBlock, vcardTemplate) {
	"use strict";

	// Compile the template through underscore
	var template = _.template(vcardTemplate);

	return AbstractBlock.extend({
		title: 'vCard',
		
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
});