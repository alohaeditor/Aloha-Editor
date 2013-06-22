// initialize Aloha settings
Aloha.settings = {
	logLevels: {
		'error': true,
		'warn': true,
		'info': false,
		'debug': false,
		'deprecated': true
	},
	errorhandling: false,
	locale: 'en',
	sidebar: {
		disabled: true
	},
	plugins: {
		DragNDropImgs: {
			config: {
				'dropHandlerCallback'	: function(imgObj, callback) {

											// your callback may look like this...
											window.MY_CALLBACK_FUNCTION.call(null, imgObj, callback);

										},
				/*
				// If you pass a dropHandlerCallback, then the uploadHandler is ignored.
				'uploadHandler':		{
											'url': null,
											'method': 'post',
											'success': function (data) {
												// handler for success
												console.log(data);
											},
											'error': function (data) {
												// handler for error
												console.log(data);
											}
										},
				*/
				'max_img_size'			: 3145728,
				'max_img_count'			: 1,
				'accept_mimes'			: 'image/gif,image/jpeg,image/jpg,image/png'
			}
		}
};