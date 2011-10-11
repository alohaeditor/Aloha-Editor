define(
['aloha/jquery', 'table/table-plugin-utils'],
function (jQuery, Utils) {
	/**
	 * The constructor for the Cell-Objects takes a DOM td-object, attaches
	 * events, adds an wrapper into the cell and returns the modified td-object as
	 * DOM representation
	 *
	 * @param originalTd
	 *            The original td-field which should will be transformed
	 * @param tableObj
	 *            Table-Object which contains the cell
	 *
	 * @return the created table-data field as DOM-representation
	 */
	var Cell = function(originalTd, tableObj) {
		if (null == originalTd) {
			originalTd = '<td>&nbsp;</td>';
		}

		//original Td must be a DOM node so that the this.obj.context property is available
		//this transformation will properly handle jQuery objects as well as DOM nodes
	    originalTd = jQuery( originalTd ).get( 0 );

		this.obj = jQuery(originalTd);
		this.tableObj = tableObj;

		tableObj.cells.push(this);
	};

	/**
	 * Reference to the jQuery-representation of the wrapping table
	 *
	 * @see Cell.table
	 */
	Cell.prototype.tableObj = undefined;

	/**
	 * Reference to the jQuery td-Object of the cell
	 */
	Cell.prototype.obj = undefined;

	/**
	 * The jQuery wrapper of the cell
	 */
	Cell.prototype.wrapper = undefined;

	/**
	 * Flag if the cell has focus
	 */
	Cell.prototype.hasFocus = false;

	/**
	 * The jQuery wrapper of the cell
	 */
	Cell.activeCell = undefined;

	/**
	 * The jQuery wrapper of the cell
	 */
	Cell.lastActiveCell = undefined;

	/**
	 * Focus method for the contentediable div within a table data-field. The method
	 * requires the event-property Cell as a Cell object. If the
	 * Cell wasn't activated yet it does all relevant actions to activate the cell.
	 *
	 * @param e
	 *            the jquery event object
	 * @return void
	 */
	Cell.prototype.editableFocus = function(e) {
		// only do activation stuff if the cell don't has the focus
		if (!this.hasFocus) {
			// set an internal flag to focus the table
			this.tableObj.focus();

			// set the clicked cell active as the active cell
			Cell.activeCell = this;

			// set the clicked cell active as the last active cell (the difference
			// to activeCell is that lastActiveCell won't be reset on blur)
			Cell.lastActiveCell = this;

			// add an active-class
			this.obj.addClass('aloha-table-cell_active');

			// set the focus flag
			this.hasFocus = true;

			// select the whole content in the table-data field
			this.selectAll(this.wrapper.get(0));

			// unset the selection type
			this.tableObj.selection.selectionType = 'cell';

		}
	};

	/**
	 * Blur event for the contenteditable div within a table-data field. The method
	 * requires the event-property Cell as a Cell object. It
	 * sets the hasFocus flag of the cell to false and removes the "active"
	 * css-class.
	 *
	 * @param jqEvent
	 *            the jquery event object
	 * @return void
	 */
	Cell.prototype.editableBlur = function(jqEvent){
		// no active cell
		Cell.activeCell = undefined;

		// reset the focus of the cell
		this.hasFocus = false;

		// remove "active class"
		this.obj.removeClass('aloha-table-cell-active');
	};

	Cell.prototype.activate = function() {
		// wrap the created div into the contents of the cell
		this.obj.wrapInner('<div/>');

		// create the editable wrapper for the cells
		var wrapper = this.obj.children('div').eq(0);

		wrapper.contentEditable(true);
		wrapper.addClass('aloha-table-cell-editable');


		var that = this;
		// attach events to the editable div-object
		wrapper.bind('focus', function(jqEvent) {
			// ugly workaround for ext-js-adapter problem in ext-jquery-adapter-debug.js:1020
			if (jqEvent.currentTarget) {
				jqEvent.currentTarget.indexOf = function () {
					return -1;
				};
			}
			that.editableFocus(jqEvent);
		});
		wrapper.bind('mousedown', function(jqEvent) {
			// ugly workaround for ext-js-adapter problem in ext-jquery-adapter-debug.js:1020
			if (jqEvent.currentTarget) {
				jqEvent.currentTarget.indexOf = function () {
					return -1;
				};
			}
			
			that.editableMouseDown(jqEvent);

			//start cell selection
			that.startCellSelection();       
			
		});
		wrapper.bind('blur',      function(jqEvent) { that.editableBlur(jqEvent);      });
		wrapper.bind('keyup',     function(jqEvent) { that.editableKeyUp(jqEvent);     });
		wrapper.bind('keydown',   function(jqEvent) { that.editableKeyDown(jqEvent);   });
		wrapper.bind('mouseover', function(jqEvent) { that.selectCellRange(); });

		// we will treat the wrapper just like an editable
		wrapper.contentEditableSelectionChange(function (event) {
			Aloha.Selection.onChange(wrapper, event);
			return wrapper;
		});

		this.obj.bind('mousedown', function(jqEvent) {
			setTimeout(function() {
				that.wrapper.trigger('focus');
			}, 1);
			// unselect cells
			that.tableObj.selection.unselectCells();
	        //start cell selection
	        that.startCellSelection();       
			jqEvent.stopPropagation();
		});

		if (this.obj.get(0)) {
			this.obj.get(0).onselectstart = function (jqEvent) { return false; };
		}

		// set contenteditable wrapper div
		this.wrapper = this.obj.children();
		if (this.wrapper.get(0)) {
			this.wrapper.get(0).onselectstart = function() {
				window.event.cancelBubble = true;
			};
			// Disabled the dragging of content, since it makes cell selection difficult
			this.wrapper.get(0).ondragstart = function() { return false };
		}

		return this;
	};

	/**
	 * The deactivate method removes the contenteditable helper div within the
	 * table-data field and wraps the innerHtml to the outerHTML
	 *
	 * @return void
	 */
	Cell.prototype.deactivate = function() {
		var wrapper = this.obj.children('.aloha-table-cell-editable');

		if (wrapper.length) {
			// get the inner html of the contenteditable div
			var innerHtml = wrapper.html();

			// remove the contenteditable div and its attached events
			wrapper.unbind();
			wrapper.remove();

			// remove the click event of the
			this.obj.unbind('click');

			if (jQuery.trim(this.obj.attr('class')) == '') {
				this.obj.removeAttr('class');
			}

			// set the inner html of the contenteditable div as html for the table-data
			// field
			this.obj.html(innerHtml);
		}
	}

	/**
	 * Gives the X (column no) for a cell, after adding colspans 
	 */
	Cell.prototype.virtualX = function(){
		var $rows = this.tableObj.obj.children().children('tr');
		var rowIdx = this.obj.parent().index();
		var colIdx = this.obj.index();
		return Utils.cellIndexToGridColumn($rows, rowIdx, colIdx);
	};

	/**
	 * Gives the Y (row no) for a cell, after adding colspans 
	 */
	Cell.prototype.virtualY = function(){
		return this.obj.parent('tr').index();
	};

	/**
	 * Starts the cell selection mode
	 */
	Cell.prototype.startCellSelection = function(){
		if(!this.tableObj.selection.cellSelectionMode){

			//deactivate keepCellsSelected flag
			this.tableObj.selection.keepCellsSelected = false;

			//unselect currently selected cells
			this.tableObj.selection.unselectCells();

			// activate cell selection mode
			this.tableObj.selection.cellSelectionMode = true; 

			//bind a global mouseup event handler to stop cell selection
			var that = this;
			jQuery('body').bind('mouseup.cellselection', function(){
				that.endCellSelection();
			});

			this.tableObj.selection.baseCellPosition = [this.virtualY(), this.virtualX()];
		}
	};

	/**
	 * Ends the cell selection mode
	 */
	Cell.prototype.endCellSelection = function(){
		if(this.tableObj.selection.cellSelectionMode){
			this.tableObj.selection.cellSelectionMode = false; 
			this.tableObj.selection.keepCellsSelected = true;
			this.tableObj.selection.baseCellPosition = null;
			this.tableObj.selection.lastSelectionRange = null; 

			this.tableObj.selection.selectionType = 'cell';

			//unbind the global cell selection event
			jQuery('body').unbind('mouseup.cellselection');
		}
	};

	/**
	 * Toggles selection of cell.
	 * This works only when cell selection mode is active. 
	 */
	Cell.prototype.selectCellRange = function(){
		if(!this.tableObj.selection.cellSelectionMode) {
			return;
		}

		var cX = this.virtualX();
		var cY = this.virtualY();
		var basePos = this.tableObj.selection.baseCellPosition;
		var bX = basePos[1];
		if (cX < basePos[1]) {
			bX = cX;
			cX = basePos[1];
		}
		var bY = basePos[0];
		if (cY < bY) {
			bY = cY;
			cY = basePos[0];
		}

		var $rows = this.tableObj.obj.children().children('tr');
		var grid = Utils.makeGrid($rows);
		
		this.tableObj.selection.selectedCells = [];
		var selectClass = this.tableObj.get('classCellSelected');
		for (var i = 0; i < grid.length; i++) {
			for (var j = 0; j < grid[i].length; j++) {
				var cellInfo = grid[i][j];
				if ( Utils.containsDomCell(cellInfo) ) {
					if (i >= bY && i <= cY && j >= bX && j <= cX) {
						jQuery( cellInfo.cell ).addClass(selectClass);
						this.tableObj.selection.selectedCells.push(cellInfo.cell);
					} else {
						jQuery( cellInfo.cell ).removeClass(selectClass);
					}
				}
			}
		}

		Aloha.trigger( 'aloha-table-selection-changed' );
	};

	/**
	 * Native toString-method
	 *
	 * @return string name of the namespace
	 */
	Cell.prototype.toString = function() {
		return 'TableCell';
	};

	/**
	 * Selects all inner-contens of an contentEditable-object
	 *
	 * @param editableNode dom-representation of the editable node (div-element)
	 * @return void
	 */
	Cell.prototype.selectAll = function(editableNode) {
		var e = (editableNode.jquery) ? editableNode.get(0) : editableNode;

		// Not IE
		if (!jQuery.browser.msie) {
			var s = window.getSelection();
			// Safari
			if (s.setBaseAndExtent /*&& e> 0 */) {
				s.setBaseAndExtent(e, 0, e, e.innerText.length - 1);
			}
			// Firefox and Opera
			else {
				// workaround for bug # 42885
				if (window.opera
					&& e.innerHTML.substring(e.innerHTML.length - 4) == '<BR>') {
					e.innerHTML = e.innerHTML + '&#160;';
				}

				var r = document.createRange();
				r.selectNodeContents(e);
				s.removeAllRanges();
				s.addRange(r);
			}
		}
		// Some older browsers
		else if (document.getSelection) {
			var s = document.getSelection();
			var r = document.createRange();
			r.selectNodeContents(e);
			s.removeAllRanges();
			s.addRange(r);
		}
		// IE
		else if (document.selection) {
			var r = document.body.createTextRange();
			r.moveToElementText(e);
			r.select();
		}

		Aloha.Selection.updateSelection(editableNode);
	};

	/**
	 * The mouse-down event for the editable-div in the thd-field. Unselect all
	 * cells when clicking on the editable-div.
	 *
	 * @param jqEvent
	 *            the jquery-event object
	 * @return void
	 */
	Cell.prototype.editableMouseDown = function(jqEvent) {
		// deselect all highlighted cells registered in the this.tableObj.selection object
		this.tableObj.selection.unselectCells();

		if (this.tableObj.hasFocus) {
			jqEvent.stopPropagation();
		}
	};

	//	/**
	//	 * The key-up event for the editable-div in the td-field. Just check if the div
	//	 * is empty and insert an &nbsp;
	//	 *
	//	 * @param jqEvent
	//	 *            the jquery-event object
	//	 * @return void
	//	 */
	//	Cell.prototype.editableKeyUp = function(jqEvent) {
	//	    
	//		this.checkForEmptyEvent(jqEvent);
	//		
	//	};

	/**
	 * The key-down event for the ediable-div in the td-field. Check if the the div
	 * is empty and insert an &nbsp. Furthermore if cells are selected, unselect
	 * them.
	 *
	 * @param jqEvent
	 *            the jquery-event object
	 * @return void
	 */
	Cell.prototype.editableKeyDown = function(jqEvent) {
		
		var 
		KEYCODE_TAB = 9,
		KEYCODE_ARROWLEFT = 37,
		KEYCODE_ARROWUP = 38,
		KEYCODE_ARROWRIGHT = 39
		KEYCODE_ARROWDOWN = 40;

		this.checkForEmptyEvent(jqEvent);
		
		if ( this.obj[0] == this.tableObj.obj.find('tr:last td:last')[0] ) {
			// only add a row on a single key-press of tab (so check if alt-, shift- or
			// ctrl-key are NOT pressed)
			if (KEYCODE_TAB == jqEvent.keyCode && !jqEvent.altKey && !jqEvent.shiftKey && !jqEvent.ctrlKey) {
				// add a row after the current row (false stands for not highlighting the new row)
				this.tableObj.addRowsAfter(false);
				// stop propagation because this should overwrite all other events
				jqEvent.stopPropagation();
				return;
			}
		}
		if (!jqEvent.ctrlKey && !jqEvent.shiftKey) {
			if (this.tableObj.selection.selectedCells.length > 0 && this.tableObj.selection.selectedCells[0].length > 0) {
				this.tableObj.selection.selectedCells[0][0].firstChild.focus();
				this.tableObj.selection.unselectCells();
				jqEvent.stopPropagation();
			}
		}else if(jqEvent.shiftKey && this.tableObj.selection.selectedCells.length > 0){

			switch (this.tableObj.selection.selectionType) {
			case 'row':
				switch(jqEvent.keyCode) {
				case KEYCODE_ARROWUP:
					var firstSelectedRow = this.tableObj.selection.selectedCells[0][0].parentNode.rowIndex;
					if (firstSelectedRow > 1) {
						this.tableObj.rowsToSelect.push(firstSelectedRow - 1);
					}
					break;
				case KEYCODE_ARROWDOWN:
					var lastRowIndex = this.tableObj.selection.selectedCells.length - 1;
					var lastSelectedRow = this.tableObj.selection.selectedCells[lastRowIndex][0].parentNode.rowIndex;
					if (lastSelectedRow < this.tableObj.numRows) {
						this.tableObj.rowsToSelect.push(lastSelectedRow + 1);
					}
					break;
				}
				this.tableObj.selectRows();

				break;
			case 'column':
				switch(jqEvent.keyCode) {
				case KEYCODE_ARROWLEFT:
					var firstColSelected = this.tableObj.selection.selectedCells[0][0].cellIndex;
					if (firstColSelected > 1) {
						this.tableObj.columnsToSelect.push(firstColSelected - 1);
					}
					break;
				case KEYCODE_ARROWRIGHT:
					var lastColIndex = this.tableObj.selection.selectedCells[0].length - 1;
					var lastColSelected = this.tableObj.selection.selectedCells[0][lastColIndex].cellIndex;
					if (lastColSelected < this.tableObj.numCols) {
						this.tableObj.columnsToSelect.push(lastColSelected + 1);
					}
					break;
				}
				this.tableObj.selectColumns();

				break;
			}
			jqEvent.stopPropagation();
			jqEvent.preventDefault();
			return false;
		}
	};

	/**
	 * The custom keyup event for a table-cell Checks if the cell is empty and
	 * inserts a space (\u00a0)
	 *
	 * @param e
	 *            the event object which is given by jquery
	 * @return void
	 */
	Cell.prototype.checkForEmptyEvent = function(jqEvent) {
		var $wrapper = jQuery(this.wrapper),
		    text = $wrapper.text();

		if ( $wrapper.children().length > 0) {
			return;
		}

		// if empty insert a blank space and blur and focus the wrapper
		if ( text === '' ){
			this.wrapper.text('\u00a0');
			this.wrapper.get(0).blur();
			this.wrapper.get(0).focus();
		}
	};

	return Cell;
});
