/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
 	
Ext.data.AlohaResourceReader = function(meta, recordType) {
	meta = {};
    Ext.applyIf(meta, {
		idProperty: 'id',
		root: 'items',
		totalProperty: 'results',
		fields: [
			'id',
			'url',
			'name',
			'resourceObjectType',
			'weight',
			'resourceName'
		]
    });
    Ext.data.JsonReader.superclass.constructor.call(this, meta, meta.fields);
};

Ext.extend(Ext.data.AlohaResourceReader, Ext.data.JsonReader, {
	// extend of necessary
});