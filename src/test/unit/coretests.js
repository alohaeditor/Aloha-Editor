/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

define("coretests",
['aloha/jquery'],
function(jQuery, undefined) {
	"use strict";
	
	var $ = jQuery;
	
if (window.Aloha === undefined || window.Aloha === null) {
		window.Aloha = {};		
}
window.Aloha.settings = {
	logLevels : {
		'error': true,
		'warn':  true,
		'info':  false,
		'debug': false
	},
	logHistory : {
		levels : {
			'error' : true,
			'warn' : true,
			'info' : false,
			'debug' : false
		}
	},
	errorhandling : true
};

require.ready(function() {
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
		$('body').bind('aloha',function() {
			ok(true, 'Aloha Event was fired');
			start();
		});
		setTimeout(function() {
			ok(false, 'Aloha was not initialized within 60 seconds');
			start();
		}, 60000);
	});

	// All other tests are done when Aloha is ready
	$('body').bind('aloha', function() {
		// check whether error or warn messages were logged during startup
		test('Aloha Error Log Test', function() {
			var logHistory = Aloha.Log.getLogHistory();
			equal(logHistory.length, 0, 'Check number of logged messages');
		});

		// check whether alohafying of divs works
		test('Aloha Editable Test', function() {
			var editable = $('#edit');
			editable.aloha();
			equals(editable.contentEditable(), "true", 'Check whether div is contenteditable after .aloha()');
			editable.mahalo();
			equals(editable.contentEditable(), "false", 'Check whether div is not contenteditable after .mahalo()');
		});
	});
});

});