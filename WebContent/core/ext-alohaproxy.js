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
        	var rotypes = this.getResourceObjectTypes();
        	GENTICS.Aloha.ResourceManager.query(params.query, rotypes, function( resourceResult ) {
        		var result = reader.readRecords(resourceResult);
 	 	        cb.call(scope, result, arg, true);
        	});
        } catch (e) {
            this.fireEvent("loadexception", this, null, arg, e);
            this.fireEvent('exception', this, 'response', action, arg, null, e);
            return false;
        }
	},
	resourceObjectTypes : null,
	setResourceObjectTypes : function (otypes) {
		this.resourceObjectTypes = otypes;
	},
	getResourceObjectTypes : function () {
		return this.resourceObjectTypes;
	}
});	
