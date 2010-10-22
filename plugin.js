/**
 * Drag and Drop files plugin for Aloha
 * 
 * Handles drag and drop for files
 * copyright (c) 2010 Nicolas Karageuzian - http://nka.me/
 */




GENTICS.Aloha.DragAndDropFiles = new GENTICS.Aloha.Plugin("com.gentics.aloha.plugins.DragAndDropFiles");
GENTICS.Aloha.DragAndDropFiles.languages=['en','fr'];
GENTICS.Aloha.DragAndDropFiles.config = { 'drop' : {	'max_file_size': 200000,
											'max_file_count': 2,
											'upload': {'url': "",
												'file_name_param':"",
												'additional_params': {"location":""},
												'www-encoded': false }
											}
								};

GENTICS.Aloha.DragAndDropFiles.init = function() {
	
	var that = this;
	this.sinkBodyEvent();
	/*
	GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'editableCreated', function(event, editable) {
		//config = that.getEditableConfig(editable);
		//console.log(config);
		//if (config.drop) {
		//	editable.obj[0].dropFileConfig = config.drop;
			editable.obj[0].addEventListener('drop', that.dropEventHandler, false);
		//}
	});
	*/
	jQuery('body')[0].addEventListener('drop', that.dropEventHandler, false);
	stylePath = GENTICS_Aloha_base + '/plugins/com.gentics.aloha.plugins.DragAndDropFiles/style.css';
	jQuery('<link rel="stylesheet" />').attr('href', stylePath).appendTo('head');
	this.subscribeEvents();
	
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
 * Gets Aloha editable object from DOM id
 * TODO: move this block to core.js 
 */
GENTICS.Aloha.DragAndDropFiles.getEditableById = function (id) {
	for (var i = 0; i < GENTICS.Aloha.editables.length; i++) {
		if (GENTICS.Aloha.editables[i].getId() == id) {
			return GENTICS.Aloha.editables[i];
		}
	}
};

/**
 *  Attach drag and drop listeners to document body
 * this prevents incorrect drops, reloading the page with the dropped item
 * This may or may not be helpful
 */
GENTICS.Aloha.DragAndDropFiles.sinkBodyEvent = function() {
	 if (!document.body.BodyDragSinker){
		 //console.log("Processing body event sink");
		 document.body.BodyDragSinker = true;
		 
		 var body = Ext.fly(document.body);
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
					//console.log('ext event');
					//console.log(event);
					//alert("drop event, body sinker");
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
				    if (len > GENTICS.Aloha.DragAndDropFiles.config.drop.max_file_count) {
				    	GENTICS.Aloha.log.warn(GENTICS.Aloha.DragAndDropFiles,"too much files dropped");
				    	event.stopEvent();
				    	return true;
				    }
				    //max_file_count
				    while(--len >= 0) {
				    	if (files[len].size <= GENTICS.Aloha.DragAndDropFiles.config.drop.max_file_size) {
					    	GENTICS.Aloha.EventRegistry.trigger(
			            			new GENTICS.Aloha.Event('dropFileInPage', GENTICS.Aloha,files[len]));
				    	} else {
				    		//TODO: Too big file
				    		GENTICS.Aloha.log.warn(GENTICS.Aloha.DragAndDropFiles,"max_file_size exeeded");
				    	}
				    }
				    event.stopEvent();
				    	
				} catch (error) {
					//TODO : log error
					//console.log(error);
				}
				return true;
			}
		});

	} // if
	// end body events
	//================== 
};

/**
 * On selection change
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
			 //that.fileNameField  <- sets the filename here
			 //continue with selection correction...
		 } else {
		 }
		 //var config = that.getEditableConfig(GENTICS.Aloha.activeEditable.obj);
		 //console.log(config);
	 	});
};

/**
 * Find file object
 * 
 */
GENTICS.Aloha.DragAndDropFiles.findFileObject = function(range) {
	if ( typeof range == 'undefined' ) {
        var range = GENTICS.Aloha.Selection.getRangeObject();   
    }
	try {
		if (range.getContainerParents().is('.GENTICS_drop_file_box')) {
			return range.getContainerParents().filter('.GENTICS_drop_file_box');
		}
		/*
		if (range.startContainer)
			if (range.startContainer.childNodes)
				if (range.startOffset)
					if (range.startContainer.childNodes[range.startOffset])
	    if (range.startContainer.childNodes[range.startOffset].hasClass('GENTICS_drop_file_box')) {
			// console.log(range);
			result = range.startContainer.childNodes[range.startOffset];
			return result;
		} */
	} catch (e) {
		GENTICS.Aloha.Log.debug(this,"Error finding fileobj markup.");
	}
    return null;
    
};

/**
 * The drop event handler, filtering
 */
GENTICS.Aloha.DragAndDropFiles.dropEventHandler = function(event){
	var e = event;
	event.sink = true;
	var files = e.dataTransfer.files;
	var len = files.length;
	// if no files where dropped, use default handler
	if (len < 1) {
		event.sink = false;
		return true;
	}
	event.stopPropagation();

	if (len > GENTICS.Aloha.DragAndDropFiles.config.drop.max_file_count) {
		event.stopPropagation();
		GENTICS.Aloha.Log.warn(GENTICS.Aloha.DragAndDropFiles,"too much files dropped");
	    return false;
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
		editable = target.parent('.GENTICS_editable');
	}
	if (editable[0] == null) {
		while(--len >= 0) {
			GENTICS.Aloha.EventRegistry.trigger(
        			new GENTICS.Aloha.Event('dropFileInPage', GENTICS.Aloha,files[len]));
		}
	} else {
    	GENTICS.Aloha.DragAndDropFiles.getEditableById(editable.attr('id')).activate();
    	GENTICS.Aloha.activateEditable(GENTICS.Aloha.DragAndDropFiles.getEditableById(editable.attr('id')));
    	range = GENTICS.Aloha.DragAndDropFiles.InitializeRangeForDropEvent(event, editable);
    	//GENTICS.Aloha.Selection.updateSelection(e);
    	//var range = GENTICS.Aloha.Selection.getRangeObject(true);
    	// 
    	
    	//range.initializeFromUserSelection(e);
    	//range.updateCommonAncestorContainer(editable[0]);
    	
    	
    	
    	
    	//range.correctRange();
    	//range.update();
    	//GENTICS.Aloha.Selection.rangeObject = range;
	    while(--len >= 0) {
	    	if (files[len].size > GENTICS.Aloha.DragAndDropFiles.config.drop.max_file_size) {
	    		event.stopPropagation();
	    		GENTICS.Aloha.Log.warn(GENTICS.Aloha.DragAndDropFiles,"max_file_size exeeded");
	    	    return false;
	    	}
	        //alert("testing " + files[i].name);
    	
        
        	//var simpleRange = new GENTICS.Utils.RangeObject();
        	//simpleRange.initializeFromUserSelection(e);
        	//simpleRange.correctRange();
        	//var	range = new GENTICS.Aloha.Selection.SelectionRange(simpleRange);
        	//range.select();
        	//range.endOffset = range.startOffset + 1;
        	//range.correctRange();
        	//range.update();
        	//range.select();
        	var config = GENTICS.Aloha.DragAndDropFiles.getEditableConfig(editable);
           	if (config.drop) {
        		var display = jQuery('<div class="GENTICS_drop_file_box"><div class="GENTICS_drop_file_icon GENTICS_drop_file_default"></div>' +
        				'<div class="GENTICS_drop_file_details">'+ files[len].name +'</div></div>');
        		display.data('file',files[len]);
        		//target.parent().append(display);
        		GENTICS.Utils.Dom.insertIntoDOM(display,range, editable);// jQuery(GENTICS.Aloha.activeEditable.obj));
        		GENTICS.Aloha.EventRegistry.trigger(
        				new GENTICS.Aloha.Event('dropFileInEditable', GENTICS.Aloha, {
        					'file':files[len],
        					'display': display,
        					'range': range,
        					'editable': editable}));
           	} else {
            	GENTICS.Aloha.EventRegistry.trigger(
            			new GENTICS.Aloha.Event('dropFileInPage', GENTICS.Aloha,files[len]));
           	}
        } //while
        }//else 
        	
    return false;
};

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
