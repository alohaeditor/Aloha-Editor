/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define(
['aloha/core', 'aloha/plugin', 'aloha/jquery', 'aloha/command', 'aloha/console'],
function(Aloha, Plugin, jQuery, Commands, console) {
	"use strict";

	// Private Vars and Methods
	var
		GENTICS = window.GENTICS,
		$window = jQuery(window),
		$document = jQuery(document),
		$pasteDiv = jQuery('<div style="position:absolute; top:-100000px; left:-100000px"></div>')
			.contentEditable(true),
		pasteHandlers = [],
		pasteRange = null,
		pasteEditable = null,
		scrollTop = 0,
		scrollLeft = 0,
		height = 0;
	

	/**
	 * This method redirects the paste into the pasteDiv. After the paste occurred,
	 * the content in the pasteDiv will be modified by the pastehandlers and will
	 * then be copied into the editable.
	 */
	function redirectPaste() {

		// store the current range
		pasteRange = new GENTICS.Utils.RangeObject(true);
		pasteEditable = Aloha.activeEditable;

		// store the current scroll position
		scrollTop = $window.scrollTop();
		scrollLeft = $window.scrollLeft();
		height = $document.height();

		// empty the pasteDiv
		$pasteDiv.text('');

		// blur the active editable
		if (pasteEditable) {
			// TODO test in IE!
			//pasteEditable.blur();
			// alternative:
			pasteEditable.obj.blur();
		}

		// set the cursor into the paste div
		GENTICS.Utils.Dom.setCursorInto($pasteDiv.get(0));

		// focus the pasteDiv
		$pasteDiv.focus();
	};

	/**
	 * Get the pasted content and insert into the current editable
	 */
	function getPastedContent() {
		var that = this,
			i = 0,
			heightDiff = 0, 
			pasteDivContents;

		// insert the content into the editable at the current range
		if (pasteRange && pasteEditable) {
			
			// activate and focus the editable
			// @todo test in IE
			//pasteEditable.activate();
			pasteEditable.obj.focus();

			pasteDivContents = $pasteDiv.html();

			if ( Aloha.queryCommandSupported('insertHTML') ) {
				Aloha.execCommand('insertHTML', false, pasteDivContents, pasteRange);
			} else {
				Aloha.Log.error('Common.Paste', 'Command "insertHTML" not available. Enable the plugin "common/commands".');
			}

			// finally scroll back to the original scroll position, plus eventually difference in height
//			if (scrollTop !== false && scrollLeft !== false && this.height !== false) {
				heightDiff = jQuery(document).height() - height;
				$window.scrollTop(scrollTop + heightDiff);
				$window.scrollLeft(scrollLeft);
//			}
		}
		
		// unset temporary values
		pasteRange = null;
		pasteEditable = null;
		scrollTop = 0;
		scrollLeft = 0;
		height = 0;

		// empty the pasteDiv
		$pasteDiv.text('');
	};


	// Public Methods
	return Plugin.create( 'paste', {
		settings: {},
//		dependencies: [ 'contenthandler' ],

		/**
		 * Initialize the PastePlugin
		 */
		init: function() {
			var that = this;

			// append the div into which we past to the document
			jQuery('body').append($pasteDiv);

			// subscribe to the event editableCreated to redirect paste events into our pasteDiv
			// TODO: move to paste command
			// http://support.mozilla.com/en-US/kb/Granting%20JavaScript%20access%20to%20the%20clipboard
			// https://code.google.com/p/zeroclipboard/
			Aloha.bind('aloha-editable-created', function(event, editable) {
				
				// the events depend on the browser
				if (jQuery.browser.msie) {
					// only do the ugly beforepaste hack, if we shall not access the clipboard
					if (that.settings.noclipboardaccess) {
						editable.obj.bind('beforepaste', function(event) {
							redirectPaste();
							event.stopPropagation();
						});
					} else {
						// this is the version using the execCommand for IE
						editable.obj.bind('paste', function(event) {
							redirectPaste();
							var range = document.selection.createRange();
							range.execCommand('paste');
							getPastedContent();

							// call smartContentChange after paste action
							Aloha.activeEditable.smartContentChange(event);
							event.stopPropagation();
							return false;
						});
					}
				} else {
					editable.obj.bind('paste', function(event) {
						redirectPaste();
						window.setTimeout(function() {
							getPastedContent();
						}, 10);

						// call smartContentChange after paste action
						Aloha.activeEditable.smartContentChange(event);
						event.stopPropagation();
					});
				}
			});

			// bind a handler to the paste event of the pasteDiv to get the
			// pasted content (but do this only once, not for every editable)
			if (jQuery.browser.msie && that.settings.noclipboardaccess) {
				$pasteDiv.bind('paste', function(event) {
					window.setTimeout(function() {
						getPastedContent();
					}, 10);

					// call smartContentChange after paste action
					Aloha.activeEditable.smartContentChange(event);
					event.stopPropagation();
				});
			}
		},

		/**
		 * Register the given paste handler
		 * @param pasteHandler paste handler to be registered
		 */
		register: function( pasteHandler ) {
			console.deprecated( 'Plugins.Paste', 'register() for pasteHandler is deprecated. Use the ContentHandler Plugin instead.' );
		}
	});
});
