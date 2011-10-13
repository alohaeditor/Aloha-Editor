define(
['aloha/jquery', 'table/table-plugin-utils'],
function ($, Utils) {
	/**
	 * The TableSelection object is a helper-object
	 */
	var TableSelection = function (table) {
		this.table = table;
	};

	/**
	 * Gives the type of the cell-selection
	 * possible values are "row" or "col" 
	 * also possible value is 'cell', which defines custom cell selections
	 */
	TableSelection.prototype.selectionType = undefined;

	/**
	 * Holds all currently selected table cells as an array of DOM "td" representations
	 */
	TableSelection.prototype.selectedCells = new Array();

	/**
	 * Holds all table columnIdx if selectiontype is column
	 */
	TableSelection.prototype.selectedColumnIdxs = new Array();

	/**
	 * Holds all table rowIds if selectiontype is column
	 */
	TableSelection.prototype.selectedRowIdxs = new Array();

	/**
	 * Holds the active/disabled state of cell selection mode 
	 */
	TableSelection.prototype.cellSelectionMode = false;

	/**
	 * Tells whether to keep the cells selected 
	 */
	TableSelection.prototype.keepCellsSelected = false;
	
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
        if ( typeof this.table == 'undefined' || !this.table ) {
        	return;
        }

		this.unselectCells();

		var rows = this.table.obj.find("tr").toArray()
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

		this.selectionType = 'column';
		Aloha.trigger( 'aloha-table-selection-changed' );
	};
	
	/**
	 * Marks all cells of the specified row or rows as selected
	 *
	 * @return void
	 */
	TableSelection.prototype.selectRows = function ( rowsToSelect ) {
        if ( typeof this.table == 'undefined' || !this.table ) {
        	return;
        }

		this.unselectCells();

		var rows = this.table.obj.find("tr").toArray();
		
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
		
	    this.selectionType = 'row';
		Aloha.trigger( 'aloha-table-selection-changed' );
	};
	
	/**
	 * This method return true if all sellected cells are TH cells.
	 *
	 * @return boolean
	 */
	TableSelection.prototype.isHeader = function ( ) {
		
        if ( typeof this.table == 'undefined' || !this.table ) {
        	return;
        }
        
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
		var 
		rows;

		if ( typeof this.table == 'undefined' || !this.table ) {
    		return;
		}
		
		//don't unselect cells if cellSelectionMode is active
		if ( this.cellSelectionMode || this.keepCellsSelected ) {
    		return;
		}

		if (this.selectedCells.length > 0) {
			
			rows = this.table.obj.find("tr").toArray();
			
			for (var i = 0; i < rows.length; i++) {
			    for ( var j = 1; j < rows[i].cells.length; j++ ) {  
					// TODO make proper cell selection method
					$( rows[i].cells[j] ).removeClass( this.table.get('classCellSelected') );
			    }
			}

			this.selectedCells = new Array();
			this.selectedColumnIdxs = new Array();
			this.selectedRowIdxs = new Array();
			this.selectionType = undefined;
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
	 * This method merges all selected cells
	 *
	 * @return void
	 */
	TableSelection.prototype.mergeCells = function(){
		if (this.selectedCells.length > 0) {

			//sorts the cells
			this.selectedCells.sort(function(a, b){
				var aRowId = $(a).parent().prevAll('tr').length;
				var bRowId = $(b).parent().prevAll('tr').length;

				var aColId = $(a).prevAll('td, th').length;
				var bColId = $(b).prevAll('td, th').length;

				if(aRowId < bRowId){
					return -1; 
				}
				else if(aRowId > bRowId){
					return 1; 
				}
				//row id is equal
				else {
					//sort by column id
					if(aColId < bColId){
						return -1; 
					}
					if(aColId > bColId){
						return 1; 
					}
				}
			});

			var firstCell = $(this.selectedCells.shift());

			//set the initial rowspan and colspan
			var rowspan = parseInt(firstCell.attr('rowspan')) || 1;
			var colspan = parseInt(firstCell.attr('colspan')) || 1;;

			var firstRowId = prevRowId = firstCell.parent().prevAll('tr').length;
			var firstColId = firstCell.parent().prevAll('tr').length;

			//iterate through remaining cells
			for (var i = 0; i < this.selectedCells.length; i++) {
				//get the current cell
				var curCell = $(this.selectedCells[i]);

				var curRowId = curCell.parent().prevAll('tr').length;

				//if current cell is in the same row as the first cell,
				//increase colspan
				if(curRowId == firstRowId){
					colspan += (parseInt(curCell.attr('colspan')) || 1); 
				}
				//if they are in different rows increase the rowspan
				else {
					if(curRowId != prevRowId)
						rowspan += (parseInt(curCell.attr('rowspan')) || 1);      
				}

				//set the current row id to previous row id
				prevRowId = curRowId;

				// get the content of the current row and append it to the first cell
				firstCell.find(":first-child").append(" " + curCell.find(":first-child").html());

				// remove the cell
				curCell.remove();
			}
			
			firstCell.attr({ 'rowspan': rowspan, 'colspan': colspan });

			//select the merged cell
			this.selectedCells = [firstCell];

			//reset flags
			this.cellSelectionMode = false; 
			this.keepCellsSelected = false;
			this.baseCellPosition = null;
			this.lastSelectionRange = null; 
			this.selectionType = 'cell';
		}
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
				var $cell = $(this);
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
							$rows.eq(rowIdx + i).prepend(selection.table.newActiveCell().obj);
						} else {
							$( leftCell ).after(selection.table.newActiveCell().obj);
						}
					}
				}
				$cell.removeAttr('colspan');
				$cell.removeAttr('rowspan');
			});

			//reset flags
			this.cellSelectionMode = false; 
			this.keepCellsSelected = false;
			this.baseCellPosition = null;
			this.lastSelectionRange = null; 
			this.selectionType = 'cell';
		}
	};

	return TableSelection;
});
