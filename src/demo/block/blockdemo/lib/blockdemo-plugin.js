/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define([
	'core/plugin',
	'block/blockmanager',
	'blockdemo/productteaserblock',
	'blockdemo/companyblock',
	'blockdemo/editableproductteaserblock',
	'blockdemo/vcardblock',
	'css!blockdemo/css/block.css'
], function(Plugin, BlockManager, ProductTeaserBlock, CompanyBlock, EditableProductTeaserBlock, VCardBlock) {
	"use strict";
	return Plugin.create('blockdemo', {
		init: function() {
			BlockManager.registerBlockType('ProductTeaserBlock', ProductTeaserBlock);
			BlockManager.registerBlockType('CompanyBlock', CompanyBlock);
			BlockManager.registerBlockType('EditableProductTeaserBlock', EditableProductTeaserBlock);
			BlockManager.registerBlockType('VCardBlock', VCardBlock);
		}
	});
});