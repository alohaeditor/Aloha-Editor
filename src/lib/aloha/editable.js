/* editable.js is part of the Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * License http://aloha-editor.org/license.php
 */
define([
	'aloha/core',
	'util/class',
	'jquery',
	'aloha/content-rules',
	'aloha/pluginmanager',
	'aloha/selection',
	'aloha/markup',
	'aloha/contenthandlermanager',
	'aloha/console',
	'aloha/block-jump',
	'aloha/ephemera',
	'util/dom2',
	'util/browser',
	'PubSub',
	'aloha/copypaste',
	'aloha/command',
	'aloha/state-override'
], function (
	Aloha,
	Class,
	$,
	ContentRules,
	PluginManager,
	Selection,
	Markup,
	ContentHandlerManager,
	console,
	BlockJump,
	Ephemera,
	Dom,
	Browser,
	PubSub,
	CopyPaste,
	Command,
	StateOverride
) {
	'use strict';

	var jQuery = $;
	var unescape = window.unescape,
		GENTICS = window.GENTICS,

		// True, if the next editable activate event should not be handled
		ignoreNextActivateEvent = false;

	/**
	 * A cache to hold information derived, and used in getContents().
	 * @type {object<string,(string|jQuery.<HTMLElement>)>}
	 * @private
	 */
	var editableContentCache = {};

	// default supported and custom content handler settings
	// @TODO move to new config when implemented in Aloha
	Aloha.defaults.contentHandler = {};
	Aloha.defaults.contentHandler.initEditable = ['blockelement', 'sanitize'];
	Aloha.defaults.contentHandler.getContents = ['blockelement', 'sanitize', 'basic'];

	// The insertHtml contenthandler ( paste ) will, by default, use all
	// registered content handlers.
	//Aloha.defaults.contentHandler.insertHtml = void 0;

	if (typeof Aloha.settings.contentHandler === 'undefined') {
		Aloha.settings.contentHandler = {};
	}

	var defaultContentSerializer = function (editableElement) {
		return jQuery(editableElement).html();
	};

	var contentSerializer = defaultContentSerializer;

	/**
	 * Triggers smartContentChange handlers.
	 *
	 * @param {Aloha.Editable}
	 * @return {string} Content that has been processed by getContent handlers
	 *                  and smartContentChange handlers.
	 */
	function handleSmartContentChange(editable) {
		return ContentHandlerManager.handleContent(editable.getContents(), {
			contenthandler: Aloha.settings.contentHandler.smartContentChange
		}, editable);
	}

	/**
	 * List of observed key, mapped against their keycodes.
	 *
	 * @type {object<number, string>}
	 * @const
	 */
	var KEYCODES = {
		65: 'a'
	};

	/**
	 * Handlers for various key combos.
	 * Each handler ought to return false if they do not want the event to
	 * continue propagating.
	 */
	var keyBindings = {
		'ctrl+a': function () {
			var editable = CopyPaste.getEditableAt(CopyPaste.getRange());
			if (editable) {
				CopyPaste.selectAllOf(editable.obj[0]);
				return false;
			}
		}
	};

	/**
	 * Gets the name of the modifier key if is in effect for the given event.
	 *
	 * eg: <Ctrl>+c
	 *
	 * @param {jQuery.Event} $event
	 * @return {string|null} Modifier string or null if no modifier is in
	 *                       effect.
	 *                      
	 */
	function keyModifier($event) {
		return $event.altKey ? 'alt' :
					$event.ctrlKey ? 'ctrl' :
						$event.shiftKey ? 'shift' : null;
	}

	/**
	 * Handles keydown events that are fired on the page's document.
	 *
	 * @param {jQuery.Event) $event
	 * @return {boolean} Returns false to stop propagation; undefined otherwise.
	 */
	function onKeydown($event) {
		if (!Aloha.activeEditable) {
			return;
		}
		var key = KEYCODES[$event.which];
		if (key) {
			var modifier = keyModifier($event);
			var combo = (modifier ? modifier + '+' : '') + key;
			if (keyBindings[combo]) {
				return keyBindings[combo]($event);
			}
		}
	}

	/**
	 * Registers events on the given editable's corresponding DOM element.
	 *
	 * @param {Editable} editable
	 */
	function registerEvents(editable) {
		var $editable = editable.obj;

		$editable.mousedown(function () {
			Aloha.eventHandled = true;
		}).mouseup(function () {
			Aloha.eventHandled = false;
		});

		$editable.keydown(function (event) {
			var letEventPass = Markup.preProcessKeyStrokes(event);
			editable.keyCode = event.which;
			if (!letEventPass) {
				// the event will not proceed to key press, therefore trigger
				// smartContentChange
				editable.smartContentChange(event);
			}
			return letEventPass;
		});

		$editable.keypress(StateOverride.keyPressHandler);
		$editable.keypress(function (event) {
			// triggers a smartContentChange to get the right charcode
			// To test try http://www.w3.org/2002/09/tests/keys.html
			Aloha.activeEditable.smartContentChange(event);
		});

		// native drag and drop adds unwanted style elements so we need to
		// disable it
		$editable.on('dragstart', function (event) {
			return false;
		});

		$editable.keyup(function (event) {
			if (event.keyCode === 27) {
				Aloha.deactivateEditable();
				return false;
			}
		});

		$editable.contentEditableSelectionChange(function (event) {
			Selection.onChange($editable, event, 0, Aloha.mouseEventChangedEditable);
			if (Aloha.mouseEventChangedEditable) {
				Aloha.mouseEventChangedEditable = false;
			}
			return $editable;
		});
	}

	/**
	 * Helper function for safely removing a placeholder that is a div
	 * @private
	 * @param {Element} placeholder DOM Element
	 */
	function removeDivPlaceholder(placeholder) {
		var $placeholder = $(placeholder);
		var child = placeholder.firstChild;

		if (!child) {
			$placeholder.remove();
			return;
		}

		if (!Dom.isTextNode(child) || child.data.indexOf('\u00A0') === -1) {
			child = placeholder.lastChild;
		}

		if (Dom.isTextNode(child)) {
			child.data = child.data.replace(/(^(\u00A0)+)|((\u00A0)+$)/g, '');
		}

		if (!$placeholder.is(':empty')) {
			Dom.removeShallow(placeholder);
		} else {
			$placeholder.remove();
		}
	}

	/**
	 * Checks if the element given is an unmodified aloha placeholder
	 *
	 * @private
	 * @param {HTMLElement} node
	 * @return {Boolean} True if the given element is an aloha-editing-paragraph.
	 */
	function isUnmodifiedAlohaEditingP(node) {
		return Browser.ie
		       ? (node.className === 'aloha-editing-p aloha-placeholder'
		         && node.children.length === 0
		         && (!node.firstChild || node.firstChild.data === '\u2060'))
		       : (node.className === 'aloha-editing-p aloha-placeholder'
		         && node.children.length >= 1
		         && node.children[0].nodeName === 'BR'
		         && node.children[0].className === 'aloha-end-br');
	}

	/**
	 * Helper function for safely removing a placeholder that is a paragraph
	 *
	 * @private
	 * @param {Element} placeholder DOM Element
	 */
	function removePPlaceholder(placeholder) {
		var $placeholder = $(placeholder);
		if (isUnmodifiedAlohaEditingP(placeholder)) {
			$placeholder.remove();
		} else {
			$placeholder.removeClass('aloha-editing-p');
			$placeholder.removeClass('aloha-placeholder');
			if (Browser.ie) {
				//remove trailing or leading word joiner
				var child = $placeholder[0].firstChild;
				if (child && Dom.isTextNode(child) && child.data.indexOf('\u2060') >= -1) {
					child.data = child.data.replace(/(^(\u2060)+)|((\u2060)+$)/g, '');
				}
			}
		}
	}


	/**
	 * Safely removes a placeholder and leaves its content at its place.
	 * This function is a helper to be passed to a jQuery each() invocation.
	 *
	 * @private
	 * @param {index}   index (Unused) index of placeholder element in jQuery collection.
	 * @param {Element} placeholder DOM Element
	 */
	function removePlaceholder(index, placeholder) {
		var $placeholder = $(placeholder);
		if ($placeholder.hasClass('aloha-editing-div')) {
			removeDivPlaceholder(placeholder);
			return;
		}
		if ($placeholder.hasClass('aloha-editing-p')) {
			removePPlaceholder(placeholder);
			return;
		}
		$placeholder.remove();
	}

	$(document).keydown(onKeydown);

	/**
	 * Editable object
	 * @namespace Aloha
	 * @class Editable
	 * @method
	 * @constructor
	 * @param {Object} obj jQuery object reference to the object
	 */
	Aloha.Editable = Class.extend({

		_constructor: function (obj) {
			// check wheter the object has an ID otherwise generate and set
			// globally unique ID
			if (!obj.attr('id')) {
				obj.attr('id', GENTICS.Utils.guid());
			}

			// store object reference
			this.obj = obj;
			this.originalObj = obj;
			this.ready = false;

			// delimiters, timer and idle for smartContentChange
			// smartContentChange triggers -- tab: '\u0009' - space: '\u0020' - enter: 'Enter'
			// backspace: U+0008 - delete: U+007F
			this.sccDelimiters = [':', ';', '.', '!', '?', ',',
								  unescape('%u0009'), unescape('%u0020'), unescape('%u0008'), unescape('%u007F'), 'Enter'];
			this.sccIdle = 5000;
			this.sccDelay = 500;
			this.sccTimerIdle = false;
			this.sccTimerDelay = false;

			// see keyset http://www.w3.org/TR/2007/WD-DOM-Level-3-Events-20071221/keyset.html
			this.keyCodeMap = {
				93: 'Apps', // The Application key
				18: 'Alt', // The Alt ( Menu ) key.
				20: 'CapsLock', // The Caps Lock ( Capital ) key.
				17: 'Control', // The Control ( Ctrl ) key.
				40: 'Down', // The Down Arrow key.
				35: 'End', // The End key.
				13: 'Enter', // The Enter key.
				112: 'F1', // The F1 key.
				113: 'F2', // The F2 key.
				114: 'F3', // The F3 key.
				115: 'F4', // The F4 key.
				116: 'F5', // The F5 key.
				117: 'F6', // The F6 key.
				118: 'F7', // The F7 key.
				119: 'F8', // The F8 key.
				120: 'F9', // The F9 key.
				121: 'F10', // The F10 key.
				122: 'F11', // The F11 key.
				123: 'F12', // The F12 key.

				// Anybody knows the keycode for F13-F24?
				36: 'Home', // The Home key.
				45: 'Insert', // The Insert ( Ins ) key.
				37: 'Left', // The Left Arrow key.
				224: 'Meta', // The Meta key.
				34: 'PageDown', // The Page Down ( Next ) key.
				33: 'PageUp', // The Page Up key.
				19: 'Pause', // The Pause key.
				44: 'PrintScreen', // The Print Screen ( PrintScrn, SnapShot ) key.
				39: 'Right', // The Right Arrow key.
				145: 'Scroll', // The scroll lock key
				16: 'Shift', // The Shift key.
				38: 'Up', // The Up Arrow key.
				91: 'Win', // The left Windows Logo key.
				92: 'Win' // The right Windows Logo key.
			};

			this.placeholderClass = 'aloha-placeholder';

			Aloha.registerEditable(this);
		},

		/**
		 * Initialize the editable
		 * @return void
		 * @hide
		 */
		init: function () {
			var me = this;

			// TODO make editables their own settings.
			this.settings = Aloha.settings;

			// smartContentChange settings
			// @TODO move to new config when implemented in Aloha
			if (Aloha.settings && Aloha.settings.smartContentChange) {
				if (Aloha.settings.smartContentChange.delimiters) {
					this.sccDelimiters = Aloha.settings.smartContentChange.delimiters;
				}

				if (Aloha.settings.smartContentChange.idle) {
					this.sccIdle = Aloha.settings.smartContentChange.idle;
				}

				if (Aloha.settings.smartContentChange.delay) {
					this.sccDelay = Aloha.settings.smartContentChange.delay;
				}
			}

			// check if Aloha can handle the obj as Editable
			if (!this.check(this.obj)) {
				//Aloha.log( 'warn', this, 'Aloha cannot handle {' + this.obj[0].nodeName + '}' );
				this.destroy();
				return;
			}

			// apply content handler to clean up content
			if (typeof Aloha.settings.contentHandler.getContents === 'undefined') {
				Aloha.settings.contentHandler.getContents = Aloha.defaults.contentHandler.getContents;
			}

			// apply content handler to clean up content
			if (typeof Aloha.settings.contentHandler.initEditable === 'undefined') {
				Aloha.settings.contentHandler.initEditable = Aloha.defaults.contentHandler.initEditable;
			}

			Ephemera.markAttr(me.obj, 'style');

			var content = me.obj.html();
			content = ContentHandlerManager.handleContent(content, {
				contenthandler: Aloha.settings.contentHandler.initEditable,
				command: 'initEditable'
			}, me);
			me.obj.html(ContentRules.applyRules(content, me.obj[0]));

			// Because editables can only properly be initialized when Aloha
			// plugins are loaded.
			Aloha.bind('aloha-plugins-loaded', function () {
				me.obj.addClass('aloha-editable').contentEditable(true);

				registerEvents(me);

				// mark the editable as unmodified
				me.setUnmodified();

				// we don't do the sanitizing on aloha ready, since some plugins add elements into the content and bind
				// events to it. If we sanitize by replacing the html, all events would get lost. TODO: think about a
				// better solution for the sanitizing, without destroying the events  apply content handler to clean up content
				//				var content = me.obj.html();
				//				if ( typeof Aloha.settings.contentHandler.initEditable === 'undefined' ) {
				//					Aloha.settings.contentHandler.initEditable = Aloha.defaults.contentHandler.initEditable;
				//				}
				//				content = ContentHandlerManager.handleContent( content, {
				//					contenthandler: Aloha.settings.contentHandler.initEditable
				//				} );
				//				me.obj.html( content );

				me.snapshotContent = me.getContents();


				me.initPlaceholder();

				me.ready = true;

				// disable object resizing and inline table editing.
				// we do this in here and with a slight delay, because
				// starting with FF 15, this would cause a JS error
				// if done before the first DOM object is made contentEditable.
				window.setTimeout(function () {
					Aloha.disableObjectResizing();
					Aloha.disableInlineTableEditing();
				}, 20);

				// throw a new event when the editable has been created
				/**
				 * @event editableCreated fires after a new editable has been created, eg. via $( '#editme' ).aloha()
				 * The event is triggered in Aloha's global scope Aloha
				 * @param {Event} e the event object
				 * @param {Array} a an array which contains a reference to the currently created editable on its first position
				 */
				Aloha.trigger('aloha-editable-created', [me]);
				PubSub.pub('aloha.editable.created', {
					editable: me,
					data: me // deprecated
				});
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
		check: function () {
			/* TODO check those elements
			'map', 'meter', 'object', 'output', 'progress', 'samp',
			'time', 'area', 'datalist', 'figure', 'kbd', 'keygen',
			'mark', 'math', 'wbr', 'area',
			*/

			// Extract El
			var me = this,
				obj = this.obj,
				el = obj.get(0),
				nodeName = el.nodeName.toLowerCase(),

				// supported elements
				textElements = ['a', 'abbr', 'address', 'article', 'aside', 'b', 'bdo', 'blockquote', 'cite', 'code', 'command', 'del', 'details', 'dfn', 'div', 'dl', 'em', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'i', 'ins', 'menu', 'nav', 'p', 'pre', 'q', 'ruby', 'section', 'small', 'span', 'strong', 'sub', 'sup', 'var'],
				i,
			    div;

			for (i = 0; i < textElements.length; ++i) {
				if (nodeName === textElements[i]) {
					return true;
				}
			}

			// special handled elements
			switch (nodeName) {
			case 'label':
			case 'button':
				// TODO need some special handling.
				break;
			case 'textarea':
			case 'input':
				// Create a div alongside the textarea
				div = jQuery('<div id="' + this.getId() + '-aloha" class="aloha-' + nodeName + '" />').insertAfter(obj);

				// Resize the div to the textarea and
				// Populate the div with the value of the textarea
				// Then, hide the textarea
				div.height(obj.height()).width(obj.width()).html(obj.val());

				obj.hide();

				// Attach a onsubmit to the form to place the HTML of the
				// div back into the textarea
				obj.parents('form:first').submit(function () {
					obj.val(me.getContents());
				});

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
		initPlaceholder: function () {
			if (Aloha.settings.placeholder && this.isEmpty()) {
				this.addPlaceholder();
			}
		},

		/**
		 * Check if the conteneditable is empty.
		 *
		 * @return {Boolean}
		 */
		isEmpty: function () {
			var editableTrimedContent = jQuery.trim(this.getContents()),
				onlyBrTag = (editableTrimedContent === '<br>') ? true : false;
			return (editableTrimedContent.length === 0 || onlyBrTag);
		},

		/**
		 * Add placeholder in editable
		 *
		 * @return void
		 */
		addPlaceholder: function () {
			var div = jQuery('<div>'),
				span = jQuery('<span>'),
				el,
				obj = this.obj;
			if (GENTICS.Utils.Dom.allowsNesting(obj[0], div[0])) {
				el = div;
			} else {
				el = span;
			}
			if (jQuery("." + this.placeholderClass, obj).length !== 0) {
				return;
			}
			jQuery.each(Aloha.settings.placeholder, function (selector, selectorConfig) {
				if (obj.is(selector)) {
					el.html(selectorConfig);
				}
			});
			if (!el.is(':empty')) {
				el.addClass(this.placeholderClass).addClass('aloha-ephemera');
				jQuery(obj).append(el);
			}
			jQuery('br', obj).remove();
		},

		/**
		 * remove placeholder from contenteditable. If setCursor is true,
		 * will also set the cursor to the start of the selection. However,
		 * this will be ASYNCHRONOUS, so if you rely on the fact that
		 * the placeholder is removed after calling this method, setCursor
		 * should be false ( or not set )
		 *
		 * @return void
		 */
		removePlaceholder: function (obj, setCursor) {
			var placeholderClass = this.placeholderClass,
				range;
			if (jQuery("." + this.placeholderClass, obj).length === 0) {
				return;
			}
			// set the cursor // remove placeholder
			if (setCursor === true) {
				window.setTimeout(function () {
					range = new Selection.SelectionRange();
					range.startContainer = range.endContainer = obj.get(0);
					range.startOffset = range.endOffset = 0;
					obj.find('.' + placeholderClass).each(removePlaceholder);
					range.select();

				}, 100);
			} else {
				obj.find('.' + placeholderClass).each(removePlaceholder);
			}
		},

		/**
		 * destroy the editable
		 * @return void
		 */
		destroy: function () {
			// leave the element just to get sure
			if (this === Aloha.getActiveEditable()) {
				this.blur();
			}

			// special handled elements
			switch (this.originalObj.get(0).nodeName.toLowerCase()) {
			case 'label':
			case 'button':
				// TODO need some special handling.
				break;
			case 'textarea':
			case 'input':
				// restore content to original textarea
				this.originalObj.val(this.getContents());
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

			// initialize the object and disable contentEditable
			// unbind all events
			// TODO should only unbind the specific handlers.
			this.obj.removeClass('aloha-editable').contentEditable(false).unbind('mousedown click dblclick focus keydown keypress keyup');

			/* TODO remove this event, it should implemented as bind and unbind
			// register the onSelectionChange Event with the Editable field
			this.obj.contentEditableSelectionChange( function( event ) {
				Aloha.Selection.onChange( me.obj, event );
				return me.obj;
			} );
			*/

			// throw a new event when the editable has been created
			/**
			 * @event editableCreated fires after a new editable has been destroyes, eg. via $( '#editme' ).mahalo()
			 * The event is triggered in Aloha's global scope Aloha
			 * @param {Event} e the event object
			 * @param {Array} a an array which contains a reference to the currently created editable on its first position
			 */
			Aloha.trigger('aloha-editable-destroyed', [this]);
			PubSub.pub('aloha.editable.destroyed', {
				editable: this,
				data: this // deprecated
			});

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
			return this.originalContent !== this.getContents();
		},

		/**
		 * String representation of the object
		 * @method
		 * @return Aloha.Editable
		 */
		toString: function () {
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
		disable: function () {
			return this.isDisabled() || this.obj.contentEditable(false);
		},

		/**
		 * enable this editable
		 * reenables a disabled editable to be writteable again
		 */
		enable: function () {
			return this.isDisabled() && this.obj.contentEditable(true);
		},


		/**
		 * activates an Editable for editing
		 * disables all other active items
		 * @method
		 */
		activate: function (e) {
			// get active Editable before setting the new one.
			var oldActive = Aloha.getActiveEditable();

			// We need to ommit this call when this flag is set to true.
			// This flag will only be set to true before the removePlaceholder method
			// is called since that method invokes a focus event which will again trigger
			// this method. We want to avoid double invokation of this method.
			if (ignoreNextActivateEvent) {
				ignoreNextActivateEvent = false;
				return;
			}

			// handle special case in which a nested editable is focused by a click
			// in this case the "focus" event would be triggered on the parent element
			// which actually shifts the focus away to it's parent. this if is here to
			// prevent this situation
			if (e && e.type === 'focus' && oldActive !== null && oldActive.obj.parent().get(0) === e.currentTarget) {
				return;
			}

			// leave immediately if this is already the active editable
			if (this.isActive || this.isDisabled()) {
				// we don't want parent editables to be triggered as well, so return false
				return;
			}

			this.obj.addClass('aloha-editable-active');

			Aloha.activateEditable(this);

			ignoreNextActivateEvent = true;
			this.removePlaceholder(this.obj, true);
			ignoreNextActivateEvent = false;

			this.isActive = true;

			/**
			 * @event editableActivated fires after the editable has been activated by clicking on it.
			 * This event is triggered in Aloha's global scope Aloha
			 * @param {Event} e the event object
			 * @param {Array} a an array which contains a reference to last active editable on its first position, as well
			 * as the currently active editable on it's second position
			 */
			// trigger a 'general' editableActivated event
			Aloha.trigger('aloha-editable-activated', {
				'oldActive': oldActive,
				'editable': this
			});
			PubSub.pub('aloha.editable.activated', {
				old: oldActive,
				editable: this,
				// deprecated
				data: {
					old: oldActive,
					editable: this
				}
			});
		},

		/**
		 * handle the blur event
		 * this must not be attached to the blur event, which will trigger far too often
		 * eg. when a table within an editable is selected
		 * 
		 * @param {Aloha.Editable} editable optional new editable
		 * @hide
		 */
		blur: function (editable) {
			this.obj.blur();
			this.isActive = false;
			this.initPlaceholder();
			this.obj.removeClass('aloha-editable-active');

			/**
			 * @event editableDeactivated fires after the editable has been activated by clicking on it.
			 * This event is triggered in Aloha's global scope Aloha
			 * @param {Event} e the event object
			 * @param {Array} a an array which contains a reference to this editable
			 */
			Aloha.trigger('aloha-editable-deactivated', {editable: this, newEditable: editable});
			PubSub.pub('aloha.editable.deactivated', {
				editable: this,
				newEditable: editable,
				// deprecated
				data: {
					editable: this,
					newEditable: editable
				}
			});

			/**
			 * @event smartContentChanged
			 */
			Aloha.activeEditable.smartContentChange({
				type: 'blur'
			}, null);

			Selection.resetPrevSelectionContexts();
		},

		/**
		 * check if the string is empty
		 * used for zerowidth check
		 * @return true if empty or string is null, false otherwise
		 * @hide
		 */
		empty: function (str) {
			// br is needed for chrome
			return (null === str) || (jQuery.trim(str) === '' || str === '<br/>');
		},

		/**
		 * Get the contents of this editable as a HTML string or child node DOM
		 * objects.
		 *
		 * @param {boolean} asObject Whether or not to retreive the contents of
		 *                           this editable as child node objects or as
		 *                           HTML string.
		 * @return {string|jQuery.<HTMLElement>} Contents of the editable as
		 *                                       DOM objects or an HTML string.
		 */
		getContents: function (asObject) {
			var raw = this.obj.html();
			var cache = editableContentCache[this.getId()];

			if (!cache || raw !== cache.raw) {

				BlockJump.removeZeroWidthTextNodeFix();

				var $clone = this.obj.clone(false);
				this.removePlaceholder($clone);
				$clone = jQuery(Ephemera.prune($clone[0]));
				PluginManager.makeClean($clone);

				// TODO rewrite ContentHandlerManager to accept DOM trees instead of strings
				$clone = jQuery('<div>' + ContentHandlerManager.handleContent($clone.html(), {
					contenthandler: Aloha.settings.contentHandler.getContents,
					command: 'getContents'
				}, this) + '</div>');

				cache = editableContentCache[this.getId()] = {};
				cache.raw = raw;
				cache.element = $clone;
			}

			if (asObject) {
				return cache.element.clone().contents();
			}

			if (null == cache.serialized) {
				cache.serialized = contentSerializer(cache.element[0]);
			}
			return cache.serialized;
		},

		/**
		 * Set the contents of this editable as a HTML string
		 * @param content as html
		 * @param return as object or html string
		 * @return contents of the editable
		 */
		setContents: function (content, asObject) {
			var reactivate = null;

			if (Aloha.getActiveEditable() === this) {
				Aloha.deactivateEditable();
				reactivate = this;
			}

			this.obj.html(content);

			if (null !== reactivate) {
				reactivate.activate();
			}

			this.smartContentChange({
				type: 'set-contents'
			});

			return asObject ? this.obj.contents() : contentSerializer(this.obj[0]);
		},

		/**
		 * Get the id of this editable
		 * @method
		 * @return id of this editable
		 */
		getId: function () {
			return this.obj.attr('id');
		},

		/**
		 * Generates and signals a smartContentChange event.
		 *
		 * A smart content change occurs when a special editing action, or a
		 * combination of interactions are performed by the user during the
		 * course of editing within an editable.
		 * The smart content change event would therefore signal to any
		 * component that is listening to this event, that content has been
		 * inserted into the editable that may need to be prococessed in a
		 * special way
		 * This is used for smart actions within the content/while editing.
		 * @param {Event} event
		 * @hide
		 */
		smartContentChange: function (event) {
			var me = this,
				uniChar = null;

			// ignore meta keys like crtl+v or crtl+l and so on
			if (event && (event.metaKey || event.crtlKey || event.altKey)) {
				return false;
			}

			if (event) {
				// Use among browsers reliable which http://api.jquery.com/keypress
				uniChar = (this.keyCodeMap[this.keyCode] || String.fromCharCode(event.which) || 'unknown');
			}

			var snapshot = null;

			function getSnapshotContent() {
				if (null == snapshot) {
					snapshot = me.getSnapshotContent();
				}
				return snapshot;
			}

			// handle "Enter" -- it's not "U+1234" -- when returned via "event.originalEvent.key"
			// reference: http://www.w3.org/TR/2007/WD-DOM-Level-3-Events-20071221/keyset.html
			if (jQuery.inArray(uniChar, this.sccDelimiters) >= 0) {
				clearTimeout(this.sccTimerIdle);
				clearTimeout(this.sccTimerDelay);

				this.sccTimerDelay = window.setTimeout(function () {
					Aloha.trigger('aloha-smart-content-changed', {
						'editable': me,
						'keyIdentifier': event.originalEvent.key,
						'keyCode': event.keyCode,
						'char': uniChar,
						'triggerType': 'keypress', // keypress, timer, blur, paste
						'getSnapshotContent': getSnapshotContent
					});
					handleSmartContentChange(me);

					console.debug('Aloha.Editable',
							'smartContentChanged: event type keypress triggered');
				}, this.sccDelay);

			} else if (event && event.type === 'paste') {
				Aloha.trigger('aloha-smart-content-changed', {
					'editable': me,
					'keyIdentifier': null,
					'keyCode': null,
					'char': null,
					'triggerType': 'paste',
					'getSnapshotContent': getSnapshotContent
				});
				handleSmartContentChange(me);

			} else if (event && event.type === 'blur') {
				Aloha.trigger('aloha-smart-content-changed', {
					'editable': me,
					'keyIdentifier': null,
					'keyCode': null,
					'char': null,
					'triggerType': 'blur',
					'getSnapshotContent': getSnapshotContent
				});
				handleSmartContentChange(me);

			} else if (event && event.type === 'block-change') {
				clearTimeout(this.sccTimerIdle);
				clearTimeout(this.sccTimerDelay);

				this.sccTimerDelay = window.setTimeout(function () {
					Aloha.trigger('aloha-smart-content-changed', {
						'editable': me,
						'keyIdentifier': null,
						'keyCode': null,
						'char': null,
						'triggerType': 'block-change',
						'getSnapshotContent': getSnapshotContent
					});
					handleSmartContentChange(me);

				}, this.sccDelay);

			} else if (uniChar !== null) {
				var range = Aloha.Selection.getRangeObject();

				//Remove break in otherwise empty children in IE
				//This is done automatically in Chrome and would lead to errors
				if (Browser.ie) {
					if (range.startContainer == range.endContainer) {
						var $children = $(range.startContainer).children();

						if ($children.length == 1 && $children.is('br')) {
							$children.remove();
						}
					}
				}

				// in the rare case idle time is lower then delay time
				clearTimeout(this.sccTimerDelay);
				clearTimeout(this.sccTimerIdle);
				this.sccTimerIdle = window.setTimeout(function () {
					Aloha.trigger('aloha-smart-content-changed', {
						'editable': me,
						'keyIdentifier': null,
						'keyCode': null,
						'char': null,
						'triggerType': 'idle',
						'getSnapshotContent': getSnapshotContent
					});
					handleSmartContentChange(me);
				}, this.sccIdle);
			}
		},

		/**
		 * Get a snapshot of the active editable as a HTML string
		 * @hide
		 * @return snapshot of the editable
		 */
		getSnapshotContent: function () {
			var ret = this.snapshotContent;
			this.snapshotContent = this.getContents();
			return ret;
		}
	});

	/**
	 * Sets the content serializer function.
	 *
	 * The default content serializer will just call the jQuery.html()
	 * function on the editable element (which gets the innerHTML property).
	 *
	 * This method is a static class method and will affect the result
	 * of editable.getContents() for all editables that have been or
	 * will be constructed.
	 *
	 * @param {!Function} serializerFunction
	 *        A function that accepts a DOM element and returns the serialized
	 *        XHTML of the element contents (excluding the start and end tag of
	 *        the passed element).
	 * @api
	 */
	Aloha.Editable.setContentSerializer = function (serializerFunction) {
		contentSerializer = serializerFunction;
	};

	/**
	 * Gets the content serializer function.
	 *
	 * @see Aloha.Editable.setContentSerializer()
	 * @api
	 * @return {!Function}
	 *        The serializer function.
	 */
	Aloha.Editable.getContentSerializer = function () {
		return contentSerializer;
	};

	Aloha.Editable.registerEvents = registerEvents;

});
