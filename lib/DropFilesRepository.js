
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
	this.objects = [new this.UploadFolder({
		id: "Uploads", 
		name: "Uploads", 
		displayName:"Uploads",
		parentId:"/",
		path:"Uploads",
		objectType:'folder',
		type:'folder',
		repositoryId:"com.gentics.aloha.plugins.DragAndDropFiles"
	})];
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
			try {
				if ( (!p.queryString || e.url.match(r)) &&
						(p.inFolderId == e.parentId) ) {
					ret = true;
				}
			} catch (error) {}
			return ret;
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
	var parentFolder = p.inFolderId.split("com.gentics.aloha.plugins.DragAndDropFiles")[0];
	if (parentFolder == "") {
		parentFolder = "/";
	}
	d = this.objects.filter(function(e, i, a) {
		if (e.parentId == parentFolder) return true;
		return false;
	});
//	if (p.inFolderId == "com.gentics.aloha.plugins.DragAndDropFiles") {
//		d = this.objects;
//	}
	callback.call( this, d);
};

/**
 * Add an upload
 */
GENTICS.Aloha.Repositories.Uploader.addFileUpload = function(file) {
	var type='';
	this.objects.push(new this.File({ 
		file:file,
		id: file.name, 
		name: file.name, 
		displayName:file.name,
		parentId:"Uploads",
		path:"Uploads",
		url:"Uploads",
		objectType:'file',
		type:'file',
		repositoryId:"com.gentics.aloha.plugins.DragAndDropFiles"}));
};

GENTICS.Aloha.Repositories.Uploader.startFileUpload = function(id) {
	
};

/**
 * Add a file
 */
GENTICS.Aloha.Repositories.Uploader.addFile = function(path) {
	d = [];
	d = this.objects.filter(function(e, i, a) {
		if (e.id == path) return true;
		return false;
	});
	if (d.length == 0 ) {
		pathSplit = path.split('/');
		len = pathSplit.length;
		for (var idx = 0; idx<len-2; idx++) {
			id = pathSplit.slice(0,idx+1).join('/');
			if (id == "") {
				id = "/";
			}
			d = [];
			d = this.objects.filter(function(e, i, a) {
				if (e.id == id) return true;
				return false;
			});
			if (d.length == 0 ) {
				var parentPath = "/";
				if (idx > 1) {
					parentPath = pathSplit.slice(0,idx).join('/');
				}
				this.objects.push(new GENTICS.Aloha.Repository.Folder({ 
					id: id, 
					name: pathSplit[idx], 
					displayName:pathSplit[idx],
					parentId:parentPath,
					path:parentPath,
					url:id,
					objectType:'folder',
					type:'folder',
					repositoryId:"com.gentics.aloha.plugins.DragAndDropFiles"}));
			}
		}
		this.objects.push(new this.File({ 
			id: path, 
			name: pathSplit[len-1], 
			displayName:pathSplit[len-1],
			parentId:pathSplit.slice(0,len-1).join('/'),
			path:pathSplit.slice(0,len-1).join('/'),
			url:path,
			src:path,
			objectType:'file',
			type:'file',
			repositoryId:"com.gentics.aloha.plugins.DragAndDropFiles"}));
	}
};
/**
 * The file class
 */
GENTICS.Aloha.Repositories.Uploader.File = function (data) {
	//GENTICS.Utils.applyProperties(this,data);
	GENTICS.Aloha.Repositories.Uploader.File.superclass.constructor.call(this,data);
};
Ext.extend(GENTICS.Aloha.Repositories.Uploader.File, GENTICS.Aloha.Repository.Document, {
	upload: function() {
		var that = this;
	},
});



GENTICS.Aloha.Repositories.Uploader.UploadFolder = function (data) {
	//GENTICS.Utils.applyProperties(this,data);
	GENTICS.Aloha.Repositories.Uploader.UploadFolder.superclass.constructor.call(this,data);
	this.colModel = new Ext.grid.ColumnModel([
		{header:'File Name',dataIndex:'name', width:150}
		//,{header:'Size',dataIndex:'attributes', width:60, renderer:Ext.util.Format.fileSize}
		,{header:'&nbsp;', renderer:this.statusIconRenderer}
		//,{header:'Status',dataIndex:'attributes', width:60}
		//,{header:'Progress',dataIndex:'attributes'}//,scope:that, renderer:that.progressBarColumnRenderer}
		
	]);
	
};

Ext.extend(GENTICS.Aloha.Repositories.Uploader.UploadFolder, GENTICS.Aloha.Repository.Folder, {
	statusIconRenderer: function(value, metaData, record, rowIndex, colIndex, store) {
		repo = GENTICS.Aloha.RepositoryManager.getRepository(record.data.repositoryId);
		d = repo.objects.filter(function(e, i, a) {
			if (e.id == record.data.id && e.file) return true;
			return false;
		});
		if (d.length > 0 ) {
			console.log(d[0].file);
		}
		if (data != undefined) {
			console.log(data);
		}
	}
});