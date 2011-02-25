/**
 * Aloha Editor
 * Drag and Drop files plugin for Aloha Editor
 * copyright (c) 2010 Nicolas Karageuzian - http://nka.me/
 * Copyright (c) 2010 Gentics Software GmbH
 *
 * Handles drag and drop for files
 * 
 */

GENTICS.Aloha.DragAndDropFiles = new GENTICS.Aloha.Plugin("com.gentics.aloha.plugins.DragAndDropFiles");
/**
 * Configure the available languages
 */
GENTICS.Aloha.DragAndDropFiles.languages=['en','fr'];

/**
 * Default config, each editable may have his own stuff.
 */
GENTICS.Aloha.DragAndDropFiles.config = { 'drop' : {	'max_file_size': 300000,
											'max_file_count': 2,
											'upload': {'uploader_instance':'GENTICS.Aloha.Repositories.Uploader',
										 			'config': {
										 				// can add more elements for Ext window styling 
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
								};

/**
 * Add a drop listener to the body of the whole document
 */
GENTICS.Aloha.DragAndDropFiles.init = function() {
	
	var that = this;
	// add the listener
	this.setBodyDropHandler();
	stylePath = GENTICS_Aloha_base + '/plugins/com.gentics.aloha.plugins.DragAndDropFiles/style.css';
	jQuery('head').append('<link rel="stylesheet" href="' 
			+ stylePath + '"></script>');
	if (this.settings.config === undefined) {
		this.settings.config = this.config;
	} else {
		this.settings.config = jQuery.extend(true, this.config, this.settings.config);
	}
	try {
			this.uploader = this.initUploader(this.settings.config);
			
		} catch(error) {
			GENTICS.Aloha.Log.warn(this,error);
			GENTICS.Aloha.Log.warn(this,"Error creating uploader, no upload will be processed");
		}

};
/**
 * Init a custom uploader
 */
GENTICS.Aloha.DragAndDropFiles.initUploader = function(customConfig) {
	var uploader_instance = undefined;
	try {
		uploader_instance = eval(customConfig.drop.upload.uploader_instance);
	} catch(error) {
		GENTICS.Aloha.Log.info(this,"Custom class loading error or not specified, using default");
		uploader_instance = GENTICS.Aloha.Repositories.Uploader;
		if (customConfig.drop.upload.delegate) {
			uploader_instance.delegateUploadEvent = customConfig.drop.upload.delegate; 
		}
	}
	return uploader_instance;
};

/**
 *  Attach drag and drop listeners to document body (Native JS way)
 * 
 */
GENTICS.Aloha.DragAndDropFiles.setBodyDropHandler = function() {
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
		 try {
			 if (event.preventDefault)
				 event.preventDefault();
			 else
				 event.cancelBubble = true;
			 GENTICS.Aloha.Log.info(that,"a file have been dropped on document");
			 
			 if (jQuery.browser.msie) {
				 var textdata = event.dataTransfer.getData('Text');
				 var urldata = event.dataTransfer.getData('URL');
				 var imagedataW = window.event.dataTransfer.getData('URL');
				 var textdataW = window.event.dataTransfer.getData('Text');
				 var x = textdataW;
			 }

			var files = event.dataTransfer.files;
		    var len = files.length;
		    // if no files where dropped, use default handler
		    if (len < 1) {
		    	event.sink = false;
		        return true;
		    }
		    if (len > that.settings.config.drop.max_file_count) {
		    	GENTICS.Aloha.Log.warn(that,"too much files dropped");
		    	if (event.stopPropagation)
					 event.stopPropagation();
				 else 
					 event.returnValue = false;
		    	return true;
		    }
		    var editable = null;
			target = jQuery(event.target);
			//If drop in editable
			if (target.hasClass('GENTICS_editable')) {
				editable = target;
				target = editable.children(':last');
				if (target.hasClass('GENTICS_editable')) {
					//nested space is needed in this tag, otherwise select won't success...
					editable.append('<span> </span>');
					target = editable.children(':last');
				}
			} else {
				editable = target.parents('.GENTICS_editable');
			}
			filesObjs = [];
			var dropInEditable = false;
			if (editable[0] == null) {
				while(--len >= 0) {
					fileObj = that.uploader.addFileUpload(files[len]);
					//that.uploader.startFileUpload(fileObj.id,this.config.drop.upload.config);
					filesObjs.push(fileObj);
				}
			} else {
				GENTICS.Aloha.getEditableById(editable.attr('id')).activate();
				var range = that.InitializeRangeForDropEvent(event, editable);

			    while(--len >= 0) {
			    	if (files[len].size > that.settings.config.drop.max_file_size) {
			    		event.stopPropagation();
			    		GENTICS.Aloha.Log.warn(that,"max_file_size exeeded");
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
		    	GENTICS.Aloha.EventRegistry.trigger(
    				new GENTICS.Aloha.Event('dropFilesInEditable', GENTICS.Aloha, {
    					'filesObjs':filesObjs,
    					'range': range,
    					'editable': editable}));
		    	var edConfig = that.getEditableConfig(editable);
		    	while(--len >= 0) {
		    		that.uploader.startFileUpload(filesObjs[len].id,edConfig.drop.upload.config);
		    	}
		    } else {
		    	GENTICS.Aloha.EventRegistry.trigger(
            			new GENTICS.Aloha.Event('dropFilesInPage', GENTICS.Aloha,filesObjs));
		    	while(--len >= 0) {
		    		that.uploader.startFileUpload(filesObjs[len].id,this.config.drop.upload.config);
		    	}
		    }
			if (event.stopPropagation)
				 event.stopPropagation();
			 else 
				 event.returnValue = false;
		 } catch (error) {
			GENTICS.Aloha.Log.error(GENTICS.Aloha.DragAndDropFiles,error);

		}
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
};

//GENTICS.Aloha.DragAndDropFiles.processEventForEditable = function(editable) {
//	editalbe.
//}

/**
 * TODO do we realy need a range Object? May be it makes sense to attach it to the event
 * for plugin developers comfort.
 */
GENTICS.Aloha.DragAndDropFiles.InitializeRangeForDropEvent = function(event, editable) {
	//var range = new GENTICS.Utils.RangeObject();
	var target = jQuery(event.target);
//	if (target.textNodes().length == 0 && target.html().length == 0) {
//		target.html(" ");
//	}
	var	range = new GENTICS.Aloha.Selection.SelectionRange(true);
	range.update();
//	if (target.textNodes().length == 0) {
//		range.startContainer = target[0].childNodes[0];
//		range.endContainer = target[0].childNodes[0];
//	} else {
//		range.startContainer = target.textNodes()[0];
//		range.endContainer = target.textNodes()[0];
//	}
//
//		range.startOffset = 0;
//		range.endOffset = 0;    		
//	try {
//		range.select();
//	} catch (error) {
//		GENTICS.Aloha.Log.error(this,error);
//	}
	return range;
};

/**
 * On selection change
 * TODO: this may move to a new plugin
 */
GENTICS.Aloha.DragAndDropFiles.subscribeEvents = function () {
	var that = this;
	 GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'selectionChanged', function(event, rangeObject) {
		 if (that.selectedFile != null) {
			 that.selectedFile = null;
		 }
		 var foundMarkup = that.findFileObject( rangeObject );
		 if (foundMarkup) {
			 GENTICS.Aloha.FloatingMenu.setScope(that.getUID('DragnDrop'));
			 GENTICS.Aloha.FloatingMenu.userActivatedTab = that.i18n('floatingmenu.tab.file');

		 }
	 	});
};

/**
 * Find file object
 * TODO: this may move to a new plugin
 */
GENTICS.Aloha.DragAndDropFiles.findFileObject = function(range) {
	if ( typeof range == 'undefined' ) {
        var range = GENTICS.Aloha.Selection.getRangeObject();   
    }
	try {
		if (range.getContainerParents().is('.GENTICS_drop_file_box')) {
			return range.getContainerParents().filter('.GENTICS_drop_file_box');
		}
	} catch (e) {
		GENTICS.Aloha.Log.debug(this,"Error finding fileobj markup.");
	}
    return null;
    
};
