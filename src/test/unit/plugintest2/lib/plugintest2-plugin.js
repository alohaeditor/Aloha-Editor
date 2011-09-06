/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
define(
['aloha/core', 'aloha/plugin', 'aloha/jquery', 'i18n!plugintest2/nls/i18n' ],
function(Aloha ,Plugin, jQuery, i18n ) {
	"use strict";

     return Plugin.create('plugintest2', {
		_constructor: function(){
			this._super('plugintest2');
		},
		
		/**
		 * Configure the available languages
		 */
		languages: ['en', 'de'],

		
		/**
		 * Initialize the plugin
		 */
		init: function () {
			var that = this;
			//DO NOTHING
		}
		
	});
});