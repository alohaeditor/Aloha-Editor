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
[ 'aloha/jquery' ],
function( jQuery ) {
	"use strict";


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
	jQuery.fn.firedPromiseEvent = jQuery.fn.firedPromiseEvent || function(eventName){
		var
			$el = jQuery(this),
			result = $el.data('defer-'+eventName+'-resolved') ? true : false;
		return result;
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
	jQuery.fn.createPromiseEvent = jQuery.fn.createPromiseEvent || function(eventName){
		// Prepare
		var
			$this = jQuery(this),
			events,
			boundHandlers;

		// Check
		if ( typeof $this.data('defer-'+eventName+'-resolved') !== 'undefined' ) {
			// Promise event already created
			return $this;
		}
		$this.data('defer-'+eventName+'-resolved',false);

		// Handle
		events = jQuery.fn.createPromiseEvent.events = jQuery.fn.createPromiseEvent.events || {
			// Bind the event
			bind: function(callback){
				var $this = jQuery(this);
					return $this.bind(eventName,callback);
			},

			// Trigger the event
			trigger: function(event){
				//console.log('trigger');
				// Prepare
				var
					$this = jQuery(this),
					Deferred = $this.data('defer-'+eventName),
					specialEvent;
				
				// setup deferred object if the event has been triggered
				// but not been setup before
				if ( !Deferred ) {
					specialEvent =  jQuery.event.special[eventName];
					specialEvent.setup.call(this);
					Deferred = $this.data('defer-'+eventName);
				}
				
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
				var $this = jQuery(this);
				$this.data('defer-'+eventName, new jQuery.Deferred());
			},

			// Do something when the last event handler is unbound from a particular element.
			teardown: function( namespaces ) {
				//console.log('teardown');
				var $this = jQuery(this);
				$this.data('defer-'+eventName, null);
			},

			// Do something each time an event handler is bound to a particular element.
			add: function ( handleObj ) {
				//console.log('add');
				// Prepare
				var
					$this = jQuery(this),
					Deferred = $this.data('defer-'+eventName),
					specialEvent =  jQuery.event.special[eventName];

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
		boundHandlers = [];
		jQuery.each(
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
		jQuery.fn[eventName] = jQuery.fn[eventName] || events.bind;

		// Create the Special Event
		jQuery.event.special[eventName] = jQuery.event.special[eventName] || {
			setup: events.setup,
			teardown: events.teardown,
			add: events.add,
			remove: events.remove
		};

		// Rebind already bound events to the new custom event
		jQuery.each(boundHandlers,function(i,handler){
			$this.bind(eventName,handler);
		});

		// Chain
		return $this;
	};

});
