/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define([
	//'core/plugin',
	'block/blockmanager',
	'blockdemo/productteaserblock',
	'blockdemo/companyblock',
	'css!blockdemo/css/block.css'
], function(/*Plugin,*/ BlockManager, ProductTeaserBlock, CompanyBlock) {
	"use strict";
	//return Plugin.create('block', {
		//init: function() {
			BlockManager.registerBlockType('ProductTeaserBlock', ProductTeaserBlock);
			BlockManager.registerBlockType('CompanyBlock', CompanyBlock);
			//Editable.registerCleanHandler(this._mySpeciCleanMethod);
		//}//,
		
		/*destroy: function() {
			BlockManager.unregisterBlockType('ProductTeaserBlock');
			Editable.unregisterCleanHandler(this._mySpeciCleanMethod);
		}*/
	//});
});