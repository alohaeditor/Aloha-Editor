/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

Ext.data.AlohaProxy = function( ) {
    // Must define a dummy api with "read" action to satisfy Ext.data.Api#prepare *before* calling super
    var api = {};
    api[Ext.data.Api.actions.read] = true;
    Ext.data.AlohaProxy.superclass.constructor.call(this, {
        api: api
    });
};

Ext.extend(Ext.data.AlohaProxy, Ext.data.DataProxy, {
	doRequest : function(action, rs, params, reader, cb, scope, arg) {
        try {
        	 // GENTICS.Aloha.RepositoryManager.query( objectTypeFilter, filter, inFolderId, orderBy, maxItems, skipCount, renditionFilter, repositoryId, callback)
        	GENTICS.Aloha.RepositoryManager.query(params.query, this.objectTypeFilter, null, null, null, null, null, null, null, function( items ) {
        		var result = reader.readRecords( items );
 	 	        cb.call(scope, result, arg, true);
        	});
        } catch (e) {
            this.fireEvent("loadexception", this, null, arg, e);
            this.fireEvent('exception', this, 'response', action, arg, null, e);
            return false;
        }
	},
	objectTypeFilter : null,
	setObjectTypeFilter : function (otFilter) {
		this.objectTypeFilter = otFilter;
	},
	getObjectTypeFilter : function () {
		return this.objectTypeFilter;
	}
});	
