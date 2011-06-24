/**
 * Create the resource object & check for resource namespace
 * @hide
 */
if ( !GENTICS.Aloha.Repositories ) GENTICS.Aloha.Repositories = {};
GENTICS.Aloha.Repositories.Page = new GENTICS.Aloha.Repository('com.gentics.aloha.GCN.Page', 'Content.Node');

/**
 * Initialize the repository
 */
GENTICS.Aloha.Repositories.Page.init = function () {
	// set a template for rendering objects
	this.setTemplate('<span><b>{name}</b><br/>{path}</span>');
};

/**
 * Searches a resource for resource items matching query if objectTypes.
 * If none found it returns null.
 */
GENTICS.Aloha.Repositories.Page.query = function( p, callback) {
	// check whether a magiclinkconstruct exists. If not, just do nothing, since setting GCN links is not supported
	if (!GENTICS.Aloha.GCN.settings.magiclinkconstruct) {
		callback.call(that);
	}
	var that = this;
	var params = {
		'links' : GENTICS.Aloha.GCN.settings.links
	};
	if (p.queryString) {
		params['query'] = p.queryString;
	}
	if (p.maxItems) {
		params['maxItems'] = p.maxItems;
	}
	if (p.inFolderId) {
		params['folderId'] = p.inFolderId;
		params['recursive'] = false;
	}
		
	var fetchPages = true;
	var fetchFiles = true;
	
	if (p.objectTypeFilter && p.objectTypeFilter.length > 0) {
		if(jQuery.inArray("website", p.objectTypeFilter) == -1) {
			fetchPages = false;
		}
		if(jQuery.inArray("files", p.objectTypeFilter) == -1) {
			fetchFiles = false;
		}
	}
	// TODO handle errors
	if (fetchPages === true && fetchFiles === true) {
		//Fetch both
		GENTICS.Aloha.GCN.performRESTRequest({
			'url' : GENTICS.Aloha.GCN.settings.stag_prefix + GENTICS.Aloha.GCN.restUrl + '/folder/findPages',
			'params' : params,
			'success' : function(data) {
				var collection = [];
				for (var i = 0; i < data.pages.length; ++i) {
					data.pages[i] = that.getDocument(data.pages[i], '10007');
					collection.push(data.pages[i]);
				}
				GENTICS.Aloha.GCN.performRESTRequest({
					'url' : GENTICS.Aloha.GCN.settings.stag_prefix + GENTICS.Aloha.GCN.restUrl + '/folder/findFiles',
					'params' : params,
					'success' : function(data) {
						for (var i = 0; i < data.files.length; ++i) {
							data.files[i] = that.getDocument(data.files[i], '10008');
							collection.push(data.files[i]);
						}
						callback.call(that, collection);
					},
					'error' : function() {
						// when the second REST request has an error, we call the callback for the results of the first call anyway
						callback.call(that, collection);
					},
					'type' : 'GET'
			 	});
			},
			'type' : 'GET'
	 	});
	} else if (fetchPages === true) {
		//Fetch pages
		GENTICS.Aloha.GCN.performRESTRequest({
			'url' : GENTICS.Aloha.GCN.settings.stag_prefix + GENTICS.Aloha.GCN.restUrl + '/folder/findPages',
			'params' : params,
			'success' : function(data) {
				for (var i = 0; i < data.pages.length; ++i) {
					data.pages[i] = that.getDocument(data.pages[i], '10007');
				}
				callback.call(that, data.pages);
			},
			'type' : 'GET'
	 	});
	} else if (fetchFiles === true) {
		//Fetch files
		GENTICS.Aloha.GCN.performRESTRequest({
			'url' : GENTICS.Aloha.GCN.settings.stag_prefix + GENTICS.Aloha.GCN.restUrl + '/folder/findFiles',
			'params' : params,
			'success' : function(data) {
				for (var i = 0; i < data.files.length; ++i) {
					data.files[i] = that.getDocument(data.files[i], '10008');
				}
				callback.call(that, data.files);
			},
			'type' : 'GET'
	 	});
	}
	
};

/**
 * Get the repositoryItem with given id
 * @param itemId {String} id of the repository item to fetch
 * @param callback {function} callback function
 * @return {GENTICS.Aloha.Repository.Object} item with given id
 */
GENTICS.Aloha.Repositories.Page.getObjectById = function (itemId, callback) {
	var that = this;

	if (itemId.match(/^10007./)) {
		itemId = itemId.substr(6);
	}
	GENTICS.Aloha.GCN.performRESTRequest({
		'url' : GENTICS.Aloha.GCN.settings.stag_prefix + GENTICS.Aloha.GCN.restUrl + '/page/load/' + itemId,
		'success' : function(data) {
			if (data.page) {
				callback.call(that, [that.getDocument(data.page)]);
			}
		},
		'type' : 'GET'
	});
};

/**
 * Returns all children of a given motherId.
 *
 * @param {object} params object with properties
 * <div class="mdetail-params"><ul>
 * <li><code> objectTypeFilter</code> : array  (optional) <div class="sub-desc">Object types that will be returned.</div></li>
 * <li><code> filter</code> : array  (optional) <div class="sub-desc">Attributes that will be returned.</div></li>
 * <li><code> inFolderId</code> : boolean  (optional) <div class="sub-desc">This indicates whether or not a candidate object is a child-object of the folder object identified by the given inFolderId (objectId).</div></li>
 * <li><code> orderBy</code> : array  (optional) <div class="sub-desc">ex. [{lastModificationDate:'DESC', name:'ASC'}]</div></li>
 * <li><code> maxItems</code> : Integer  (optional) <div class="sub-desc">number items to return as result</div></li>
 * <li><code> skipCount</code> : Integer  (optional) <div class="sub-desc">This is tricky in a merged multi repository scenario</div></li>
 * <li><code> renditionFilter</code> : array  (optional) <div class="sub-desc">Instead of termlist an array of kind or mimetype is expected. If null or array.length == 0 all renditions are returned. See http://docs.oasis-open.org/cmis/CMIS/v1.0/cd04/cmis-spec-v1.0.html#_Ref237323310 for renditionFilter</div></li>
 * </ul></div>
 * @param {function} callback this method must be called with all result items
 */
GENTICS.Aloha.Repository.prototype.getChildren = function( params, callback ) {
	var children = [];
	var that = this;

	if (params.inFolderId == this.repositoryId) {
		params.inFolderId = 0;
	}
	GENTICS.Aloha.GCN.performRESTRequest({
		'url' : GENTICS.Aloha.GCN.settings.stag_prefix + GENTICS.Aloha.GCN.restUrl + '/folder/getFolders/' + params.inFolderId,
		'params' : params,
		'success' : function(data) {
			for (var i = 0; i < data.folders.length; ++i) {
				data.folders[i] = that.getFolder(data.folders[i]);
			}
			callback.call(that, data.folders);
		},
		'type' : 'GET'
 	});
};

/**
 * Transform the given data (fetched from the backend) into a repository folder
 * @param {Object} data data of a folder fetched from the backend
 * @return {GENTICS.Aloha.Repository.Object} repository item
 */
GENTICS.Aloha.Repositories.Page.getFolder = function(data) {
	if (!data) {
		return null;
	}

	var fData = {
		'repositoryId' : 'com.gentics.aloha.GCN.Page',
		'type' : 'folder',
		'id' : data.id,
		'name' : data.name
	};
	return new GENTICS.Aloha.Repository.Folder(fData);
};


/**
 * Transform the given data (fetched from the backend) into a repository item
 * @param {Object} data data of a page fetched from the backend
 * @return {GENTICS.Aloha.Repository.Object} repository item
 */
GENTICS.Aloha.Repositories.Page.getDocument = function(data, objecttype) {
	if (!data) {
		return null;
	}

	objecttype = objecttype || 10007;
	// set the id
	data.id = objecttype + "." + data.id;

	// make the path information shorter by replacing path parts in the middle with ...
	var path = data.path;
	var pathLimit = 55;

	if (path && (path.length > pathLimit)) {
		path = path.substr(0, pathLimit/2) + '...' + path.substr(path.length - pathLimit/2);
	}

	data.path = path;

	// TODO make this more efficient (don't make a single call for every url)
	if (data.url && GENTICS.Aloha.GCN.settings.renderBlockContentURL) {
		data.url = GENTICS.Aloha.GCN.renderBlockContent(data.url);
	}
	data.repositoryId = 'com.gentics.aloha.GCN.Page';
	return new GENTICS.Aloha.Repository.Document(data);
};
