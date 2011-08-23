/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

define("coretests",
['aloha/jquery'],
function(aQuery, undefined) {
	"use strict";
	
	// Prepare
	var	$ = window.jQuery,
		$body = $('body');

	/* 
	 * For this to work jquery.aloha.js needs to be loaded synchronously.
	 * Usually this is not the case.
	 */
//	test('.aloha() is working with deferred loading', function() {
//		var editable = $('#edit2');
//		editable.aloha();
//		equals(1, editable.size(), 'Editable was found');
//		ok(true, '.aloha() could be called');
//	});

	// Test whether Aloha is properly initialized
	asyncTest('Aloha Startup Test', function() {
		var timeout = setTimeout(function() {
			ok(false, 'Aloha was not initialized within 60 seconds');
			start();
		}, 60000);
		aQuery('body').bind('aloha',function() {
			clearTimeout(timeout);
			ok(true, 'Aloha Event was fired');
			start();
		});
	});

	// All other tests are done when Aloha is ready
	aQuery('body').bind('aloha', function() {
		// check whether error or warn messages were logged during startup
		test('Aloha Error Log Test', function() {
			var logHistory = Aloha.Log.getLogHistory();
			equal(logHistory.length, 0, 'Check number of logged messages');
		});

		// check whether alohafying of divs works
		test('Aloha Editable Test', function() {
			var editable = aQuery('#edit');
			editable.aloha();
			equals(editable.contentEditable(), "true", 'Check whether div is contenteditable after .aloha()');
			editable.mahalo();
			equals(editable.contentEditable(), "false", 'Check whether div is not contenteditable after .mahalo()');
		});
	});
});
