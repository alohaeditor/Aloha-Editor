/*!
* This file is part of Aloha Editor Project http://aloha-editor.org
* Copyright (c) 2010-2011 Gentics Software GmbH, aloha@gentics.com
* Contributors http://aloha-editor.org/contribution.php 
* Licensed unter the terms of http://www.aloha-editor.org/license.html
*//*
* Aloha Editor is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.*
*
* Aloha Editor is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

define(
	[
 		'css!vendor/ext-3.2.1/resources/css/ext-all.css',
 		'css!vendor/ext-3.2.1/resources/css/xtheme-gray.css',
	 	'vendor/ext-3.2.1/ext-all'  // TODO for now, we use ext-all (because it is converted to a proper require module, with dependencies)
/*
	 	'order!vendor/ext-3.2.1/pkgs/ext-foundation-debug',
	 	'order!vendor/ext-3.2.1/pkgs/cmp-foundation-debug',
	 	'order!vendor/ext-3.2.1/pkgs/data-foundation-debug',
	 	'order!vendor/ext-3.2.1/pkgs/data-json-debug',
	 	'order!vendor/ext-3.2.1/pkgs/data-list-views-debug',
	 	'order!vendor/ext-3.2.1/pkgs/ext-dd-debug',
	 	'order!vendor/ext-3.2.1/pkgs/window-debug',
	 	'order!vendor/ext-3.2.1/pkgs/resizable-debug',
	 	'order!vendor/ext-3.2.1/pkgs/pkg-buttons-debug',
	 	'order!vendor/ext-3.2.1/pkgs/pkg-tabs-debug',
	 	'order!vendor/ext-3.2.1/pkgs/pkg-tips-debug',
	 	'order!vendor/ext-3.2.1/pkgs/pkg-tree-debug',
	 	'order!vendor/ext-3.2.1/pkgs/pkg-grid-foundation-debug',
	 	'order!vendor/ext-3.2.1/pkgs/pkg-toolbars-debug',
	 	'order!vendor/ext-3.2.1/pkgs/pkg-menu-debug',
	 	'order!vendor/ext-3.2.1/pkgs/pkg-forms-debug'
*/
	],
	function() {
		"use strict";

		if ( window.alohaExt ) {
			return window.alohaExt;
		}

		// set alohaExt to Ext
		return window.alohaExt = window.Ext;
	}
);
