/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

(function(window, undefined) {
	"use strict";
	var
		jQuery = window.alohaQuery, $ = jQuery,
		GENTICS = window.GENTICS,
		Aloha = window.Aloha,
		Class = window.Class,
		unescape = window.unescape;

/**
 * Editable object
 * @namespace Aloha
 * @class Editable
 * @method
 * @constructor
 * @param {Object} obj jQuery object reference to the object
 */
Aloha.Editable = Class.extend({
	_constructor: function(obj) {
		var me = this;

		// check wheter the object has an ID otherwise generate and set globally unique ID
		if ( !obj.attr('id') ) {
			obj.attr('id', GENTICS.Utils.guid());
		}

		// store object reference
		this.obj = obj;
		this.originalObj = obj;

		// the editable is not yet ready
		this.ready = false;

		// delimiters, timer and idle for smartContentChange
		// smartContentChange triggers -- tab: '\u0009' - space: '\u0020' - enter: 'Enter'
		this.sccDelimiters = [':', ';', '.', '!', '?', ',', unescape('%u0009'), unescape('%u0020'), 'Enter'];
		this.sccIdle = 5000;
		this.sccDelay = 500;
		this.sccTimerIdle = false;
		this.sccTimerDelay = false;

		// see keyset http://www.w3.org/TR/2007/WD-DOM-Level-3-Events-20071221/keyset.html
		this.keyCodeMap = {
				 93 : "Apps",         // The Application key
				 18 : "Alt",          // The Alt (Menu) key.
				 20 : "CapsLock",     // The Caps Lock (Capital) key.
				 17 : "Control",      // The Control (Ctrl) key.
				 40 : "Down",         // The Down Arrow key.
				 35 : "End",          // The End key.
				 13 : "Enter",        // The Enter key.
				112 : "F1",           // The F1 key.
				113 : "F2",           // The F2 key.
				114 : "F3",           // The F3 key.
				115 : "F4",           // The F4 key.
				116 : "F5",           // The F5 key.
				117 : "F6",           // The F6 key.
				118 : "F7",           // The F7 key.
				119 : "F8",           // The F8 key.
				120 : "F9",           // The F9 key.
				121 : "F10",          // The F10 key.
				122 : "F11",          // The F11 key.
				123 : "F12",          // The F12 key.
				// Anybody knows the keycode for F13-F24?
				 36 : "Home",         // The Home key.
				 45 : "Insert",       // The Insert (Ins) key.
				 37 : "Left",         // The Left Arrow key.
				224 : "Meta",         // The Meta key.
				 34 : "PageDown",     // The Page Down (Next) key.
				 33 : "PageUp",       // The Page Up key.
				 19 : "Pause",        // The Pause key.
				 44 : "PrintScreen",  // The Print Screen (PrintScrn, SnapShot) key.
				 39 : "Right",        // The Right Arrow key.
				145 : "Scroll",       // The scroll lock key
				 16 : "Shift",        // The Shift key.
				 38 : "Up",           // The Up Arrow key.
				 91 : "Win",          // The left Windows Logo key.
				 92 : "Win"           // The right Windows Logo key.
		};

		// placeholder
		this.placeholderClass = 'aloha-placeholder';

		// register the editable with Aloha
		Aloha.registerEditable(this);

		// try to initialize the editable
		this.init();
	},

	/**
	 * Initialize the editable
	 * @return void
	 * @hide
	 */
	init: function(){
		var me = this;

		// smartContentChange settings
		if (Aloha.settings && Aloha.settings.smartContentChange) {
			if (Aloha.settings.smartContentChange.delimiters) {
				this.sccDelimiters = Aloha.settings.smartContentChange.delimiters;
			} else {
				this.sccDelimiters = this.sccDelimiters;
			}

			if (Aloha.settings.smartContentChange.idle) {
				this.sccIdle = Aloha.settings.smartContentChange.idle;
			} else {
				this.sccIdle = this.sccIdle;
			}

			if (Aloha.settings.smartContentChange.delay) {
				this.sccDelay = Aloha.settings.smartContentChange.delay;
			} else {
				this.sccDelay = this.sccDelay;
			}
		}

		// check if Aloha can handle the obj as Editable
		if ( !this.check( this.obj ) ) {
			//Aloha.log('warn', this, 'Aloha cannot handle {' + this.obj[0].nodeName + '}');
			this.destroy();
			return;
		}

		// only initialize the editable when Aloha is fully ready (including plugins)
		Aloha.bind('aloha',function(){
			// initialize the object
			me.obj.addClass('aloha-editable')
				.contentEditable(true);

			// add focus event to the object to activate
			me.obj.mousedown(function(e) {
				return me.activate(e);
			});

			me.obj.focus(function(e) {
				return me.activate(e);
			});

			// by catching the keydown we can prevent the browser from doing its own thing
			// if it does not handle the keyStroke it returns true and therefore all other
			// events (incl. browser's) continue
			me.obj.keydown(function(event) {
				me.keyCode = event.which;
				return Aloha.Markup.preProcessKeyStrokes(event);
			});

			// handle keypress
			me.obj.keypress( function(event) {
				// triggers a smartContentChange to get the right charcode
				// To test try http://www.w3.org/2002/09/tests/keys.html
				Aloha.activeEditable.smartContentChange(event);
			});

			// handle shortcut keys
			me.obj.keyup(function(event) {
				if (event.keyCode === 27 ) {
					Aloha.deactivateEditable();
					return false;
				}
			});

			// register the onSelectionChange Event with the Editable field
			me.obj.contentEditableSelectionChange(function (event) {
				Aloha.Selection.onChange(me.obj, event);
				return me.obj;
			});

			

			// mark the editable as unmodified
			me.setUnmodified();

			me.snapshotContent = me.getContents();

			// init placeholder
			me.initPlaceholder();

			// now the editable is ready
			me.ready = true;
			// throw a new event when the editable has been created
			/**
			 * @event editableCreated fires after a new editable has been created, eg. via $('#editme').aloha()
			 * The event is triggered in Aloha's global scope Aloha
			 * @param {Event} e the event object
			 * @param {Array} a an array which contains a reference to the currently created editable on its first position
			 */
			Aloha.trigger('aloha-editable-created',[me]);
		});
	},

	/**
	 * True, if this editable is active for editing
	 * @property
	 * @type boolean
	 */
	isActive: false,

	/**
	 * stores the original content to determine if it has been modified
	 * @hide
	 */
	originalContent: null,

	/**
	 * every time a selection is made in the current editable the selection has to
	 * be saved for further use
	 * @hide
	 */
	range: undefined,

	/**
	 * Check if object can be edited by Aloha Editor
	 * @return {boolean } editable true if Aloha Editor can handle else false
	 * @hide
	 */
	check: function() {

		/* TODO check those elements
		'map', 'meter', 'object', 'output', 'progress', 'samp',
		'time', 'area', 'datalist', 'figure', 'kbd', 'keygen',
		'mark', 'math', 'wbr', 'area',
		*/

		// Extract El
		var	me = this,
			obj = this.obj,
			el = obj.get(0),
			nodeName = el.nodeName.toLowerCase(),
			// supported elements
			textElements = [ 'a', 'abbr', 'address', 'article', 'aside',
					'b', 'bdo', 'blockquote',  'cite', 'code', 'command',
					'del', 'details', 'dfn', 'div', 'dl', 'em', 'footer', 'h1', 'h2',
					'h3', 'h4', 'h5', 'h6', 'header', 'i', 'ins', 'menu',
					'nav', 'p', 'pre', 'q', 'ruby',  'section', 'small',
					'span', 'strong',  'sub', 'sup', 'var'],
			i, div, updateFunction;

		for (i = 0; i < textElements.length; i++) {
			if ( nodeName == textElements[i] ) {
				return true;
			}
		}

		// special handled elements
		switch ( nodeName ) {
			case 'label':
			case 'button':
				// TODO need some special handling.
				break;

			case 'textarea':
				// Create a div alongside the textarea
				div = jQuery('<div id="'+this.getId()+'-aloha" class="aloha-textarea"/>').insertAfter(obj);
				// Resize the div to the textarea
				div.height(obj.height())
					.width(obj.width())
				// Populate the div with the value of the textarea
					.html(obj.val());
				// Hide the textarea
				obj.hide();
				// Attach a onsubmit to the form to place the HTML of the div back into the textarea
				updateFunction = function(){
					var val = me.getContents();
					obj.val(val);
				};
				obj.parents('form:first').submit(updateFunction);
				// Swap textarea reference with the new div
				this.obj = div;
				// Supported
				return true;

			default:
				break;
		}

		// the following elements are not supported
		/*
		'canvas', 'audio', 'br', 'embed', 'fieldset', 'hgroup', 'hr',
		'iframe', 'img', 'input', 'map', 'script', 'select', 'style',
		'svg', 'table', 'ul', 'video', 'ol', 'form', 'noscript',
		 */
		return false;
	},

	/**
	 * Init Placeholder
	 *
	 * @return void
	 */
	initPlaceholder: function() {
		if (this.isEmpty() && Aloha.settings.placeholder) {
			this.addPlaceholder();
		}
	},

	/**
	 * Check if the conteneditable is empty
	 *
	 * @return {bool}
	 */
	isEmpty: function() {
		var editableTrimedContent = jQuery.trim(this.getContents()),
			onlyBrTag = (editableTrimedContent == '<br>') ? true : false;

		if (editableTrimedContent.length === 0 || onlyBrTag) {
			return true;
		} else {
			return false;
		}
	},

	/**
	 * Add placeholder in editable
	 *
	 * @return void
	 */
	addPlaceholder: function() {

		var
			div = jQuery('<div />'),
			span = jQuery('<span />'),
			el,
			obj = this.obj;

		if (GENTICS.Utils.Dom.allowsNesting(obj[0], div[0])) {
			el = div;
		} else {
			el = span;
		}

		jQuery(obj).append(el.addClass(this.placeholderClass));
		jQuery.each(
			Aloha.settings.placeholder,
			function (selector, selectorConfig) {
				if (obj.is(selector)) {
					el.html(selectorConfig);
				}
			}
		);

		// remove browser br
		jQuery('br', obj).remove();
		// delete div, span, el;
	},

	/**
	 * remove placeholder from contenteditable. If setCursor is true,
	 * will also set the cursor to the start of the selection. However,
	 * this will be ASYNCHRONOUS, so if you rely on the fact that
	 * the placeholder is removed after calling this method, setCursor
	 * should be false (or not set)
	 *
	 * @return void
	 */
	removePlaceholder: function(obj, setCursor) {
		var
			placeholderClass = this.placeholderClass,
			range;
//		// remove browser br
//		jQuery('br', obj).remove();

		// set the cursor // remove placeholder
		if (setCursor === true) {
			range = Aloha.Selection.getRangeObject();
			if ( !range.select ) {return;}
			range.startContainer = range.endContainer = obj.get(0);
			range.startOffset = range.endOffset = 0;
			range.select();

			window.setTimeout(function() {
				jQuery('.' + placeholderClass, obj).remove();
			}, 20);
		} else {
			jQuery('.' + placeholderClass, obj).remove();
		}
	},

	/**
	 * destroy the editable
	 * @return void
	 */
	destroy: function() {

		// leave the element just to get sure
		if (this == Aloha.getActiveEditable()) {
			this.blur();

			// also hide the floating menu if the current editable was active
			Aloha.FloatingMenu.obj.hide();
			Aloha.FloatingMenu.shadow.hide();
		}

		// original Object
		var	me = this,
			oo = this.originalObj.get(0),
			onn = oo.nodeName.toLowerCase(),
			val;

		// special handled elements
		switch ( onn ) {
			case 'label':
			case 'button':
				// TODO need some special handling.
				break;

			case 'textarea':
				// restore content to original textarea
				val = this.getContents();
				this.originalObj.val(val);
				this.obj.remove();
				this.originalObj.show();
				break;

			default:
				break;
		}

		// now the editable is not ready any more
		this.ready = false;

		// remove the placeholder if needed.
		this.removePlaceholder(this.obj);

		// initialize the object
		this.obj.removeClass('aloha-editable')
		// Disable contentEditable
					.contentEditable(false)

		// unbind all events
		// TODO should only unbind the specific handlers.
					.unbind('mousedown focus keydown keyup');

		/* TODO remove this event, it should implemented as bind and unbind
		// register the onSelectionChange Event with the Editable field
		this.obj.contentEditableSelectionChange(function (event) {
			Aloha.Selection.onChange(me.obj, event);
			return me.obj;
		});
		*/

		// throw a new event when the editable has been created
		/**
		 * @event editableCreated fires after a new editable has been destroyes, eg. via $('#editme').mahalo()
		 * The event is triggered in Aloha's global scope Aloha
		 * @param {Event} e the event object
		 * @param {Array} a an array which contains a reference to the currently created editable on its first position
		 */
		Aloha.trigger('aloha-editable-destroyed',[this]);

		// finally register the editable with Aloha
		Aloha.unregisterEditable(this);

	},

	/**
	 * marks the editables current state as unmodified. Use this method to inform the editable
	 * that it's contents have been saved
	 * @method
	 */
	setUnmodified: function () {
		this.originalContent = this.getContents();
	},

	/**
	 * check if the editable has been modified during the edit process#
	 * @method
	 * @return boolean true if the editable has been modified, false otherwise
	 */
	isModified: function () {
		return this.originalContent != this.getContents();
	},

	/**
	 * String representation of the object
	 * @method
	 * @return Aloha.Editable
	 */
	toString: function() {
		return 'Aloha.Editable';
	},

	/**
	 * check whether the editable has been disabled
	 */
	isDisabled: function () {
		return !this.obj.contentEditable() || this.obj.contentEditable() === 'false';
	},

	/**
	 * disable this editable
	 * a disabled editable cannot be written on by keyboard
	 */
	disable: function() {
		return this.isDisabled() || this.obj.contentEditable(false);
	},

	/**
	 * enable this editable
	 * reenables a disabled editable to be writteable again
	 */
	enable: function() {
		return this.isDisabled() && this.obj.contentEditable(true);
	},


	/**
	 * activates an Editable for editing
	 * disables all other active items
	 * @method
	 */
	activate: function(e) {
		// stop event propagation for nested editables
		if (e) {
			e.stopPropagation();
		}

		// get active Editable before setting the new one.
		var oldActive = Aloha.getActiveEditable();

		// handle special case in which a nested editable is focused by a click
		// in this case the "focus" event would be triggered on the parent element
		// which actually shifts the focus away to it's parent. this if is here to
		// prevent this situation
		if (e && e.type == 'focus' && oldActive !== null && oldActive.obj.parent().get(0) === e.currentTarget) {
			return;
		}

		// leave immediately if this is already the active editable
		if (this.isActive || this.isDisabled()) {
			// we don't want parent editables to be triggered as well, so return false
			return;
		}


		// set active Editable in core
		Aloha.activateEditable( this );

		// ie specific: trigger one mouseup click to update the range-object
		if (document.selection && document.selection.createRange) {
			this.obj.mouseup();
		}

		// Placeholder handling
		this.removePlaceholder(this.obj, true);


		// finally mark this object as active
		this.isActive = true;

		/**
		 * @event editableActivated fires after the editable has been activated by clicking on it.
		 * This event is triggered in Aloha's global scope Aloha
		 * @param {Event} e the event object
		 * @param {Array} a an array which contains a reference to last active editable on its first position, as well
		 * as the currently active editable on it's second position
		 */
		// trigger a 'general' editableActivated event
		Aloha.trigger('aloha-editable-activated',{
			'oldActive' : oldActive,
			'editable' : this
		});
	},

	/**
	 * handle the blur event
	 * this must not be attached to the blur event, which will trigger far too often
	 * eg. when a table within an editable is selected
	 * @hide
	 */
	blur: function() {

		// blur this contenteditable
		this.obj.blur();

		// disable active status
		this.isActive = false;

		// placeholder
		this.initPlaceholder();

		/**
		 * @event editableDeactivated fires after the editable has been activated by clicking on it.
		 * This event is triggered in Aloha's global scope Aloha
		 * @param {Event} e the event object
		 * @param {Array} a an array which contains a reference to this editable
		 */
		// trigger a 'general' editableDeactivated event
		Aloha.trigger('aloha-editable-deactivated',{
			'editable' : this
		});

		/**
		 * @event smartContentChanged
		 */
		Aloha.activeEditable.smartContentChange({type : 'blur'}, null);
	},

	/**
	 * check if the string is empty
	 * used for zerowidth check
	 * @return true if empty or string is null, false otherwise
	 * @hide
	 */
	empty: function(str) {
		return (null === str)
		// br is needed for chrome
		|| (jQuery.trim(str) === '' || str === '<br/>');
	},

	/**
	 * Get the contents of this editable as a HTML string
	 * @method
	 * @return contents of the editable
	 */
	getContents: function(asObject) {
		// clone the object
		var clonedObj = this.obj.clone(false);

		// do core cleanup
		clonedObj.find('.aloha-cleanme').remove();

		// remove placeholder
		this.removePlaceholder(clonedObj);

		Aloha.PluginRegistry.makeClean(clonedObj);
		return asObject ? clonedObj.contents() : clonedObj.html();
	},

	/**
	 * Get the id of this editable
	 * @method
	 * @return id of this editable
	 */
	getId: function() {
		return this.obj.attr('id');
	},

	/**
	 * Handle a smartContentChange; This is used for smart actions within the content/while editing.
	 * @hide
	 */
	smartContentChange: function(event) {
		var me = this,
			uniChar = null,
			re, match;

		// ignore meta keys like crtl+v or crtl+l and so on
		if (event && (event.metaKey || event.crtlKey || event.altKey)) {
			return false;
		}

		if (event && event.originalEvent) {

			// regex to stripp unicode
			re = new RegExp("U\\+(\\w{4})");
			match = re.exec(event.originalEvent.keyIdentifier);

			// Use keyIdentifier if available
			if ( event.originalEvent.keyIdentifier && 1 == 2) {
				if (match !== null) {
					uniChar = unescape('%u' + match[1]);
				}
				if (uniChar === null) {
					uniChar = event.originalEvent.keyIdentifier;
				}
			// FF & Opera don't support keyIdentifier
			} else {
				// Use among browsers reliable which http://api.jquery.com/keypress
				uniChar = (this.keyCodeMap[this.keyCode] || String.fromCharCode(event.which) || 'unknown');
			}
		}
		// handle "Enter" -- it's not "U+1234" -- when returned via "event.originalEvent.keyIdentifier"
		// reference: http://www.w3.org/TR/2007/WD-DOM-Level-3-Events-20071221/keyset.html
		if (jQuery.inArray(uniChar, this.sccDelimiters) >= 0) {

			clearTimeout(this.sccTimerIdle);
			clearTimeout(this.sccTimerDelay);

			this.sccTimerDelay = setTimeout(function() {

				Aloha.trigger('aloha-smart-content-changed',{
					'editable' : Aloha.activeEditable,
					'keyIdentifier' : event.originalEvent.keyIdentifier,
					'keyCode' : event.keyCode,
					'char' : uniChar,
					'triggerType' : 'keypress', // keypress, timer, blur, paste
					'snapshotContent' : me.getSnapshotContent()
				});

				Aloha.Log.debug(this, 'smartContentChanged: event type keypress triggered');
/*
				var r = Aloha.Selection.rangeObject;
				if (r.isCollapsed()
					&& r.startContainer.nodeType == 3) {

					var posDummy = jQuery('<span id="GENTICS-Aloha-PosDummy" />');

					GENTICS.Utils.Dom.insertIntoDOM(
						posDummy,
						r,
						this.obj,
						null,
						false,
						false
					);

					console.log(posDummy.offset().top, posDummy.offset().left);

					GENTICS.Utils.Dom.removeFromDOM(
						posDummy,
						r,
						false
					);

					r.select();

				}
*/
			},this.sccDelay);
		}

		else if (uniChar !== null) {

			this.sccTimerIdle = setTimeout(function() {

				// in the rare case idle time is lower then delay time
				clearTimeout(this.sccTimerDelay);

				Aloha.trigger('aloha-smart-content-changed',{
					'editable' : Aloha.activeEditable,
					'keyIdentifier' : null,
					'keyCode' : null,
					'char' : null,
					'triggerType' : 'idle',
					'snapshotContent' : me.getSnapshotContent()
				});

				Aloha.Log.debug(this, 'smartContentChanged: event type timer triggered');

			},this.sccIdle);

		}

		else if (event && event.type === 'paste') {
			Aloha.trigger('aloha-smart-content-changed',{
				'editable' : Aloha.activeEditable,
				'keyIdentifier' : null,
				'keyCode' : null,
				'char' : null,
				'triggerType' : 'paste', // paste
				'snapshotContent' : me.getSnapshotContent()
			});

			Aloha.Log.debug(this, 'smartContentChanged: event type paste triggered');
		}

		else if (event && event.type === 'blur') {
			Aloha.trigger('aloha-smart-content-changed',{
				'editable' : Aloha.activeEditable,
				'keyIdentifier' : null,
				'keyCode' : null,
				'char' : null,
				'triggerType' : 'blur',
				'snapshotContent' : me.getSnapshotContent()
			});

			Aloha.Log.debug(this, 'smartContentChanged: event type blur triggered');
		}

	},

	/**
	 * Get a snapshot of the active editable as a HTML string
	 * @hide
	 * @return snapshot of the editable
	 */
	getSnapshotContent: function() {
		var ret = this.snapshotContent;

		this.snapshotContent = this.getContents();

		return ret;
	}
});

})(window);
