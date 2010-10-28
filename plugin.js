/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * Register the PastePlugin as GENTICS.Aloha.Plugin
 */
GENTICS.Aloha.PastePlugin = new GENTICS.Aloha.Plugin('com.gentics.aloha.plugins.Paste');

/**
 * All registered paste handlers
 */
GENTICS.Aloha.PastePlugin.pasteHandlers = [];

/**
 * Initialize the PastePlugin
 */
GENTICS.Aloha.PastePlugin.init = function() {
	var that = this;

	// first of all, generate an editable div, into which the pasting is done
	this.pasteDiv = jQuery('<div style="position:absolute; top:-100000px; left:-100000px"></div>');
	this.pasteDiv.attr('contentEditable', 'true');
	jQuery('body').append(this.pasteDiv);

	// subscribe to the event editableCreated to redirect paste events into our pasteDiv
	GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'editableCreated', function(event, editable) {
		// the events depend on the browser
		if (jQuery.browser.msie) {
			editable.obj.bind('beforepaste', function(event) {
				that.redirectPaste();
			});
		} else {
			editable.obj.bind('paste', function(event) {
				that.redirectPaste();
				window.setTimeout(function() {that.getPastedContent();}, 10);
			});
		}
	});

	// for msie, we need to bind an event to our pasteDiv
	if (jQuery.browser.msie) {
		this.pasteDiv.bind('paste', function(event) {
			window.setTimeout(function() {that.getPastedContent();}, 10);
		});
	}
};

/**
 * This method redirects the paste into the pasteDiv. After the paste occurred,
 * the content in the pasteDiv will be modified by the pastehandlers and will
 * then be copied into the editable.
 */
GENTICS.Aloha.PastePlugin.redirectPaste = function() {
	// store the current range
	this.currentRange = new GENTICS.Utils.RangeObject(true);
	this.currentEditable = GENTICS.Aloha.activeEditable;

	// empty the pasteDiv
	this.pasteDiv.text('');

	// blur the active editable
	if (this.currentEditable) {
		this.currentEditable.blur();
	}

	// set the cursor into the paste div
	GENTICS.Utils.Dom.setCursorInto(this.pasteDiv.get(0));
	
	// focus the pasteDiv
	this.pasteDiv.focus();
};

/**
 * Get the pasted content and insert into the current editable
 */
GENTICS.Aloha.PastePlugin.getPastedContent = function() {
	var that = this;

	// call all paste handlers
	for (var i = 0; i < this.pasteHandlers.length; ++i) {
		this.pasteHandlers[i].handlePaste(this.pasteDiv);
	}

	// TODO collapse the range or remove the currently selected DOM

	// insert the content into the editable at the current range
	if (this.currentRange && this.currentEditable) {
		var pasteDivContents = this.pasteDiv.contents();
		for (var i = pasteDivContents.length - 1; i >= 0; --i) {
			// insert the elements
			// TODO when inserting is not possible, eventually unwrap the contents and insert that?
			GENTICS.Utils.Dom.insertIntoDOM(jQuery(pasteDivContents.get(i)), that.currentRange, that.currentEditable.obj, false);
		}

		// activate and focus the editable
		this.currentEditable.activate();
		this.currentEditable.obj.focus();

		// set the cursor after the inserted DOM element
		if (pasteDivContents.length > 0) {
			GENTICS.Utils.Dom.setCursorAfter(pasteDivContents.get(pasteDivContents.length - 1));
		} else {
			// if nothing was pasted, just reselect the old range
			this.currentRange.select();
		}
	}
	this.currentRange = false;
	this.currentEditable = false;

	// empty the pasteDiv
	this.pasteDiv.text('');
};

/**
 * Register the given paste handler
 * @param pasteHandler paste handler to be registered
 */
GENTICS.Aloha.PastePlugin.register = function(pasteHandler) {
	this.pasteHandlers.push(pasteHandler);
};

/**
 * Constructor for a paste handler
 */
GENTICS.Aloha.PastePlugin.PasteHandler = function() {
	GENTICS.Aloha.PastePlugin.register(this);
};

/**
 * Method that handles the pasted content
 */
GENTICS.Aloha.PastePlugin.PasteHandler.prototype.handlePaste = function(jqPasteDiv) {};
