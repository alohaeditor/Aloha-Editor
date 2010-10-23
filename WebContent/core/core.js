/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
if (typeof GENTICS == 'undefined' || !GENTICS) {
	/*!
	 * The GENTICS global namespace object. If GENTICS is already defined, the
	 * existing GENTICS object will not be overwritten so that defined
	 * namespaces are preserved.
	 */
	var GENTICS = {};
}

/**
 * Base Aloha Object
 * @namespace GENTICS.Aloha
 * @class Aloha The Aloha base object, which contains all the core functionality
 * @singleton
 */
GENTICS.Aloha = function () {};

// determine path of aloha for configuration
GENTICS.Aloha.setAutobase = function () {
	var scriptTags = document.getElementsByTagName('script');
	var path = scriptTags[scriptTags.length-1].src.split('?')[0]; // use last script tag (others are not yet parsed), remove any ?query
	path = path.split('/');
	var substitute = 1;
	// included by include-js.inc so it is referenced by the "core/" path
	if ('core' === path[path.length -2]) {
		substitute = 2;
	}
	GENTICS.Aloha.prototype.autobase = path.slice(0, substitute * -1).join('/') + '/';
};
GENTICS.Aloha.setAutobase();

// provide aloha version, is automatically set during build process
GENTICS.Aloha.prototype.version='##ALOHAVERSION##';

/**
 * Array of editables that are managed by Aloha
 * @property
 * @type Array
 */
GENTICS.Aloha.prototype.editables = new Array();

/**
 * The currently active editable is referenced here
 * @property
 * @type GENTICS.Aloha.Editable
 */
GENTICS.Aloha.prototype.activeEditable = null;

/**
 * Flag to mark whether Aloha is ready for use. Will be set at the end of the init() Function.
 * @property
 * @type boolean
 */
GENTICS.Aloha.prototype.ready = false;

/**
 * The aloha dictionaries
 * @hide
 */
GENTICS.Aloha.prototype.dictionaries = {};

/**
 * settings object, which will contain all Aloha settings
 * @cfg {Object} object Aloha's settings
 */
GENTICS.Aloha.prototype.settings = {};


/**
 * This represents the name of the users OS. Could be:
 * 'Mac', 'Linux', 'Win', 'Unix', 'Unknown'
 * @property
 * @type string
 */
GENTICS.Aloha.prototype.OSName = "Unknown";

/**
 * Array of callback functions to call when Aloha is ready
 * @property
 * @type Array
 * @hide
 */
GENTICS.Aloha.prototype.readyCallbacks = new Array();

/**
 * Initialize Aloha
 * called automatically by the loader
 * @event the "ready" event is triggered as soon as Aloha has finished it's initialization process
 * @hide
 */
GENTICS.Aloha.prototype.init = function () {
	// check browser version on init
	// this has to be revamped, as 
	if (jQuery.browser.webkit && parseFloat(jQuery.browser.version) < 532.5 || // Chrome/Safari 4
		jQuery.browser.mozilla && parseFloat(jQuery.browser.version) < 1.9 || // FF 3.5
		jQuery.browser.msie && jQuery.browser.version < 7 || // IE 7	
		jQuery.browser.opera) { // right now, Opera does not work :(
		alert("Sorry, your browser is not supported at the moment.");
		return;
	}
	
	
	var that = this;
	
	// register the body click event to blur editables
	jQuery('html').mousedown(function() {
		// if an Ext JS modal is visible, we don't want to loose the focus on
		// the editable as we assume that the user must have clicked somewhere
		// in the modal... where else could he click?
		// loosing the editable focus in this case hinders correct table
		// column/row deletion, as the table module will clean it's selection
		// as soon as the editable is deactivated. Furthermore you'd have to
		// refocus the editable again, which is just strange UX
		if (that.activeEditable && !that.isMessageVisible()) {
			that.activeEditable.blur();
			that.FloatingMenu.setScope('GENTICS.Aloha.empty');
			that.activeEditable = null;
		}
	});
	
	// initialize the base path to the aloha files
	if (typeof this.settings.base == 'undefined' || !this.settings.base) {
		this.settings.base = GENTICS.Aloha.autobase;
		if (typeof GENTICS_Aloha_base != 'undefined') {
			this.settings.base = GENTICS_Aloha_base;
		}
	}

	// initialize the Log
	this.Log.init();

	// initialize the error handler for general javascript errors
	if (!(this.settings.errorhandling == false)) {
		window.onerror = function (msg, url, linenumber) {
			GENTICS.Aloha.Log.error(GENTICS.Aloha, 'Error message: ' + msg + '\nURL: ' + url + '\nLine Number: ' + linenumber);
			// TODO eventually add a message to the message line?
			return true;
		};
	}

	// OS detection
	if (navigator.appVersion.indexOf("Win") != -1) {
		this.OSName = "Win";
	}
	if (navigator.appVersion.indexOf("Mac") != -1) {
		this.OSName = "Mac";
	}
	if (navigator.appVersion.indexOf("X11") != -1) {
		this.OSName = "Unix";
	}
	if (navigator.appVersion.indexOf("Linux") != -1) {
		this.OSName = "Linux";
	}
	
	// initialize the Aloha core components
	this.initI18n();
	this.PluginRegistry.init();
	this.RepositoryManager.init();
	this.Ribbon.init();
	this.FloatingMenu.init();

	// internationalize ext js message box buttons
	Ext.MessageBox.buttonText.yes = GENTICS.Aloha.i18n(this, 'yes');
	Ext.MessageBox.buttonText.no = GENTICS.Aloha.i18n(this, 'no');
	Ext.MessageBox.buttonText.cancel = GENTICS.Aloha.i18n(this, 'cancel');
	Ext.ux.AlohaAttributeField.prototype.listEmptyText = GENTICS.Aloha.i18n( GENTICS.Aloha, 'repository.no_item_found' );
	Ext.ux.AlohaAttributeField.prototype.loadingText = GENTICS.Aloha.i18n( GENTICS.Aloha, 'repository.loading' ) + '...';
	
	// set aloha ready
	this.ready = true; 

	// activate registered editables
	for (var i = 0; i < this.editables.length; i++) {
		if ( !this.editables[i].ready ) {
			this.editables[i].init();
		}
	}
	
	GENTICS.Aloha.EventRegistry.trigger(
		new GENTICS.Aloha.Event("ready", GENTICS.Aloha, null)
	);
};

/**
 * Activates editable and deactivates all other Editables
 * @param {Editable} editable the Editable to be activated
 * @return void
 */
GENTICS.Aloha.prototype.activateEditable = function (editable) {

	// blur all editables, which are currently active
	for (var i = 0; i < this.editables.length; i++) {
		if (this.editables[i] != editable && this.editables[i].isActive) {
			// remember the last editable for the editableActivated event
			var oldActive = this.editables[i]; 
			this.editables[i].blur();
		}
	}
	
	this.activeEditable = editable;
};

/**
 * Returns the current Editable
 * @return {Editable} returns the active Editable
 */
GENTICS.Aloha.prototype.getActiveEditable = function() {
	return this.activeEditable;
};

/**
 * deactivated the current Editable
 * @return void
 */
GENTICS.Aloha.prototype.deactivateEditable = function () {
	
	if ( typeof this.activeEditable == 'undefined' || this.activeEditable == null ) {
		return;
	}

	// blur the editable
	this.activeEditable.blur();
	
	// set scope for floating menu
	this.FloatingMenu.setScope('GENTICS.Aloha.empty');
	
	this.activeEditable = null;
};

/**
 * Gets an editable by an ID or null if no Editable with that ID registered.
 * @param {string} id the element id to look for.
 * @return {GENTICS.Aloha.Editable} editable
 */
GENTICS.Aloha.prototype.getEditableById = function (id) {
	
	// serach all editables for id
	for (var i = 0; i < GENTICS.Aloha.editables.length; i++) {
		if (GENTICS.Aloha.editables[i].getId() == id) {
			return GENTICS.Aloha.editables[i];
		}
	}
	
	return null;
};

/**
 * Logs a message to the console
 * @param level Level of the log ("error", "warn" or "info", "debug")
 * @param component Component that calls the log
 * @param message log message
 * @return void
 * @hide
 */
GENTICS.Aloha.prototype.log = function(level, component, message) {
	GENTICS.Aloha.Log.log(level, component, message);
};

/**
 * build a string representation of a jQuery or DOM object
 * @param object to be identified
 * @return string representation of the object
 * @hide
 */
GENTICS.Aloha.prototype.identStr = function (object) {
	if (object instanceof jQuery) {
		object = object[0];
	}
	if (!(object instanceof HTMLElement)) { 
		GENTICS.Aloha.Log.warn(this, '{' + object.toString() + '} provided is not an HTML element');
		return object.toString();
	}

	var out = object.tagName.toLowerCase();
	
	// an id should be unique, so we're okay with that
	if (object.id) {
		return out + '#' + object.id; 
	}
	
	// as there was no id, we fall back to the objects class 
	if (object.className) {
		return out + '.' + object.className;
	}
	
	// could not identify object by id or class name - so just return the tag name
	return out;
};

/**
 * a basic trim function as found on
 * http://blog.stevenlevithan.com/archives/faster-trim-javascript
 * 
 * @param str
 *            to be trimmed
 * @return trimmed string
 * @hide
 */
GENTICS.Aloha.prototype.trim = function(str) {
	str = str.replace(/^\s+/, '');
	for (var i = str.length - 1; i >= 0; i--) {
		if (/\S/.test(str.charAt(i))) {
			str = str.substring(0, i + 1);
			break;
		}
	}
	return str;
};

/**
 * Initialize i18n, load the dictionary file
 * Languages may have format as defined in 
 * http://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.10
 * All language codes available http://www.loc.gov/standards/iso639-2/php/langcodes-search.php
 * 
 * @hide
 */
GENTICS.Aloha.prototype.initI18n = function() {
	
	if (typeof this.settings.i18n == 'undefined' || !this.settings.i18n) {
		this.settings.i18n = {};
	}

	// TODO read dict files automatically on build. Develop only with "en"
	if (typeof this.settings.i18n.available == 'undefined' 
		|| !this.settings.i18n.available 
		|| !this.settings.i18n.available instanceof Array) {
		
		this.settings.i18n.available = ['en', 'de', 'fr', 'eo', 'fi', 'ru', 'it', 'pl'];
	}

	/* 
	 * try to guess ACCEPT-LANGUAGE from http header
	 * reference http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.4
	 * ACCEPT-LANGUAGE 'de-de,de;q=0.8,it;q=0.6,en-us;q=0.7,en;q=0.2';
	 * Any implementation has to set it server side because this is not
	 * accessible by JS. http://lists.w3.org/Archives/Public/public-html/2009Nov/0454.html
	*/ 
	if ( (typeof this.settings.i18n.current == 'undefined' || !this.settings.i18n.current) &&
		typeof this.settings.i18n.acceptLanguage == 'string' ) {

		var acceptLanguage = [];
		// Split the string from ACCEPT-LANGUAGE
	    var preferredLanugage = this.settings.i18n.acceptLanguage.split(",");
	    for(i = 0; i < preferredLanugage.length; i++){
	    	
	    	// split language setting
	    	var lang = preferredLanugage[i].split(";");
	    	
	    	// convert quality to float
	    	if ( typeof lang[1] == 'undefined' || !lang[1] ) {
	    	  lang[1] = 1;
	    	} else {
	    	  lang[1] = parseFloat(lang[1].substring(2, lang[1].length)); 
	    	}
	    	
	    	// add converted language to accepted languages
	    	acceptLanguage.push(lang);
	    }
	    
	    // sort by quality
	    acceptLanguage.sort(function (a,b) {return b[1] - a[1];});
	    
	    // check in sorted order if any of preferred languages is available
	    for(i = 0; i < acceptLanguage.length; i++) {
	    	if ( jQuery.inArray(acceptLanguage[i][0], this.settings.i18n.available) >= 0 ) {
	    		this.settings.i18n.current = acceptLanguage[i][0];
	    		break;
	    	}
	    }
	}

	/*
	 * default language from for the browser navigator API.
	 */ 
	if (typeof this.settings.i18n.current == 'undefined' || !this.settings.i18n.current) {
		this.settings.i18n.current = (navigator.language
				? navigator.language       // gecko/webkit/opera
				: navigator.userLanguage   // IE
		);
	}

	// determine the actual language based on current and available languages
	var actualLanguage = this.getLanguage(this.settings.i18n.current, this.settings.i18n.available);

	if (!actualLanguage) {
		GENTICS.Aloha.Log.error(this, 'Could not determine actual language.');
	} else {
		// TODO load the dictionary file for the actual language
		var fileUrl = this.settings.base + 'i18n/' + actualLanguage + '.dict';
		this.loadI18nFile(fileUrl, this);
	}
};


/**
 * Check is language is among available languages
 * @method
 * @param {String} language language to be set
 * @param {Array} availableLanguages list of available languages
 * @return the actual language as a string
 */
GENTICS.Aloha.prototype.getLanguage = function(language, availableLanguages) {
	
	if (!availableLanguages instanceof Array) {
		GENTICS.Aloha.Log.error(this, 'Available languages must be an Array');
		return null;
	}
	
	if (typeof language == 'undefined' || !language) {
		return availableLanguages[0];
	}
	
	for (var i = 0; i < availableLanguages.length; ++i) {
		if (language == availableLanguages[i]) {
			return language;
		}
	}

	return availableLanguages[0];
};

/**
 * parses an i18n file
 * @param {String} fileUrl
 * @param {String} component
 * @hide
 */
GENTICS.Aloha.prototype.loadI18nFile = function(fileUrl, component) {
	// Note: this ajax request must be done synchronously, because the otherwise
	// the first i18n calls might come before the dictionary is available
	jQuery.ajax(
		{
			async : false,
			datatype : 'text',
			url : fileUrl,
			error: function(request, textStatus, error) {
				GENTICS.Aloha.Log.error(component, 'Error while getting dictionary file ' + fileUrl + ': server returned ' + textStatus);
			},
			success: function(data, textStatus, request) {
				if (GENTICS.Aloha.Log.isInfoEnabled()) {
					GENTICS.Aloha.Log.info(component, 'Loaded dictionary file ' + fileUrl);
				}
				GENTICS.Aloha.parseI18nFile(data, component);
			}
		}
	);
};

/**
 * 
 * @param data
 * @param component
 * @hide
 */
GENTICS.Aloha.prototype.parseI18nFile = function(data, component) {
	data = data.replace(/\r/g, '');
	var entries = data.split('\n');
	var dictionary = new Object();
	for (var i = 0; i < entries.length; ++i) {
		var entry = entries[i];
		var equal = entry.indexOf('=');
		if (equal > 0) {
			var key = GENTICS.Aloha.trim(entry.substring(0, equal));
			var value = GENTICS.Aloha.trim(entry.substring(equal + 1, entry.length));
			value = value.replace(/\\n/g, '\n');
			value = value.replace(/\\\\/g, '\\');

			// check for duplicate keys and print a warning
			if (dictionary[key]) {
				GENTICS.Aloha.Log.warn(component, 'Found duplicate key ' + key + ' in dictionary file, ignoring');
			} else {
				dictionary[key] = value;
			}
		}
	}

	this.dictionaries[component.toString()] = dictionary;
};

/**
 * Method to translate the given key for the given component either from the component dictionary, or from the Aloha core library.
 * @method
 * @param {String} component component for which the key shall be localized
 * @param {String} key key to be localized
 * @param {Array} replacements array of replacements 
 * @return localized string
 */
GENTICS.Aloha.prototype.i18n = function(component, key, replacements) {
	var value = null;

	// first get the dictionary for the component
	if (this.dictionaries[component.toString()]) {
		if (this.dictionaries[component.toString()][key]) {
			value = this.dictionaries[component.toString()][key];
		}
	}

	// when the value was not found and component is not GENTICS.Aloha, do a fallback
	if (!value && component != GENTICS.Aloha) {
		if (this.dictionaries[GENTICS.Aloha.toString()]) {
			if (this.dictionaries[GENTICS.Aloha.toString()][key]) {
				value = this.dictionaries[GENTICS.Aloha.toString()][key];
			}
		}
	}

	// value still not found, so output the key
	if (!value) {
		return '??? ' + key + ' ???';
	} else {
		// substitute placeholders
		if (typeof replacements != 'undefined' && replacements != null) {
			for ( var i = 0; i < replacements.length; ++i) {
				if (typeof replacements[i] != 'undefined' && replacements[i] != null) {
					var regEx = new RegExp('\\{' + (i) + '\\}', 'g');
					var safeArgument = replacements[i].toString().replace(/\{/g, '\\{');
					safeArgument = safeArgument.replace(/\}/g, '\\}');
					value = value.replace(regEx, safeArgument);
				}
			}
		}

		value = value.replace(/\{\d\}/g, '');
		value = value.replace(/\\\{/g, '{');
		value = value.replace(/\\\}/g, '}');
		return value;
	}
};


/**
 * Register the given editable
 * @param editable editable to register
 * @return void
 * @hide
 */
GENTICS.Aloha.prototype.registerEditable = function (editable) {
	this.editables.push(editable);
};

/**
 * Unregister the given editable. It will be deactivated and removed from editables.
 * @param editable editable to unregister
 * @return void
 * @hide
 */
GENTICS.Aloha.prototype.unregisterEditable = function (editable) {
	
	// Find the index
	var id = this.editables.indexOf( editable ); 
	// Remove it if really found!
	if (id != -1) {
		this.editables.splice(id, 1); 
	}
};

/**
 * Displays a message according to it's type
 * @method
 * @param {GENTICS.Aloha.Message} message the GENTICS.Aloha.Message object to be displayed
 */
GENTICS.Aloha.prototype.showMessage = function (message) {
	
	if (GENTICS.Aloha.FloatingMenu.obj) {
		GENTICS.Aloha.FloatingMenu.obj.css('z-index', 8900);
	}
	
	switch (message.type) {
		case GENTICS.Aloha.Message.Type.ALERT:
		    Ext.MessageBox.alert(message.title, message.text, message.callback);
		    break;
		case GENTICS.Aloha.Message.Type.CONFIRM:
		    Ext.MessageBox.confirm(message.title, message.text, message.callback);
		    break;
		case GENTICS.Aloha.Message.Type.WAIT:
		    Ext.MessageBox.wait(message.text, message.title);
		    break;
		default:
			this.log('warn', this, 'Unknown message type for message {' + message.toString() + '}');
			break;
	}
};

/**
 * Hides the currently active modal, which was displayed by showMessage()
 * @method
 */
GENTICS.Aloha.prototype.hideMessage = function () {
	Ext.MessageBox.hide();
};

/**
 * checks if a modal dialog is visible right now
 * @method
 * @return true if a modal is currently displayed
 */
GENTICS.Aloha.prototype.isMessageVisible = function () {
	return Ext.MessageBox.isVisible();
};

/**
 * String representation
 * @hide
 */
GENTICS.Aloha.prototype.toString = function () {
	return 'GENTICS.Aloha';
};

/**
 * Check whether at least one editable was modified
 * @method
 * @return {boolean} true when at least one editable was modified, false if not
 */
GENTICS.Aloha.prototype.isModified = function () {
	// check if something needs top be saved
	for (var i in this.editables) {
		if (this.editables[i].isModified) {
			if (this.editables[i].isModified()) {
				return true;
			}
		}
	}

	return false;
};

GENTICS.Aloha = new GENTICS.Aloha();

/**
 * TODO move to util
 * reimplementation of indexOf for current Microsoft Browsers
 * IE does not support indexOf() for Arrays
 * @param object to look for
 * @return index of obj in Array or -1 if not found
 * @hide
 */
if(!Array.indexOf){
	Array.prototype.indexOf = function(obj){
		for(var i=0; i<this.length; i++){
		    if(this[i]===obj){
		     return i;
		    }
	   	}
	   	return -1;
	};
}

/**
 * Initialize Aloha when the dom is ready and Ext is ready
 * @hide
 */
jQuery(document).ready(function() {
	if (Ext.isReady) {
		GENTICS.Aloha.init();
	} else {
		Ext.onReady(function() {
			GENTICS.Aloha.init();
		});
	}
});