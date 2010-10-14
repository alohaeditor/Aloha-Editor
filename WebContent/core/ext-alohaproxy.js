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
    this.params = {
    		queryString: null,
    		objectTypeFilter: null,
    		filter: null,
    		inFolderId: null,
    		orderBy: null,
    		maxItems: null,
    		skipCount: null,
    		renditionFilter: null,
    		repositoryId: null
    };
};

Ext.extend(Ext.data.AlohaProxy, Ext.data.DataProxy, {
	doRequest : function(action, rs, params, reader, cb, scope, arg) {
		var p = this.params;
		jQuery.extend(p, params);
        try {
        	GENTICS.Aloha.RepositoryManager.query( p, function( items ) {
        		var result = reader.readRecords( items );
 	 	        cb.call(scope, result, arg, true);
        	});
        } catch (e) {
            this.fireEvent("loadexception", this, null, arg, e);
            this.fireEvent('exception', this, 'response', action, arg, null, e);
            return false;
        }
	},
	setObjectTypeFilter : function (otFilter) {
		this.params.objectTypeFilter = otFilter;
	},
	getObjectTypeFilter : function () {
		return this.params.objectTypeFilter;
	},
	setParams : function (p) {
		jQuery.extend(this.params, p);
	}
});	
