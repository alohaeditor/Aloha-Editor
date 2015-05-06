define([
	'aloha',
	'aloha/jquery',
	'table/table-plugin-utils',
	'table/table-cell',
	'ui/dialog',
	'i18n!table/nls/i18n'
], function (
	Aloha,
	$,
	Utils,
	TableCell,
	Dialog,
	i18n
) {
	/**
	 * The TableSelection object is a helper-object
	 */
	var TableSelection = function (table) {
		this.table = table;
	};

	/**
	 * Returns if a content parameter is a content that be added in a 
	 * merge cell from the cells selecteds.
	 * 
	 * @param {String|TextNodeElement|HTMLElement} content - A content 
	 * from the cell, might be a TextNode, HTMLElement or a String
	 * 
	 * @return {Boolean}
	 */
	function isMergeableContent(content) {
		return ((
				'string' === typeof(content) && '' !== $.trim(content)
			) || (
				content.nodeType
				&& (
					3 === content.nodeType
					&&
					'' !== $.trim(content.data)
				) || (
					1 === content.nodeType
				)
			));
	}

	var POSSIBLE_SELECTION_TYPES = [ 'cell', 'column', 'row' ];

	TableSelection.getPossibleSelectionTypes = function () {
		return POSSIBLE_SELECTION_TYPES;
	};

	/**
	 * Gives the type of the cell-selection
	 * possible values are "cell", "row", "column" or "all".
	 * If the value is 'cell' means custom cell selections
	 */
	TableSelection.prototype.selectionType = undefined;

	/**
	 * Stores the currently selected rectangle
	 * @type {Object} the rectangle object
	 */
	TableSelection.prototype.currentRectangle = {};
	/**
	 * Holds all currently selected table cells as an array of DOM "td" representations
	 */
	TableSelection.prototype.selectedCells = [];

	/**
	 * Holds all table columnIdx if selectiontype is column
	 */
	TableSelection.prototype.selectedColumnIdxs = [];

	/**
	 * Holds all table rowIds if selectiontype is column
	 */
	TableSelection.prototype.selectedRowIdxs = [];

	/**
	 * Holds the active/disabled state of cell selection mode 
	 */
	TableSelection.prototype.cellSelectionMode = false;

	/**
	 * Gives the position of the base cell of a selection - [row, column]
	 */
	TableSelection.prototype.baseCellPosition = null;

	/**
	 * Gives the range of last cell selection - [row, column]
	 */
	TableSelection.prototype.lastSelectionRange = null;

	/**
	 * Marks all cells of the specified column or columns as selected
	 *
	 * @return void
	 */
	TableSelection.prototype.selectColumns = function ( columnsToSelect ) {
		this.unselectCells();

		var rows = this.table.getRows();
		// first row is the selection row (dump it, it's not needed)
		rows.shift();
		
		var grid = Utils.makeGrid(rows);
		for (var j = 0; j < columnsToSelect.length; j++) {
			// check if this column is already selected.
			if ( -1 !== $.inArray(columnsToSelect[j], this.selectedColumnIdxs) ) {
				continue;
			}
			this.selectedColumnIdxs.push( columnsToSelect[j] );
			for (var i = 0; i < grid.length; i++) {
				var cellInfo = grid[i][columnsToSelect[j]];
				if ( Utils.containsDomCell(cellInfo) ) {
					$(cellInfo.cell).addClass(this.table.get('classCellSelected'));
					this.selectedCells.push( cellInfo.cell );
				}
			}
		}
		this.currentRectangle.columns = this.selectedColumnIdxs;
		this.selectionType = 'column';
	};
	
	/**
	 * Marks all cells of the specified row or rows as selected
	 *
	 * @return void
	 */
	TableSelection.prototype.selectRows = function( rowsToSelect ) {
		this.unselectCells();

		var rows = this.table.getRows();
		
 	    rowsToSelect.sort( function ( a, b ) { return a - b; } );
		for (var i = 0; i < rowsToSelect.length; i++) {
			if ( rows[ rowsToSelect[i] ] ) {
				// check if this row is already selected.
	        	for ( var z = 0; z < this.selectedRowIdxs.length; z++ ) {
	        		if ( rowsToSelect[i] == this.selectedRowIdxs[z] ) {
	        			return;
	        		}
	        	}
				this.selectedRowIdxs.push( rowsToSelect[i] );
				// to not select first cell, which is a control cell
			    for ( var j = 1; j < rows[ rowsToSelect[i] ].cells.length; j++ ) {  
					this.selectedCells.push( rows[ rowsToSelect[i] ].cells[j] );
					// TODO make proper cell selection method
					$( rows[ rowsToSelect[i] ].cells[j] ).addClass( this.table.get('classCellSelected') );
			    }
			}
		}
		this.currentRectangle.rows = this.selectedRowIdxs;

	    this.selectionType = 'row';
	};

	TableSelection.prototype.selectAll = function () {
		var rowIndices = $.map( this.table.getRows(), function ( item, i ) {
			return i;
		});

		//getRows() returns all rows, even the header row which we must not select
		rowIndices.shift();

		this.selectRows( rowIndices );

		this.selectionType = 'all';
	};
	
	/**
	 * To be called when cells of the table were selected
	 * @see selectRows, selectColumns, selectCellRange
	 * TODO this should be private
	 */
	TableSelection.prototype.notifyCellsSelected = function () {
		Aloha.trigger( 'aloha-table-selection-changed' );
		
		// the UI feels more consisten when we remove the non-table
		// selection when cells are selected
		// TODO this code doesn't work right in IE as it causes the table
		//  scope of the floating menu to be lost. Maybe this can be
		//  handled by testing for an empty selection in the
		//  aloha-selection-changed event.
		//Aloha.getSelection().removeAllRanges();
	};

	/**
	 * To be called when a cell-selection is entirely removed
	 * @see unselectCells
	 */
	TableSelection.prototype._notifyCellsUnselected = function () {
		Aloha.trigger( 'aloha-table-selection-changed' );
	};

	/**
	 * This method return true if all sellected cells are TH cells.
	 *
	 * @return boolean
	 */
	TableSelection.prototype.isHeader = function ( ) {
		
        if ( this.selectedCells.length == 0 ) {
        	return false;
        }
        
        // take 1 column to detect if the header button is pressd
		for (var i = 0; i < this.selectedCells.length; i++) {
			if ( !this.selectedCells[i] || this.selectedCells[i].nodeName.toLowerCase() != 'th' ) {
				return false;
			}
		}
		return true;
	}
	
	/**
	 * This method removes the "selected" class from all selected cells
	 *
	 * @return void
	 */
	TableSelection.prototype.unselectCells = function(){
		//don't unselect cells if cellSelectionMode is active
		if ( this.cellSelectionMode ) {
    		return;
		}

		if (this.selectedCells.length > 0) {
			var
				cells = this.selectedCells,
				classCellSelected = this.table.get('classCellSelected');

			for (var i = 0, len = cells.length; i < len; i++) {
				$(cells[i]).removeClass(classCellSelected);
			}

			this.selectedCells = [];
			this.selectedColumnIdxs = [];
			this.selectedRowIdxs = [];
			this.currentRectangle = {};

			//we keep 'cell' as the default selection type instead of
			//unsetting the selectionType to avoid an edge-case where a
			//click into a cell doesn't trigger a call to
			//TableCell.editableFocs (which would set the 'cell'
			//selection type) which would result in the FloatingMenu
			//losing the table scope.
			this.selectionType = 'cell';

			this._notifyCellsUnselected();
		}
	};

	/**
	 * Returns the index of a given cell, in selectedCells
	 * returns -1 if the given cell is not in selectedCells 
	 * @params cell
	 *          DOMElement
	 *
	 * @return integer 
	 */
	TableSelection.prototype.selectionIndex = function(cell){
		for(var i = 0; i < this.selectedCells.length; i++){
			if(this.selectedCells[i] === cell){
				return i; 
			} 
		}
		return -1;
	};


	/**
	 * Given a contour creates a object representing a rectangle.
	 * This function only gives a useful return value if the given
	 * contour rectangular.
	 *
	 * @param {object} contour
	 *        a rectangular contour
	 * @return {object}
	 *        an object with the properties top, right, bottom, left, 
	 *        representing the rectangular contour.
	 */
	function getRectFromContour( contour ) {
		return {
			'top'   : contour.top[0],
			'right' : contour.right[0] + 1,
			'bottom': contour.bottom[0] + 1,
			'left'  : contour.left[0]
		};
	}

	/**
	 * Given a grid and contour, determines whether the contour is
	 * rectangular, and each cell in the rectangle is selected.
	 *
	 * @param {array} grid
	 *        a two-dimensional array representing a grid see Utils.makeGrid
	 * @param {object} contour
	 *        an object reprensenting a contour see Utils.makeContour
	 * @param {function} isSelected
	 *        a function that determines whether a cell in the given grid
	 *        is selected for merging.
	 * @return {boolean}
	 *        true if all cells inside the contour are selected and can
	 *        be merged.
	 */
	function isMergeable(grid, contour, isSelected) {
		var mergeable = true;
		if (   -1 !== Utils.indexOfAnyBut( contour.top   , contour.top[0]    )
			|| -1 !== Utils.indexOfAnyBut( contour.right , contour.right[0]  )
			|| -1 !== Utils.indexOfAnyBut( contour.bottom, contour.bottom[0] )
			|| -1 !== Utils.indexOfAnyBut( contour.left  , contour.left[0]   ) ) {
			// the outside of the selected area is jagged (not a rectangle)
			mergeable = false;
		} else {
			// the outside of the selected area is a rectangle, but we
			// must also ensore that there are no holes in the selection
			var rect = getRectFromContour( contour )
			Utils.walkGridInsideRect( grid, rect, function ( cellInfo ) {
				if ( ! isSelected( cellInfo ) ) {
					mergeable = false;
					return false;
				}
			});
		}
		return mergeable;
	}

	/**
	 * This method merges all selected cells
	 *
	 * @return void
	 */
	TableSelection.prototype.mergeCells = function(){

		var selectedCells = this.selectedCells;
		if ( 0 === selectedCells.length ) {
			return;
		}

		var isSelected = function ( cellInfo ) {
			return -1 != $.inArray( cellInfo.cell, selectedCells );
		};

		var grid = Utils.makeGrid( this.table.getRows() );
		var contour = Utils.makeContour( grid, isSelected );

		if ( ! isMergeable( grid, contour, isSelected ) ) {
			Dialog.alert({
				title : i18n.t('Table'),
				text : i18n.t('table.mergeCells.notRectangular')
			});
			return;
		}

		var selectedRect = getRectFromContour( contour );
		var $firstCell = $( grid[ selectedRect.top ][ selectedRect.left ].cell );
		var $firstContainer = $( TableCell.getContainer( $firstCell.get( 0 ) ) );

		Utils.walkGridInsideRect( grid, selectedRect, function ( cellInfo, x, y ) {
			if (   x - cellInfo.spannedX === selectedRect.left
				&& y - cellInfo.spannedY === selectedRect.top ) {
				return;
			}
			var cell = cellInfo.cell;
			var contents = $( TableCell.getContainer( cell ) ).contents();
			// only append the delimiting space if there is some non-whitespace
			for ( var i = 0; i < contents.length; i++ ) {
				if(isMergeableContent(contents[i])){
					$firstContainer.append( " " );
					$firstContainer.append( contents );
					break;
				}
//
//				if (   "string" !== typeof contents[i]
//					|| "" !== $.trim( contents[i].data ) ) {
//					$firstContainer.append( " " );
//					$firstContainer.append( contents );
//					break;
//				}
			}
			$( cell ).remove();
		});

		$firstCell.attr({ 'rowspan': selectedRect.bottom - selectedRect.top,
						  'colspan': selectedRect.right  - selectedRect.left });

		//select the merged cell
		this.selectedCells = [ $firstCell.get( 0 ) ];

		//reset flags
		this.cellSelectionMode = false; 
		this.baseCellPosition = null;
		this.lastSelectionRange = null; 
		this.selectionType = 'cell';

		Aloha.trigger( 'aloha-table-selection-changed' );
	};

	/**
	 * This method splits all selected cells (if they are already have row or column spans)
	 *
	 * @return void
	 */
	TableSelection.prototype.splitCells = function(){
		var selection = this;

		// split the selected cells or currently active cell
		var cells_to_split = this.selectedCells;
		if (cells_to_split.length > 0) {

			$(cells_to_split).each(function(){
				Utils.splitCell(this, function () {
					return selection.table.newActiveCell().obj;
				});
			});

			//reset flags
			this.cellSelectionMode = false; 
			this.baseCellPosition = null;
			this.lastSelectionRange = null; 
			this.selectionType = 'cell';

			Aloha.trigger( 'aloha-table-selection-changed' );
		}
	};

	/**
	 * This method checks if the current selection of cells is merge able
	 *
	 * @return {boolean}
	 *        true if more than one cell is selected.
	 */
	TableSelection.prototype.cellsAreMergeable = function() {
		var selectedCells = this.selectedCells;

		if ( selectedCells.length < 2 ) {
			return false;
		}

		var isSelected = function ( cellInfo ) {
			return -1 != $.inArray( cellInfo.cell, selectedCells );
		};

		var grid = Utils.makeGrid( this.table.getRows() );
		var contour = Utils.makeContour( grid, isSelected );

		if ( ! isMergeable( grid, contour, isSelected ) ) {
			return false;
		} else {
			return true;
		}
	};

	/**
	 * This method checks if the current selection of cells is split able
	 *
	 * @return {boolean}
	 *        true if more than one cell is selected.
	 */
	TableSelection.prototype.cellsAreSplitable = function() {
		var splitable = 0;
		if ( this.selectedCells.length > 0 ) {
			$(this.selectedCells).each(function(){
				var cell = this;
				var colspan = Utils.colspan( cell );
				var rowspan = Utils.rowspan( cell );

				if ( colspan > 1 || rowspan > 1 ) {
					splitable++;
				}
			});

			if ( splitable > 0 ) {
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	};

	/**
	 * Gets the currenty active selection type from the selected
	 * rectangle or the selected rows/columns.
	 * The first element in the array is the selection type which is
	 * most likely to be the most important one to the user.
	 * (e.g. "table" if a whole table was selected or "row" when the whole row was selected)
	 *
	 * @return {array} an array of currently active selection types
	 */
	TableSelection.prototype.getCurrentSelectionTypes = function () {
		var rect = this.currentRectangle;
		var table = this.table;
		var selectionTypes = [];

		// check if a whole row was selected with row or cell selection
		if (rect.rows || (rect.left === 1 && rect.right >= table.numCols)) {
			selectionTypes.push('row');
		}
		// check if a whole column was selected with column or cell selection
		if (rect.columns || (rect.top === 1 && rect.bottom >= table.numRows)) {
			selectionTypes.push('column');
		}
		// if all rows and columns are selected using row, column or cell selection mark the whole table as selected
		// put the "cell" selection type on the first position in the array to make sure it is selected
		// as active tab in the toolbar
		if (
			// check if the whole table is selected with row selection
			(rect.rows && rect.rows.length === table.numRows) ||
			// check if the whole table is selected with column selection
			(rect.columns && rect.columns.length === table.numCols) ||
			// check if the whole table is selected with cell selection
			($.inArray('row', selectionTypes) !== -1 && $.inArray('column', selectionTypes) !== -1)
		) {
			selectionTypes.unshift('cell');
		// if row and column selection was not used, we know the cell selection was used and need to add this type in the array
		} else if (!rect.rows && !rect.columns) {
			selectionTypes.push('cell');
		}
		// as fallback use the selection type set with the old logic
		if (selectionTypes.length === 0) {
			selectionTypes.push(this.selectionType);
		}
		return selectionTypes;
	};

	return TableSelection;
});
