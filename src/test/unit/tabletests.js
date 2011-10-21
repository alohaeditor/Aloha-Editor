/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

define(
[ 'testutils', 'htmlbeautifier' ],
function( TestUtils ) {
	'use strict';
	
	var tests = [
		
		//
		//	  NB:
		//	------------------------------------------------------------------
		//	  The table plugin currently does not disactivate correctly when
		//	  mahalo is called, so are unable to run this test together. we
		//	  can only run one at a time
		//	------------------------------------------------------------------
		//
		
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
		// Column selection
		//
		
		/*
		{
			start     : '<table><tbody><tr><td>foo</td></tr></tbody></table>',
			expected  : '<table><tbody><tr><td>foo</td><td>&nbsp;</td></tr></tbody></table>',
			operation : function ( table ) {
				table.selectColumns( [ 0 ] ); 
				table.addColumnsRight();
			}
		},
		*/
		
		//
		//	  NB:
		//	------------------------------------------------------------------
		//	  Selectcolumns has a bug where it allows us to programmatically
		//	  select the helper column (and row).
		//	  All following tests will work around this fault by using
		//	  1-indexing with selectcolumns
		//	------------------------------------------------------------------
		//
		
		//
		// Inserting/removing cols
		//
		
		/*
		{
			start     : '<table><tbody><tr><td>foo</td></tr></tbody></table>',
			expected  : '<table><tbody><tr><td>foo</td><td>&nbsp;</td></tr></tbody></table>',
			operation : function ( table ) {
				table.selectColumns( [ 1 ] ); 
				table.addColumnsRight();
			}
		},
		*/
		
		/*
		{
			start     : '<table><tbody><tr><td>foo</td></tr></tbody></table>',
			expected  : '<table><tbody><tr><td>&nbsp;</td><td>foo</td></tr></tbody></table>',
			operation : function ( table ) {
				table.selectColumns( [ 0 ] ); 
				table.addColumnsLeft();
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
		},
		*/
		
		/*
		{
			start     : '<table><tbody><tr><td>foo</td></tr><tr><td>bar</td></tr></tbody></table>',
			expected  : '<table><tbody><tr><td>&nbsp;</td><td>foo</td></tr><tr><td>&nbsp;</td><td>bar</td></tr></tbody></table>',
			operation : function ( table ) {
				table.selectColumns( [ 0 ] ); 
				table.addColumnsRight();
			}
		},
		*/
		
		/*
		{
			start     : '<table><tbody><tr><td>foo</td><td>bar</td></tr><tr><td>foo1</td><td>bar2</td></tr></tbody></table>',
			expected  : '<table><tbody><tr><td>foo</td><td>&nbsp;</td><td>bar</td></tr><tr><td>foo1</td><td>&nbsp;</td><td>bar2</td></tr></tbody></table>',
			operation : function ( table ) {
				table.selectColumns( [ 2 ] ); 
				table.addColumnsLeft();
			}
		},
		*/
		
		//
		// Inserting/removing rows
		//
		
		// In this case  we are only interested that a column is inserted we
		// ignore the fact that there is an error with addColumnsRight where it
		// the 0 index is the selection helper columns
		/*
		{
			start     : '<table><tbody><tr><td>foo</td></tr></tbody></table>',
			expected  : '<table><tbody><tr><td>foo</td></tr><tr><td>&nbsp;</td></tr></tbody></table>',
			operation : function ( table ) {
				table.addRow( 0 );
			}
		},
		*/
		
		/*
		{
			start     : '<table><tbody><tr><td>foo</td></tr><tr><td>bar</td></tr></tbody></table>',
			expected  : '<table><tbody><tr><td>foo</td></tr><tr><td>&nbsp;</td></tr><tr><td>bar</td></tr></tbody></table>',
			operation : function ( table ) {
				table.addRow( 1 );
			}
		},
		*/
		
		//
		// Merging
		//
		
		/*
		{
			start     : '<table><tbody>\
							<tr><td class="aloha-cell-selected">foo</td></tr>\
							<tr><td class="aloha-cell-selected">bar</td></tr>\
						</tbody></table>',
			expected  : '<table><tbody>\
							<tr><td rowspan="2" colspan="1">foo bar</td></tr>\
							<tr></tr>\
						</tbody></table>',
			operation : function ( table ) {
				var $cells = table.obj.find( 'td.aloha-cell-selected' );
				var cells = [];
				$cells.each( function () { cells.push( this ); } );
				table.selection.selectedCells = cells;
				table.selection.mergeCells();
			}
		},
		*/
		
		/*
		{
			start     : '<table><tbody>\
							<tr><td class="aloha-cell-selected"><i>foo</i></td></tr>\
							<tr><td class="aloha-cell-selected">bar</td></tr>\
						</tbody></table>',
			expected  : '<table><tbody>\
							<tr><td rowspan="2" colspan="1"><i>foo</i> bar</td></tr>\
							<tr></tr>\
						</tbody></table>',
			operation : function ( table ) {
				var $cells = table.obj.find( 'td.aloha-cell-selected' );
				var cells = [];
				$cells.each( function () { cells.push( this ); } );
				table.selection.selectedCells = cells;
				table.selection.mergeCells();
			}
		}
		*/
		
		/*
		{
			start     : '<table><tbody>\
							<tr><td class="aloha-cell-selected">foo</td></tr>\
							<tr><td>bar</td></tr>\
						</tbody></table>',
			expected  : '<table><tbody>\
							<tr><td rowspan="1" colspan="1">foo</td></tr>\
							<tr><td>bar</td></tr>\
						</tbody></table>',
			operation : function ( table ) {
				var $cells = table.obj.find( 'td.aloha-cell-selected' );
				var cells = [];
				$cells.each( function () { cells.push( this ); } );
				table.selection.selectedCells = cells;
				table.selection.mergeCells();
			}
		}
		*/
		
		/*
		{
			start     : '<table><tbody>\
							<tr><td class="aloha-cell-selected"><i>foo</i></td></tr>\
							<tr><td class="aloha-cell-selected"><i>bar</i></td></tr>\
						</tbody></table>',
			expected  : '<table><tbody>\
							<tr><td rowspan="2" colspan="1"><i>foo</i> <i>bar</i></td></tr>\
							<tr></tr>\
						</tbody></table>',
			operation : function ( table ) {
				var $cells = table.obj.find( 'td.aloha-cell-selected' );
				var cells = [];
				$cells.each( function () { cells.push( this ); } );
				table.selection.selectedCells = cells;
				table.selection.mergeCells();
			}
		}
		*/
		
		{
			start     : '<table><tbody>\
							<tr><td class="aloha-cell-selected">foo1</td>\
								<td class="aloha-cell-selected">bar1</td></tr>\
							<tr><td>foo2</td><td>bar2</td></tr>\
						</tbody></table>',
			expected  : '<table><tbody>\
							<tr><td rowspan="1" colspan="2">foo1 bar1</td></tr>\
							<tr><td>foo2</td><td>bar2</td></tr>\
						</tbody></table>',
			operation : function ( table ) {
				var $cells = table.obj.find( 'td.aloha-cell-selected' );
				var cells = [];
				$cells.each( function () { cells.push( this ); } );
				table.selection.selectedCells = cells;
				table.selection.mergeCells();
			}
		},
		
		/*
		{
			start     : '<table><tbody>\
							<tr><td class="aloha-cell-selected"><i>foo1</i></td>\
								<td class="aloha-cell-selected"><i>bar1</i></td></tr>\
							<tr><td class="aloha-cell-selected"><i>foo2</i></td>\
								<td class="aloha-cell-selected"><i>bar2</i></td></tr>\
						</tbody></table>',
			expected  : '<table><tbody>\
							<tr><td rowspan="2" colspan="2">\
								<i>foo1</i> <i>bar1</i> <i>foo2</i> <i>bar2</i>\
							</td></tr>\
							<tr></tr>\
						</tbody></table>',
			operation : function ( table ) {
				var $cells = table.obj.find( 'td.aloha-cell-selected' );
				var cells = [];
				$cells.each( function () { cells.push( this ); } );
				table.selection.selectedCells = cells;
				table.selection.mergeCells();
			}
		}
		*/
		
		/*
		{
			start     : '<table><tbody>\
							<tr><td class="aloha-cell-selected"><i>foo1</i></td>\
								<td class="aloha-cell-selected"><i>bar1</i></td></tr>\
							<tr><td><i>foo2</i></td>\
								<td><i>bar2</i></td></tr>\
						</tbody></table>',
			expected  : '<table><tbody>\
							<tr><td rowspan="1" colspan="2">\
								<i>foo1</i> <i>bar1</i>\
							</td></tr>\
							<tr><td><i>foo2</i></td>\
								<td><i>bar2</i></td></tr>\
						</tbody></table>',
			operation : function ( table ) {
				var $cells = table.obj.find( 'td.aloha-cell-selected' );
				var cells = [];
				$cells.each( function () { cells.push( this ); } );
				table.selection.selectedCells = cells;
				table.selection.mergeCells();
			}
		}
		*/
		
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
			testcase,
			start,
			expected;
		
		for ( var i = 0; i < tests.length; i++ ) {
			testcase = tests[ i ];
			start = style_html( testcase.start );
			expected = style_html( testcase.expected );
			
			// Place test contents into our editable
			editable.html( start ).aloha();
			
			if ( typeof testcase.operation === 'function' ) {
				// Click the editable to trigger the aloha-editable-activated 
				// event Then click on the table to activate
				editable.mousedown().find( 'table' ).mousedown();
				testcase.operation( TablePlugin.activeTable );
			}
			
			editable.mahalo();
			
			test( 'table test', { start: start, expected: expected }, function() {
				var result = editable.html().toLowerCase();
				result = result.replace( /(<table.*?)\s*id\s*=\s*[\"\'][^\"\']*[\"\']/ig, '$1' );
				result = style_html( result );
				deepEqual( result, expected, 'Check Operation Result' );
			});
		}
	});
});
