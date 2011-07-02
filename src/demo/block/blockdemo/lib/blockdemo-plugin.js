/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define([
	'block/blockmanager',
	'blockdemo/productteaserblock'
], function(BlockManager, ProductTeaserBlock) {
	"use strict";

	BlockManager.registerBlockType('ProductTeaserBlock', ProductTeaserBlock);
});