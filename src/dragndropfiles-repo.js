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
	this.uploadFolder = new this.UploadFolder({
		id: "Uploads", 
		name: "Uploads", 
		displayName:"Uploads",
		parentId:"/",
		path:"Uploads",
		objectType:'folder',
		type:'folder',
		repositoryId:"com.gentics.aloha.plugins.DragAndDropFiles"
	});
	this.browser = new GENTICS.Aloha.ui.Browser();
	
	this.objects = [this.uploadFolder];
	var that = this;
};

GENTICS.Aloha.Repositories.Uploader.upload_conf = {
		// can add more elements for Ext window styling 
		'method':'POST',
		'url': "",
		'file_name_param':"filename",
		'file_name_header':'X-File-Name',
		'extra_headers':{}, //Extra parameters
		'extra_post_data': {}, //Extra parameters
		'send_multipart_form': false, //true for html4 TODO: make browser check
		//'additional_params': {"location":""},
		'www_encoded': false };


/**
 * Repository's Query function
 */
GENTICS.Aloha.Repositories.Uploader.query = function( p, callback) {
	GENTICS.Aloha.Log.info(this,"Query Uploader");
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
	callback.call( this, d);
};

/**
 * The get childrens function
 */
GENTICS.Aloha.Repositories.Uploader.getChildren = function( p, callback) {
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
	//this.browser.show();

	var d = this.objects.filter(function(e, i, a) {
		if (e.name == file.name) return true;
		return false;
	});
	if (d.length > 0 ) {
		return d[0];
	}
	var len = this.objects.length;
	var id = 'GENTICS_idx_file' + len;
	this.objects.push(new this.File({ 
		file:file,
		id: id, 
		name: file.name, 
		displayName:file.name,
		parentId:"Uploads",
		path:"Uploads",
		url:"Uploads",
		objectType:'file',
		type:'file',
		ulProgress: 0,
		parent: this.uploadFolder,
		repositoryId:"com.gentics.aloha.plugins.DragAndDropFiles"}));
	try {
		var repoNode = this.browser.tree.getNodeById("com.gentics.aloha.plugins.DragAndDropFiles");
		repoNode.expand();
		this.browser.tree.getNodeById("Uploads").select();
	} catch(error) {}
	return this.objects[len];
};

GENTICS.Aloha.Repositories.Uploader.startFileUpload = function(id,upload_config) {
	var type='';
	var d = this.objects.filter(function(e, i, a) {
		if (e.id == id) {return true;}
		return false;
	});
	if (d.length > 0 ) {
		d[0].uploadFile(Ext.apply(this.upload_conf,upload_config));
	} else {
		GENTICS.Aloha.Log.error(this,"No file with that id");
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
	render: function() {
		try {
			// This refresh the uploader view
			this.parent.viewGrid.store.reload();
		} catch (error) {}
	},
	/**
	 * Alerting window
	 * TODO: i18n
	 */
	fileAlert:function(text){
		if(this.fileAlertMsg === undefined || !this.fileAlertMsg.isVisible()){
			this.fileAlertMsgText = 'Error uploading:<BR>'+text;
			this.fileAlertMsg = Ext.MessageBox.show({
				title:'Upload Error',
				msg: this.fileAlertMsgText,
				buttons: Ext.Msg.OK,
				modal:false,
				icon: Ext.MessageBox.ERROR
			});
		}else{
				this.fileAlertMsgText += text;
				this.fileAlertMsg.updateText(this.fileAlertMsgText);
				this.fileAlertMsg.getDialog().focus();
		}
		
	},
	/**
	 * Process the file upload
	 */
	uploadFile: function(uploadConfig) {
		var that = this;
		
		var extra_headers = Ext.apply(uploadConfig.extra_headers,
				{'Content-Type':this.file.type});
		//TODO: find or implements the jquery(-ui) replacement object for XHRUpload
		var upload = new Ext.ux.XHRUpload({
			// TODO: make this configurable
			method:uploadConfig.method
			,url: uploadConfig.url
			,filePostName:uploadConfig.file_name_param
			,fileNameHeader:uploadConfig.file_name_header
			,extraHeaders:extra_headers
			,extraPostData:uploadConfig.extra_post_data
			,sendMultiPartFormData:uploadConfig.www_encoded
			,file:this.file
			,listeners:{
				scope:this
				,uploadloadstart:function(event){
					that.ulStatus = 'Sending';
					that.render();
					//this.colModel.render();
				}
				,uploadprogress:function(event){
					that.ulProgress = Math.round((event.loaded / event.total)*100);
					that.render();
				}
				// XHR Events
				,loadstart:function(event){
					that.ulStatus = 'Sending';
					that.render();
				}
				,progress:function(event){
					that.ulProgress = Math.round((event.loaded / event.total)*100);
					that.render();
				}
				,abort:function(event){
					//that.updateFile(fileRec, 'status', 'Aborted');
					GENTICS.Aloha.EventRegistry.trigger(
		        			new GENTICS.Aloha.Event('UploadFailure', GENTICS.Aloha,this));
				}
				,error:function(event){
					that.ulStatus = 'Error';
					that.render();
					GENTICS.Aloha.EventRegistry.trigger(
		        			new GENTICS.Aloha.Event('UploadFailure', GENTICS.Aloha,this));
				}
				,load:function(event){
					that.delegateUploadEvent(upload.xhr.responseText, this);
					
				} // on load
			} // listeners
		}); // XHRUpload
		upload.send();
	},
	delegateUploadEvent: function(responseString,fileItem) {
		var that=this,
			result=null;
		try{
			result = jQuery.parseJSON(responseString);// throws
																		// a
																		// SyntaxError.
		}catch(e){
			GENTICS.Aloha.EventRegistry.trigger(
        			new GENTICS.Aloha.Event('UploadFailure', GENTICS.Aloha,this));
			//this.fireEvent('fileupload', this, false, {error:'Invalid JSON returned'});
			return true;
		}
		
		if( result.success ){
			that.ulProgress = 100 ;
			that.ulStatus =  'Done';
			that.render();
			that.src = result.data;
			GENTICS.Aloha.EventRegistry.trigger(
        			new GENTICS.Aloha.Event('UploadSuccess', GENTICS.Aloha,this));
			//this.fireEvent('fileupload', this, true, result);
		}else{
			this.fileAlert('<BR>'+that.file.name+'<BR><b>'+result.error+'</b><BR>');
			that.ulStatus = 'Error';
			that.render();
			GENTICS.Aloha.EventRegistry.trigger(
        			new GENTICS.Aloha.Event('UploadFailure', GENTICS.Aloha,this));
			//this.fireEvent('fileupload', this, false, result);
		}
	}
});



GENTICS.Aloha.Repositories.Uploader.UploadFolder = function (data) {
	//GENTICS.Utils.applyProperties(this,data);
	GENTICS.Aloha.Repositories.Uploader.UploadFolder.superclass.constructor.call(this,data);
	
	this.colModel = new Ext.grid.ColumnModel([
		{header:'File Name',dataIndex:'name', width:150}
		,{header:'Size', width:80, renderer:this.fileSizeRenderer, getDataObject:this.getDataObject, columnTemplate:
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
	/**
	 * Utility method, when in ui-browser, some of the data are lost.
	 * Get the data object from record - this is a helper for in column renderers
	 */
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
	
	
	/**
	 * warn : this scopes column
	 */
	statusRenderer: function(value, metaData, record, rowIndex, colIndex, store) {
		data = this.getDataObject(record);
		if (data != null ) {
			if (!data.ulStatus) {data.ulStatus = 'Pending';}
			return this.columnTemplate.apply({
				value: data.ulStatus
			});
		}
	},
	/**
	 * warn : this scopes column
	 */
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
	/**
	 * warn : this scopes column
	 */
	fileSizeRenderer: function(value, metaData, record, rowIndex, colIndex, store) {
		var data = this.getDataObject(record);
		if (data != null ) {
			return this.columnTemplate.apply({
				value: Ext.util.Format.fileSize(data.file.size)
			});
		}
	},
	/**
	 * warn : this scopes column
	 */
	fileProgressRenderer: function(value, metaData, record, rowIndex, colIndex, store) {
		var data = this.getDataObject(record);
		if (data != null ) {
			metaData.css += ' x-grid3-td-progress-cell';
			return this.columnTemplate.apply({
				value: data.ulProgress
			});
		}
	}
});