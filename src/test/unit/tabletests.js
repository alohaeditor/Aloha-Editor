/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

define(
[ 'testutils' ],
function( TestUtils ) {
	'use strict';
	
	var tests = [
		
		//
		// Activation/deactivation
		//
		
		/*
		{
			start     : '<table><tbody><tr><td>foo</td></tr></tbody></table>',
			expected  : '<table><tbody><tr><td>foo</td></tr></tbody></table>',
			operation : function ( table ) {}
		},
		*/
		
		//
		//	adding columns
		//
		
		/*
		// In this case  we are only interested that a column is inserted
		// we ignore the fact that there is an error with addColumnsRight
		// where it the 0 index is the selection helper columns)
		{
			start     : '<table><tbody><tr><td>foo</td></tr></tbody></table>',
			expected  : '<table><tbody><tr><td>foo</td><td>&nbsp;</td></tr></tbody></table>',
			operation : function ( table ) {
				//table.selectColumns( [ 0 ] ); 
				table.selectColumns( [ 1 ] ); 
				table.addColumnsRight();
			}
		},
		*/
		
		/*
		{
			start     : '<table><tbody><tr><td>foo</td><td>bar</td></tr></tbody></table>',
			expected  : '<table><tbody><tr><td>foo</td><td>&nbsp;</td><td>bar</td></tr></tbody></table>',
			operation : function ( table ) {
				table.selectColumns( [ 0 ] ); 
				table.addColumnsRight();
			}
		}
		*/
		
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
		var TablePlugin = Aloha.require( 'table/table-plugin' ),		
		    jQuery = Aloha.jQuery,
		    editable = jQuery( '#editable' ),
			testcase;
		
		for ( var i = 0; i < tests.length; i++ ) {
			testcase = tests[ i ];
			
			// Place test contents into our editable
			editable.html( testcase.start ).aloha();
			
			if ( typeof testcase.operation === 'function' ) {
				// Click the editable to trigger the aloha-editable-activated 
				// event Then click on the table to activate
				editable.mousedown().find( 'table' ).mousedown();
				testcase.operation( TablePlugin.activeTable );
			}
			
			editable.mahalo();
			
			test( 'table test', { start: testcase.start, expected: testcase.expected }, function() {
				var result = editable.html().toLowerCase();
				result = result.replace( /(<table.*?)\s*id\s*=\s*[\"\'][^\"\']*[\"\']/ig, '$1' );
				deepEqual( result, testcase.expected, 'Check Operation Result' );
			});
		}
	});
});
