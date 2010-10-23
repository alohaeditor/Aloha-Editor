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
GENTICS.Aloha.DragAndDropFiles.config = { 
	'drop' : {
		'max_file_size': 200000,
		'max_file_count': 2,
		'upload': {
			'url': "",
			'file_name_param':"",
			'additional_params': {
				"location":""
			},
			'www-encoded': false 
		}
	}
};
/**
 * Add a drop listener to the body of the whole document
 */
GENTICS.Aloha.DragAndDropFiles.init = function() {
	var that = this;
	
	// add the listener
	this.sinkBodyEvent();
	
	stylePath = GENTICS_Aloha_base + '/plugins/com.gentics.aloha.plugins.DragAndDropFiles/style.css';
	jQuery('<link rel="stylesheet" />').attr('href', stylePath).appendTo('head');
	this.subscribeEvents();
	
};

/**
 *  Attach drag and drop listeners to document body
 * this prevents incorrect drops, reloading the page with the dropped item
 * This may or may not be helpful
 */
GENTICS.Aloha.DragAndDropFiles.sinkBodyEvent = function() {
	var that = this;

//	// This is redundant to body.on({'drag': funtcion() {} }); 	 
//	jQuery('body')[0].addEventListener('drop', that.dropEventHandler, false);

	if ( !document.body.GENTICS_ALoha_DragSink ) {
		 
		//console.log("Processing body event sink");
		 document.body.GENTICS_ALoha_DragSink = true;
		 
		 var body = Ext.fly(document.body);
		 
		 body.on({
			dragenter: function(event) {
			 	// TODO outline all drag targets
				return true;
			}
			,dragleave: function(event) {
			 	// remove drag targets outlines
				return true;
			}
			// TODO move Drag over to editables as then the drag symbol should change
			,dragover: function(event) {	
				event.stopEvent();
				return false;
			}
			// TODO move Drag over to editables as then the drag symbol should change
			,drop: function(event) {
				try {
					//console.log('ext event');
					if (event.browserEvent.originalEvent.sink) { // is event maked to be sinked
						event.stopEvent(); // this prevents default browser comportment
						return true;
					}
					var files = e.dataTransfer.files;
				    var len = files.length;
				    
				    // if no files where dropped, use default handler
				    if (len < 1) {
				    	event.sink = false;
				        return true;
				    }
				    if (len > that.config.drop.max_file_count) {
				    	GENTICS.Aloha.log.warn(that, "Too many files dropped. Only "+that.config.drop.max_file_count+" allowed (drop.max_file_count)." );
				    	event.stopEvent();
				    	return true;
				    }
				    // max_file_count
				    while(--len >= 0) {
				    	if (files[len].size <= that.config.drop.max_file_size) {
				    		
				    		// ######### CORE VALUE OF the plugin ###########
				    		// TODO handle the hole upload event here. This is the main business for this plugin.
				    		
				    		// TODO define API how plugins may accept drop elements, update status information about single or multiple uplod,
				    		// finish upload and change elements accordingly.
				    		// TODO implement all available methods from https://developer.mozilla.org/en/DOM/FileReader for FF3.6+
				    		// REF https://developer.mozilla.org/en/Using_files_from_web_applications
				    		// TODO support more borwsers with DnD http://stackoverflow.com/questions/2657653/drag-and-drop-file-upload-in-google-chrome-chromium
			    			var reader = new FileReader();
			    			reader.config = that.getEditableConfig(data.editable);
			    			reader.attachedData = data;
			    			reader.onloadend = function(readyEvent) {
			    				// TODO upload finished
			    			};
			    			reader.readAsDataURL(data.file);
				    		
			    			// TODO pass all available data to the event.
			    			// TODO pass an update upload status event methode
			    			// TODO pass an update upload finished event methode
			        		GENTICS.Aloha.EventRegistry.trigger(
		        				new GENTICS.Aloha.Event('dropFileInEditable', GENTICS.Aloha, {
		        					'file':files[len],
		        					'display': display,
		        					'range': range,
		        					'editable': editable
		        				})
			        		);
				    	} else {
				    		// TODO: throw errors and push to messageing system.
				    		GENTICS.Aloha.log.warn(that,"Maximal filesize exeeded. (drop.max_file_size).");
				    	}
				    }
				    event.stopEvent();
				    	
				} catch (error) {
					// TODO log error
					// TODO push messages to user
					//console.log(error);
				}
				return true;
			}
		});
	} // if
};

// TODO do we realy need a range Object? May be it makes sense to attach it to the event
// for plugin developers comfort. 
GENTICS.Aloha.DragAndDropFiles.InitializeRangeForDropEvent = function(event, editable) {
	//var range = new GENTICS.Utils.RangeObject();
	target = jQuery(event.target);
	var	range = new GENTICS.Aloha.Selection.SelectionRange();
	try {
		range.startContainer = e.rangeParent;
		range.endContainer = e.rangeParent;
	} catch(error) {
		range.startContainer = target[0];//.parent()[0];
		range.endContainer = target[0];//.parent()[0];
	}
	range.startParent = target.parent()[0];
	range.endParent = target.parent()[0];
	range.updateCommonAncestorContainer(editable[0]);
	range.unmodifiableMarkupAtStart = editable;
	range.limitObject = editable[0];
	
	try {
		range.startOffset = event.rangeOffset;
		range.endOffset = event.rangeOffset;    		
	} catch(error) {
		range.startOffset = 0;
		range.endOffset = 0;    		
	}
	try {
		range.select();
	} catch (error) {
		console.log(error);
	}
	return range;
};
