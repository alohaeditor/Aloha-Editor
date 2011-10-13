define(
['aloha/jquery'],
function ($) {
	var Utils = {
		/**
		 * Translates the DOM-Element column offset of a table-cell to the
		 * column offset of a grid-cell, which is the column index adjusted
		 * by other cells' rowspan and colspan values.
		 *
		 * @param rows the rows of a table as an array or jQuery object
		 * @param rowIdx the index in rows of the cell to get the grid column index of
		 * @param colIdx the index in rows[row].cells of the cell to get the grid column index of
		 * @return the grid column index of the cell at the given rowIdx and colIdx, or null
		 *   if the given rowIdx and colIdx coordinates point to a cell outside of the table.
		 */
		'cellIndexToGridColumn': function (rows, rowIdx, colIdx) {
			var gridColumn = null;
			Utils.walkCells(rows, function(ri, ci, walkedGridColumn, rowspan, colspan) {
				if (ri === rowIdx && ci === colIdx) {
					gridColumn = walkedGridColumn;
					return false;
				}
			});
			return gridColumn;
		},
		/**
		 * Walks the table-cells of the table represented by the given rows,
		 * invoking the given callback for each.
		 * @param callback will receive the following arguments
		 *   o ri the row index of the table-cell
		 *   o ci the column index of the table-cell as the offset of the DOM-Element
		 *   o gridCi the column index of the table-cell in a virtual grid that overlays the table (see makeGrid())
		 *   o colspan the colspan attribute of the table-cell (as a number)
		 *   o rowspan the rowspan attribute of the table-cell (as a number)
		 *   returning false from the callback will terminate the walk early.
		 * @return void
		 */
		'walkCells': function (rows, callback) {
			var adjust = [];
			for (var ri = 0; ri < rows.length; ri++) {
				var cells = rows[ri].cells;
				var skip = 0;
				for (var ci = 0; ci < cells.length; ci++) {
					var cell = cells[ci];
					var colspan = parseInt($(cell).attr('colspan')) || 1;
					var rowspan = parseInt($(cell).attr('rowspan')) || 1;
					
					while (adjust[ci + skip]) {
						adjust[ci + skip] -= 1;
						skip += 1;
					}

					if (false === callback(ri, ci, ci + skip, colspan, rowspan)) {
						return;
					}
					
					for (var i = 0; i < colspan; i++) {
						if (adjust[ci + skip + i] ) {
							throw "an impossible case has occurred";
						}
						adjust[ci + skip + i] = rowspan - 1;
					}
					skip += colspan - 1;
				}
				for (; ci + skip < adjust.length; skip++) {
					if (adjust[ci + skip]) {
						adjust[ci + skip] -= 1;
					}
				}
			}
		},
		/**
		 * Makes a grid out of the table represented by the given rows.  A
		 * grid will contain one or multiple grid-cells for each table-cell.
		 * A table-cell that has a colspan or rowspan greater than one will
		 * be represented by multiple cells (colspan*rowspan) in the
		 * grid.
		 * @parm rows either an array or an jQuery object holding the DOM
		 *   rows of the table.
		 * @return the table translated to a grid of the form
		 *   [ [cell11, cell12, cell13, ...],
		 *     [cell21, cell22, cell23, ...],
		 *     ... ]
		 *  where each grid-cell is an object containing the following members:
		 *  cell: the DOM object in the table that is rendered into the grid-cell
		 *  colspan: the colspan attribute of the DOM object (as a number)
		 *  rowspan: the rowspan attribute of the DOM object (as a number)
		 *  spannedX: the row offset of the grid-cell in the table-cell (0 based)
		 *  spannedY: the column offset of the grid-cll in the table-cell (0 based)
		 */
		'makeGrid': function (rows) {
			var grid = [];
			Utils.walkCells(rows, function(ri, ci, gridCi, colspan, rowspan) {
				var cell = rows[ri].cells[ci];
				for (var spannedY = 0; spannedY < rowspan; spannedY++) {
					grid[ri + spannedY] = grid[ri + spannedY] || [];
					for (var spannedX = 0; spannedX < colspan; spannedX++) {
						grid[ri + spannedY][gridCi + spannedX] = {
							'cell'    : cell,
							'colspan' : colspan,
							'rowspan' : rowspan,
							'spannedX': spannedX,
							'spannedY': spannedY
						};
					}
				}
			});
			return grid;
		},
		/**
		 * A grid-cell is said to contain a dom-cell if it is located in the
		 * upper-left corner of a table-cell. A table-cell may have a
		 * rowspan and colspan, and as such may be comprised of several
		 * grid-cells, of which only one (the upper-left corner one)
		 * contains a dom-cell.
		 * @param cellInfo a cell in the grid returned by makeGrid()
		 * @return whether the given grid-cell maps to a dom-cell
		 */
		'containsDomCell': function (cellInfo) {
			return 0 === cellInfo.spannedX && 0 === cellInfo.spannedY;
		},
		/**
		 * A grid-cell may not contain a dom-cell (due to rowspand and
		 * colspan). If this function is given the coordinates of such a
		 * grid-cell, it will look to the left of the grid-cell, until it
		 * finds a grid-cell that contains a dom-cell and returns the
		 * DOM-Element of it.
		 *
		 * This function is useful to insert something into the DOM next to
		 * or in place of the grid-cell.
		 *
		 * @param grid the grid of the table (see makeGrid())
		 * @param ri the row index into the grid
		 * @param ci the column index into the grid
		 * @return the DOM-Element either at or to the left of the grid-cell
		 *   a the given coordinates.
		 */
		'leftDomCell': function (grid, ri, gridCi) {
			do {
				var cellInfo = grid[ri][gridCi];
				if ( 0 === cellInfo.spannedY ) {
					return cellInfo.cell;
				} 
				gridCi -= cellInfo.spannedX + 1;
			} while (gridCi >= 0);
			return null;
		},
		/**
		 * Given a cell of a table (td/th) with a colspan or rowspan
		 * greater than one, will set the rowspan and colspan of the
		 * cell to one and insert empty cells where the original cell
		 * spanned (the number of cells allocated with createCell will
		 * be rowspan * colspan - 1).
		 *
		 * @param cell
		 *        the cell to split
		 * @param createCell
 		 *        a callback that will be invoked rowspan * colspan - 1
		 *        times, and which must return a table cell (td/th) that
		 *        will be inserted into the table
		 */
		'splitCell': function (cell, createCell) {
			var $cell = $(cell);
			var colspan = parseInt($cell.attr('colspan')) || 1;
			var rowspan = parseInt($cell.attr('rowspan')) || 1;

			var $row  = $cell.parent();
			var $rows = $row.parent().children();
			var rowIdx = $row.index();
			var colIdx = $cell.index();
			var grid = Utils.makeGrid($rows);
			var gridColumn = Utils.cellIndexToGridColumn($rows, rowIdx, colIdx);
			for (var i = 0; i < rowspan; i++) {
				for (var j = (0 === i ? 1 : 0); j < colspan; j++) {
					var leftCell = Utils.leftDomCell(grid, rowIdx + i, gridColumn);
					if (null == leftCell) {
						$rows.eq(rowIdx + i).prepend(createCell());
					} else {
						$( leftCell ).after(createCell());
					}
				}
			}
			$cell.removeAttr('colspan');
			$cell.removeAttr('rowspan');
		}
	};
	return Utils;
});
