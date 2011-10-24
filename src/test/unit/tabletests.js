/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

/**
 * Known issues with table plugin
 * ------------------------------
 * 1) selectRow/selectColumn does not take into account the helper row/column.
 *    selectRow(0) and selectColumn(0) will therefore select the selection
 *    helper cells rather than the editable cells.
 *
 * 2) When a colspan or a rowspan is equal to the number of respective rows
 *    or columns, then the table will break. It will no longer be possible to
 *    activate/deactivate the table, or to select and operate over that
 *    selection
 *
 * 3) Merging columns leaves an empty row.
 */

define(
[ 'testutils', 'htmlbeautifier' ],
function( TestUtils ) {
	'use strict';
	
	/**
	 * Helper function to create an array of "selected" td's, which are marked
	 * with the class "aloha-cell-selected"
	 *
	 * @param {Table} table
	 * @return {Array} set of selected td's
	 */
	function getSelectedCells ( table ) {
		var cells = [],
		    $cells = table.obj.find( 'td.aloha-cell-selected' );
		$cells.each( function () { cells.push( this ); } );
		return cells;
	};
	
	var tests = [
		
		{ module : 'Activation/deactivation' },
		///////////////////////////////////////////////////////////////////////
		
		{
			exclude   : true,
			desc      : 'Activate and deactivate a table',
			start     : '<table><tbody><tr><td>foo</td></tr></tbody></table>',
			expected  : '<table><tbody><tr><td>foo</td></tr></tbody></table>',
			operation : function ( table ) {}
		},
		
		{ module : 'Row/column selection' },
		///////////////////////////////////////////////////////////////////////
		
		{
			exclude   : true,
			desc      : 'Select column by index',
			start     : '<table><tbody><tr><td>foo</td></tr></tbody></table>',
			expected  : '<table><tbody><tr><td>bar</td></tr></tbody></table>',
			operation : function ( table ) {
				table.selection.selectColumns( [ 0 ] );
				table.obj.find( '.aloha-cell-selected' )
					 .html( 'foo was selected' )
					 .removeAttr( 'class' )
					 .removeAttr( 'style' );
			}
		},
		
		{
			exclude   : true,
			desc      : 'Select row by index',
			start     : '<table><tbody><tr><td>foo</td></tr></tbody></table>',
			expected  : '<table><tbody><tr><td>bar</td></tr></tbody></table>',
			operation : function ( table ) {
				table.selection.selectRows( [ 0 ] );
				table.obj.find( '.aloha-cell-selected' )
					 .html( 'foo was selected' )
					 .removeAttr( 'class' )
					 .removeAttr( 'style' );
			}
		},
		
		//
		//	  NB:
		//	-------------------------------------------------------------------
		//	  selectRow and selectColumns has a bug where index 0 selects the
		//	  helper row/column instead of the first editable row/column.
		//	  All following tests will work around this fault by using
		//	  1-indexing with selectcolumns rather than 0 based indexing.
		//	  Where this id done, we note that we have "corrected" the index.
		//	-------------------------------------------------------------------
		//
		
		{ module : 'Inserting/removing columns' },
		///////////////////////////////////////////////////////////////////////
		
		{
			exclude	  : true,
			desc      : 'Insert column right of column at index 0 (corrected to 1)',
			start     : '<table><tbody>\
							<tr><td>foo</td><td>bar</td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td>foo</td><td>&nbsp;</td><td>bar</td></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.selection.selectColumns( [ 1 ] ); 
				table.addColumnsRight();
			}
		},
		
		{
			exclude	  : true,
			desc      : 'Insert column right of column at index 1 (corrected to 2)',
			start     : '<table><tbody>\
							<tr><td>foo</td><td>bar</td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td>foo</td><td>&nbsp;</td><td>bar</td></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.selection.selectColumns( [ 2 ] ); 
				table.addColumnsLeft();
			}
		},
		
		{
			exclude	  : true,
			desc      : 'Insert column left of 1st column (column 0, corrected to 1)',
			start     : '<table><tbody>\
							<tr><td>foo</td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td>&nbsp;</td><td>foo</td></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.selection.selectColumns( [ 1 ] ); 
				table.addColumnsLeft();
			}
		},
		
		{
			exclude	  : true,
			desc      : 'Add column left of 2nd column (corrected to 2)',
			start     : '<table><tbody>\
							<tr><td>foo</td><td>bar</td></tr>\
							<tr><td>foo1</td><td>bar2</td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td>foo</td><td>&nbsp;</td><td>bar</td></tr>\
							<tr><td>foo1</td><td>&nbsp;</td><td>bar2</td></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.selection.selectColumns( [ 2 ] ); 
				table.addColumnsLeft();
			}
		},
		
		{ module : 'Inserting/removing rows' },
		///////////////////////////////////////////////////////////////////////
		
		{
			exclude	  : true,
			desc      : 'Add row at index 0 (corrected to 1)',
			start     : '<table><tbody>\
							<tr><td>foo</td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td>foo</td></tr>\
							<tr><td>&nbsp;</td></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.addRow( 1 );
			}
		},
		
		{
			exclude   : true,
			desc      : 'Add row at index 1 (corrected to 2)',
			start     : '<table><tbody>\
							<tr><td>foo</td></tr>\
							<tr><td>bar</td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td>foo</td></tr>\
							<tr><td>&nbsp;</td></tr>\
							<tr><td>bar</td></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.addRow( 2 );
			}
		},
		
		{ module : 'Merging cells' },
		///////////////////////////////////////////////////////////////////////
		
		{
			exclude   : true,
			desc      : 'Basic columns merging',
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
			exclude   : true,
			desc      : 'Merging columns with inner tags',
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
			exclude   : true,
			desc      : 'Merge a single cell',
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
			exclude   : true,
			desc      : 'Merge column',
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
		
		{
			exclude   : true,
			desc      : 'Merge column, with inner tags',
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
			exclude   : true,
			desc      : 'Merge a row',
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
			exclude   : true,
			desc      : 'Merge a 2x2 selection',
			start     : '<table><tbody>\
							<tr><td class="aloha-cell-selected">foo1</td>\
								<td class="aloha-cell-selected">bar1</td></tr>\
							<tr><td class="aloha-cell-selected">foo2</td>\
								<td class="aloha-cell-selected">bar2</td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td rowspan="2" colspan="2">\
								foo1 bar1 foo2 bar2\
							</td></tr>\
							<tr></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.selection.selectedCells = getSelectedCells( table );
				table.selection.mergeCells();
			}
		},
		
		{
			exclude   : true,
			desc      : 'Merge a 2x2 selection, with inner tags',
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
			exclude   : true,
			desc      : 'Prevent merging of non-rectangular selection',
			start     : '<table><tbody>\
							<tr><td class="aloha-cell-selected">foo1</td>\
								<td class="aloha-cell-selected">bar1</td></tr>\
							<tr><td class="aloha-cell-selected">foo2</td>\
								<td>bar2</td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td>foo1</td><td>bar1</td></tr>\
							<tr><td>foo2</td><td>bar2</td></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.selection.selectedCells = getSelectedCells( table );
				table.selection.mergeCells();
			}
		},
		
		{
			exclude   : true,
			desc      : 'Prevent attempt to merge an alreay merged cell',
			start     : '<table><tbody>\
							<tr><td rowspan="2" colspan="1" class="aloha-cell-selected">foo bar</td></tr>\
							<tr></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td rowspan="2" colspan="1">foo bar</td></tr>\
							<tr></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				try {
					table.selection.selectedCells = getSelectedCells( table );
					table.selection.mergeCells();
				} catch ( ex ) {
					console.log( 'ERROR!' );
				}
			}
		},
		
		{ module : 'Splitting merged cells' },
		///////////////////////////////////////////////////////////////////////
		
		{
			exclude   : true,
			desc      : 'Split a table with a single merged cell',
			start     : '<table><tbody>\
							<tr><td rowspan="2" colspan="1" class="aloha-cell-selected">foo bar</td></tr>\
							<tr></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td class="aloha-cell-selected">foo bar</td></tr>\
							<tr><td class="aloha-cell-selected"></td></tr>\
						</tbody></table>',
			operation : function ( table ) {
				table.selection.selectedCells = getSelectedCells( table );
				table.selection.splitCells();
			}
		},
		
		{
			exclude   : true,
			desc      : 'Split a 2x2 merged cell',
			start     : '<table><tbody>\
							<tr><td rowspan="2" colspan="1" class="aloha-cell-selected">foo1 foo2</td>\
								<td>bar1</td></tr>\
							<tr><td>bar2</td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td>foo1 foo2</td><td>bar1</td></tr>\
							<tr><td>&nbsp;</td><td>bar2</td></tr>\
						</tbody></table>',
			operation : function ( table ) {
				table.selection.selectedCells = getSelectedCells( table );
				table.selection.splitCells();
			}
		},
		
		{
			exclude   : true,
			desc      : 'Split 2 merged cell, simultaneosly',
			start     : '<table><tbody>\
							<tr>\
								<td rowspan="2" colspan="1" class="aloha-cell-selected">foo1 foo2</td>\
								<td rowspan="2" colspan="1" class="aloha-cell-selected">bar1 bar2</td>\
							</tr>\
							<tr></tr>\
						  </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td>foo1 foo2</td><td>bar1 bar2</td></tr>\
							<tr><td>&nbsp;</td><td>&nbsp;</td></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.selection.selectedCells = getSelectedCells( table );
				table.selection.splitCells();
			}
		},
		
		//
		// Transform to from normal cell to header
		//
		
		{ module : 'Transforming cells to headers' },
		
		{
			exclude   : true,
			desc      : 'Transform row as table header',
			start     : '<table><tbody>\
							<tr>\
								<td class="aloha-cell-selected">foo</td>\
								<td class="aloha-cell-selected">bar</td>\
							</tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr>\
								<th scope="col">foo</th>\
								<th scope="col">bar</th>\
							</tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.selection.selectedCells = getSelectedCells( table );
				table.tablePlugin.rowHeader.onclick();
			}
		},
		
		{
			exclude   : true,
			desc      : 'Transform column as table header',
			start     : '<table><tbody>\
							<tr><td class="aloha-cell-selected">foo1</td><td>bar1</td></tr>\
							<tr><td class="aloha-cell-selected">foo2</td><td>bar2</td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><th scope="row">foo1</th><td>bar1</td></tr>\
							<tr><th scope="row">foo2</th><td>bar2</td></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.selection.selectedCells = getSelectedCells( table );
				table.tablePlugin.columnHeader.onclick();
			}
		},
		
		//
		// Transform to from header to normal cell
		//
		
		//
		// Toggle header transformations
		//
		
		{ exclude : true } // ... nothing
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
			
			if ( testcase.exclude === true ) {
				continue; // comment out to run all tests
			}
			
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
