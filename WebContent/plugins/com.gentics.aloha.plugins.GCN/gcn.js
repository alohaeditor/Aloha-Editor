
/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

/**
 * Create the Resources object. Namespace for Resources
 * @hide
 */
if ( !GENTICS.Aloha.Resources ) GENTICS.Aloha.Resources = {};

/**
 * register the plugin with unique name
 */
GENTICS.Aloha.Resources.delicious = new GENTICS.Aloha.Resource('com.gentics.aloha.resources.gcn');

/**
 * init Delicious resource
 */
GENTICS.Aloha.Resources.delicious.init = function() {
	var that = this;
	
};

/**
 * Searches a resource for resource items matching query if resourceObjectTypes.
 * If none found it returns null.
 */
GENTICS.Aloha.Resources.delicious.query = function(searchText, resourceObjectTypes, callback) {
	var that = this;
	callback.call( that, []);
};

/**
 * Returns all tags for username in a tree style way
 */
GENTICS.Aloha.Resources.delicious.getNavigation = function(mother, resourceObjectTypes, filter, callback) {
	var that = this;

	var request = {
		url: 'http://dev42.office:99/data.json',
		type: 'POST',
		body: {node:832},
		success: function(data) {
			var items = [];
			// convert data
			for (var i = 0; i < data.length; ++i) {
				items.push({
					id: data[i].id,
					name: data[i].name,
					hasMoreItems: (data[i].subFolders.length > 0),
					url: data[i].publishDir,
					resourceName: that.resourceName,
					resourceObjectType: data[i].cls 
				});
		    }
			callback.call( that, items);
		}
	};
	
	GENTICS.Aloha.GCN.performRESTRequest(request);
};