
/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

/**
 * Create the Repositories object. Namespace for Repositories
 * @hide
 */
if ( !GENTICS.Aloha.Repositories ) GENTICS.Aloha.Repositories = {};

/**
 * register the plugin with unique name
 */
GENTICS.Aloha.Repositories.LinkList = new GENTICS.Aloha.Repository('com.gentics.aloha.repositories.LinkList');

/**
 * configure data as array with following format:
 * 
 * [{ id: 1, name: 'Aloha Editor - The HTML5 Editor', url:'http://aloha-editor.com', objectType:'website' }];	

 * @property
 * @cfg
 */
GENTICS.Aloha.Repositories.LinkList.settings.data = [
	{ id: 1, name: 'Aloha Editor - The HTML5 Editor', url:'http://aloha-editor.com', objectType:'website' }
];

/**
 * Internal folder structur.
 * @hide
 */
GENTICS.Aloha.Repositories.LinkList.folder =[];

/**
 * initalize LinkList, parse all links, build folder structure and add 
 * additional properties to the items
 */
GENTICS.Aloha.Repositories.LinkList.init = function() {
	
	// generate folder structure
    for (var i = 0; i < this.settings.data.length; i++) {
    	
    	var u = this.settings.data[i].uri = this.parseUri(this.settings.data[i].url);

    	// add hostname as root folder 
    	this.addFolder('', u.host);
    	var path = '/' + u.host;

    	var pathparts = u.path.split('/');
    	for (j = 0; j < pathparts.length; j++) {
    		if ( 
    			pathparts[j] && 
    			// it's a file because it has an extension.
    			pathparts[j].lastIndexOf('.') < 0
    		) {
	    		this.addFolder(path, pathparts[j]);
	    		path += '/' + pathparts[j];
    		}
    	}
    	this.settings.data[i].parentId = path;
    }
}

GENTICS.Aloha.Repositories.LinkList.addFolder = function (path, name) {
	var p = path + '/' + name;
	if ( name && !this.folder[p] ) {
		this.folder[p] = {
				id: p,
				displayName: (name)?name:p,
				parentId: path,
				objectType: 'host',
				repositoryId: this.repositoryId
		};
	}
}

/**
 * Searches a repository for object items matching query if objectTypeFilter.
 * If none found it returns null.
 */
GENTICS.Aloha.Repositories.LinkList.query = function(queryString, objectTypeFilter, filter, inFolderId, orderBy, maxItems, skipCount, renditionFilter, callback) {
	var d = this.settings.data.filter(function(e, i, a) {
		var r = new RegExp(queryString, 'i'); 
		return (
			jQuery.inArray(e.objectType, objectTypeFilter) > -1 &&
			( e.displayName.match(r) || e.url.match(r) ) 
		);
	});
	callback.call( this, d);
};

/**
 * returns the folder structure as parsed at init.
 */
GENTICS.Aloha.Repositories.LinkList.getChildren = function(objectTypeFilter, filter, inFolderId, inTreeId, orderBy, maxItems, skipCount, renditionFilter, callback) {
	var d = [];
	for ( e in this.folder ) {
		var l = this.folder[e].parentId;
		if ( typeof this.folder[e] != 'function' && ( // extjs prevention
			this.folder[e].parentId == inFolderId || // all subfolders
			(!this.folder[e].parentId && inFolderId == this.repositoryId) // the hostname 
		)) {
			d.push(this.folder[e]);
		}
	}
	callback.call( this, d);
};

//parseUri 1.2.2
//(c) Steven Levithan <stevenlevithan.com>
//MIT License
//http://blog.stevenlevithan.com/archives/parseuri
GENTICS.Aloha.Repositories.LinkList.parseUri = function(str) {
	var	o = {
			strictMode: false,
			key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
			q:   {
				name:   "queryKey",
				parser: /(?:^|&)([^&=]*)=?([^&]*)/g
			},
			parser: {
				strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
				loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
			}
		},
		m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
		uri = {},
		i   = 14;

	while (i--) uri[o.key[i]] = m[i] || "";

	uri[o.q.name] = {};
	uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
		if ($1) uri[o.q.name][$1] = $2;
	});

	return uri;
};
