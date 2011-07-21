/*!
* This file is part of Aloha Editor Project http://aloha-editor.org
* Copyright © 2010-2011 Gentics Software GmbH, aloha@gentics.com
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

// Ensure Namespace
window.GENTICS = window.GENTICS || {};
window.GENTICS.Utils = window.GENTICS.Utils || {};
window.Aloha = window.Aloha || {};
window.Aloha.settings = window.Aloha.settings || {};
window.Aloha.ui = window.Aloha.ui || {};
window.Aloha_base = window.Aloha_base || false;

define(
	'aloha',
	[
		'aloha/jquery',
		'order!vendor/jquery.json-2.2.min',
		'order!vendor/jquery.store',
		'order!util/base',
		'order!util/lang',
		'order!util/range',
		'order!util/position',
		'order!util/dom',
		'order!aloha/jquery.aloha',
		'aloha/ext',
		'aloha/ext-alohaproxy',
		'aloha/ext-alohareader',
		'aloha/ext-alohatreeloader',
		'order!aloha/core',
		'order!aloha/ui',
		'order!aloha/ui-attributefield',
		'order!aloha/ui-browser',
		'aloha/floatingmenu',
		'order!aloha/editable',
		'order!aloha/log',
		'order!aloha/markup',
		'order!aloha/message',
		'order!aloha/plugin',
		'order!aloha/selection',
		'order!aloha/sidebar',
		'order!aloha/repositorymanager',
		'order!aloha/repository',
		'order!aloha/repositoryobjects',
		'order!aloha/rangy-core'
	],
	function($) {
		$('body')
			.addClass('alohacoreloaded')
			.trigger('alohacoreloaded');
	}
);
