/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */
(function(window, undefined) {
	"use strict";
	var
		jQuery = window.alohaQuery, $ = jQuery,
		GENTICS = window.GENTICS,
		Aloha = window.Aloha,
		Class = window.Class;

/**
 * Abstract Sidebar
 */
Aloha.Sidebar = Class.extend({
	/**
	 * Add a panel to this sidebar
	 * @param panel panel to add to this sidebar
	 * @return void
	 */
	add: function(panel) {},

	/**
	 * Render this sidebar
	 * @return HTML Code of the rendered sidebar
	 */
	render: function() {},

	/**
	 * Open the given panel in the sidebar and close all other (not pinned) panels
	 * @param panel panel to open
	 * @return void
	 */
	openPanel: function(panel) {},

	/**
	 * Close the given panel in the sidebar
	 * @param panel panel to close
	 * @return void
	 */
	closePanel: function(panel) {},

	/**
	 * Toggle the "pinned" status of the panel
	 * @param panel panel to pin/unpin
	 * @return void
	 */
	togglePinPanel: function(panel) {}
});

/**
 * Right Sidebar
 */
// Aloha.SidebarRight = function () {};
Aloha.SidebarRight = new Aloha.Sidebar();

/**
 * Left Sidebar
 */
// Aloha.SidebarLeft = function () {};
Aloha.SidebarLeft = new Aloha.Sidebar();


//################### Aloha Sidebar Panels ######################

/**
 * Abstract Sidebar Panel
 */
Aloha.Sidebar.Panel = Class.extend({
	/**
	 * Render this panel
	 * @return HTML Code of the rendered panel
	 */
	render: function() {}
});

})(window);
