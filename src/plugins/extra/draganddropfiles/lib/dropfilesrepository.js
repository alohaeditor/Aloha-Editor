/* dragndropfiles.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2012 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 * 
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 * 
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
 */
 /*
 * Repository
 * Copyright (c) 2010 Nicolas Karageuzian - http://nka.re
 */
define([	
	'jquery',
	'aloha/repository',
	'aloha/repository',
	'i18n!aloha/nls/i18n'],
function( $, repository, i18nCore ){
	"use strict";
	var jQuery = $,
	    GENTICS = window.GENTICS,
	    Aloha = window.Aloha,
	    Uploader = {
		_constructor: function( repositoryId, repositoryName ) {
			var uploadFolder = new this.UploadFolder({
				id: "Uploads",
				name: "Uploads",
				displayName:"Uploads",
				parentId:"/",
				path:"Uploads",
				objectType:'folder',
				type:'folder',
				repositoryId:repositoryId
			});
			Aloha.Log.info( Aloha, "_constructor : Initializing default uploader" );
			this._super( repositoryId, repositoryName );

			this.uploadFolder = uploadFolder;
			this.objects = [uploadFolder];
			// upload queue FIFO
			this.uploadQueue = {
					
					// items queued
					queue: [], 
					
					// add an item
					push: function( obj ) { 
						this.queue.push( obj );
					},
					
					// grabs first item of array and remove it
					pop: function(){ 
						var result = this.queue[0];
						this.queue = this.queue.splice( 1 );
						return result;
					},
					
					// Process file uploads
					processQueue: function() { 
						var file;
						
						// prevents concurrent runs of processQueue
						if ( !this.processUpload ) { 
							this.processUpload = true;
							
							// recalculate queue lenght after each upload
							while( this.queue.length > 0 ) {
								file = this.pop();
								file.startUpload();
							}
							this.processUpload = false;
						}
					}
			};

		},
		config: {
			'method':'POST',
			'callback': function(resp) { return resp;},
			'url': "",
			'accept': 'application/json',
			'file_name_param':"filename",
			'file_name_header':'X-File-Name',
			
			//Extra parameters
			'extra_headers':{},
			
			//Extra parameters
			'extra_post_data': {}, 
			
			//true for html4 TODO: make browser check
			'send_multipart_form': false, 
			'www_encoded': false,
			'image': {
				'max_width': 800,
				'max_height': 800
			},
			'fieldName': function(){
				return 'filename';
				}
		},
		
		/**
		 * Repository's Query function
		 */
		query: function( p, callback ) {
			Aloha.Log.info( this, "Query Uploader" );
			var d = [];
			if ( p.inFolderId === this.repositoryId && p.queryString == null ) {
				d = this.objects;
			} else {
				d = this.objects.filter( function( e, i, a ) {
					var r = new RegExp( p.queryString, 'i' );
					var ret = false;
					try {
						if ( ( !p.queryString || e.url.match(r) ) &&
								(p.inFolderId == e.parentId) ) {
							ret = true;
						}
					} catch (error) {}
					return ret;
				});
			}
			callback.call( this, d );
		},
		
		/**
		 * Get children of a given node of the tree
		 */
		getChildren: function( p, callback ) {
			var d = [],
				parentFolder = p.inFolderId.split( "" )[0];
			if ( parentFolder === "" ) {
				parentFolder = "/";
			}
			d = this.objects.filter( function( e, i, a ) {
				if ( e.parentId == parentFolder ) return true;
				return false;
			});
			callback.call( this, d );
		},
		
		/**
		 * Triggers an upload
		 * Resizes if it's an image which is too large
		 */
		addFileUpload: function( file, targetid ) {
			var d,
				len = this.objects.length,
				id = 'ALOHA_idx_file' + len,
				merge_conf = {};
			
			// check if given file is already in the repository
			d = this.objects.filter( function( e, i, a ) {
				if ( e.name == file.name ) {
					return true;
				}
				return false;
			});
			// if so, returns this file
			if ( d.length > 0 ) {
				return d[0];
			}
			
			// else process the file
			jQuery.extend( true, merge_conf, this.config );
			
			this.objects.push(new this.UploadFile({
				file:file,
				id: id,
                targetid: targetid,
				name: file.name,
				displayName:file.name,
				parentId:"Uploads",
				path:"Uploads",
				url:"Uploads",
				objectType:'file',
				type:'file',
				ulProgress: 0,
				parent: this.uploadFolder,
				repositoryId:this.repositoryId}));
				
			return this.objects[len];
		},
		
		/** 
		 * Start upload of a given file
		 */
		startFileUpload: function(id,upload_config) {
			var d = this.objects.filter(function(e, i, a) {
				if ( e.id == id ) {
					return true;
					
				}
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
		},
		
		/**
		 * Type for an uploadFolder, extends from aloha repository API folder
		 */
		UploadFolder: Aloha.RepositoryFolder.extend({
			_constructor: function ( properties ) {
				this._super( properties );
			},
			getDataObject: function(record) {
				var repo = Aloha.RepositoryManager.getRepository( record.data.repositoryId ),
					d = repo.objects.filter( function( e, i, a ) {
						if ( e.id === record.data.id && e.file ) return true;
						return false;
					});
				if (d.length > 0 ) {
					return d[0];
				}
				return null;
			}
		}),

		/**
		 * Type for a file, extends from aloha repository API file
		 * Attach an xhr to the file in order to process the upload
		 */
		UploadFile: Aloha.RepositoryDocument.extend({
			_constructor: function(properties) {
				var xhr = this.xhr,
				uploadFile = this;
				uploadFile._super( properties );
				xhr.upload.onprogress = function( rpe ) {
					uploadFile.loaded = rpe.loaded;
					uploadFile.total = rpe.total;
					uploadFile.ulProgress = rpe.loaded / rpe.total;
					Aloha.trigger( 'aloha-upload-progress', uploadFile );
					xhr.onload = function(load) {
						try {
							uploadFile.src = uploadFile.upload_config.callback( xhr.responseText, uploadFile );
							Aloha.trigger( 'aloha-upload-success', uploadFile );
						} catch(e) {
							Aloha.trigger( 'aloha-upload-failure', uploadFile );
						}
					};
					xhr.onabort = function() {
						Aloha.trigger( 'aloha-upload-abort', uploadFile );
					};
					xhr.onerror = function(e) {
						Aloha.trigger( 'aloha-upload-error', uploadFile );
					};
				};
			},
			xhr: new XMLHttpRequest(),
			contentTypeHeader: 'text/plain; charset=x-user-defined-binary',
			/**
			 * Process upload of a file
			 */
			startUpload: function() {
				var data,
					filename = this.file.fileName,
					xhr = this.xhr,
					options = this.upload_config,
					uploadFile = this,
					targetsize = {},
					tempimg = new Image();
				
				if ( typeof filename === "undefined" ) {
					filename = this.file.name;
				}
				if ( this.targetid == null ) {
					this.targetid = "";
				}
				xhr.open( options.method, typeof(options.url) == "function" ? options.url() : options.url, true );
				xhr.setRequestHeader( "Cache-Control", "no-cache" );
				xhr.setRequestHeader( "X-Requested-With", "XMLHttpRequest" );
				xhr.setRequestHeader( options.file_name_header, filename );
				xhr.setRequestHeader( "X-File-Size", this.file.fileSize );
                xhr.setRequestHeader( "X-drop-targetId", this.targetid );
				xhr.setRequestHeader( "Accept", options.accept );
//			l
				if ( !options.send_multipart_form ) {
					xhr.setRequestHeader( "Content-Type", this.file.type + ";base64" );
					xhr.overrideMimeType( this.file.type );
					Aloha.Log.debug( Aloha, "Original Data (length:" + 
						this.file.data.length + ") = " + this.file.data.substring( 0, 30 ) );
					tempimg.onload = function() {
						var canvas = document.createElement('canvas');
						targetsize = {
							height: tempimg.height,
							width: tempimg.width
						};
						if ( tempimg.width > tempimg.height ) {
							if ( tempimg.width > options.image.max_width ) {
								targetsize.width = options.image.max_width;
								targetsize.height = tempimg.height * options.image.max_width / tempimg.width;
							}
						} else {
							if ( tempimg.height > options.image.max_height ) {
								targetsize.height = options.image.max_height;
								targetsize.width = tempimg.width * options.image.max_height / tempimg.height;
							}
						}
						canvas.setAttribute( 'width', targetsize.width );
						canvas.setAttribute( 'height', targetsize.height );
						canvas.getContext( '2d' ).drawImage(
							tempimg,
							0,
							0,
							tempimg.width,
							tempimg.height,
							0,
							0,
							targetsize.width,
							targetsize.height
						);
						data = canvas.toDataURL( uploadFile.file.type );
						Aloha.Log.debug( Aloha , "Sent Data (length:" + data.length + ") = " + data.substring(0,30) );
						xhr.send( data );
					};
					tempimg.src = this.file.data;
				} else {
					//Many thanks to scottt.tw
					if ( window.FormData ) {
						var f = new FormData();
						f.append( typeof( options.fieldName ) == "function" ? options.fieldName() : options.fieldName, this.file );
						xhr.send(f);
					}
					//Thanks to jm.schelcher
					else if ( this.file.getAsBinary ) {
						var boundary = (1000000000000+Math.floor(Math.random()*8999999999998)).toString();
						var dashdash = '--';
						var crlf     = '\r\n';

						/* Build RFC2388 string. */
						var builder = '';

						builder += dashdash;
						builder += boundary;
						builder += crlf;

						builder += 'Content-Disposition: form-data; name="' 
							+ ( typeof( options.fieldName ) == "function" ? options.fieldName() : options.fieldName ) 
							+ '"';
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

						xhr.setRequestHeader( 'content-type', 'multipart/form-data; boundary=' + boundary );
						xhr.sendAsBinary( builder );
					}
					else {
						options.onBrowserIncompatible();
					}
				}


			}
		})
	};
	return repository.extend( Uploader );
});

