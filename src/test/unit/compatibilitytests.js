/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

define("compatibilitytest",
['aloha/jquery', 'jquery-plugin!../test/unit/jquery.alohaTest'],
function(aQuery) {
	"use strict";

	// Start the tests, when Aloha is ready
	aQuery('body').bind('aloha', function() {
		// for IE, it is necessary to have this setTimeout. Otherwise, the
		// editable would not be recognized as having contentEditable turned on
		// right after editable.aloha
		setTimeout(function() {

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

			// Test if legacy jQuery version is correct
			test('jQuery compatibility test', function() {
				equals(window.jQuery.fn.jquery, '1.2.1', 'Legacy jQuery version is correct');
			});
		
			// Test if legacy jQuery version is correct
			test('Aloha jQuery test', function() {
				equals(aQuery.fn.jquery, '1.5.1', 'Legacy jQuery version is correct');
			});
		
			// Test if legacy jQuery version is correct
			test('window.alohaQuery test', function() {
				equals(window.alohaQuery.fn.jquery, '1.5.1', 'Legacy jQuery version is correct');
			});
		
			// Test if the jquery plugins necessary for aloha core are attached to the Aloha jQuery object
			test('jquery core plugin test', function() {
				equals(typeof aQuery.store, 'function', 'Check whether the jQuery plugin "store" was attached to Aloha jQuery');
				equals(typeof aQuery.toJSON, 'function', 'Check whether the jQuery plugin "json" was attached to Aloha jQuery');
			});
		
			// Test if third party jquery plugins, loaded with the 'jquery-plugin' loader are attached to the Aloha jQuery object
			test('3rd party jquery plugin test', function() {
				equals(typeof aQuery().alohaTest, 'function', 'Check whether the jQuery plugin "alohaTest" was attached to Aloha jQuery');
			});
		}, 1);
	});
});