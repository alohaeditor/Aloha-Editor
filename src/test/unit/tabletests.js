/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

define(
[ 'testutils', 'table/table-plugin' ],
function( TestUtils, TablePlugin ) {
	'use strict';

	var tests = [
		
		//
		// Activation/deactivation
		//
		
		{
			start     : '<table><tbody><tr><td>foo</td></tr></tbody></table>',
			expected  : '<table><tbody><tr><td>foo</td></tr></tbody></table>',
			operation : function () {
			}
		}
		
		//
		// Inserting/removing rows
		//
		
		//
		// Inserting/removing cols
		//
		
		//
		// Merge rows
		//
		
		//
		// Merge cells
		//
		
		//
		// Prevent merging non-rectangulare selections
		//
		
		//
		// Split merged cells
		//
		
		//
		// Transform to from normal cell to header
		//
		
		//
		// Transform to from header to normal cell
		//
		
		//
		// Toggle header transformations
		//
		
	];

	Aloha.ready( function() {
		var jQuery = Aloha.jQuery,
		    editable = jQuery( '#editable' ),
			testcase;
		
		for ( var i = 0; i < tests.length; i++ ) {
			testcase = tests[ i ];
			
			editable.html( testcase.start );
			editable.aloha().mahalo();
            
			typeof testcase.operation === 'function' && testcase.operation();
			
			test( 'table test', { start: testcase.start, expected: testcase.expected }, function() {
				var result = editable.html().toLowerCase();
				result = result.replace( /(<table.*?)\s*id\s*=\s*[\"\'][^\"\']*[\"\']/ig, '$1' );
				deepEqual( result, testcase.expected, 'Check Operation Result' );
			});
		}
	});
});
