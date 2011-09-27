/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

define(
[ 'testutils' ],
function( TestUtils ) {
	"use strict";
	
	// All other tests are done when Aloha is ready
	Aloha.ready( function() {

		var 
			editable = Aloha.jQuery( '#edit' ),
			converter = Aloha.jQuery('<div>');
		
		// aloha'fy the editable
		editable.aloha();
		
		for ( var i = 0; i < tests.length; i++ ) {
			var 
				start = typeof tests[i] === 'string' ? tests[i] : tests[i][0],
				expected = typeof tests[i] === 'string' ? tests[i] : tests[i][1],
				desc = converter.text(start).html() + ' -> ' + converter.text(expected).html();
			
			module( 'Selection ' + (i+1) + ' : ' + desc, {
				setup: function() {
					// fill the editable area with the start value
					editable.html( this.start );
					editable.focus();
				},
				teardown: function() {
					// goodbye
				}
			});
			
			test( name, {start:start, expected:expected}, function() {
				var 
					// place the selection (and remove the selection marker)
					startRange = TestUtils.addRange( editable ),
					endRange,
					result;
				
				// remove all ranges
				Aloha.getSelection().removeAllRanges();
				
				// create a range object
				var testRange = Aloha.createRange();
				
				// set the range
				testRange.setStart( startRange.startContainer, startRange.startOffset );
				testRange.setEnd( startRange.endContainer, startRange.endOffset );
				
				// place the marker at the selection
				Aloha.getSelection().addRange( testRange );
				
				// get the selected Range
				endRange = Aloha.getSelection().getRangeAt( 0 );
				
				// add markers to selection
				TestUtils.addBrackets(endRange);

				// get the content of the editable
				result = Aloha.editables[0].getContents();			

				// compare the result with the expected result
				deepEqual( result.toLowerCase(), this.expected, 'Check Operation Result' );
			});
		}
	});
});
