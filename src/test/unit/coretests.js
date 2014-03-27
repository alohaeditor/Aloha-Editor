/* coretests.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2012 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 * 
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 * 
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
 */
define([], function() {
	"use strict";
	
	// Test whether Aloha is properly initialized
	asyncTest('Aloha trigger event "aloha-ready".', function() {
		var timeout = setTimeout(function() {
			ok(false, 'Aloha did not trigger event "aloha-ready" within 60 seconds');
			start();
		}, 60000);
		Aloha.bind('aloha-ready',function() {
			clearTimeout(timeout);
			ok(true, 'Event "aloha-ready" was fired');
			start();
		});
	});

	// Test whether Aloha is properly initialized
	asyncTest( 'Aloha.ready( callback ).', function() {
		var timeout = setTimeout( function() {
			ok( false, 'Aloha did not callback Aloha.ready() within 60 seconds' );
			start();
		}, 20000);
		Aloha.ready( function() {
			clearTimeout( timeout );
			ok( true, 'Aloha.ready() was called' );
			start();
		});
	});

	// Test whether Aloha is properly initialized
	asyncTest( 'Aloha.bind(\'aloha-ready\'. callback ).', function() {
		var timeout = setTimeout( function() {
			ok( false, 'Aloha did not callback Aloha.bind( \'aloha-ready\', cb ) within 60 seconds' );
			start();
		}, 20000 );
		Aloha.bind( 'aloha-ready', function() {
			clearTimeout( timeout );
			ok( true, 'Aloha.bind( \'aloha-ready\', cb ) was called' );
			start();
		});
	});

	// Test whether Aloha is properly initialized
	asyncTest( 'Aloha.bind(\'test\').trigger(\'test\'. callback ).', function() {
		var timeout = setTimeout( function() {
			ok( false, 'Aloha.trigger(test) did not call Aloha.bind( \'test\', cb ) within 60 seconds' );
			start();
		}, 20000 );
		Aloha.bind( 'test', function() {
			clearTimeout( timeout );
			ok( true, 'Aloha.bind( \'aloha-ready\', cb ) was called' );
			start();
		})
		Aloha.trigger( 'test' );
	});
	
	// Test whether Aloha is properly initialized
//	asyncTest( '$(body).bind(\'aloha-ready\'. callback ).', function() {
//		var timeout = setTimeout( function() {
//			ok( false, 'Aloha did not callback $(body).bind( \'aloha-ready\', cb ) within 60 seconds' );
//			start();
//		}, 20000 );
//		Aloha.jQuery('body').bind( 'aloha-ready', function() {
//			clearTimeout( timeout );
//			ok( true, '$(body).bind( \'aloha-ready\', cb ) was called' );
//			start();
//		});
//	});
	
	// All other tests are done when Aloha is ready
	Aloha.ready( function() {
		
		var 
			editable = Aloha.jQuery('#edit'),
			logHistory = Aloha.Log.getLogHistory();
		
		// check whether error or warn messages were logged during startup		
		test('Aloha Error Log Test', function() {
			equal(logHistory.length, 0, 'Check number of logged messages');
		});
		
		test( 'Aloha.require() test', function() {
			equals( typeof Aloha.require, 'function', 'Aloha.require() is available' );
		});

		test( 'Aloha.bind() test', function() {
			equals( typeof Aloha.bind, 'function', 'Aloha.bind() is available' );
		});

		test( 'Aloha.trigger() test', function() {
			equals( typeof Aloha.trigger, 'function', 'Aloha.trigger() is available' );
		});
		
		asyncTest('Aloha.settings.baseUrl', function() {
			var url = Aloha.settings.baseUrl + '/aloha.js';
			jQuery.ajax({
				url: url,
				success: function( data ) {
					ok(true, 'aloha.js can be loaded from ' + Aloha.settings.baseUrl);
					start();
				},
				error: function( error ) {
					ok(false, 'Error: '+ error.statusText + '. URL was ' + url );
					start();
				}
			});
		});
		
		/*
		// check whether alohafying of divs works
		test('Aloha Editable Test', function() {
			// in chrome and safari this test only works with every second reload
			editable.aloha();
			equals(editable.contentEditable(), true, 'Check whether div is contenteditable after .aloha()');
			editable.mahalo();
			equals(editable.contentEditable(), false, 'Check whether div is not contenteditable after .mahalo()');
		});
		*/
		
	});
});
