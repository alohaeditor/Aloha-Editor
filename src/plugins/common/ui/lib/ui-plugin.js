/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define([
    'aloha/plugin',
    'css!./vendor/jquery-ui-1.9m6.css',
    'css!./css/ui.css',
    'jquery-plugin!./vendor/jquery-ui-1.9m6',
   	'./ui',
    './button',
    './togglebutton',
    './togglecommandbutton',
    './dropdown',
	'./text',
	'./multiSplit',
	'./toolbar',
	'./components'
], function ( Plugin, Ui ) {
	'use strict';
	return Plugin.create( "ui", {} );
});
