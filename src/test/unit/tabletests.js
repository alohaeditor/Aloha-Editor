/* tabletests.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2012 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 * 
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 * 
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
 */
define(
[ 'testutils', 'htmlbeautifier' ],
function ( TestUtils ) {
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
		    $cells = table.obj.find( '.aloha-cell-selected' );
		$cells.each( function () { cells.push( this ); } );
		return cells;
	};
	
	//
	//	 NB:
	//	---------------------------------------------------------------------
	//	 selectRow and selectColumns has an issue where index 0 selects the
	//	 helper row/column instead of the first editable row/column.
	//	 All following tests will work around this fault by using 1-indexing
	//	 with selectcolumns rather than 0 based indexing.
	//	 Where this is done, we note that we have "corrected" the index.
	//	---------------------------------------------------------------------
	//
	
	var tests = [
		
		{ module : 'Activation/deactivation' },
		///////////////////////////////////////////////////////////////////////
		
		{
			exclude   : false,
			desc      : 'Activate and deactivate a table',
			start     : '<table><tbody><tr><td>foo</td></tr></tbody></table>',
			expected  : '<table><tbody><tr><td>foo</td></tr></tbody></table>',
			operation : function ( table ) {}
		},
		
		{ module : 'makeClean' },
		///////////////////////////////////////////////////////////////////////
		
		{
			exclude   : false,
			desc      : 'makeClean',
			start     : '<table class="original"><tbody>\
							<tr><td>test</td></tr>\
						 </tbody></table>',
			expected  : '<table class="original"><tbody>\
							<tr><td>test</td></tr>\
						 </tbody></table>\
						 <!-- <table class="clone"><tbody>' +
							'<tr><td>test</td></tr>' +
							'</tbody></table> -->',
			operation : function ( table ) {
				var clone = jQuery( '#editable' ).clone( false );
				
				clone.find( 'table' )
					 .addClass( 'clone' )
					 .removeClass( 'original' );
				
				table.tablePlugin.makeClean( clone );
				
				jQuery( '#editable' ).append(
					'<!-- ' + clone.html()
						.replace( /[\r\n]/g, '' )
						.replace( />\s*(.*?)\s*</g, '>$1<' ) + ' -->'
				);
			}
		},
		
		{ module : 'Row/column selection' },
		///////////////////////////////////////////////////////////////////////
		
		{
			exclude   : false,
			desc      : 'Select column by index (corrected to 1-index)',
			start     : '<table><tbody><tr><td>foo</td></tr></tbody></table>',
			expected  : '<table><tbody><tr><td>bar</td></tr></tbody></table>',
			operation : function ( table ) {
				table.selection.selectColumns( [ 1 ] );
				table.obj.find( '.aloha-cell-selected' )
					 .html( 'bar' )
					 .removeAttr( 'class' )
					 .removeAttr( 'style' );
			}
		},
		
		{
			exclude   : false,
			desc      : 'Select row by index (corrected to 1-index)',
			start     : '<table><tbody><tr><td>foo</td></tr></tbody></table>',
			expected  : '<table><tbody><tr><td>bar</td></tr></tbody></table>',
			operation : function ( table ) {
				table.selection.selectRows( [ 1 ] );
				table.obj.find( '.aloha-cell-selected' )
					 .html( 'bar' )
					 .removeAttr( 'class' )
					 .removeAttr( 'style' );
			}
		},
		
		{ module : 'Inserting/removing columns' },
		///////////////////////////////////////////////////////////////////////
		
		{
			exclude   : false,
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
			exclude   : false,
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
			exclude   : false,
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
			exclude   : false,
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
		
		{
			exclude   : false,
			desc      : 'Column selection with merged cells ',
			start     : '<table><tbody>\
							<tr><td colspan="2" rowspan="1">foo1 bar1</td></tr>\
							<tr><td>foo2</td><td>bar2</td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td colspan="2" rowspan="1">foo1 bar1</td></tr>\
							<tr><td>foo2</td><td>was selected</td></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.selection.selectColumns( [ 2 ] );
				table.obj.find( '.aloha-cell-selected' )
					 .html( 'was selected' )
					 .removeAttr( 'class' )
					 .removeAttr( 'style' );
			}
		},
		
		{
			exclude   : false,
			desc      : 'Insert column before column 2, with merged cells (corrected to 2)',
			start     : '<table><tbody>\
							<tr><td colspan="2" rowspan="1">foo1 bar1</td></tr>\
							<tr><td>foo2</td><td>bar2</td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td colspan="2" rowspan="1">foo1 bar1</td><td>&nbsp;</td></tr>\
							<tr><td>foo2</td><td>&nbsp;</td><td>bar2</td></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.selection.selectColumns( [ 2 ] );
				table.addColumnsLeft();
			}
		},
		
		{
			exclude   : false,
			desc      : 'Remove 2nd column (corrected to 2)',
			start     : '<table><tbody>\
							<tr><td>foo1</td><td class="aloha-cell-selected">bar1</td></tr>\
							<tr><td>foo2</td><td class="aloha-cell-selected">bar2</td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td>foo1</td></tr>\
							<tr><td>foo2</td></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.selection.selectColumns( [ 2 ] ); 
				table.deleteColumns();
			}
		},
		
		{
			exclude   : false,
			desc      : 'Remove 2nd column (corrected to 2) of merged row',
			start     : '<table><tbody>\
							<tr><td colspan="3" rowspan="1">foo1 bar1 test1</td></tr>\
							<tr><td>foo2</td><td class="aloha-cell-selected">bar2</td><td>test2</td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td colspan="2" rowspan="1">foo1 bar1 test1</td></tr>\
							<tr><td>foo2</td><td>test2</td></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.selection.selectColumns( [ 2 ] ); 
				table.deleteColumns();
			}
		},
		
		{ module : 'Inserting/removing rows' },
		///////////////////////////////////////////////////////////////////////
		
		{
			exclude   : false,
			desc      : 'Add row at index 0 (corrected to 1)',
			start     : '<table><tbody>\
							<tr><td>foo</td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td>&nbsp;</td></tr>\
							<tr><td>foo</td></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.addRow( 1 );
			}
		},
		
		{
			exclude   : false,
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
			exclude   : false,
			desc      : 'Basic columns merging',
			start     : '<table><tbody>\
							<tr><td class="aloha-cell-selected">foo</td></tr>\
							<tr><td class="aloha-cell-selected">bar</td></tr>\
						</tbody></table>',
			expected  : '<table><tbody>\
							<tr><td colspan="1" rowspan="2">foo bar</td></tr>\
							<tr></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.selection.selectedCells = getSelectedCells( table );
				table.selection.mergeCells();
			}
		},
		
		{
			exclude   : false,
			desc      : 'Merging columns with inner tags',
			start     : '<table><tbody>\
							<tr><td class="aloha-cell-selected"><i>foo</i></td></tr>\
							<tr><td class="aloha-cell-selected">bar</td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td colspan="1" rowspan="2"><i>foo</i> bar</td></tr>\
							<tr></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.selection.selectedCells = getSelectedCells( table );
				table.selection.mergeCells();
			}
		},
		
		{
			exclude   : false,
			desc      : 'Merge a single cell',
			start     : '<table><tbody>\
							<tr><td class="aloha-cell-selected">foo</td></tr>\
							<tr><td>bar</td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td colspan="1" rowspan="1">foo</td></tr>\
							<tr><td>bar</td></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.selection.selectedCells = getSelectedCells( table );
				table.selection.mergeCells();
			}
		},
		
		{
			exclude   : false,
			desc      : 'Merge column',
			start     : '<table><tbody>\
							<tr><td class="aloha-cell-selected">foo1</td><td>bar1</td></tr>\
							<tr><td class="aloha-cell-selected">foo2</td><td>bar2</td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td colspan="1" rowspan="2">foo1 foo2</td><td>bar1</td></tr>\
							<tr><td>bar2</td></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.selection.selectedCells = getSelectedCells( table );
				table.selection.mergeCells();
			}
		},
		
		{
			exclude   : false,
			desc      : 'Merge column, with inner tags',
			start     : '<table><tbody>\
							<tr><td class="aloha-cell-selected"><i>foo</i></td></tr>\
							<tr><td class="aloha-cell-selected"><i>bar</i></td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td colspan="1" rowspan="2"><i>foo</i> <i>bar</i></td></tr>\
							<tr></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.selection.selectedCells = getSelectedCells( table );
				table.selection.mergeCells();
			}
		},
		
		{
			exclude   : false,
			desc      : 'Merge a row',
			start     : '<table><tbody>\
							<tr><td class="aloha-cell-selected">foo1</td>\
								<td class="aloha-cell-selected">bar1</td></tr>\
							<tr><td>foo2</td><td>bar2</td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td colspan="2" rowspan="1">foo1 bar1</td></tr>\
							<tr><td>foo2</td><td>bar2</td></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.selection.selectedCells = getSelectedCells( table );
				table.selection.mergeCells();
			}
		},
		
		{
			exclude   : false,
			desc      : 'Merge a 2x2 selection',
			start     : '<table><tbody>\
							<tr><td class="aloha-cell-selected">foo1</td>\
								<td class="aloha-cell-selected">bar1</td></tr>\
							<tr><td class="aloha-cell-selected">foo2</td>\
								<td class="aloha-cell-selected">bar2</td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td colspan="2" rowspan="2">\
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
			exclude   : false,
			desc      : 'Merge a 2x2 selection, with inner tags',
			start     : '<table><tbody>\
							<tr><td class="aloha-cell-selected"><i>foo1</i></td>\
								<td class="aloha-cell-selected"><i>bar1</i></td></tr>\
							<tr><td class="aloha-cell-selected"><i>foo2</i></td>\
								<td class="aloha-cell-selected"><i>bar2</i></td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td colspan="2" rowspan="2">\
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
			exclude   : false,
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
			exclude   : false,
			desc      : 'Prevent attempt to merge an alreay merged cell',
			start     : '<table><tbody>\
							<tr><td colspan="1" rowspan="2" class="aloha-cell-selected">foo bar</td></tr>\
							<tr></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td colspan="1" rowspan="2">foo bar</td></tr>\
							<tr></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.selection.selectedCells = getSelectedCells( table );
				table.selection.mergeCells();
			}
		},
		
		{ module : 'Splitting merged cells' },
		///////////////////////////////////////////////////////////////////////
		
		{
			exclude   : false,
			desc      : 'Split a table with a single merged cell',
			start     : '<table><tbody>\
							<tr><td colspan="1" rowspan="2" class="aloha-cell-selected">foo bar</td></tr>\
							<tr></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td>foo bar</td></tr>\
							<tr><td>&nbsp;</td></tr>\
						</tbody></table>',
			operation : function ( table ) {
				table.selection.selectedCells = getSelectedCells( table );
				table.selection.splitCells();
			}
		},
		
		{
			exclude   : false,
			desc      : 'Split a 2x2 merged cell',
			start     : '<table><tbody>\
							<tr><td colspan="1" rowspan="2" class="aloha-cell-selected">foo1 foo2</td>\
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
			exclude   : false,
			desc      : 'Split 2 merged cell, simultaneosly',
			start     : '<table><tbody>\
							<tr>\
								<td colspan="1" rowspan="2" class="aloha-cell-selected">foo1 foo2</td>\
								<td colspan="1" rowspan="2" class="aloha-cell-selected">bar1 bar2</td>\
							</tr>\
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
		
		{ module : 'Transforming cells to headers' },
		///////////////////////////////////////////////////////////////////////
		
		{
			exclude   : false,
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
			exclude   : false,
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
		
		{
			exclude   : false,
			desc      : 'Toggle header to td cell',
			start     : '<table><tbody>\
							<tr><th scope="row" class="aloha-cell-selected">foo1</th><td>bar1</td></tr>\
							<tr><th scope="row" class="aloha-cell-selected">foo2</th><td>bar2</td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td>foo1</td><td>bar1</td></tr>\
							<tr><td>foo2</td><td>bar2</td></tr>\
						 </tbody></table>',
			operation : function ( table ) {
				table.selection.selectedCells = getSelectedCells( table );
				table.tablePlugin.columnHeader.onclick();
			}
		},
		
		{ module : 'Nested tables' },
		///////////////////////////////////////////////////////////////////////
		
		{
			exclude   : false,
			desc      : 'Nested tables',
			start     : '<table><tbody>\
							<tr><td>\
								<table><tbody>\
									<tr><td>foo</td></tr>\
								</tbody></table>\
							</td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td>\
								<table><tbody>\
									<tr><td>foo</td></tr>\
								</tbody></table>\
							</td></tr>\
						 </tbody></table>',
			operation : function () {}
		},
		
		{ module : 'Aligning columns of unbalanced table test' },
		///////////////////////////////////////////////////////////////////////
		
		{
			exclude   : false,
			desc      : 'With rowspan',
			start     : '<table><tbody>\
							<tr><td rowspan="2"></td><td></td></tr>\
							<tr><td></td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td rowspan="2"></td><td></td></tr>\
							<tr><td></td></tr>\
						 </tbody></table>',
			operation : function () {}
		},
		
		{
			exclude   : false,
			desc      : 'With rowspan',
			start     : '<table><tbody>\
							<tr><td rowspan="2"></td><td></td><td></td></tr>\
							<tr><td></td><td></td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td rowspan="2"></td><td></td><td></td></tr>\
							<tr><td></td><td></td></tr>\
						 </tbody></table>',
			operation : function () {}
		},
		
		{
			exclude   : false,
			desc      : 'With no rowspan and colspan',
			start     : '<table><tbody>\
							<tr><td></td><td></td></tr>\
							<tr><td></td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td></td><td></td></tr>\
							<tr><td></td><td></td></tr>\
						 </tbody></table>',
			operation : function () {}
		},
		
		{
			exclude   : false,
			desc      : 'With colspan',
			start     : '<table><tbody>\
							<tr><td colspan="2"></td></tr>\
							<tr><td></td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td colspan="2"></td></tr>\
							<tr><td></td><td></td></tr>\
						 </tbody></table>',
			operation : function () {}
		},
		
		{
			exclude   : false,
			desc      : 'With colspan',
			start     : '<table><tbody>\
							<tr><td colspan="2"></td></tr>\
							<tr><td></td></tr>\
							<tr><td></td><td></td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td colspan="2"></td></tr>\
							<tr><td></td><td></td></tr>\
							<tr><td></td><td></td></tr>\
						 </tbody></table>',
			operation : function () {}
		},
		
		{
			exclude   : false,
			desc      : 'Removing redundant colspan="1" attribute',
			start     : '<table><tbody>\
							<tr><td colspan="1"></td></tr>\
							<tr><td></td></tr>\
						 </tbody></table>',
			expected  : '<table><tbody>\
							<tr><td></td></tr>\
							<tr><td></td></tr>\
						 </tbody></table>',
			operation : function () {}
		},
		
		{ exclude : true } // ... just for catching trailing commas
	];
	
	Aloha.ready( function () {
		var TablePlugin = Aloha.require( 'table/table-plugin' ),		
		    jQuery = Aloha.jQuery,
		    editable = jQuery( '#editable' ),
		    testcase,
		    start,
		    expected;
		
		for ( var i = 0; i < tests.length; i++ ) {
			testcase = tests[ i ];
			
			if ( testcase.exclude === true ) {
				continue; // comment in to run all tests
			}
			
			if ( testcase.module ) {
				module( testcase.module.toUpperCase() + ' :' );
				continue;
			}
			
			start = style_html( testcase.start );
			expected = style_html( testcase.expected );
			
			// Place test contents into our editable, and activate the editable
			editable.html( start ).aloha();
			
			if ( typeof testcase.operation == 'function' ) {
				editable
					.mousedown() // tigger the aloha-editable-activated event
					.mouseup() // this is needed to get the table plugin to deactivate correctly
					.find( 'table' )
						.mousedown();
				testcase.operation( TablePlugin.activeTable );
			}
			
			editable.mahalo();
			
			test(
				( testcase.desc || 'Test' ).toUpperCase(),
				{ start: start, expected: expected },
				function () {
					var result = editable.html().toLowerCase();
					
					// Strip away the id added to the table tag
					// Internet Explorer does not have quotes around attribute
					// values, so we need to add them
					// Normalize the order of colspan and rowspan attributes
					
					result = result.replace(
						/([\w-]+)\s*=\s*([\w-]+)([\s>])/g,
						function ( str, $n, $v, $e, offset, s ) {
							return $n + '="' + $v + '"' + $e;
						}
					).replace(
						/(<table.*?)\s*id\s*=\s*[\"\']*[^\"\']*?[\"\']*(\s|>)/ig,
						'$1$2'
					).replace(
						/(rowspan=\"[^\"]+\") (colspan=\"[^\"+]\")/ig,
						'$2 $1'
					);
					
					result = style_html( result );
					deepEqual( result, expected, 'Check Operation Result' );
				}
			);
		}
	} );
} );
