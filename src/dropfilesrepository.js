/*
 * Repository
 * Copyright (c) 2010 Nicolas Karageuzian - http://nka.me
 */

(function(window, undefined) {
	var
		jQuery = window.alohaQuery, $ = jQuery,
		GENTICS = window.GENTICS,
		Aloha = window.Aloha,
		/**
		 * Type description for UploadFolder
		 */

		UploadFolder = Aloha.Repository.Folder.extend({
			_constructor: function (properties) {
				this._super(properties);
			},
			getDataObject: function(record) {
				repo = Aloha.RepositoryManager.getRepository(record.data.repositoryId);
				d = repo.objects.filter(function(e, i, a) {
					if (e.id == record.data.id && e.file) return true;
					return false;
				});
				if (d.length > 0 ) {
					return d[0];
				}
				return null;
			}
		}),

		/**
		 * The file class
		 */
		UploadFile = Aloha.Repository.Document.extend({
			_constructor: function(properties) {
				var xhr = this.xhr,
				that = this;
				this._super(properties);
				xhr.upload['onprogress'] = function(rpe) {
					that.loaded = rpe.loaded;
					that.total = rpe.total;
					that.ulProgress = rpe.loaded / rpe.total;
					Aloha.trigger('aloha-upload-progress',that);
					xhr.onload = function(load) {
						try {
							that.src = that.upload_config.callback(xhr.responseText);
							Aloha.trigger('aloha-upload-success',that);
						} catch(e) {
							Aloha.trigger('aloha-upload-failure', that);
						}
//						if (that.delegateUploadEvent(xhr.responseText)) {
//
//						} else {
					};
					xhr.onabort = function() {
						Aloha.trigger('aloha-upload-abort', that);
					};
					xhr.onerror = function(e) {
						Aloha.trigger('aloha-upload-error', that);
					};
				}
			},
			xhr: new XMLHttpRequest(),
			contentTypeHeader: 'text/plain; charset=x-user-defined-binary',
			/**
			 * Process upload of a file
			 */
			startUpload: function() {
				//if ()
				var xhr = this.xhr, options = this.upload_config;

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
//			/**
//			 * Method to override to handle backend response
//			 */
//			delegateUploadEvent: function(responseString,fileItem) {
//				try{
//					result = jQuery.parseJSON(responseString);
//					return result.success;
////					if (result.success)
////						return result.data;
//				}catch(e){
//					return false;
//				}
//			}
		});
	Aloha.Repositories = Aloha.Repositories||[];
	/**
	 * Repository for uploaded files
	 */
	Aloha.Repositories.Uploader = new (Aloha.Repository.extend({
		_constructor: function(repositoryId, repositoryName) {
			this._super(repositoryId, repositoryName);
			uploadFolder = new UploadFolder({
				id: "Uploads",
				name: "Uploads",
				displayName:"Uploads",
				parentId:"/",
				path:"Uploads",
				objectType:'folder',
				type:'folder',
				repositoryId:"draganddropfilesrepository"
			});

			this.objects = [uploadFolder];
			var that = this;
			// upload queue FIFO
			this.uploadQueue = {
					queue: [], // items queued
					push: function(obj) { // add an item
						this.queue.push(obj);
					},
					pop: function(){ // grabs first item of array and remove it
						var result = this.queue[0];
						this.queue = this.queue.splice(1);
						return result;
					},
					processQueue: function() { // Process file uploads
						var file;
						if (!this.processUpload) { // prevents concurrent runs of processQueue
							this.processUpload = true;
							// recalculate queue lenght after each upload
							while(this.queue.length > 0) {
								file = this.pop();
								file.startUpload();
							}
							this.processUpload = false;
						}
					}
			};

		},
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
			'fieldName': function(){
				return 'filename'
				}
		},
		/**
		 * Repository's Query function
		 */
		query: function( p, callback) {
			Aloha.Log.info(this,"Query Uploader");
			var d = [];
			if (p.inFolderId == "draganddropfilesrepository" && p.queryString == null) {
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
			var parentFolder = p.inFolderId.split("")[0];
			if (parentFolder == "") {
				parentFolder = "/";
			}
			d = this.objects.filter(function(e, i, a) {
				if (e.parentId == parentFolder) return true;
				return false;
			});
//			if (p.inFolderId == "com.gentics.aloha.plugins.DragAndDropFiles") {
//				d = this.objects;
//			}
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

			this.objects.push(new UploadFile({
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
				repositoryId:"draganddropfilesrepository"}));
//			try {
//				var repoNode = this.browser.tree.getNodeById("com.gentics.aloha.plugins.DragAndDropFiles");
//				repoNode.expand();
//				//this.browser.tree.getNodeById("Uploads").select();
//			} catch(error) {}
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
				this.uploadQueue.processQueue();
			} else {
				Aloha.Log.error(this,"No file with that id");
			}
		}
	}))('draganddropfilesrepository','Dropped Files');




})(window,document);
