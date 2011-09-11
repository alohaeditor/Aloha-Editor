/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

define( [], function() {
	"use strict";
	
	// Test whether Aloha is properly initialized
	asyncTest('Aloha Startup Test', function() {
		var timeout = setTimeout(function() {
			ok(false, 'Aloha was not initialized within 60 seconds');
			start();
		}, 60000);
		jQuery('body').bind('aloha',function() {
			clearTimeout(timeout);
			ok(true, 'Aloha Event was fired');
			start();
		});
	});

	// All other tests are done when Aloha is ready
	jQuery('body').bind('aloha', function() {
		
		var 
			editable = jQuery('#edit'),
			logHistory = Aloha.Log.getLogHistory();
		
		// check whether error or warn messages were logged during startup		
		test('Aloha Error Log Test', function() {
			equal(logHistory.length, 0, 'Check number of logged messages');
		});
		
		// Test if legacy jQuery version is correct
		test( 'alohaQuery test', function() {
			equals( alohaQuery.fn.jquery, '1.5.1', 'Legacy jQuery version is correct' );
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
