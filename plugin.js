/**
 * Drag and Drop files plugin for Aloha
 * 
 * Handles drag and drop for files
 * copyright (c) 2010 Nicolas Karageuzian - http://nka.me/
 */

GENTICS.Aloha.DnDFile = new GENTICS.Aloha.Plugin("com.gentics.aloha.plugins.DragnDropFiles");
GENTICS.Aloha.DnDFile.languages=[];
GENTICS.Aloha.DnDFile.config = { 'drop' : {	'max_file_size': 200000,
											'max_file_count': 2,
											'upload': {'url': "",
												'file_name_param':"",
												'additional_params': {"location":""},
												'www-encoded': false },
											}
								};

GENTICS.Aloha.DnDFile.init = function() {
	var that = this;
	console.log(this);
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
	stylePath = GENTICS_Aloha_base + '/plugins/com.gentics.aloha.plugins.DragnDropFiles/style.css';
	jQuery('<link rel="stylesheet" />').attr('href', stylePath).appendTo('head');
	this.subscribeEvents();
};

/**
 *  Attach drag and drop listeners to document body
 * this prevents incorrect drops, reloading the page with the dropped item
 * This may or may not be helpful
 */
GENTICS.Aloha.DnDFile.sinkBodyEvent = function() {
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
				    if (len > GENTICS.Aloha.DnDFile.config.drop.max_file_count) {
				    	GENTICS.Aloha.log.warn(GENTICS.Aloha.DnDFile,"too much files dropped");
				    	event.stopEvent();
				    	return true;
				    }
				    //max_file_count
				    while(--len >= 0) {
				    	if (files[len].size <= GENTICS.Aloha.DnDFile.config.drop.max_file_size) {
					    	GENTICS.Aloha.EventRegistry.trigger(
			            			new GENTICS.Aloha.Event('dropFileInPage', GENTICS.Aloha,files[len]));
				    	} else {
				    		//TODO: Too big file
				    		GENTICS.Aloha.log.warn(GENTICS.Aloha.DnDFile,"max_file_size exeeded");
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
GENTICS.Aloha.DnDFile.subscribeEvents = function () {
	var that = this;
	 GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'selectionChanged', function(event, rangeObject) {
		 if (that.selectedFile != null) {
			 that.selectedFile = null;
		 }
		 var foundMarkup = that.findFileObject( rangeObject );
		 //var config = that.getEditableConfig(GENTICS.Aloha.activeEditable.obj);
		 //console.log(config);
	 	});
};

GENTICS.Aloha.DnDFile.findFileObject = function(range) {
	if ( typeof range == 'undefined' ) {
        var range = GENTICS.Aloha.Selection.getRangeObject();   
    }
	try {
		if (range.startContainer)
			if (range.startContainer.childNodes)
				if (range.startOffset)
					if (range.startContainer.childNodes[range.startOffset])
	    if (range.startContainer.childNodes[range.startOffset].hasClass('GENTICS_drop_file_box')) {
			// console.log(range);
			result = range.startContainer.childNodes[range.startOffset];
			return result;
		}
	} catch (e) {
		GENTICS.Aloha.Log.debug(this,"Error finding fileobj markup.");
	}
    return null;
    
};

GENTICS.Aloha.DnDFile.dropEventHandler = function(event){
	var e = event;
	event.sink = true;
	var files = e.dataTransfer.files;
	var len = files.length;
	// if no files where dropped, use default handler
	if (len < 1) {
		event.sink = false;
		return true;
	}

	if (len > GENTICS.Aloha.DnDFile.config.drop.max_file_count) {
		event.stopPropagation();
		GENTICS.Aloha.Log.warn(GENTICS.Aloha.DnDFile,"too much files dropped");
	    return false;
	}
	
	var editable = null;
	target = jQuery(event.target);
	//If drop in editable
	if (target.hasClass('GENTICS_editable')) {
		editable = target;
		target = editable.children(':last');
		if (target.hasClass('GENTICS_editable')) {
			editable.append('<p> </p>');
			target = editable.children(':last');
		}
	} else {
		editable = target.parent('.GENTICS_editable');
	}
	var	range = new GENTICS.Aloha.Selection.SelectionRange({
		   startContainer: target,
		   endContainer: target,
		   startOffset: event.rangeOffset,
		   endOffset: event.rangeOffset
	   });
	range.update();
    // parameter for event handler :
    // {'file': file, 'img': img}
    while(--len >= 0) {
    	if (files[len].size > GENTICS.Aloha.DnDFile.config.drop.max_file_size) {
    		event.stopPropagation();
    		GENTICS.Aloha.Log.warn(GENTICS.Aloha.DnDFile,"max_file_size exeeded");
    	    return false;
    	}
        //alert("testing " + files[i].name);
    	//nested space is needed in this tag, otherwise select won't success...
        if (editable[0] != null) {
        	var config = GENTICS.Aloha.DnDFile.getEditableConfig(editable);
           	if (config.drop) {
        		var display = jQuery('<div class="GENTICS_drop_file_box"><div class="GENTICS_drop_file_icon GENTICS_drop_file_default"></div>' +
        				'<div class="GENTICS_drop_file_details">'+ files[len].name +'</div></div>');
        		target.parent().append(display);
        		//GENTICS.Utils.Dom.insertIntoDOM(display,range, editable);
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
        } else {
        	GENTICS.Aloha.EventRegistry.trigger(
        			new GENTICS.Aloha.Event('dropFileInPage', GENTICS.Aloha,files[len]));
        }
    } //while
    event.stopPropagation();
    return false;
};