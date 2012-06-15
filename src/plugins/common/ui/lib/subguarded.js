define([
	'aloha/core',
	'aloha/jquery'
],
function( Aloha, jQuery ) {
	'use strict';

	var alohaUid = 1;
	var registeredArguments = {};
	var registeredGuards = {};

	function getUid( func ) {
		if ( !func.alohaUid ) {
			func.alohaUid = ++alohaUid;
		}
		return func.alohaUid;
	}

	function getRegisteredGuards( event ) {
		return registeredGuards[ event ];
	}

	function getArguments( func ) {
		return registeredArguments[ func.alohaUid ];
	}

	function registerArguments( func, args ) {
		if ( !registeredArguments[ func.alohaUid ] ) {
			registeredArguments[ func.alohaUid ] = [];
		}
		registeredArguments[ func.alohaUid ].push( args );
		return registeredArguments[ func.alohaUid ];
	}

	function registerGuard( event, func ) {
		if ( !registeredGuards[ event ] ) {
			registeredGuards[ event ] = [];
		}
		registeredGuards[ event ].push ( func );
	}

	function trigger( event, $event, range, nativeEvent ) {
		var guards = getRegisteredGuards(event);
		var i;
		for ( i = 0; i < guards.length; i++ ) {
			guards[i](getArguments(guards[i]));
		}
	}

	/**
	 * Provides a mechanism to register event handlers that are filtered and
	 * dispatched through a guard function.  All arguments following the guard
	 * parameter will be passed as to the guard function in a list containing
	 * lists of arguments with which it will determine whether or not to call a
	 * callback function which will be provided as one of the arguments in that
	 * argument list.
	 *
	 * @param {string} event
	 * @param {function(array.<array.<*...>>)} guard A function that will be
	 *                                               invoked when the specified
	 *                                               event is fired.
	 * @param {*...} args A variable number of arguments which will be passed
	 *                    as a list in a list to the dispatch function.
	 */
	function on( /* event, dispatch [, ... ] */ ) {
		var args = Array.prototype.slice.call( arguments );
		var event = args.shift();
		var guard = args.shift();
		getUid(guard); // Sets guard.uid property.
		registerArguments( guard, args );
		registerGuard( event, guard );
		Aloha.bind( event, function ($event, range, nativeEvent ) {
			trigger( event, $event, range, nativeEvent );
		});
	}

	return on;

});
