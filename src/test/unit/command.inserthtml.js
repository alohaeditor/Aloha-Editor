/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

define("command.inserthtml",
['aloha/jquery', 'testutils'],
function(aQuery, TestUtils, undefined) {
	"use strict";
	
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

	// Prepare
	var	$ = window.jQuery,
		$body = $('body');

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
		// find all the tests
		var $edit = aQuery('#edit');
		aQuery('.test').each(function() {
			var $test = aQuery(this),
				desc = $test.children('.desc').eq(0).text(),
				$input = $test.children('.input').eq(0),
				$ref = $test.children('.ref').eq(0).clone(),
				$insert = $test.children('.insert').eq(0),

			// fill the editable area with the input
			$edit.html($input.html());
			$edit.focus();

			module('Commmand inserthtml', {
				setup: function() {
					// aloha'fy the editable
					$edit.aloha();
				},
				teardown: function() {
					// de-aloha'fy the editable
//					$edit.mahalo();
				}
			});

			// get test data (description, input and reference result)
			test(desc, function() {
				// place the selection (and remove the selection marker)
				var 
					selectionRange = TestUtils.rangeFromMarker($edit),
					expected = $ref.contents(),
					result = null;
				
				ok(selectionRange, 'Check for selection');
				selectionRange.select();
				Aloha.Selection.updateSelection();

				// simulate backspace
				Aloha.execCommand('inserthtml', false, $insert);
				
				TestUtils.markerFromSelection();
				
				result = Aloha.editables[0].getContents(true);			

				// compare the result with the expected result
				deepEqual(result.extractHTML(), expected.extractHTML(), 'Check Operation Result');
			});
		});
	});
});
