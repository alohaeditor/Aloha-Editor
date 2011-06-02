// Start Closure
(function(window, undefined) {
	"use strict";
	
	// Prepare
	var
		jQuery = window.alohaQuery, $ = jQuery,
		Ext = window.Ext,
		GENTICS = window.GENTICS,
		Aloha = window.Aloha;


/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */
Ext.data.AlohaObjectReader = function(meta, recordType) {
	meta = {};
    Ext.applyIf(meta, {
		idProperty: 'id',
		root: 'items',
		totalProperty: 'results',
		fields: [
			'id',
			'url',
			'name',
			'type',
			'weight',
			'path',
			'repositoryId'
		]
    });
    Ext.data.JsonReader.superclass.constructor.call(this, meta, meta.fields);
};

Ext.extend(Ext.data.AlohaObjectReader, Ext.data.JsonReader, {
	// extend of necessary
});

})(window);