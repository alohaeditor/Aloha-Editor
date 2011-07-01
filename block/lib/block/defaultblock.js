/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define(['block/block/abstractblock', 'block/lifecyclemanager'],
function(AbstractBlock, LifecycleManager) {
	"use strict";

	var DefaultBlock = AbstractBlock.extend({
		render: function(attributes) {
			return "Hallo default";
		}
	});
	LifecycleManager.registerBlockType('DefaultBlock', DefaultBlock);

	return DefaultBlock;
});