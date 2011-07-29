/*!
* This file is part of Aloha Editor Project http://aloha-editor.org
* Copyright � 2010-2011 Gentics Software GmbH, aloha@gentics.com
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
		'order!aloha/jquery',
	 	'order!vendor/ext-3.2.1/adapter/jquery/ext-jquery-adapter-debug',
	 	'order!vendor/ext-3.2.1/ext-all'
	],
	function(jQuery, _1, _2, undefined) {
		"use strict";

		if ( window.alohaExt ) {
			return window.alohaExt;
		}

		// set alohaExt to Ext
		return window.alohaExt = window.Ext;
	}
);