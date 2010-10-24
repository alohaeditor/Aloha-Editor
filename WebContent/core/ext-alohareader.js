/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
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
			'repositoryId'
		]
    });
    Ext.data.JsonReader.superclass.constructor.call(this, meta, meta.fields);
};

Ext.extend(Ext.data.AlohaObjectReader, Ext.data.JsonReader, {
	// extend of necessary
});