/*!
 * Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH
 * aloha-sales@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */
 
define(['block/blockmanager', 'core/sidebar'],
function(BlockManager, Sidebar) {
	"use strict";

	return new (Class.extend({
		
		_sidebar: null,

		init: function() {
			var that = this;
			that._initSidebar();
			BlockManager.bind('blockSelectionChange', this._onBlockSelectionChange, this);
		},
		_initSidebar: function() {
			this._sidebar = new Sidebar({
				position: 'right',
				width: 250,
				isOpen: false,
				panels: []
			});
		},
		
		/**
		 * @param {Array} selectedBlocks
		 */
		_onBlockSelectionChange: function(selectedBlocks) {
			this._sidebar.addPanel({
				title: 'Foo bar'
			});
		}
	}))();
});