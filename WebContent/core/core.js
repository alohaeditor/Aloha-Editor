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
}
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
 * Initialize Aloha
 * called automatically by the loader
 * @hide
 */
GENTICS.Aloha.prototype.init = function () {
	var that = this;
	
	// register the body click event to blur editables
	jQuery('html').mousedown(function() {
		// if an Ext JS modal is visible, we don't want to loose the focus on
		// the editable as we assume that the user must have clicked somewhere
		// in the modal... where else could he click?
		// loosing the editalbe focus in this case hinders correct table
		// column/row deletion, as the table module will clean it's selection
		// as soon as the editable is deactivated. Furthermore you'd have to
		// refocus the editable again, which is just strange UX
		if (that.activeEditable && !that.isMessageVisible()) {
			that.FloatingMenu.setScope('GENTICS.Aloha.empty');
			that.activeEditable.blur();
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

	// initialize the dictionary for Aloha itself
	this.initI18n();

	// initialize all plugins
	this.PluginRegistry.init();
	// TODO call init on all other Aloha Core objects (messageline, etc.)
	
	// intitialize the ribbon
	this.Ribbon.init();

	// initialize the floatingmenu
	this.FloatingMenu.init();

	// highlight editables as long as the mouse is moving
	GENTICS.Utils.Position.addMouseMoveCallback(function () {
		that.highlightEditables();
	});

	// fade editable borders when mouse stops moving
	GENTICS.Utils.Position.addMouseStopCallback(function () {
		that.fadeEditables();
	});

	// internationalize ext js message box buttons
	Ext.MessageBox.buttonText.yes = GENTICS.Aloha.i18n(this, 'yes');
	Ext.MessageBox.buttonText.no = GENTICS.Aloha.i18n(this, 'no');
	Ext.MessageBox.buttonText.cancel = GENTICS.Aloha.i18n(this, 'cancel');
	
	// set aloha ready
	this.ready = true;

	// editable have to be initialized AFTER Aloha is ready
	for ( var i = 0; i < this.editables.length; i++) {
		this.editables[i].init();
	}
};

/**
 * highlights all editables, and will be called when the mouse is moving
 * @return void
 * @hide
 */
GENTICS.Aloha.prototype.highlightEditables = function () {
	for ( var i = 0; i < this.editables.length; i++) {
		var editable = this.editables[i].obj;
		if (!this.activeEditable) {
			editable.addClass('GENTICS_editable_highlight');
		}
	}
};

/**
 * fades all highlighted editables
 * will be called when the mouse has stopped moving
 * @return void
 * @hide
 */
GENTICS.Aloha.prototype.fadeEditables = function () {
	for ( var i = 0; i < this.editables.length; i++) {
		var editable = this.editables[i].obj;
		if (editable.hasClass('GENTICS_editable_highlight')) {
			editable.removeClass('GENTICS_editable_highlight')
				.css('outline', '5px solid #FFE767')
				.animate({
					outlineWidth : '0px'
				}, 300, 'swing', function () {
					jQuery(this).css('outline', '');
				});
		}
	}
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
 * @hide
 */
GENTICS.Aloha.prototype.initI18n = function() {
	// TODO check whether current language an available languages
	if (typeof this.settings.i18n == 'undefined' || !this.settings.i18n) {
		this.settings.i18n = {};
	}

	if (typeof this.settings.i18n.available == 'undefined' || !this.settings.i18n.available) {
		this.settings.i18n.available = ['en', 'de'];
	}

	if (typeof this.settings.i18n.current == 'undefined' || !this.settings.i18n.current) {
		var browserLang = null;
		if (navigator.language) {
			browserLang = navigator.language;
		} else if (navigator.browserLanguage) {
			browserLang = navigator.browserLanguage;
		} else {
			browserLang = 'en';
		}

		for (var i = 0; i < this.settings.i18n.available.length; ++i) {
			if (browserLang.indexOf(this.settings.i18n.available[i]) >= 0) {
				this.settings.i18n.current = this.settings.i18n.available[i];
				break;
			}
		}

		if (!this.settings.i18n.current) {
			this.settings.i18n.current = 'en';
		}
	}

	// determine the actual language
	var actualLanguage = this.getLanguage(this.settings.i18n.current, this.settings.i18n.available);

	if (!actualLanguage) {
		GENTICS.Aloha.Log.error(this, 'Could not determine actual language, no languages available');
	} else {
		// TODO load the dictionary file for the actual language
		var fileUrl = this.settings.base + 'i18n/' + actualLanguage + '.dict';
		this.loadI18nFile(fileUrl, this);
	}
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
 * Get the actual language
 * @method
 * @param {String} current current selected language
 * @param {Array} available list of available languages
 * @return the actual language as a string
 */
GENTICS.Aloha.prototype.getLanguage = function(current, available) {
	if (!typeof available == 'Array') {
		return null;
	}

	for (var i = 0; i < available.length; ++i) {
		if (current == available[i]) {
			return current;
		}
	}

	return available[0];
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
 * Displays a message according to it's type
 * @method
 * @param {GENTICS.Aloha.Message} message the GENTICS.Aloha.Message object to be displayed
 */
GENTICS.Aloha.prototype.showMessage = function (message) {
	GENTICS.Aloha.FloatingMenu.obj.css('z-index', 8900);
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

GENTICS.Aloha = new GENTICS.Aloha();

/**
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