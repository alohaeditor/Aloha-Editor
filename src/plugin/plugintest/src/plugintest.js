/*
* Aloha Image pluginTest - Test Aloha plugin API
* 
* This is intentionally broken at several points.
* 
* Aloha loading should at least report errors of what is wrong in this plugin, and should end-up with initialization without being affected...
* 
* use only for testing purpose.
* 
* written for test/unit/pluginapi.html
* 
* Copyright (C) 2010-2011 - GENTICS
* Author
* 	Nicolas Karageuzian
*/

(function(window, undefined) {
	"use strict";

	var
		jQuery = window.alohaQuery || window.jQuery, $ = jQuery,
		GENTICS = window.GENTICS,
		Aloha = window.Aloha;
	
	Aloha.InitFailTest = new (Aloha.Plugin.extend({
		_constructor: function(){
			this._super('plugintest');
		},
		
		init: function() {
			throw "such error may happend while plugin's development";
			// it would be nice for the developer to have the error reported (and aloha should continue loading)
		}
	}));
})(window);