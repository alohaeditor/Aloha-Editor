/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

GENTICS.Aloha.LinkChecker = new GENTICS.Aloha.Plugin('com.gentics.aloha.plugins.linkchecker');

/**
 * Configure the available languages
 * http://en.wikipedia.org/wiki/List_of_HTTP_status_codes
 */
GENTICS.Aloha.LinkChecker.languages = ['en'];

/**
 * All error codes that have an explanation.
 */
GENTICS.Aloha.LinkChecker.errorCodes = [400, 401, 402, 403, 404, 405,
                                        406, 407, 408, 409, 410, 411,
                                        412, 413, 414, 415, 416, 417,
                                        418, 422, 423, 424, 425, 426,
                                        449, 450, 500, 501, 502, 503,
                                        504, 505, 506, 507, 509, 510];
/**
 * This codes are asumed temporary errors.
 */
GENTICS.Aloha.LinkChecker.warningCodes = [404, 411, 412, 413, 426, 449,
                                          450, 500, 503, 504, 505, 507,
                                          509, 510];


/**
 * Initialize the plugin and set initialize flag on true
 */
GENTICS.Aloha.LinkChecker.init = function () {

	// initialize the timer
	this.timer = {};
	
	// remember reference to this class for callback
	var that = this;

	stylePath = GENTICS_Aloha_base + '/plugins/com.gentics.aloha.plugins.LinkChecker/css/LinkChecker.css';
	jQuery('<link rel="stylesheet" />').attr('href', stylePath).appendTo('head');

	// mark active Editable with a css class
	GENTICS.Aloha.EventRegistry.subscribe(
			GENTICS.Aloha, 
			"editableActivated", 
			function (jEvent, aEvent) {
				// find all link tags
				aEvent.editable.obj.find('a').each(function() {
					that.checkLink(this, 0);
				});
			} 
	);

	// remove active Editable ccs class
	GENTICS.Aloha.EventRegistry.subscribe(
			GENTICS.Aloha, 
			"editableDeactivated", 
			function (jEvent, aEvent) {
				// remove link marks
				that.makeClean(aEvent.editable.obj);
			}
	);

	// remove active Editable ccs class
	GENTICS.Aloha.EventRegistry.subscribe(
			GENTICS.Aloha, 
			"hrefChanged", 
			function (jEvent, aEvent) {
				that.checkLink(aEvent.obj);
			}
	);

};

GENTICS.Aloha.LinkChecker.checkLink = function (obj, delay, timeout) {
	
	var that = this;
	
	// extract url from link object
	var url = jQuery(obj).attr('href');
	
	if ( !url ) {
		return;
	}
	
	this.timer[url] = this.urlExists(
		url, 
		// success
		function(xhr) {
			that.makeCleanLink(obj);
		},
		//failure
		function(xhr) {
			if ( obj ) {
				if ( jQuery.inArray(xhr.status, that.errorCodes) >= 0 ) {
					var e = xhr.status;
				} else {
					var e = '0';
				}
				var o = jQuery(obj);
				if ( o.attr('title') ) {
					o.attr('data-title', o.attr('title'));
				}
				o.attr('title', url+'. '+that.i18n('error.'+e));
				if ( jQuery.inArray(xhr.status, that.warningCodes) >= 0 ) {					
					o.addClass('GENTICS_link_warn');
				} else {
					o.addClass('GENTICS_link_error');
				}
			}
		}, 
		this.timer[url], 
		timeout, 
		delay
	);
};

GENTICS.Aloha.LinkChecker.urlExists = function (url, successFunc, failureFunc, timer, timeout, delay) {
	
	// abort timer for that request
	clearTimeout(timer);
	
	delay = (delay != null && delay != undefined ) ? delay : 700;

	// start timer for delayed request
    var newTimer = setTimeout( function() {
    	
    	// start request 
		var myXHR = jQuery.ajax({
			url: url,
			timeout: timeout ? 10000 : timeout,
			type: 'HEAD',
			complete: function(xhr) {
				// abort timer for that request
				clearTimeout(newTimer);
				try {
					// if response HTTP status 200 link is ok
					// this implementation does NOT cover redirects!
				    if (xhr.status == 200) {
				    	successFunc.call(this, xhr); 
				    } else {
						failureFunc.call(this, xhr);
				  	}
				} catch(e) {
					failureFunc.call(this, {'status':0});
				}
			}
		}); 
		
	}, delay);
    
	return newTimer;
};

GENTICS.Aloha.LinkChecker.makeCleanLink = function (obj) {
	if ( obj ) {
		var o = jQuery(obj);
		if ( o.attr('data-title') ) {
			o.attr('title', o.attr('data-title'));
		}
		o.removeAttr('data-title');
		o.removeClass('GENTICS_link_error');
		o.removeClass('GENTICS_link_warn');
	}
};

GENTICS.Aloha.LinkChecker.makeClean = function (editable) {
	var that = this;
	// find all link tags
	editable.find('a').each(function() {
		that.makeCleanLink(this);
	});
};