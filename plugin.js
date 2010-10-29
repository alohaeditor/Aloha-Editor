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
											'upload': {'uploader_class':'GENTICS.Aloha.Uploader',
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
	jQuery('<link rel="stylesheet" />').attr('href', stylePath).appendTo('head');
	
	// TODO: have to finish specs, lines below may move to a new plugin
		//this.subscribeEvents();
//		var uxXHR = '' + GENTICS_Aloha_base + '/plugins/com.gentics.aloha.plugins.DragAndDropFiles/deps/Ext.ux.XHRUpload.js';
//		jQuery('<script type="text/javascript" />').attr('src', uxXHR).appendTo('head');
//		var uploaderPath = '' + GENTICS_Aloha_base + '/plugins/com.gentics.aloha.plugins.DragAndDropFiles/uploader.js';
//		jQuery('<script type="text/javascript" />').attr('src', uploaderPath).appendTo('head');
		try {
			this.uploader = this.initUploader(this.settings.config);
			
		} catch(error) {
			GENTICS.Aloha.Log.warn(this,error);
			GENTICS.Aloha.Log.warn(this,"Error creating uploader, no upload will be processed");
		}
		
		GENTICS.Aloha.FloatingMenu.createScope(this.getUID('DragnDrop'), 'global');
		this.fileNameField = new GENTICS.Aloha.ui.AttributeField({});
		GENTICS.Aloha.FloatingMenu.addButton(
	    		this.getUID('DragnDrop'),
	    		this.fileNameField,
	    		this.i18n('floatingmenu.tab.file'),
	    		1
	    );
};
/**
 * Init the uploader for given conf
 */
GENTICS.Aloha.DragAndDropFiles.initUploader = function(customConfig) {
	var uploader_class = undefined;
	try {
		uploader_class = eval(customConfig.drop.upload.uploader_class);
	} catch(error) {
		GENTICS.Aloha.Log.info(this,"Custom class loading error or not specified, using default");
	}
	if (uploader_class == undefined) {
		uploader_class = eval(this.config.drop.upload.uploader_class);
	}
	var uploader_config = this.config.drop.upload.config;
	Ext.apply(uploader_config,{	
		title: 'Upload status',
		width:435,
		height:140,
		//border:false,
		plain:true,
		layout: 'border',
		closeAction: 'hide'
		}, customConfig.drop.upload.config);
	uploader = new uploader_class(uploader_config);
	return uploader;
};

/**
 *  Attach drag and drop listeners to document body (ExtJs way)
 * 
 */
GENTICS.Aloha.DragAndDropFiles.setBodyDropHandler = function() {
	 if (!document.body.BodyDragSinker){
		 document.body.BodyDragSinker = true;
		 var that = this;
		 body = Ext.fly(document.body);
		 body.on({
			dragenter:function(event){
				return true;
			}
			,dragleave:function(event){
				return true;
			}
			,dragover:function(event){				
				event.stopEvent();
				return false;
			}
			,drop:function(event){
				try {
					if (event.browserEvent.originalEvent.sink) { // is event maked to be sinked
						event.stopEvent(); // this prevents default browser comportment
						return true;
					}
					var e = event.browserEvent.originalEvent;
					var files = e.dataTransfer.files;
				    var len = files.length;
				    // if no files where dropped, use default handler
				    if (len < 1) {
				    	e.sink = false;
				        return true;
				    }
				    if (len > that.config.drop.max_file_count) {
				    	GENTICS.Aloha.log.warn(that,"too much files dropped");
				    	event.stopEvent();
				    	return true;
				    }
				    var editable = null;
					target = jQuery(e.target);
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
							ul_id = GENTICS.Aloha.Repositories.Uploader.addFileUpload(files[len]);
							GENTICS.Aloha.Repositories.Uploader.startFileUpload(ul_id,this.config.drop.upload.config);
//							GENTICS.Aloha.EventRegistry.trigger(
//				        			new GENTICS.Aloha.Event('dropFileInPage', GENTICS.Aloha, files[len]));
							//ul_id = that.uploader.addFileUpload(files[len]);
			            	//that.uploader.startFileUpload(ul_id);
						}
						//that.uploader.show(document.body);
					} else {
						GENTICS.Aloha.getEditableById(editable.attr('id')).activate();
						range = that.InitializeRangeForDropEvent(e, editable);

					    while(--len >= 0) {
					    	if (files[len].size > that.config.drop.max_file_size) {
					    		event.stopPropagation();
					    		GENTICS.Aloha.Log.warn(that,"max_file_size exeeded");
					    	    return false;
					    	}
					    	ul_id = GENTICS.Aloha.Repositories.Uploader.addFileUpload(files[len]);
					    	
					    	//TODO : have a look in core for solving the per-editable config issue
				        	var edConfig = that.getEditableConfig(editable);
				           	if (edConfig.drop) {
				           		GENTICS.Aloha.Repositories.Uploader.startFileUpload(ul_id,edConfig.drop.upload.config);
				           		//ul_id = that.uploader.addFileUpload(files[len],edConfig.drop.upload.config.url);
				        		var display = jQuery('<div id="GENTICS_drop_file_uploading_'+ul_id+'" class="GENTICS_drop_file_box"><div class="GENTICS_drop_file_icon GENTICS_drop_file_default"></div>' +
				        				'<div class="GENTICS_drop_file_details">'+ files[len].name +'</div></div>');
				        		//target.parent().append(display);
				        		//GENTICS.Utils.Dom.insertIntoDOM(display,range,  jQuery(GENTICS.Aloha.activeEditable.obj));
				        		GENTICS.Aloha.EventRegistry.trigger(
				        				new GENTICS.Aloha.Event('dropFileInEditable', GENTICS.Aloha, {
				        					'file':files[len],
				        					'ul_id': ul_id,
				        					'display': display,
				        					'range': range,
				        					'editable': editable}));
				        		//that.uploader.show(document.body);
				        		//that.uploader.startFileUpload(ul_id);
				           	} else {
				            	GENTICS.Aloha.EventRegistry.trigger(
				            			new GENTICS.Aloha.Event('dropFileInPage', GENTICS.Aloha,files[len]));
				            	GENTICS.Aloha.Repositories.Uploader.startFileUpload(ul_id,this.config.drop.upload.config);
				            	//ul_id = that.uploader.addFileUpload(files[len]);
				            	//that.uploader.show(document.body);
				            	//that.uploader.startFileUpload(ul_id);
				           	}
				           	
				        } //while
					}
				    event.stopEvent();
				    	
				} catch (error) {
					//TODO : log error
					GENTICS.Aloha.Log.error(GENTICS.Aloha.DragAndDropFiles,error);
					//console.log(error);
				}
				return false;
			}
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

