/*!
* This file is part of Aloha Editor Project http://aloha-editor.org
* Copyright � 2010-2011 Gentics Software GmbH, aloha@gentics.com
* Contributors http://aloha-editor.org/contribution.php 
* Licensed unter the terms of http://www.aloha-editor.org/license.html
*//*
* Aloha Editor is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.*
*
* Aloha Editor is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

define(
[ 'aloha/core', 'aloha/selection', 'aloha/jquery' ],
function( Aloha, Selection, jQuery ) {
	"use strict";
	
	var
//		$ = jQuery,
//		Aloha = window.Aloha,
//		console = window.console,
		XMLSerializer = window.XMLSerializer;

	/**
	 * jQuery between Extension
	 *
	 * insert either html code, a dom object OR a jQuery object inside of an existing text node.
	 * if the chained jQuery object is not a text node, nothing will happen.
	 *
	 * @param content HTML Code, DOM object or jQuery object to be inserted
	 * @param offset character offset from the start where the content should be inserted
	 */
	jQuery.fn.between = function(content, offset) {
		var
			offSize,
			fullText;

		if (this[0].nodeType !== 3) {
			// we are not in a text node, just insert the element at the corresponding position
			offSize = this.children().size();
			if (offset > offSize) {
				offset = offSize;
			}
			if (offset <= 0) {
				this.prepend(content);
			} else {
				this.children().eq(offset -1).after(content);
			}
		} else {
			// we are in a text node so we have to split it at the correct position
			if (offset <= 0) {
				this.before(content);
			} else if (offset >= this[0].length) {
				this.after(content);
			} else {
				fullText = this[0].data;
				this[0].data = fullText.substring(0, offset);
				this.after(fullText.substring(offset, fullText.length));
				this.after(content);
			}
		}
	};

	/**
	 * Make the object contenteditable. Care about browser version (name of contenteditable attribute depends on it)
	 */
	jQuery.fn.contentEditable = function( b ) {
		// ie does not understand contenteditable but contentEditable
		// contentEditable is not xhtml compatible.
		var
			$el = jQuery(this),
			ce = 'contenteditable';

		// Check
		if (jQuery.browser.msie && parseInt(jQuery.browser.version,10) == 7 ) {
			ce = 'contentEditable';
		}
		if (typeof b === 'undefined' ) {
			return $el.attr(ce);
		}
		else if (b === '') {
			$el.removeAttr(ce);
		}
		else {
			if (b && b !== 'false') {
				b='true';
			} else {
				b='false';
			}
			$el.attr(ce, b);
		}

		// Return
		return $el;
	};

	/**
	 * jQuery Aloha Plugin
	 *
	 * turn all dom elements to continous text
	 * @return	jQuery object for the matched elements
	 * @api
	 */
	jQuery.fn.aloha = function() {
		// Prepare
		var $body = jQuery('body'), $this = jQuery(this);

		// Check
		if ( $body.firedPromiseEvent('aloha') ) {
			// Aloha Ready
			$this.each(function() {
				// create a new aloha editable object for each queried object
				var $this = jQuery(this);
				if ( !Aloha.isEditable(this) ) {
					new Aloha.Editable($this);
				}
			});
		}
		else {
			// Aloha Not Ready
			$body.bind('aloha',function(){
				$this.aloha();
			});
		}

		// Chain
		return $this;
	};

	/**
	 * jQuery destroy elements as editable
	 *
	 * destroy all mached elements editable capabilities
	 * @return	jQuery object for the matched elements
	 * @api
	 */
	jQuery.fn.mahalo = function() {
		return this.each(function() {
			if (Aloha.isEditable(this)) {
				Aloha.getEditableById(jQuery(this).attr('id')).destroy();
			}
		});
	};

	/**
	 * jQuery Extension
	 * new Event which is triggered whenever a selection (length >= 0) is made in
	 * an Aloha Editable element
	 */
	jQuery.fn.contentEditableSelectionChange = function(callback) {
		var that = this;

		// update selection when keys are pressed
		this.keyup(function(event){
			var rangeObject = Selection.getRangeObject();
			callback(event);
		});

		// update selection on doubleclick (especially important for the first automatic selection, when the Editable is not active yet, but is at the same time activated as the selection occurs
		this.dblclick(function(event) {
			callback(event);
		});

		// update selection when text is selected
		this.mousedown(function(event){
			// remember that a selection was started
			that.selectionStarted = true;
		});
		jQuery(document).mouseup(function(event) {
			Selection.eventOriginalTarget = that;
			if (that.selectionStarted) {
				callback(event);
			}
			Selection.eventOriginalTarget = false;
			that.selectionStarted = false;
		});

		return this;
	};
//
//	/**
//	 * Creates a Promise Event
//	 * For instance onDomReady is a promise event, all events bound to it after it's initial trigger are fired immediately
//	 * @version 1.0.0
//	 * @date March 08, 2011
//	 * @package jquery-sparkle {@link http://www.balupton/projects/jquery-sparkle}
//	 * @author Benjamin Arthur Lupton {@link http://balupton.com}
//	 * @copyright 2011 Benjamin Arthur Lupton {@link http://balupton.com}
//	 * @license MIT License {@link http://creativecommons.org/licenses/MIT/}
//	 * @param {String} eventName
//	 * @return {jQuery}
//	 */
//	jQuery.fn.firedPromiseEvent = jQuery.fn.firedPromiseEvent || function(eventName){
//		var
//			$el = jQuery(this),
//			result = $el.data('defer-'+eventName+'-resolved') ? true : false;
//		return result;
//	};
//
//	/**
//	 * Creates a Promise Event
//	 * For instance onDomReady is a promise event, all events bound to it after it's initial trigger are fired immediately
//	 * @version 1.0.0
//	 * @date March 08, 2011
//	 * @package jquery-sparkle {@link http://www.balupton/projects/jquery-sparkle}
//	 * @author Benjamin Arthur Lupton {@link http://balupton.com}
//	 * @copyright 2011 Benjamin Arthur Lupton {@link http://balupton.com}
//	 * @license MIT License {@link http://creativecommons.org/licenses/MIT/}
//	 * @param {String} eventName
//	 * @return {jQuery}
//	 */
//	jQuery.fn.createPromiseEvent = jQuery.fn.createPromiseEvent || function(eventName){
//		// Prepare
//		var
//			$this = jQuery(this),
//			events,
//			boundHandlers;
//
//		// Check
//		if ( typeof $this.data('defer-'+eventName+'-resolved') !== 'undefined' ) {
//			// Promise event already created
//			return $this;
//		}
//		$this.data('defer-'+eventName+'-resolved',false);
//
//		// Handle
//		events = jQuery.fn.createPromiseEvent.events = jQuery.fn.createPromiseEvent.events || {
//			// Bind the event
//			bind: function(callback){
//				var $this = jQuery(this);
//					return $this.bind(eventName,callback);
//			},
//
//			// Trigger the event
//			trigger: function(event){
//				//console.log('trigger');
//				// Prepare
//				var
//					$this = jQuery(this),
//					Deferred = $this.data('defer-'+eventName),
//					specialEvent;
//				
//				// setup deferred object if the event has been triggered
//				// but not been setup before
//				if ( !Deferred ) {
//					specialEvent =  jQuery.event.special[eventName];
//					specialEvent.setup.call(this);
//					Deferred = $this.data('defer-'+eventName);
//				}
//				
//				// Update Status
//				$this.data('defer-'+eventName+'-resolved',true);
//
//				// Fire Deferred Events
//				Deferred.resolve();
//
//				// Prevent
//				event.preventDefault();
//				event.stopImmediatePropagation();
//				event.stopPropagation();
//
//				// Chain
//				return $this;
//			},
//
//			// Do something when the first event handler is bound to a particular element.
//			setup: function( data, namespaces ) {
//				//console.log('setup');
//				var $this = jQuery(this);
//				$this.data('defer-'+eventName, new jQuery.Deferred());
//			},
//
//			// Do something when the last event handler is unbound from a particular element.
//			teardown: function( namespaces ) {
//				//console.log('teardown');
//				var $this = jQuery(this);
//				$this.data('defer-'+eventName, null);
//			},
//
//			// Do something each time an event handler is bound to a particular element.
//			add: function ( handleObj ) {
//				//console.log('add');
//				// Prepare
//				var
//					$this = jQuery(this),
//					Deferred = $this.data('defer-'+eventName),
//					specialEvent =  jQuery.event.special[eventName];
//
//				// Check
//				if ( !Deferred ) {
//					specialEvent.setup.call(this);
//					return specialEvent.add.apply(this,[handleObj]);
//				}
//
//				// Attach
//				//console.log('attach');
//				Deferred.done(handleObj.handler);
//			},
//
//			// Do something each time an event handler is unbound from a particular element.
//			remove: function ( handleObj ) {
//				//console.log('remove');
//			}
//		};
//
//		// Fetch already bound events
//		boundHandlers = [];
//		jQuery.each(
//			($this.data('events') || {})[eventName] || [],
//			function(i,event){
//				boundHandlers.push(event.handler);
//			}
//		);
//
//		// Unbind already bound events
//		$this.unbind(eventName);
//
//		// Bind to the actual event
//		$this.bind(eventName, events.trigger);
//
//		// Create the Helper
//		jQuery.fn[eventName] = jQuery.fn[eventName] || events.bind;
//
//		// Create the Special Event
//		jQuery.event.special[eventName] = jQuery.event.special[eventName] || {
//			setup: events.setup,
//			teardown: events.teardown,
//			add: events.add,
//			remove: events.remove
//		};
//
//		// Rebind already bound events to the new custom event
//		jQuery.each(boundHandlers,function(i,handler){
//			$this.bind(eventName,handler);
//		});
//
//		// Chain
//		return $this;
//	};

	/**
	 * Fetch the outerHTML of an Element
	 * @version 1.0.0
	 * @date February 01, 2011
	 * @package jquery-sparkle {@link http://www.balupton/projects/jquery-sparkle}
	 * @author Benjamin Arthur Lupton {@link http://balupton.com}
	 * @copyright 2011 Benjamin Arthur Lupton {@link http://balupton.com}
	 * @license MIT License {@link http://creativecommons.org/licenses/MIT/}
	 * @return {String} outerHtml
	 */
	jQuery.fn.outerHtml = jQuery.fn.outerHtml || function(){
		var
			$el = jQuery(this),
			el = $el.get(0);
			if (typeof el.outerHTML != 'undefined') {
				return el.outerHTML;
			} else {
				try {
					// Gecko-based browsers, Safari, Opera.
					return (new XMLSerializer()).serializeToString(el);
				 } catch (e) {
					try {
					  // Internet Explorer.
					  return el.xml;
					} catch (e) {}
				}
			}
	
	};


	jQuery.fn.zap = function () {
		return this.each(function(){ jQuery(this.childNodes).insertBefore(this); }).remove();
	};

	jQuery.fn.textNodes = function(excludeBreaks, includeEmptyTextNodes) {
			var
				ret = [],
				doSomething = function(el){
					if (
						(el.nodeType === 3 && jQuery.trim(el.data) && !includeEmptyTextNodes) ||
						(el.nodeType === 3 && includeEmptyTextNodes) ||
						(el.nodeName =="BR" && !excludeBreaks)) {
						ret.push(el);
					} else {
						for (var i=0, childLength = el.childNodes.length; i < childLength; ++i) {
							doSomething(el.childNodes[i]);
						}
					}
				};
			
			doSomething(this[0]);

			return jQuery(ret);
	};

});
