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

	// Test whether Aloha is properly initialized
	asyncTest( 'Aloha Startup Test', function() {
		var timeout = setTimeout(function() {
			ok(false, 'Aloha was not initialized within 60 seconds');
			start();
		}, 60000);
		aQuery( 'body' ).bind( 'aloha',function() {
			clearTimeout( timeout );
			ok( true, 'Aloha Event was fired' );
			start();
		});
	});

	// All other tests are done when Aloha is ready
	aQuery( 'body' ).bind( 'aloha', function() {

		var editable = aQuery( '#edit' );
		// aloha'fy the editable
		editable.aloha();
		
		for ( var i = 0; i < tests.tests.length; i++ ) {
			var 
				check = tests.tests[i],
				desc = check.start + ' -> ' + check.expected;
			
			module( 'Commmand ' + tests.defaultCommand, {
				setup: function() {
					// fill the editable area with the start value
					editable.html(this.check.start);
					editable.focus();
				},
				teardown: function() {
					// goodbye
				}
			});

			test('"' + (check.value || tests.defaultValue) + '": ' + desc, {check:check}, function() {
				var 
					check = this.check,
					command = check.command || tests.defaultCommand,
					value = check.value || tests.defaultValue,
					expected = aQuery( '<div>' + check.expected + '</div>' ).contents(),
					// place the selection (and remove the selection marker)
					range = TestUtils.rangeFromMarker( editable ),
					result;
				
				ok( range, 'Check for selection' );
				range.select();
				Aloha.Selection.updateSelection();

				// execute the command
				Aloha.execCommand( command, false, value );
				
				// place the marker at the selection
				TestUtils.markerFromSelection();
				
				// TODO deactivate the editable 
				result = Aloha.editables[0].getContents( true );			

				// compare the result with the expected result
				deepEqual( result.extractHTML(), expected.extractHTML(), 'Check Operation Result' );
			});
		}
	});
});
