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

jQuery.extend(true,GENTICS.Aloha.Repositories.Uploader,{
	config: {
		// can add more elements for Ext window styling 
		'method':'POST',
		'url': "",
		'file_name_param':"filename",
		'file_name_header':'X-File-Name',
		'extra_headers':{}, //Extra parameters
		'extra_post_data': {}, //Extra parameters
		'send_multipart_form': false, //true for html4 TODO: make browser check
		//'additional_params': {"location":""},
		'www_encoded': false,
		'fieldName': function(){return 'filename'}},
	init: function() {
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

		this.objects = [this.uploadFolder];
		var that = this;
		// upload queue FIFO
		this.uploadQueue = {
				queue: [], // items queued
				push: function(obj) { // add an item
					this.queue.push(obj);
				},
				pop: function(){ // grabs first item of array and remove it
					return this.queue[0];
					this.queue = this.queue.splice(1);
				},
				processQueue: function() { // Process file uploads
					if (!this.processUpload) { // prevents concurrent runs of processQueue
						this.processUpload = true;
						// recalculate queue lenght after each upload
						while(this.queue.length > 0) {
							this.pop().uploadFile();
						}
						this.processUpload = false;
					}
				}
		};
	},
	/**
	 * Repository's Query function
	 */
	query: function( p, callback) {
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
	},
	getChildren: function( p, callback) {
		d = [];
		var parentFolder = p.inFolderId.split("com.gentics.aloha.plugins.DragAndDropFiles")[0];
		if (parentFolder == "") {
			parentFolder = "/";
		}
		d = this.objects.filter(function(e, i, a) {
			if (e.parentId == parentFolder) return true;
			return false;
		});
//		if (p.inFolderId == "com.gentics.aloha.plugins.DragAndDropFiles") {
//			d = this.objects;
//		}
		callback.call( this, d);
	},
	addFileUpload: function(file) {
		var type='';
		//this.browser.show();

		var d = this.objects.filter(function(e, i, a) {
			if (e.name == file.name) return true;
			return false;
		});
		if (d.length > 0 ) {
			return d[0];
		}
		var len = this.objects.length,
			id = 'ALOHA_idx_file' + len,
			merge_conf = {};
		jQuery.extend(true,merge_conf, this.config);
		
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
//		try {
//			var repoNode = this.browser.tree.getNodeById("com.gentics.aloha.plugins.DragAndDropFiles");
//			repoNode.expand();
//			//this.browser.tree.getNodeById("Uploads").select();
//		} catch(error) {}
		return this.objects[len];
	},
	startFileUpload: function(id,upload_config) {
		var type='',
			d = this.objects.filter(function(e, i, a) {
			if (e.id == id) {return true;}
			return false;
		});
		if (d.length > 0 ) {
			jQuery.extend(true,upload_config,this.upload_conf);
			d[0].upload_config = upload_config;
			this.uploadQueue.push(d[0]);
			
		} else {
			GENTICS.Aloha.Log.error(this,"No file with that id");
		}
	}
});

/**
 * The file class
 */
GENTICS.Aloha.Repositories.Uploader.File = function (data) {
	jQuery.extend(true,this,data);
	//GENTICS.Aloha.Repositories.Uploader.File.superclass.constructor.call(this,data);
};
jQuery.extend(true,GENTICS.Aloha.Repositories.Uploader.File.prototype,GENTICS.Aloha.Repository.Document.prototype);

jQuery.extend(true,GENTICS.Aloha.Repositories.Uploader.File.prototype, {
	xhr: new XMLHttpRequest(),
	contentTypeHeader: 'text/plain; charset=x-user-defined-binary',
	init: function() {
		var xhr = this.xhr,
			that = this;
		xhr.upload['onprogress'] = function(rpe) {
			that.loaded = rpe.loaded;
			that.total = rpe.total;
			that.ulProgress = rpe.loaded / rpe.total;
			GENTICS.Aloha.EventRegistry.trigger(
        			new GENTICS.Aloha.Event('Uploadprogress', GENTICS.Aloha,that));
		};
		xhr.onload = function(load) {
			if (this.delegateUploadEvent(xhr.responseText)) {
				GENTICS.Aloha.EventRegistry.trigger(
	        			new GENTICS.Aloha.Event('UploadSuccess', GENTICS.Aloha,that));
			} else {
				GENTICS.Aloha.EventRegistry.trigger(
	        			new GENTICS.Aloha.Event('UploadFailure', GENTICS.Aloha,that));
			}
		};
		xhr.onabort = function() {
			GENTICS.Aloha.EventRegistry.trigger(
        			new GENTICS.Aloha.Event('UploadAbort', GENTICS.Aloha,that));
		};
		xhr.onerror = function(e) {
			GENTICS.Aloha.EventRegistry.trigger(
        			new GENTICS.Aloha.Event('UploadError', GENTICS.Aloha,that));
		};
	},
	/**
	 * Process upload of a file
	 */
	uploadFile: function(options) {
		//if ()
		var xhr = this.xhr;
		
		xhr.open(options.method, typeof(options.url) == "function" ? options.url(number) : options.url, true);
		xhr.setRequestHeader("Cache-Control", "no-cache");
		xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		xhr.setRequestHeader(options.file_name_header, this.file.fileName);
		xhr.setRequestHeader("X-File-Size", this.file.fileSize);
//		l
		if (!options.send_multipart_form) {
			xhr.setRequestHeader("Content-Type", this.file.type);
			xhr.setRequestHeader("Accept", "application/json");
			xhr.overrideMimeType(this.file.type);
			xhr.send(this.file);
		} else {
			if (window.FormData) {//Many thanks to scottt.tw
				var f = new FormData();
				f.append(typeof(options.fieldName) == "function" ? options.fieldName() : options.fieldName, this.file);
				xhr.send(f);
			}
			else if (this.file.getAsBinary) {//Thanks to jm.schelcher
				var boundary = (1000000000000+Math.floor(Math.random()*8999999999998)).toString();
				var dashdash = '--';
				var crlf     = '\r\n';

				/* Build RFC2388 string. */
				var builder = '';

				builder += dashdash;
				builder += boundary;
				builder += crlf;

				builder += 'Content-Disposition: form-data; name="'+(typeof(options.fieldName) == "function" ? options.fieldName() : options.fieldName)+'"';
				builder += '; filename="' + this.file.fileName + '"';
				builder += crlf;

				builder += 'Content-Type: application/octet-stream';
				builder += crlf;
				builder += crlf;

				/* Append binary data. */
				builder += this.file.getAsBinary();
				builder += crlf;

				/* Write boundary. */
				builder += dashdash;
				builder += boundary;
				builder += dashdash;
				builder += crlf;

				xhr.setRequestHeader('content-type', 'multipart/form-data; boundary=' + boundary);
				xhr.sendAsBinary(builder);
			}
			else {
				options.onBrowserIncompatible();
			}
		}
		
		
	},
	/**
	 * Method to override to handle backend response
	 */
	delegateUploadEvent: function(responseString,fileItem) {
		try{
			result = jQuery.parseJSON(responseString);
			if (result.success)
				return result.data;
		}catch(e){
			return false;
		}
	}
});



GENTICS.Aloha.Repositories.Uploader.UploadFolder = function (data) {
	//GENTICS.Utils.applyProperties(this,data);
	//GENTICS.Aloha.Repositories.Uploader.UploadFolder.superclass.constructor.call(this,data);
	

};

jQuery.extend(true,GENTICS.Aloha.Repositories.Uploader.UploadFolder.prototype,GENTICS.Aloha.Repository.Document.prototype);

jQuery.extend(true,GENTICS.Aloha.Repositories.Uploader.UploadFolder.prototype, {
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
	}

});