
if ( !GENTICS.Aloha.Repositories ) GENTICS.Aloha.Repositories = {};

/**
 * Repository for uploaded files
 */
GENTICS.Aloha.Repositories.Uploader = new GENTICS.Aloha.Repository('com.gentics.aloha.plugins.DragAndDropFiles');

/**
 * Initialize repository
 */
GENTICS.Aloha.Repositories.Uploader.init = function() {
	this.repositoryName = 'Uploader';
	this.objects = [];
	var that = this;
	GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'UploadSuccess', function(event,data) {
		that.addFile(data.result.data);
		return true;
	});
};

/**
 * Repository's Query function
 */
GENTICS.Aloha.Repositories.Uploader.query = function( p, callback) {
	GENTICS.Aloha.Log.info(this,"Query Uploader");
	console.log(p);
	var d = [];
	if (p.inFolderId == "com.gentics.aloha.plugins.DragAndDropFiles" && p.queryString == null) {
		d = this.objects;
	} else {
		d = this.objects.filter(function(e, i, a) {
			var r = new RegExp(p.queryString, 'i'); 
			var ret = false;
			return ( e.path.match(r) );
			/* (
			( !queryString || e.displayName.match(r) || e.url.match(r) ) && 
			( !objectTypeFilter || jQuery.inArray(e.objectType, objectTypeFilter) > -1) &&
			( !inFolderId || inFolderId == e.parentId ) 
		);*/
		});
	}
	console.log(d);
	callback.call( this, d);
};

/**
 * The get childrens function
 */
GENTICS.Aloha.Repositories.Uploader.getChildren = function( p, callback) {
	console.log(p);
	d = [];
//	if (p.inFolderId =="com.gentics.aloha.plugins.DragAndDropFiles") {
//		d = this.objects;
//	}
	callback.call( this, d);
};

/**
 * Add a file
 */
GENTICS.Aloha.Repositories.Uploader.addFile = function(path) {
	len = this.objects.length;
	this.objects.push(new this.File({ id: len+1, name: path, repositoryId:"com.gentics.aloha.plugins.DragAndDropFiles"}))
};
/**
 * The document class
 */
GENTICS.Aloha.Repositories.Uploader.File = function (data) {
	//GENTICS.Utils.applyProperties(this,data);
	
	GENTICS.Aloha.Repositories.Uploader.File.superclass.constructor.call(this,data);
};

Ext.extend(GENTICS.Aloha.Repositories.Uploader.File, GENTICS.Aloha.Repository.Document, {
	
});
