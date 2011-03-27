
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
GENTICS.Aloha.Repositories.LinkList = new GENTICS.Aloha.Repository('linklist');

/**
 * configure data as array with following format:
 *
 * [
 * { name: 'Aloha Editor - The HTML5 Editor', url:'http://aloha-editor.com', type:'website' },
 * { name: 'Aloha Logo', url:'http://www.aloha-editor.com/images/aloha-editor-logo.png', type:'image'  }
 * ];
 *
 * @property
 * @cfg
 */
GENTICS.Aloha.Repositories.LinkList.settings.data = [
	{ name: 'Aloha Editor - The HTML5 Editor', url:'http://aloha-editor.com', type:'website' },
	{ name: 'Aloha Logo', url:'http://www.aloha-editor.com/images/aloha-editor-logo.png', type:'image'  }
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

    	var e = this.settings.data[i];
    	e.repositoryId = this.repositoryId;
    	e.id = e.id ? e.id : e.url;
    	var u = e.uri = this.parseUri(e.url);

    	// add hostname as root folder
    	var path = this.addFolder('', u.host);

    	var pathparts = u.path.split('/');
    	for (j = 0; j < pathparts.length; j++) {
    		if (
    			pathparts[j] &&
    			// It's a file because it has an extension.
    			// Could improve this one :)
    			pathparts[j].lastIndexOf('.') < 0
    		) {
	    		path = this.addFolder(path, pathparts[j]);
    		}
    	}
    	e.parentId = path;
    	this.settings.data[i] = new GENTICS.Aloha.Repository.Document(e);
    }

    // repository name
    this.repositoryName = 'Linklist';
};

GENTICS.Aloha.Repositories.LinkList.addFolder = function (path, name) {

	var type = path ? 'folder' : 'hostname';
	var p = path ? path + '/' + name : name;

	if ( name && !this.folder[p] ) {
		this.folder[p] = new GENTICS.Aloha.Repository.Folder({
				id: p,
				name: (name)?name:p,
				parentId: path,
				type: 'host',
				repositoryId: this.repositoryId
		});
	}
	return p;
};

/**
 * Searches a repository for object items matching query if objectTypeFilter.
 * If none found it returns null.
 */
GENTICS.Aloha.Repositories.LinkList.query = function( p, callback) {
	// Not supported; filter, orderBy, maxItems, skipcount, renditionFilter
	//
	var d = this.settings.data.filter(function(e, i, a) {
		var r = new RegExp(p.queryString, 'i');
		var ret = false;
		return (
			( !p.queryString || e.name.match(r) || e.url.match(r) ) &&
			( !p.objectTypeFilter || jQuery.inArray(e.type, p.objectTypeFilter) > -1) &&
			( !p.inFolderId || p.inFolderId == e.parentId )
		);
	});
	callback.call( this, d);
};

/**
 * returns the folder structure as parsed at init.
 */
GENTICS.Aloha.Repositories.LinkList.getChildren = function( p, callback) {
	var d = [];
	for ( e in this.folder ) {
		var l = this.folder[e].parentId;
		if ( typeof this.folder[e] != 'function' && ( // extjs prevention
			this.folder[e].parentId == p.inFolderId || // all subfolders
			(!this.folder[e].parentId && p.inFolderId == this.repositoryId) // the hostname
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

/**
 * Get the repositoryItem with given id
 * @param itemId {String} id of the repository item to fetch
 * @param callback {function} callback function
 * @return {GENTICS.Aloha.Repository.Object} item with given id
 */
GENTICS.Aloha.Repositories.LinkList.getObjectById = function (itemId, callback) {
	var d = [];

	for (var i = 0; i < this.settings.data.length; i++) {
		if (this.settings.data[i].id == itemId) {
			d.push(this.settings.data[i]);
		}
	}

	callback.call(this, d);
	return true;
};
