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
GENTICS.Aloha.Repositories.Page.query = function( p, callback) {
	var that = this;
	var params = {
		'name' : p.queryString,
		'links' : GENTICS.Aloha.GCN.settings.links
	};
	if (p.maxItems) {
		params['maxresults'] = p.maxItems;
	}
	// TODO handle errors
	GENTICS.Aloha.GCN.performRESTRequest({
		'url' : GENTICS.Aloha.GCN.settings.stag_prefix + GENTICS.Aloha.GCN.restUrl + '/folder/findPages',
		'params' : params,
		'success' : function(data) {
			// TODO let the portal render <plink>s
			jQuery.each(data.pages, function(index, page) {
				page.id = "10007." + page.id;
				page.displayName = page.name;
				page.objectType = "website";
				// TODO make this more efficient (don't make a single call for every url)
				if (page.url && GENTICS.Aloha.GCN.settings.renderBlockContentURL) {
					page.url = GENTICS.Aloha.GCN.renderBlockContent(page.url);
				}
			});
			callback.call(that, data.pages);
		},
		'type' : 'GET'
 	});
};
