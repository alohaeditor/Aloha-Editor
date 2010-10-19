/**
 * Drag and Drop files plugin for Aloha
 * 
 * Handles drag and drop for files
 * copyright (c) 2010 Nicolas Karageuzian - http://nka.me/
 */

GENTICS.Aloha.DnDFile = new GENTICS.Aloha.Plugin("com.gentics.aloha.plugins.DragnDropFiles");
GENTICS.Aloha.DnDFile.languages=[];
GENTICS.Aloha.DnDFile.config = { 'drop' : {	'max_file_size': '200000',
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
	GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'editableCreated', function(event, editable) {
		config = that.getEditableConfig(editable);
		if (config.drop) {
			editable.obj[0].dropFileConfig = config.drop;
			editable.obj[0].addEventListener('drop', that.dropEventHandler, false);
		}
	});
}

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
					}
					var files = e.dataTransfer.files;
				    var count = files.length;
				    // if no files where dropped, use default handler
				    if (count < 1) {
				    	event.sink = false;
				        return true;
				    }
				    var len = files.length;
				    while(--len >= 0) {
				    	GENTICS.Aloha.EventRegistry.trigger(
				        		new GENTICS.Aloha.Event('dropFile', GENTICS.Aloha,file));
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

GENTICS.Aloha.DnDFile.dropEventHandler = function(event){
	var editable = null;
	target = jQuery(event.target);
	if (target.hasClass('GENTICS_editable')) {
		editable = target;
		target.append('<div></div>');
		target = target.children(':last');
	} else {
		editable = target.parent('.GENTICS_editable');
	}
	var	range = new GENTICS.Aloha.Selection.SelectionRange();
	var e = event;
    event.sink = true;
    var files = e.dataTransfer.files;
    var count = files.length;
    // if no files where dropped, use default handler
    if (count < 1 || jQuery.inArray('drop', config) != -1) {
    	event.sink = false;
        return true;
    }
	range.update(target);
	range.startContainer = target;
	range.endContainer = target;
	range.correctRange();
	
    var len = files.length;
    
    // parameter for event handler :
    // {'file': file, 'img': img}
    while(--len >= 0) {
    	
        //alert("testing " + files[i].name);
        var display = jQuery('<p class="GENTICS_default_file_icon"></p>');
        
        GENTICS.Utils.Dom.insertIntoDOM(display,range, editable);
        GENTICS.Aloha.EventRegistry.trigger(
        		new GENTICS.Aloha.Event('dropFileInEditable', GENTICS.Aloha, {
        			'file':files[len],
        			'display': display,
        			'range': range,
        			'editable': editable}));
        
        
    } //while
    return false;
};