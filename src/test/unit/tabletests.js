/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

define(
[ 'testutils', 'htmlbeautifier' ],
function( TestUtils ) {
	'use strict';
	
	function getSelectedCells ( table ) {
		var $cells = table.obj.find( 'td.aloha-cell-selected' );
		var cells = [];
		$cells.each( function () { cells.push( this ); } );
		return cells;
	};
	
	var tests = [
		
		{ module : 'Activation/deactivation' },
		
		{
			desc	  : 'Activate and deactivate a table',
			start     : '<table><tbody><tr><td>foo</td></tr></tbody></table>',
			expected  : '<table><tbody><tr><td>foo</td></tr></tbody></table>',
			operation : function ( table ) {}
		},
		
		//
		//	  NB:
		//	------------------------------------------------------------------
		//	  selectRow and selectColumns has a bug where it allows us to
		//	  programmatically select the helper column (and row).
		//	  All following tests will work around this fault by using
		//	  1-indexing with selectcolumns rather than 0 based indexing
		//	------------------------------------------------------------------
		//
		
		{ module : 'Row/column selection' },
		
		{
			desc	  : 'Select column by index',
			start     : '<table><tbody><tr><td>foo</td></tr></tbody></table>',
			expected  : '<table><tbody><tr><td>bar</td></tr></tbody></table>',
			operation : function ( table ) {
				table.selectColumns( [ 0 ] );
				table.obj.find( '.aloha-cell-selected' )
					 .html( 'bar' )
					 .removeAttr( 'class' )
					 .removeAttr( 'style' );
			}
		},
		
		{
			desc	  : 'Select row by index',
			start     : '<table><tbody><tr><td>foo</td></tr></tbody></table>',
			expected  : '<table><tbody><tr><td>bar</td></tr></tbody></table>',
			operation : function ( table ) {
				table.selectRows( [ 0 ] );
				table.obj.find( '.aloha-cell-selected' )
					 .html( 'bar' )
					 .removeAttr( 'class' )
					 .removeAttr( 'style' );
			}
		},
		
		{ module : 'Inserting/removing columns' },
		
		//
		// Inserting/removing cols
		//
		
		{
			desc	  : 'Insert column right of column at index 0',
			start     : '<table><tbody><tr><td>foo</td><td>bar</td></tr></tbody></table>',
			expected  : '<table><tbody><tr><td>foo</td><td>&nbsp;</td><td>bar</td></tr></tbody></table>',
			operation : function ( table ) {
				table.selectColumns( [ 0 ] ); 
				table.addColumnsRight();
			}
		},
		
		{
			desc	  : 'Insert column right of column at index 1',
			start     : '<table><tbody><tr><td>foo</td></tr></tbody></table>',
			expected  : '<table><tbody><tr><td>foo</td><td>&nbsp;</td></tr></tbody></table>',
			operation : function ( table ) {
				table.selectColumns( [ 1 ] ); 
				table.addColumnsRight();
			}
		},
		
		{
			desc	  : 'Insert column left of 1st column',
			start     : '<table><tbody><tr><td>foo</td></tr></tbody></table>',
			expected  : '<table><tbody><tr><td>&nbsp;</td><td>foo</td></tr></tbody></table>',
			operation : function ( table ) {
				table.selectColumns( [ 0 ] ); 
				table.addColumnsLeft();
			}
		},
		
		{
			desc	  : 'Add column left of 2nd column',
			start     : '<table><tbody>\
							<tr><td>foo</td><td>bar</td></tr>\
							<tr><td>foo1</td><td>bar2</td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td>foo</td><td>&nbsp;</td><td>bar</td></tr>\
							<tr><td>foo1</td><td>&nbsp;</td><td>bar2</td></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.selectColumns( [ 2 ] ); 
				table.addColumnsLeft();
			}
		},
		
		{ module : 'Inserting/removing rows' },
		
		//
		// Inserting/removing rows
		//
		
		{
			desc	  : 'Add row at index 0',
			start     : '<table><tbody><tr><td>foo</td></tr></tbody></table>',
			expected  : '<table><tbody><tr><td>foo</td></tr><tr><td>&nbsp;</td></tr></tbody></table>',
			operation : function ( table ) {
				table.addRow( 0 );
			}
		},
		
		{
			desc	  : 'Add row at index 1',
			start     : '<table><tbody><tr><td>foo</td></tr><tr><td>bar</td></tr></tbody></table>',
			expected  : '<table><tbody><tr><td>foo</td></tr><tr><td>&nbsp;</td></tr><tr><td>bar</td></tr></tbody></table>',
			operation : function ( table ) {
				table.addRow( 1 );
			}
		},
		
		{ module : 'Merging cells' },
		
		{
			desc	  : 'Basic columns merging',
			start     : '<table><tbody>\
							<tr><td class="aloha-cell-selected">foo</td></tr>\
							<tr><td class="aloha-cell-selected">bar</td></tr>\
						</tbody></table>',
			expected  : '<table><tbody>\
							<tr><td rowspan="2" colspan="1">foo bar</td></tr>\
							<tr></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.selection.selectedCells = getSelectedCells( table );
				table.selection.mergeCells();
			}
		},
		
		{
			desc	  : 'Merging columns',
			start     : '<table><tbody>\
							<tr><td class="aloha-cell-selected"><i>foo</i></td></tr>\
							<tr><td class="aloha-cell-selected">bar</td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td rowspan="2" colspan="1"><i>foo</i> bar</td></tr>\
							<tr></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.selection.selectedCells = getSelectedCells( table );
				table.selection.mergeCells();
			}
		},
		
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
				table.selection.selectedCells = getSelectedCells( table );
				table.selection.mergeCells();
			}
		},
		
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
				table.selection.selectedCells = getSelectedCells( table );
				table.selection.mergeCells();
			}
		},
		
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
				table.selection.selectedCells = getSelectedCells( table );
				table.selection.mergeCells();
			}
		},
		
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
				table.selection.selectedCells = getSelectedCells( table );
				table.selection.mergeCells();
			}
		},
		
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
				table.selection.selectedCells = getSelectedCells( table );
				table.selection.mergeCells();
			}
		},
		
		{
			start     : '<table><tbody>\
							<tr><td class="aloha-cell-selected">foo1</td><td>bar1</td></tr>\
							<tr><td class="aloha-cell-selected">foo2</td><td>bar2</td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td rowspan="2" colspan="1">foo1 foo2</td><td>bar1</td></tr>\
							<tr><td>bar2</td></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.selection.selectedCells = getSelectedCells( table );
				table.selection.mergeCells();
			}
		},
		
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
		
		[]
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
			
			if ( testcase.module ) {
				module( testcase.module.toUpperCase() + ' :' );
				continue;
			}
			
			start = style_html( testcase.start );
			expected = style_html( testcase.expected );
			
			// Place test contents into our editable, and activate the editable
			editable.html( start ).aloha();
			
			if ( typeof testcase.operation === 'function' ) {
				editable
					.mousedown() // tigger the aloha-editable-activated event
					.mouseup()	 // this is needed to get the table plugin to deactivate correctly
						.find( 'table' )
							.mousedown();
				testcase.operation( TablePlugin.activeTable );
			}
			
			editable.mahalo();
			
			test(
				( testcase.desc || 'Test' ).toUpperCase(),
				{ start: start, expected: expected },
				function() {
					var result = editable.html().toLowerCase();
					result = result.replace( /(<table.*?)\s*id\s*=\s*[\"\'][^\"\']*[\"\']/ig, '$1' );
					result = style_html( result );
					deepEqual( result, expected, 'Check Operation Result' );
				}
			);
		}
	});
});
