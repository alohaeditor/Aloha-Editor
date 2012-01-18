/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define([
	'aloha/plugin',
	'block/blockmanager',
	'blockdemo/block',
	'css!blockdemo/css/block.css'
], function(Plugin, BlockManager, block) {
	"use strict";
	return Plugin.create('blockdemo', {
		init: function() {
			BlockManager.registerBlockType('ProductTeaserBlock', block.ProductTeaserBlock);
			BlockManager.registerBlockType('CompanyBlock', block.CompanyBlock);
			BlockManager.registerBlockType('EditableProductTeaserBlock', block.EditableProductTeaserBlock);
			BlockManager.registerBlockType('ImageBlock', block.ImageBlock);
			BlockManager.registerBlockType('EditableImageBlock', block.EditableImageBlock);
			BlockManager.registerBlockType('NewsBlock', block.NewsBlock);
			BlockManager.registerBlockType('SortableNewsBlock', block.SortableNewsBlock);
			BlockManager.registerBlockType('ColumnBlock', block.ColumnBlock);
			BlockManager.registerBlockType('UneditableColumnBlock', block.UneditableColumnBlock);
		}
	});
});