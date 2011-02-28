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
	},
	upload_conf: {
		// can add more elements for Ext window styling 
		'method':'POST',
		'url': "",
		'file_name_param':"filename",
		'file_name_header':'X-File-Name',
		'extra_headers':{}, //Extra parameters
		'extra_post_data': {}, //Extra parameters
		'send_multipart_form': false, //true for html4 TODO: make browser check
		//'additional_params': {"location":""},
		'www_encoded': false },
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
		var len = this.objects.length;
		var id = 'ALOHA_idx_file' + len;
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
	},
	startFileUpload: function(id,upload_config) {
		var type='',
			d = this.objects.filter(function(e, i, a) {
			if (e.id == id) {return true;}
			return false;
		});
		if (d.length > 0 ) {
			jQuery.extend(true,upload_config,this.upload_conf);
			d[0].uploadFile(upload_config);
		} else {
			GENTICS.Aloha.Log.error(this,"No file with that id");
		}
	}
});

/**
 * The file class
 */
GENTICS.Aloha.Repositories.Uploader.File = function (data) {
	//GENTICS.Utils.applyProperties(this,data);
	GENTICS.Aloha.Repositories.Uploader.File.superclass.constructor.call(this,data);
};
jQuery.extend(true,GENTICS.Aloha.Repositories.Uploader.File,GENTICS.Aloha.Repository.Document);

jQuery.extend(true,GENTICS.Aloha.Repositories.Uploader.File, {
	render: function() {
	},
	/**
	 * Alerting window
	 * TODO: i18n
	 */
	fileAlert:function(text){
		
	},
	/**
	 * Process the file upload
	 */
	uploadFile: function(uploadConfig) {
		var that = this;
		
		var extra_headers = {};
		jQuery.extend(true,extra_headers,uploadConfig.extra_headers);
		jQuery.extend(true,extra_headers,
				{'Content-Type':this.file.type});
		//TODO: find or implements the jquery(-ui) replacement object for XHRUpload
		var options = onStart: function(event, total) {
			return true;
		},
		onStartOne: function(event, name, number, total) {
			return true;
		},
		onProgress: function(event, progress, name, number, total) {
		},
		onFinishOne: function(event, response, name, number, total) {
			remote_url = that.delegateUploadEvent(upload.xhr.responseText);
			if (remote_url){
				that.src = remote_url;
				GENTICS.Aloha.EventRegistry.trigger(
	        			new GENTICS.Aloha.Event('UploadSuccess', GENTICS.Aloha,this));
			} else {
				GENTICS.Aloha.EventRegistry.trigger(
	        			new GENTICS.Aloha.Event('UploadFailure', GENTICS.Aloha,this));
			}
			
		},
		onFinish: function(event, total) {
		},
		onError: function(event, name, error) {
		},
		onBrowserIncompatible: function() {
			alert("Sorry, but your browser is incompatible with uploading files using HTML5 (at least, with current preferences.\n Please install the latest version of Firefox, Safari or Chrome");
		},
		autostart: false,
		autoclear: true,
		stopOnFirstError: false,
		sendBoundary: false,
		fieldName: 'user_file[]',//ignore if sendBoundary is false
		method: 'post',

		STATUSES: {
			'STARTED':		'Запуск',
			'PROGRESS':		'Загрузка',
			'LOADED':		'Обработка',
			'FINISHED':		'Завершено'
		},

		setName: function(text) {},
		setStatus: function(text) {},
		setProgress: function(value) {},

		genName: function(file, number, total) {
			return file + "(" + (number+1) + " из " + total + ")";
		},
		genStatus: function(progress, finished) {
			if (finished) {
				return options.STATUSES['FINISHED'];
			}
			if (progress == 0) {
				return options.STATUSES['STARTED'];
			}
			else if (progress == 1) {
				return options.STATUSES['LOADED'];
			}
			else {
				return options.STATUSES['PROGRESS'];
			}
		},
		genProgress: function(loaded, total) {
			return loaded / total;
		}
	},
			,load:function(event){
				
			} // on load
		}; 
		upload.send();
	},
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
	GENTICS.Aloha.Repositories.Uploader.UploadFolder.superclass.constructor.call(this,data);
	

};

jQuery.extend(true,GENTICS.Aloha.Repositories.Uploader.UploadFolder,GENTICS.Aloha.Repository.Document);

jQuery.extend(true,GENTICS.Aloha.Repositories.Uploader.UploadFolder, {
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