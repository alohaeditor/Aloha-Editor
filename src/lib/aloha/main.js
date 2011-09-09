/*!
* This file is part of Aloha Editor Project http://aloha-editor.org
* Copyright (c) 2010-2011 Gentics Software GmbH, aloha@gentics.com
* Contributors http://aloha-editor.org/contribution.php 
* Licensed unter the terms of http://www.aloha-editor.org/license.html
*
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

// Ensure GENTICS Namespace
GENTICS = window.GENTICS || {};
GENTICS.Utils = GENTICS.Utils || {};

// Ensure Aloha settings namespace 
Aloha = window.Aloha || {};
Aloha.settings = Aloha.settings || {};

define( 
	'aloha',
	[
		'aloha/jquery',
		'aloha/core',
		'util/json2',
		'vendor/jquery.json-2.2.min',
		'vendor/jquery.store',
		'util/class',
		'util/lang',
		'util/range',
		'util/position',
		'util/dom',
		'aloha/jquery.aloha',
	 	'aloha/ext',
		'aloha/ext-alohaproxy',
		'aloha/ext-alohareader',
		'aloha/ext-alohatreeloader',
		'aloha/ui',
		'aloha/ui-attributefield',
		'aloha/ui-browser',
		'aloha/floatingmenu',
		'aloha/editable',
		'aloha/console',
		'aloha/markup',
		'aloha/message',
		'aloha/plugin',
		'aloha/selection',
		'aloha/sidebar',
		'aloha/repositorymanager',
		'aloha/repository',
		'aloha/repositoryobjects',
		'aloha/rangy-core'
	],
	function( jQuery, Aloha ) {
		
		Aloha.trigger('aloha-core-loaded');

		// jQuery calls the init methode when the dom is ready
		jQuery(Aloha.init);
		
		return Aloha;
		
	}
);
