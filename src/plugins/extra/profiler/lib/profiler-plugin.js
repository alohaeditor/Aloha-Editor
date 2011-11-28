/*!
 * Aloha Editor
 * Author & Copyright (c) 2011 Gentics Software GmbH
 * aloha-sales@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 *
 * Aloha Profiler
 * --------------
 * Provides a useful interface to profile some of Aloha components and their
 * methods.
 */

window.define( [
	'aloha/core',
	'aloha/plugin',
	'aloha/editable',
	'aloha/selection',
	'aloha/markup',
	'aloha/contenthandlermanager',
	'aloha/floatingmenu',
	'aloha/console'
], function( Aloha, Plugin, Editable, Selection, Markup,
             ContentHandlerManager, FloatingMenu, console ) {
	// 'caller', 'callee', and 'arguments' properties may not be accessed on
	// strict mode functions or the arguments objects for calls to them
	// 'use strict';

	var profiledFunctions = [],

		// get the arguments string literal of this function, and split it into
		// an array of names
	    argsStr = ( /function[^\(]*\(([^\)]+)/g ).exec( arguments.callee.toString() ),
	    argNames = argsStr ? argsStr[1].replace( /^\s+|\s+$/g, '' ).split( /\,\s*/ ) : [],
	    args = Array.prototype.slice.call( arguments );

	/**
	 * @param {String} path dot seperated path to resolve inside a given object
	 *                 or browser window
	 * @param {?Object} object inwhich to resolve a path. If no object is
	 *                  passed, the browser window object will be used instead
	 * @return {?} Object
	 */
	function resolvePath(path, obj) {
		if ( typeof path !== 'string' ) {
			return path;
		}

		if ( !obj || typeof obj !== 'object' ) {
			obj = window;
		}

		var parts = path.split( '.' ),
		    i = 0,
			j = parts.length;

		for ( ; i < j; ++i ) {
			obj = obj[ parts[ i ] ];
			if ( typeof obj === 'undefined' ) {
				console.error(
					'Aloha.Profiler',
					'Property "' + parts[ i ] + '" does not exist' +
						( i ? ' in object ' + parts.slice( 0, i ).join( '.' ) : '' )
				);

				return null;
			}
		}

		return obj;
	};
	
	function parseObjectPath( path, obj ) {
		if ( typeof path !== 'string' ) {
			return null;
		}

		var parts = path.split( '.' ),
		    pathToProp = parts.slice( 0, Math.max( 1, parts.length - 1 ) ).join( '.' ),
			prop;

		obj = resolvePath( pathToProp, obj );

		if ( !obj ) {
			return null;
		}

		if ( parts.length > 1 ) {
			var lastProp = parts[ parts.length - 1 ];
			if ( typeof obj[ lastProp ] === 'undefined' ) {
				console.error( 'Aloha.Profiler',
					'Property "' + lastProp + '" does not exist in object ' +
					pathToProp );
			} else {
				prop = lastProp;
			}
		}

		return {
			obj       : obj[ prop ],
			path      : path,
			parentObj : obj,
			propName  : prop
		};
	};

	Aloha.Profiler = Plugin.create( 'profiler', {

		/**
		 * Explose all dependencies to allow easy access. eg:
		 * If the 5th dependency was Markup, then:
		 * Aloha.Profiler.profile(Aloha.Profiler.alohaObjects[4], 'preProcessKeyStrokes')
		 * would start profiling the Markup.preProcessKeyStrokes method.
		 */
		loadedDependencies: Array.prototype.slice.call( arguments ),

		/**
		 * Provides a better interface to access various components of Aloha.
		 * eg: Aloha.Profiler.profile(Aloha.Profiler.alohaComponents[ 'Markup' ], 'preProcessKeyStrokes')
		 */
		alohaComponents: {},

		/**
		 * Initializes Profiler plugin by populating alohaComponents with all
		 * arguments of our define function, mapping name, to object
		 */
		init: function() {
			var j = argNames.length;
			while ( --j >= 0 ) {
				this.alohaComponents[ argNames[ j ] ] = args[ j ];
			}
		},

		/**
		 * Shortcut to profile one of the Aloha components that was required by
		 * Aloha Profiler.
		 *
		 * @param {String} path
		 * @param {String} fnName
		 */
		profileAlohaComponent: function( path, fnName ) {
			var parts = parseObjectPath( path, this.alohaComponents );
			return this.profile( parts.parentObj, fnName || parts.propName );
		},

		/**
		 * @param {(Object|String)} obj object or path to object that contains
		 *                 the function we want to profile. Or the path to the
		 *                 function itself
		 * @param {String} fnName name of function inside obj, which we want to
		 *                 profile
		 * @param {?Function(Function, Array):Boolean} intercept functiont to
		 *                 call each time this method is invoked
		 */
		profile: function( obj, fnName, intercept ) {
			var path,
			    parts,
			    objIndex = -1,
			    i;

			if ( typeof obj === 'string' ) {
				parts = parseObjectPath( obj );
				obj = parts.parentObj;
				path = parts.path + ( fnName ? '.' + fnName : '' );
				if ( parts.propName ) {
					if ( typeof parts.obj === 'function' ) {
						fnName = parts.propName;
					} else if ( parts.obj === 'object' ) {
						obj = parts.obj;
					}
				}
			}

			if ( !obj || !fnName || typeof obj[ fnName ] !== 'function' ) {
				return;
			}

			for ( i = 0; i < profiledFunctions.length; ++i ) {
				if ( profiledFunctions[ i ] === obj ) {
					objIndex = i;
					if ( profiledFunctions[ i ][ fnName ] ) {
						return;
					}
				}
			}

			var fn = obj[ fnName ];

			// In IE typeof window.console.log returns "object!!!"
			if ( window.console && window.console.log ) {
				if ( objIndex == -1 ) {
					objIndex = profiledFunctions.push( obj ) - 1;
				}

				profiledFunctions[ objIndex ][ fnName ] = fn;

				obj[ fnName ] = function() {
					if ( typeof intercept === 'function' ) {
						intercept( fn, arguments );
					}

					// window.console.time( fnName );
					var start = +( new Date() );
					var returnValue = fn.apply( obj, arguments );

					// window.console.timeEnd( fnName );
					window.console.log( ( path || fnName ) + ': ' +
						( ( new Date() ) - start ) + 'ms' );

					return returnValue;
				};
			}
		},

		/**
		 * @return {String} "Aloha.Profiler"
		 */
		toString: function() {
			return 'Aloha.Profiler';
		}
	} );

	return Aloha.Profiler;
} );
