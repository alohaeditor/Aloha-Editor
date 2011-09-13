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

define( 
	'aloha',
	[
		'aloha/core',
		'util/json2',
		'vendor/jquery.json-2.2.min',
		'vendor/jquery.store',
		'util/class',
		'util/lang',
		'util/range',
		'util/position',
		'util/dom',
		'aloha/jquery.patch',
		'aloha/jquery.aloha',
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
		'aloha/rangy-core',
	 	'aloha/ext',
		'aloha/ext-alohaproxy',
		'aloha/ext-alohareader',
		'aloha/ext-alohatreeloader'
	],
	function( Aloha ) {
		
		// loading css is not a dependency
		Aloha.require(['css!../css/aloha.css']);
		
		// jQuery calls the init method when the dom is ready
		Aloha.jQuery( Aloha.init );
		
		// The Aloha abject is now available but ready after the aloha-ready event
		return Aloha;
		
	}
);
