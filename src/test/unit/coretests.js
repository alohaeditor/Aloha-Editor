/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

define( [], function() {
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
	asyncTest('Aloha.ready( callback ).', function() {
		var timeout = setTimeout(function() {
			ok(false, 'Aloha did not callback Aloha.ready() within 60 seconds');
			start();
		}, 60000);
		Aloha.ready( function() {
			clearTimeout(timeout);
			ok(true, 'Aloha.ready() was called');
			start();
		});
	});

	// All other tests are done when Aloha is ready
	Aloha.bind('aloha-ready', function() {
		
		var 
			editable = Aloha.jQuery('#edit'),
			logHistory = Aloha.Log.getLogHistory();
		
		// check whether error or warn messages were logged during startup		
		test('Aloha Error Log Test', function() {
			equal(logHistory.length, 0, 'Check number of logged messages');
		});
		
		// Test if legacy jQuery version is correct
		test( 'Aloha.jQuery test', function() {
			equals( Aloha.jQuery.fn.jquery, '1.6.1', 'Delivered jQuery version is correct' );
		});
	
		// check whether alohafying of divs works
		test('Aloha Editable Test', function() {
			editable.aloha();
			equals(editable.contentEditable(), "true", 'Check whether div is contenteditable after .aloha()');
			editable.mahalo();
			equals(editable.contentEditable(), "false", 'Check whether div is not contenteditable after .mahalo()');
		});
		
	});
});
