/*
 * Upload Handler Copyright (c) 2010 Nicolas Karageuzian
 */
/**
 * Uploader class
 * 
 * Successful upload server action response JSON :
 * <PRE>
 * {"success": true,
 *  "data": "File url on remote end"}
 * </pre>
 * 
 * 
 */
GENTICS.Aloha.Uploader = function(config) {
	this.initialConfig = config;
	imagebase = GENTICS_Aloha_base + '/plugins/com.gentics.aloha.plugins.DragAndDropFiles/resources/images/';
	this.iconStatusPending = imagebase + 'hourglass.png'
	this.iconStatusSending = imagebase + 'loading.gif'
	this.iconStatusAborted = imagebase + 'cross.png'
	this.iconStatusError = imagebase + 'cross.png'
	this.iconStatusDone = imagebase + 'tick.png'
	Ext.apply(this, config);
	var fields = ['id', 'name', 'size', 'status', 'progress'];
	this.fileRecord = Ext.data.Record.create(fields);
	var that = this;
	this.fileGrid = new Ext.grid.GridPanel({
				/*
				 * x:0 ,y:30 ,width:this.initialConfig.gridWidth || 420
				 * ,height:this.initialConfig.gridHeight || 200
				 * ,enableHdMenu:false
				 * 
				 */
				region: 'center',
				/*
				 * TODO: Expose this store as an Aloha registry
				 */
				store:new Ext.data.ArrayStore({
					fields: fields,
					reader: new Ext.data.ArrayReader({idIndex: 0}, this.fileRecord)
				}),
				columns:[
					{header:'File Name',dataIndex:'name', width:150}
					,{header:'Size',dataIndex:'size', width:60, renderer:Ext.util.Format.fileSize}
					,{header:'&nbsp;',dataIndex:'status', width:30, scope:that, renderer:that.statusIconRenderer}
					,{header:'Status',dataIndex:'status', width:60}
					,{header:'Progress',dataIndex:'progress',scope:that, renderer:that.progressBarColumnRenderer}
				]
			});
	this.items = [this.fileGrid];
	GENTICS.Aloha.Uploader.superclass.constructor.call(this);
}; // Constructor function

/**
 * Class description
 */
Ext.extend(GENTICS.Aloha.Uploader, Ext.Window, {
	statusIconRenderer:function(value){
		switch(value){
		default:
			return value;
		case 'Pending':
			return '<div class="GENTICS_uploader_status_icon"><img src="'+this.iconStatusPending+'" width=16 height=16></div>';
		case 'Sending':
			return '<div class="GENTICS_uploader_status_icon"><img src="'+this.iconStatusSending+'" width=16 height=16></div>';
		case 'Aborted':
			return '<div class="GENTICS_uploader_status_icon"><img src="'+this.iconStatusAborted+'" width=16 height=16></div>';
		case 'Error':
			return '<div class="GENTICS_uploader_status_icon"><img src="'+this.iconStatusError+'" width=16 height=16></div>';
		case 'Done':
			return '<div class="GENTICS_uploader_status_icon"><img src="'+this.iconStatusDone+'" width=16 height=16></div>';
		}
	},
	fileAlert:function(text){
		if(this.fileAlertMsg === undefined || !this.fileAlertMsg.isVisible()){
			this.fileAlertMsgText = 'Error uploading:<BR>'+text;
			this.fileAlertMsg = Ext.MessageBox.show({
				title:'Upload Error',
				msg: this.fileAlertMsgText,
				buttons: Ext.Msg.OK,
				modal:false,
				icon: Ext.MessageBox.ERROR
			});
		}else{
				this.fileAlertMsgText += text;
				this.fileAlertMsg.updateText(this.fileAlertMsgText);
				this.fileAlertMsg.getDialog().focus();
		}
		
	},
	progressBarColumnTemplate: new Ext.XTemplate(
			'<div class="GENTICS_uploader-progress-cell-inner GENTICS_uploader-progress-cell-inner-center GENTICS_uploader-progress-cell-foreground">',
				'<div>{value} %</div>',
			'</div>',
			'<div class="GENTICS_uploader-progress-cell-inner GENTICS_uploader-progress-cell-inner-center GENTICS_uploader-progress-cell-background" style="left:{value}%">',
				'<div style="left:-{value}%">{value} %</div>',
			'</div>'
    ),
	progressBarColumnRenderer:function(value, meta, record, rowIndex, colIndex, store){
        meta.css += ' x-grid3-td-progress-cell';
		return this.progressBarColumnTemplate.apply({
			value: value
		});
	},
	
	/**
	 * 
	 */
	updateFile:function(fileRec, key, value){
		fileRec.set(key, value);
		fileRec.commit();
	},
	/**
	 * Add a file to upload in the grid
	 */
	addFileUpload: function(file,url) {
		Ext.apply(file,{
			id: ++this.fileId
			,status: 'Pending'
			,progress: '0'
			,complete: '0'
		});
		try {
			var fileRec = new this.fileRecord(file);
			fileRec.file = file;
			if (url === undefined) {
				url = this.url;
			}
			fileRec.url = url;
			this.fileGrid.store.add(fileRec);
			return fileRec.id;
		} catch (error) {
			// TODO : error handling
			console.log(error);
		}
	},
	startFileUpload: function(id) {
		try {
			var fileRec = this.fileGrid.store.getById(id);
			var file = fileRec.file;
			// File upload process
			upload = new Ext.ux.XHRUpload({
				// TODO: make this configurable
				method:this.method
				,url: fileRec.url
				,filePostName:this.file_name_param
				,fileNameHeader:this.file_name_header
				,extraHeaders:this.extra_headers
				,extraPostData:this.extra_post_data
				,sendMultiPartFormData:false
				,file:file
				,listeners:{
					scope:this
					,uploadloadstart:function(event){
						this.updateFile(fileRec, 'status', 'Sending');
					}
					,uploadprogress:function(event){
						this.updateFile(fileRec, 'progress', Math.round((event.loaded / event.total)*100));
					}
					// XHR Events
					,loadstart:function(event){
						this.updateFile(fileRec, 'status', 'Sending');
					}
					,progress:function(event){
						fileRec.set('progress', Math.round((event.loaded / event.total)*100) );
						fileRec.commit();
					}
					,abort:function(event){
						this.updateFile(fileRec, 'status', 'Aborted');
						GENTICS.Aloha.EventRegistry.trigger(
			        			new GENTICS.Aloha.Event('UploadFailure', GENTICS.Aloha,fileRec));
						this.fireEvent('fileupload', this, false, {error:'XHR upload aborted'});
					}
					,error:function(event){
						this.updateFile(fileRec, 'status', 'Error');
						GENTICS.Aloha.EventRegistry.trigger(
			        			new GENTICS.Aloha.Event('UploadFailure', GENTICS.Aloha,fileRec));
						this.fireEvent('fileupload', this, false, {error:'XHR upload error'});
					}
					,load:function(event){
						
						try{
							var result = Ext.util.JSON.decode(upload.xhr.responseText);// throws
																						// a
																						// SyntaxError.
						}catch(e){
							Ext.MessageBox.show({
								buttons: Ext.MessageBox.OK
								,icon: Ext.MessageBox.ERROR
								,modal:false
								,title:'Upload Error!'
								,msg:'Invalid JSON Data Returned!<BR><BR>Please refresh the page to try again.'
							});
							this.updateFile(fileRec, 'status', 'Error');
							GENTICS.Aloha.EventRegistry.trigger(
				        			new GENTICS.Aloha.Event('UploadFailure', GENTICS.Aloha,fileRec));
							this.fireEvent('fileupload', this, false, {error:'Invalid JSON returned'});
							return true;
						}
						if( result.success ){
							fileRec.set('progress', 100 );
							fileRec.set('status', 'Done');
							fileRec.commit();		
							GENTICS.Aloha.EventRegistry.trigger(
				        			new GENTICS.Aloha.Event('UploadSuccess', GENTICS.Aloha,{file: fileRec,result:result}));
							this.fireEvent('fileupload', this, true, result);
						}else{
							this.fileAlert('<BR>'+file.name+'<BR><b>'+result.error+'</b><BR>');
							this.updateFile(fileRec, 'status', 'Error');
							GENTICS.Aloha.EventRegistry.trigger(
				        			new GENTICS.Aloha.Event('UploadFailure', GENTICS.Aloha,fileRec));
							this.fireEvent('fileupload', this, false, result);
						}
					} // on load
				}, // listeners
			}); // XHRUpload
			upload.send();
		} catch (error) {
			// TODO : error handling
			console.log(error);
		}
	}
	
});