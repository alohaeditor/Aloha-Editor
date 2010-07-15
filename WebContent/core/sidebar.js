/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * Abstract Sidebar
 */
GENTICS.Aloha.Sidebar = function () {};

/**
 * Add a panel to this sidebar
 * @param panel panel to add to this sidebar
 * @return void
 */
GENTICS.Aloha.Sidebar.prototype.add = function(panel) {};

/**
 * Render this sidebar
 * @return HTML Code of the rendered sidebar
 */
GENTICS.Aloha.Sidebar.prototype.render = function() {};

/**
 * Open the given panel in the sidebar and close all other (not pinned) panels
 * @param panel panel to open
 * @return void
 */
GENTICS.Aloha.Sidebar.prototype.openPanel = function(panel) {};

/**
 * Close the given panel in the sidebar
 * @param panel panel to close
 * @return void
 */
GENTICS.Aloha.Sidebar.prototype.closePanel = function(panel) {};

/**
 * Toggle the "pinned" status of the panel
 * @param panel panel to pin/unpin
 * @return void
 */
GENTICS.Aloha.Sidebar.prototype.togglePinPanel = function(panel) {};

/**
 * Right Sidebar
 */
// GENTICS.Aloha.SidebarRight = function () {};
GENTICS.Aloha.SidebarRight = new GENTICS.Aloha.Sidebar();

/**
 * Left Sidebar
 */
// GENTICS.Aloha.SidebarLeft = function () {};
GENTICS.Aloha.SidebarLeft = new GENTICS.Aloha.Sidebar();


//################### Aloha Sidebar Panels ######################

/**
 * Abstract Sidebar Panel
 */
GENTICS.Aloha.Sidebar.Panel = function () {};

/**
 * Render this panel
 * @return HTML Code of the rendered panel
 */
GENTICS.Aloha.Sidebar.Panel.prototype.render = function() {};
