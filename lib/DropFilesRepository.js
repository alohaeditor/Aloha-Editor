/*
 * Repository
 * Copyright (c) 2010 Nicolas Karageuzian - http://nka.me
 */
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
		for (var idx = 0; idx<len-1; idx++) {
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
		,{header:'Size', width:60, renderer:this.fileSizeRenderer, getDataObject:this.getDataObject, columnTemplate:
			new Ext.XTemplate('<div class="x-grid3-cell-inner x-grid3-col-1" unselectable="on">{value}</div>')}
		
		,{header:'&nbsp;',dataIndex:'attributes',width:40, renderer:this.statusIconRenderer, getDataObject:this.getDataObject, columnTemplate:
			new Ext.XTemplate('<div class="x-grid3-cell-inner x-grid3-col-2" unselectable="on">{value}</div>')}
		
		,{header:'Status',dataIndex:'attributes',width:80, renderer:this.statusRenderer, getDataObject:this.getDataObject, columnTemplate:
			new Ext.XTemplate('<div class="x-grid3-cell-inner x-grid3-col-3" unselectable="on">{value}</div>')}
		
		,{header:'Progress', renderer:this.fileProgressRenderer, getDataObject:this.getDataObject, columnTemplate: new Ext.XTemplate(
			'<div class="GENTICS_uploader-progress-cell-inner GENTICS_uploader-progress-cell-inner-center GENTICS_uploader-progress-cell-foreground">',
				'<div>{value} %</div>',
			'</div>',
			'<div class="GENTICS_uploader-progress-cell-inner GENTICS_uploader-progress-cell-inner-center GENTICS_uploader-progress-cell-background" style="left:{value}%">',
				'<div style="left:-{value}%">{value} %</div>',
			'</div>'
		)}
		
	]);
	
};

Ext.extend(GENTICS.Aloha.Repositories.Uploader.UploadFolder, GENTICS.Aloha.Repository.Folder, {
	getDataObject: function(record) {
		repo = GENTICS.Aloha.RepositoryManager.getRepository(record.data.repositoryId);
		d = repo.objects.filter(function(e, i, a) {
			if (e.id == record.data.id && e.file) return true;
			return false;
		});
		if (d.length > 0 ) {
			return d[0];
		}
		return null;
	},
	statusRenderer: function(value, metaData, record, rowIndex, colIndex, store) {
		data = this.getDataObject(record);
		if (data != null ) {
			if (!data.ulStatus) {data.ulStatus = 'Pending';}
			return this.columnTemplate.apply({
				value: data.ulStatus
			});
		}
	},
	statusIconRenderer: function(value, metaData, record, rowIndex, colIndex, store) {
		data = this.getDataObject(record);
		iconsbase = GENTICS_Aloha_base + '/plugins/com.gentics.aloha.plugins.DragAndDropFiles/resources/images/';
		if (data != null ) {
			if (!data.ulStatus) {data.ulStatus = 'Pending';}
			switch(data.ulStatus){
			default:
				return value;
			case 'Pending':
				return '<div class="GENTICS_uploader_status_icon"><img src="'+iconsbase+'hourglass.png" width=16 height=16></div>';
			case 'Sending':
				return '<div class="GENTICS_uploader_status_icon"><img src="'+iconsbase+'loading.gif" width=16 height=16></div>';
			case 'Aborted':
				return '<div class="GENTICS_uploader_status_icon"><img src="'+iconsbase+'cross.png" width=16 height=16></div>';
			case 'Error':
				return '<div class="GENTICS_uploader_status_icon"><img src="'+iconsbase+'cross.png" width=16 height=16></div>';
			case 'Done':
				return '<div class="GENTICS_uploader_status_icon"><img src="'+iconsbase+'tick.png" width=16 height=16></div>';
			}
		}
	},
	fileSizeRenderer: function(value, metaData, record, rowIndex, colIndex, store) {
		data = this.getDataObject(record);
		if (data != null ) {
			return this.columnTemplate.apply({
				value: Ext.util.Format.fileSize(data.file.size)
			});
		}
	},
	fileProgressRenderer: function(value, metaData, record, rowIndex, colIndex, store) {
		data = this.getDataObject(record);
		if (data != null ) {
			metaData.css += ' x-grid3-td-progress-cell';
			return this.columnTemplate.apply({
				value: 20
			});
		}
	}
});