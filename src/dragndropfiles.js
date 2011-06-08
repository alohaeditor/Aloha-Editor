/**
 * Aloha Editor
 * Drag and Drop files plugin for Aloha Editor
 * copyright (c) 2010 Nicolas Karageuzian - http://nka.me/
 * Copyright (c) 2010 Gentics Software GmbH
 *
 * Handles drag and drop for files
 *
 */

//(function(window, undefined) {
//    var
//        $ = jQuery = window.alohaQuery,
//        GENTICS = window.GENTICS,
//        Aloha = GENTICS.Aloha;
(function(window, undefined) {
	var
		jQuery = window.alohaQuery, $ = jQuery,
		GENTICS = window.GENTICS,
		Aloha = window.Aloha;

	/**
	 * register the plugin with unique name
	 */
	Aloha.DragAndDropFiles = new (Aloha.Plugin.extend({
		_constructor: function(){
			this._super('dragndropfiles');
		},
		/**
		 * Configure the available languages
		 */
		languages:['en','fr'],
		/**
		 * Default config, each editable may have his own stuff.
		 */
		config: { 'drop' : {	'max_file_size': 300000,
			'max_file_count': 2,
			'upload': {
					'uploader_instance':'Aloha.Repositories.Uploader',
					'config': {
						'callback': function(resp) { return resp;}, // what to do with the server response, must return the new file location,
																	//  if server return an error, throws an exception (throw "error")
						'method':'POST',
						'url': "",
						'file_name_param':"filename",
						'file_name_header':'X-File-Name',
						'extra_headers':{}, //Extra parameters
						'extra_post_data': {}, //Extra parameters
						'send_multipart_form': false, //true for html4 TODO: make browser check
						//'additional_params': {"location":""},
						'www_encoded': false }
					}
			}
		},
		/**
		 * Add a drop listener to the body of the whole document
		 */
		init: function() {
			var that = this;
			Aloha.loadJs(Aloha.getPluginUrl('dragndropfiles') + '/src/dropfilesrepository.js', function(){


				// add the listener
				that.setBodyDropHandler();
	//			stylePath = GENTICS_Aloha_base + '/plugins/com.gentics.aloha.plugins.DragAndDropFiles/style.css';
	//			jQuery('head').append('<link rel="stylesheet" href="'
	//					+ stylePath + '"></script>');
				if (that.settings === undefined) {
					that.settings = that.config;
				} else {
					that.settings = jQuery.extend(true, that.config, that.settings);
				}

				try {
						that.uploader = that.initUploader(that.settings);
					} catch(error) {
						Aloha.Log.warn(that,error);
						Aloha.Log.warn(that,"Error creating uploader, no upload will be processed");
					}

			});


		},


		/**
		 * Init a custom uploader
		 */
		initUploader: function(customConfig) {
			var uploader_instance;
			try {
				uploader_instance = eval(customConfig.drop.upload.uploader_instance);
			} catch(error) {
				Aloha.Log.info(this,"Custom class loading error or not specified, using default");
				uploader_instance = Aloha.Repositories.Uploader;
				if (customConfig.drop.upload.delegate) {
					uploader_instance.delegateUploadEvent = customConfig.drop.upload.delegate;
				}
			}
			return uploader_instance;
		},
		/**
		 *  Attach drag and drop listeners to document body (Native JS way)
		 *
		 */
		setBodyDropHandler: function() {
			if (!document.body.BodyDragSinker){
				document.body.BodyDragSinker = true;
				var that = this;
				this.onstr = "";
				this.mydoc = document;
				this.methodName = "addEventListener";
				if (jQuery.browser.msie) {
					this.onstr = "on";
					this.methodName = "attachEvent";
					this.mydoc = document.body;
				}

				// sets the default handler
				this.mydoc[this.methodName](this.onstr+"drop", function(event) {
				Aloha.Log.info(that,"a file have been dropped on document");

				if (jQuery.browser.msie) {
					var textdata = event.dataTransfer.getData('Text');
					var urldata = event.dataTransfer.getData('URL');
					var imagedataW = window.event.dataTransfer.getData('URL');
					var textdataW = window.event.dataTransfer.getData('Text');
					var x = textdataW;
				}
				// if no files where dropped, use default handler
				if (!event.dataTransfer && !event.dataTransfer.files) {
					event.sink = false;
								return true;
				}
				var files = event.dataTransfer.files,
						len = files.length,
						editable = null;
					if (len < 1) {
						event.sink = false;
							return true;
					}
					if (event.preventDefault)
						event.preventDefault();
					else
						event.cancelBubble = true;
					if (len > that.settings.drop.max_file_count) {
						Aloha.Log.warn(that,"too much files dropped");
						if (event.stopPropagation)
						event.stopPropagation();
					else
						event.returnValue = false;
						return true;
					}
				target = jQuery(event.target);
				//If drop in editable
				if (target.hasClass('aloha-editable')) {
					editable = target;
					target = editable.children(':last');
					if (target.hasClass('aloha-editable')) {
						//nested space is needed in this tag, otherwise select won't success...
						editable.append('<span> </span>');
						target = editable.children(':last');
					}
				} else {
					editable = target.parents('.aloha-editable');
				}
				var filesObjs = [],
					dropInEditable = false;
				if (editable[0] === null) {
					while(--len >= 0) {
						fileObj = that.uploader.addFileUpload(files[len]);
						//that.uploader.startFileUpload(fileObj.id,this.config.drop.upload.config);
						filesObjs.push(fileObj);
					}
				} else {
					Aloha.getEditableById(editable.attr('id')).activate();
					var range = that.InitializeRangeForDropEvent(event, editable);

						while(--len >= 0) {
							if (files[len].size > that.settings.drop.max_file_size) {
								event.stopPropagation();
								Aloha.Log.warn(that,"max_file_size exeeded");
									return false;
							}
							fileObj = that.uploader.addFileUpload(files[len]);
							filesObjs.push(fileObj);
							var edConfig = that.getEditableConfig(editable);
									if (edConfig.drop) {
										dropInEditable = true;
										//that.uploader.startFileUpload(fileObj.id,edConfig.drop.upload.config);
									} else {
										//that.uploader.startFileUpload(fileObj.id,this.config.drop.upload.config);
									}

							} //while
				}
				var len = filesObjs.length;
				if (dropInEditable) {
						Aloha.trigger('aloha-drop-files-in-editable', {
							'filesObjs':filesObjs,
							'range': range,
							'editable': editable});
						var edConfig = that.getEditableConfig(editable);
						while(--len >= 0) {
							that.uploader.startFileUpload(filesObjs[len].id,edConfig.drop.upload.config);
						}
					} else {
						Aloha.trigger('loha-drop-files-in-page', filesObjs);
						while(--len >= 0) {
							that.uploader.startFileUpload(filesObjs[len].id,this.config.drop.upload.config);
						}
					}
				if (event.stopPropagation)
					event.stopPropagation();
				else
					event.returnValue = false;
				return false;
			}, false);
			// TODO: improve below to allow default comportment behaviour if drop event is not a files drop event
			this.mydoc[this.methodName](this.onstr+"dragenter", function(event) {
				if (event.preventDefault)
					event.preventDefault();
				else
					event.cancelBubble = true;
				if (event.stopPropagation)
					event.stopPropagation();
				else
					event.returnValue = false;
				return false;
			}, false);
			this.mydoc[this.methodName](this.onstr+"dragleave", function(event) {
				if (event.preventDefault)
					event.preventDefault();
				else
					event.cancelBubble = true;
				if (event.stopPropagation)
					event.stopPropagation();
				else
					event.returnValue = false;
				return false;
			}, false);
			this.mydoc[this.methodName](this.onstr+"dragover", function(event) {
				if (event.preventDefault)
					event.preventDefault();
				else
					event.cancelBubble = true;
				if (event.stopPropagation)
					event.stopPropagation();
				else
					event.returnValue = false;
				//return false;
			}, false);



			} // if
			// end body events
			//==================
		},
		/**
		 * TODO do we realy need a range Object? May be it makes sense to attach it to the event
		 * for plugin developers comfort.
		 */
		InitializeRangeForDropEvent: function(event, editable) {
			//var range = new GENTICS.Utils.RangeObject();
			var target = jQuery(event.target);
//			if (target.textNodes().length == 0 && target.html().length == 0) {
//				target.html(" ");
//			}
			var	range = new Aloha.Selection.SelectionRange(true);
			range.update();
			if (target.textNodes().length == 0) {
				range.startContainer = target[0].childNodes[0];
				range.endContainer = target[0].childNodes[0];
			} else {
				range.startContainer = target.textNodes()[0];
				range.endContainer = target.textNodes()[0];
			}
		//
				range.startOffset = 0;
				range.endOffset = 0;
			try {
				range.select();
			} catch (error) {
				Aloha.Log.error(this,error);
			}
			return range;
		}
	}))();
})(window, document);