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
 * TODO make configuration adoptable to each editable
 */
GENTICS.Aloha.DragAndDropFiles.config = { 'drop' : {	'max_file_size': 200000,
											'max_file_count': 2,
											'upload': {//'uploader_class':'GENTICS.Aloha.Uploader',
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
	// TODO #1 complete code an see other #1 in this code
	var uploader_class = undefined;
	try {
		uploader_class = eval(customConfig.drop.upload.uploader_class);
	} catch(error) {
		GENTICS.Aloha.Log.info(this,"Custom class loading error or not specified, using default");
	}
};

/**
 *  Attach drag and drop listeners to document body (ExtJs way)
 * 
 */
GENTICS.Aloha.DragAndDropFiles.setBodyDropHandler = function() {
	 if (!document.body.BodyDragSinker){
		 document.body.BodyDragSinker = true;
		 var that = this;
		 
			 document.addEventListener("drop", function(event) {
			 try {
				 event.preventDefault();
				 GENTICS.Aloha.Log.info(that,"a file have been dropped on document");
				 
				var files = event.dataTransfer.files;
			    var len = files.length;
			    // if no files where dropped, use default handler
			    if (len < 1) {
			    	event.sink = false;
			        return true;
			    }
			    if (len > that.settings.config.drop.max_file_count) {
			    	GENTICS.Aloha.log.warn(that,"too much files dropped");
			    	event.stopPropagation();
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
						editable.append('<p> </p>');
						target = editable.children(':last');
					}
				} else {
					editable = target.parents('.GENTICS_editable');
				}
				if (editable[0] == null) {
					while(--len >= 0) {
						// TODO #1  GENTICS.Aloha.Repositories.Uploader should be replaced by custom config behaviour
						//fileObj = that.uploader.addFileUpload(files[len]);
						fileObj = GENTICS.Aloha.Repositories.Uploader.addFileUpload(files[len]);
						// we may be more flexible here
						//that.uploader.startFileUpload(ul_id);
						GENTICS.Aloha.Repositories.Uploader.startFileUpload(fileObj.id,this.config.drop.upload.config);
	//					 for example, throw an event
						//GENTICS.Aloha.EventRegistry.trigger(
	//		        			new GENTICS.Aloha.Event('dropFileInPage', GENTICS.Aloha, files[len]));
					}
				} else {
					GENTICS.Aloha.getEditableById(editable.attr('id')).activate();
					range = that.InitializeRangeForDropEvent(event, editable);
	
				    while(--len >= 0) {
				    	if (files[len].size > that.settings.config.drop.max_file_size) {
				    		event.stopPropagation();
				    		GENTICS.Aloha.Log.warn(that,"max_file_size exeeded");
				    	    return false;
				    	}
				    	fileObj = GENTICS.Aloha.Repositories.Uploader.addFileUpload(files[len]);
				    	
				    	//TODO : have a look in core for solving the per-editable config issue
			        	var edConfig = that.getEditableConfig(editable);
			           	if (edConfig.drop) {
			           		GENTICS.Aloha.Repositories.Uploader.startFileUpload(fileObj.id,edConfig.drop.upload.config);
			        		var display = jQuery('<div id="'+fileObj.id+'" class="GENTICS_drop_file_box"><div class="GENTICS_drop_file_icon GENTICS_drop_file_default"></div>' +
			        				'<div class="GENTICS_drop_file_details">'+ files[len].name +'</div></div>');
			        		GENTICS.Aloha.EventRegistry.trigger(
			        				new GENTICS.Aloha.Event('dropFileInEditable', GENTICS.Aloha, {
			        					'fileObj':fileObj,
			        					'range': range,
			        					'editable': editable}));
			           	} else {
			            	GENTICS.Aloha.EventRegistry.trigger(
			            			new GENTICS.Aloha.Event('dropFileInPage', GENTICS.Aloha,files[len]));
			            	GENTICS.Aloha.Repositories.Uploader.startFileUpload(fileObj.id,this.config.drop.upload.config);
	
			           	}
			           	
			        } //while
				}
				event.stopPropagation();
			 } catch (error) {
				//TODO : log error
				GENTICS.Aloha.Log.error(GENTICS.Aloha.DragAndDropFiles,error);
				//console.log(error);
			}
			 return false;
		 });
		 document.addEventListener("dragenter", function(event) {
			 event.preventDefault();
			 event.stopPropagation();
			 return false;
		 });
		 document.addEventListener("dragleave", function(event) {
			 event.preventDefault();
			 event.stopPropagation();
			 return false;
		 });
		 document.addEventListener("dragover", function(event) {
			 event.preventDefault();
			 event.stopPropagation();
			 return false;
		 });

	} // if
	// end body events
	//================== 
};

/**
 * TODO do we realy need a range Object? May be it makes sense to attach it to the event
 * for plugin developers comfort.
 */
GENTICS.Aloha.DragAndDropFiles.InitializeRangeForDropEvent = function(event, editable) {
	//var range = new GENTICS.Utils.RangeObject();
	target = jQuery(event.target);
	if (target.textNodes().length == 0 && target.html().length == 0) {
		target.html(" ");
	}
	var	range = new GENTICS.Aloha.Selection.SelectionRange();
	if (target.textNodes().length == 0) {
		range.startContainer = target[0].childNodes[0];
		range.endContainer = target[0].childNodes[0];
	} else {
		range.startContainer = target.textNodes()[0];
		range.endContainer = target.textNodes()[0];
	}

		range.startOffset = 0;
		range.endOffset = 0;    		
	try {
		range.select();
	} catch (error) {
		GENTICS.Aloha.log(this,error);
	}
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

