/*!
*   This file is part of Aloha Editor
*   Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
*   Licensed unter the terms of http://www.aloha-editor.com/license.html
*//*
*	Aloha Editor is free software: you can redistribute it and/or modify
*   it under the terms of the GNU Affero General Public License as published by
*   the Free Software Foundation, either version 3 of the License, or
*   (at your option) any later version.*
*
*   Aloha Editor is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   GNU Affero General Public License for more details.
*
*   You should have received a copy of the GNU Affero General Public License
*   along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

(function($) {
	/**
	 * jQuery Aloha Plugin
	 *
	 * turn all dom elements to continous text
	 * @return	jQuery object for the matched elements
	 * @api
	 */
	$.fn.aloha = function() {
		// Prepare
		var $body = $('body'), $this = $(this);

		// Check
		if ( $body.firedPromiseEvent('aloha') ) {
			// Aloha Ready
			$this.each(function() {
				// create a new aloha editable object for each queried object
				if ( !GENTICS.Aloha.isEditable(this) ) {
					new GENTICS.Aloha.Editable($(this));
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
	$.fn.mahalo = function() {
		return this.each(function() {
			if (GENTICS.Aloha.isEditable(this)) {
				GENTICS.Aloha.getEditableById($(this).attr('id')).destroy();
			}
		});
	};

	/**
	 * jQuery Extension
	 * new Event which is triggered whenever a selection (length >= 0) is made in
	 * an Aloha Editable element
	 */
	$.fn.GENTICS_contentEditableSelectionChange = function(callback) {
		var that = this;

		// update selection when keys are pressed
		this.keyup(function(event){
			var rangeObject = GENTICS.Aloha.Selection.getRangeObject();
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
		$(document).mouseup(function(event) {
			GENTICS.Aloha.Selection.eventOriginalTarget = that;
			if (that.selectionStarted) {
				callback(event);
			}
			GENTICS.Aloha.Selection.eventOriginalTarget = false;
			that.selectionStarted = false;
		});

		return this;
	};

	/**
	 * Creates a Promise Event
	 * For instance onDomReady is a promise event, all events bound to it after it's initial trigger are fired immediately
	 * @version 1.0.0
	 * @date March 08, 2011
	 * @package jquery-sparkle {@link http://www.balupton/projects/jquery-sparkle}
	 * @author Benjamin Arthur Lupton {@link http://balupton.com}
	 * @copyright 2011 Benjamin Arthur Lupton {@link http://balupton.com}
	 * @license MIT License {@link http://creativecommons.org/licenses/MIT/}
	 * @param {String} eventName
	 * @return {jQuery}
	 */
	$.fn.firedPromiseEvent = $.fn.firedPromiseEvent || function(eventName){
		return $(this).data('defer-'+eventName+'-resolved') ? true : false;
	};

	/**
	 * Creates a Promise Event
	 * For instance onDomReady is a promise event, all events bound to it after it's initial trigger are fired immediately
	 * @version 1.0.0
	 * @date March 08, 2011
	 * @package jquery-sparkle {@link http://www.balupton/projects/jquery-sparkle}
	 * @author Benjamin Arthur Lupton {@link http://balupton.com}
	 * @copyright 2011 Benjamin Arthur Lupton {@link http://balupton.com}
	 * @license MIT License {@link http://creativecommons.org/licenses/MIT/}
	 * @param {String} eventName
	 * @return {jQuery}
	 */
	$.fn.createPromiseEvent = $.fn.createPromiseEvent || function(eventName){
		// Prepare
		var $this = $(this);

		// Check
		if ( typeof $this.data('defer-'+eventName+'-resolved') !== 'undefined' ) {
			// Promise event already created
			return $this;
		}
		$this.data('defer-'+eventName+'-resolved',false);

		// Handle
		var events = $.fn.createPromiseEvent.events = $.fn.createPromiseEvent.events || {
			// Bind the event
			bind: function(callback){
				var $this = $(this);
					return $this.bind(eventName,callback);
			},

			// Trigger the event
			trigger: function(event){
				//console.log('trigger');
				// Prepare
				var
					$this = $(this),
					Deferred = $this.data('defer-'+eventName);

				// Update Status
				$this.data('defer-'+eventName+'-resolved',true);

				// Fire Deferred Events
				Deferred.resolve();

				// Prevent
				event.preventDefault();
				event.stopImmediatePropagation();
				event.stopPropagation();

				// Chain
				return $this;
			},

			// Do something when the first event handler is bound to a particular element.
			setup: function( data, namespaces ) {
				//console.log('setup');
				var $this = $(this);
				$this.data('defer-'+eventName, new $.Deferred());
			},

			// Do something when the last event handler is unbound from a particular element.
			teardown: function( namespaces ) {
				//console.log('teardown');
				var $this = $(this);
				$this.data('defer-'+eventName, null);
			},

			// Do something each time an event handler is bound to a particular element.
			add: function ( handleObj ) {
				//console.log('add');
				// Prepare
				var
					$this = $(this),
					Deferred = $this.data('defer-'+eventName),
					specialEvent =  $.event.special[eventName];

				// Check
				if ( !Deferred ) {
					specialEvent.setup.call(this);
					return specialEvent.add.apply(this,[handleObj]);
				}

				// Attach
				//console.log('attach');
				Deferred.done(handleObj.handler);
			},

			// Do something each time an event handler is unbound from a particular element.
			remove: function ( handleObj ) {
				//console.log('remove');
			}
		};

		// Fetch already bound events
		var boundHandlers = [];
		$.each(
			($this.data('events') || {})[eventName] || [],
			function(i,event){
				boundHandlers.push(event.handler);
			}
		);

		// Unbind already bound events
		$this.unbind(eventName);

		// Bind to the actual event
		$this.bind(eventName, events.trigger);

		// Create the Helper
		$.fn[eventName] = $.fn[eventName] || events.bind;

		// Create the Special Event
		$.event.special[eventName] = $.event.special[eventName] || {
			setup: events.setup,
			teardown: events.teardown,
			add: events.add,
			remove: events.remove
		};

		// Rebind already bound events to the new custom event
		$.each(boundHandlers,function(i,handler){
			$this.bind(eventName,handler);
		});

		// Chain
		return $this;
	};

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
	$.fn.outerHtml = $.fn.outerHtml||function(){
		var
			$el = $(this),
			el = $el.get(0),
			outerHtml = el.outerHTML || new XMLSerializer().serializeToString(el);
		return outerHtml;
	};


	jQuery.fn.zap = function () {
		return this.each(function(){ jQuery(this.childNodes).insertBefore(this); }).remove();
	};

	jQuery.fn.textNodes = function(excludeBreaks, includeEmptyTextNodes) {
			var ret = [];

			(function(el){
					if (
							(el.nodeType === 3 && jQuery.trim(el.data) && !includeEmptyTextNodes) ||
							(el.nodeType === 3 && includeEmptyTextNodes) ||
							(el.nodeName =="BR" && !excludeBreaks)) {
							ret.push(el);
					} else {
							for (var i=0, childLength = el.childNodes.length; i < childLength; ++i) {
									arguments.callee(el.childNodes[i]);
							}
					}
			})(this[0]);
			return jQuery(ret);
	};

})(jQuery);
