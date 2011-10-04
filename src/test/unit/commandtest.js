/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

define(
['testutils'],
function( TestUtils ) {
	"use strict";
	
	var aQuery = Aloha.jQuery;

	// Test whether Aloha is properly initialized
	asyncTest( 'Aloha Startup Test', function() {
		var timeout = setTimeout(function() {
			ok(false, 'Aloha was not initialized within 60 seconds');
			start();
		}, 60000);
		Aloha.ready( function() {
			clearTimeout( timeout );
			ok( true, 'Aloha Event was fired' );
			start();
		});
	});

	// All other tests are done when Aloha is ready
	Aloha.ready( function() {

		var 
			editable = aQuery( '#edit' ),
			converter = aQuery('<div>');
		
		// aloha'fy the editable
		editable.aloha();
		
		for ( var i = 0; i < tests.tests.length; i++ ) {

			var	check = tests.tests[i];
			check.value = ( typeof check.value !== 'undefined') ? check.value : tests.defaultValue;
			check.attributes = ( typeof check.attributes !== 'undefined') ? check.attributes : tests.defaultAttributes;
			converter.text(check.start);
			var desc = converter.html();
			converter.text(check.value);
			var	name = check.name || '"' + converter.html() + '": ' + desc;
			
			module( 'Commmand ' + (i+1) + ' ' + tests.defaultCommand, {
				setup: function() {
					// fill the editable area with the start value
					editable.html(this.check.start);
					editable.focus();
				},
				teardown: function() {
					// goodbye
				}
			});
			
			test( name, {check:check}, function() {
				var 
					check = this.check,
					command = check.command || tests.defaultCommand,
					range = TestUtils.addRange( editable ),
					execResult,
					execToggle,
					result,
					r;
				
				r = Aloha.createRange();
				r.setStart( range.startContainer, range.startOffset) ;
				r.setEnd( range.endContainer, range.endOffset);
				Aloha.getSelection().removeAllRanges();
				Aloha.getSelection().addRange(r);
				
				// Start
				if ( typeof check.indetermStart !== 'undefined' ) {
					// query command indeterminacy and compare
					result = Aloha.queryCommandIndeterm( command );
					deepEqual( result, check.indetermStart, 'queryCommandIndeterm start' );
				}
				if ( typeof check.stateStart !== 'undefined' ) {
					// query command state and compare
					result = Aloha.queryCommandState( command );
					deepEqual( result, check.stateStart, 'queryCommanState start' );
				}
				if ( typeof check.valueStart !== 'undefined' ) {
					// query command value and compare
					result = Aloha.queryCommandValue( command );
					deepEqual( result, check.valueStart, 'queryCommandValue start' );
				}
				
				// ExecCommand
				if ( typeof check.execResult !== 'undefined' ) {
					// execute the command
					Aloha.execCommand( command, false, check.value );
					// place the marker at the selection and add brackets
					range = rangy.getSelection().getRangeAt(0);
					TestUtils.addBrackets(range);
					result = Aloha.editables[0].getContents( true );			
					execResult = aQuery( '<div>' + check.execResult + '</div>' ).contents();
					deepEqual( result.extractHTML( check.attributes ), execResult.extractHTML( check.attributes ), 'execCommand result' );
				}
				
				// Result
				if ( typeof check.indetermResult !== 'undefined' ) {
					// query command indeterminacy and compare
					result = Aloha.queryCommandIndeterm( command );
					deepEqual( result, check.indetermResult, 'queryCommandIndeterm result' );
				}
				if ( typeof check.stateResult !== 'undefined' ) {
					// query command state and compare
					result = Aloha.queryCommandState( command );
					deepEqual( result, check.stateResult, 'queryCommanState result' );
				}
				if ( typeof check.valueResult !== 'undefined' ) {
					// query command value and compare
					result = Aloha.queryCommandValue( command );
					deepEqual( result, check.valueResult, 'queryCommandValue result' );
				}

				if ( check.execToggle ) {
					range = TestUtils.addRange( editable );
				
					r = Aloha.createRange();
					r.setStart( range.startContainer, range.startOffset) ;
					r.setEnd( range.endContainer, range.endOffset);
					Aloha.getSelection().removeAllRanges();
					Aloha.getSelection().addRange(r);

					// toggle ExecCommand
					if ( typeof check.execToggle !== 'undefined' ) {
						// execute the command
						result = Aloha.execCommand( command, false, check.value );
						// place the marker at the selection and add brackets
						range = rangy.getSelection().getRangeAt(0);
						TestUtils.addBrackets(range);
						result = Aloha.editables[0].getContents( true );			
						execToggle = aQuery( '<div>' + check.execToggle + '</div>' ).contents();
						deepEqual( result.extractHTML( check.attributes ), execToggle.extractHTML( check.attributes ), 'execCommand toggle result' );
					}
					
					// Toggle result
					if ( typeof check.indetermToggle !== 'undefined' ) {
						// query command indeterminacy and compare
						result = Aloha.queryCommandIndeterm( command );
						deepEqual( result, check.indetermToggle, 'queryCommandIndeterm toggle result' );
					}
					if ( typeof check.stateToggle !== 'undefined' ) {
						// query command state and compare
						result = Aloha.queryCommandState( command );
						deepEqual( result, check.stateToggle, 'queryCommanState toggle result' );
					}
					if ( typeof check.valueResult !== 'undefined' ) {
						// query command value and compare
						result = Aloha.queryCommandValue( command );
						deepEqual( result, check.valueToggle, 'queryCommandValue toggle result' );
					}
				}
					
			});
		}
	});
});
