/**
 * Create the resource object & check for resource namespace
 * @hide
 */
if ( !GENTICS.Aloha.Repositories ) GENTICS.Aloha.Repositories = {};
GENTICS.Aloha.Repositories.Page = new GENTICS.Aloha.Repository('com.gentics.aloha.GCN.Page');

/**
 * Searches a resource for resource items matching query if objectTypes.
 * If none found it returns null.
 */
GENTICS.Aloha.Repositories.Page.query = function(queryString, objectTypeFilter, filter, inFolderId, orderBy, maxItems, skipCount, renditionFilter, callback) {
	var that = this;
	jQuery.ajax({ type: "POST",
		url: "/Portal.Node/portal?gentics.rs=search.Search&gentics.rsid=jsonsearch&gentics.pb=center",
		dataType : "json",
		data : {
			q : queryString + "*" // always query for page name + wildcard
		},
		success: function(data) {
			callback.call( that, data.pages);
		}
		// TODO handle errors
	});
};