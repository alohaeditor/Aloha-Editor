/*!
*   This file is part of Aloha Editor
*   Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
*   Licensed unter the terms of http://www.aloha-editor.com/license.html
*//*
*	Aloha Editor is free software: you can redistribute it and/or modify
*   it under the terms of the GNU Affero General Public License as published by
*   the Free Software Foundation, either version 3 of the License, or
*   (at your option) any later version.*
*
*   Aloha Editor is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   GNU Affero General Public License for more details.
*
*   You should have received a copy of the GNU Affero General Public License
*   along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
Ext.tree.AlohaTreeLoader = function(config) {
	Ext.apply(this, config);
	Ext.tree.AlohaTreeLoader.superclass.constructor.call(this);
};

Ext.extend( Ext.tree.AlohaTreeLoader, Ext.tree.TreeLoader, {
	paramOrder: ['node', 'id'],
	nodeParameter: 'id',
	directFn : function(node, id, callback) {
		var params = {
				inFolderId: node.id,
				objectTypeFilter: this.objectTypeFilter,
				repositoryId: node.repositoryId
		};
		GENTICS.Aloha.RepositoryManager.getChildren ( params, function( items ) {
 	        var response = {};
 	        response= {
 	            status: true,
 	            scope: this,
 			    argument: {callback: callback, node: node}
 	   		};
 	      	if(typeof callback == "function"){
 	        	callback(items, response);
 	      	}	 	        
    	});
	},
    createNode: function(node) {
		if ( node.name ) {
			node.text = node.name;
		}
		if ( node.hasMoreItems ) {
			node.leaf = !node.hasMoreItems;
		}
		if ( node.objectType ) {
			node.cls = node.objectType;
		}
		if (node.baseType) {
			//basetype 'document' should not contains more items
			if (node.baseType == "document") node.leaf = true;
		}
        result = Ext.tree.TreeLoader.prototype.createNode.call(this, node);
        // attach original repo object to node (TreeNode object loose some of it)
        // will be used in ui-browser to get custom ui components from repository
        result.repoData = node;
        return result;
    },
	objectTypeFilter : null,
	setObjectTypeFilter : function (otFilter) {
		this.objectTypeFilter = otFilter;
	},
	getObjectTypeFilter : function () {
		return this.objectTypeFilter;
	}
});	
