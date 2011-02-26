/*!
*   This file is part of Aloha Editor
*   Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
*   Licensed unter the terms of http://www.aloha-editor.com/license.html
*//*
*	Aloha Editor is free software: you can redistribute it and/or modify
*   it under the terms of the GNU Affero General Public License as published by
*   the Free Software Foundation, either version 3 of the License, or
*   (at your option) any later version.*
*
*   Aloha Editor is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   GNU Affero General Public License for more details.
*
*   You should have received a copy of the GNU Affero General Public License
*   along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
(function(window, undefined) {
	var
		$ = jQuery = window.alohaQuery,
		GENTICS = window.GENTICS,
		Aloha = GENTICS.Aloha;

/**
 * Abstract Sidebar
 */
GENTICS.Aloha.Sidebar = function () {};

GENTICS.Aloha.Sidebar.prototype = {
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
};

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

})(window);
