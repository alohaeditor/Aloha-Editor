define([
	'aloha',
	'aloha/jquery',
	'aloha/ephemera',
	'table/table-plugin-utils',
	'util/browser',
	'util/misc',
	'util/dom'
], function (
	Aloha,
	jQuery,
	Ephemera,
	Utils,
	Browser,
	Misc,
	Dom
) {
	/**
	 * Constructs a TableCell.
	 *
	 * @param {DomNode} cell
	 *        A td/th which will be represente by this TableCell.
	 * @param {Table} tableObj
	 *        The Table which contains the cell. The cell will be
	 *        activated/dactivated with the table.
	 */
	var TableCell = function (originalTd, tableObj) {
		if (null == originalTd) {
			originalTd = '<td></td>';
		}

		//original Td must be a DOM node so that the this.obj.context property is available
		//this transformation will properly handle jQuery objects as well as DOM nodes
		var $td = jQuery(originalTd);
		originalTd = $td.get(0);

		this.obj = $td;
		this.tableObj = tableObj;
		var ephemeraClass = 'aloha-ephemera';
		var isEphemeral = $td.hasClass(ephemeraClass) || $td.parent().hasClass(ephemeraClass);
		if (!isEphemeral) {
			jQuery(originalTd).addClass(this.tableObj.tablePlugin.defaultCellClass);
		}
		tableObj.cells.push(this);
	};

	/**
	 * Reference to the jQuery-representation of the wrapping table
	 *
	 * @see TableCell.table
	 */
	TableCell.prototype.tableObj = undefined;

	/**
	 * Reference to the jQuery td-Object of the cell
	 */
	TableCell.prototype.obj = undefined;

	/**
	 * The jQuery wrapper of the cell
	 */
	TableCell.prototype.wrapper = undefined;

	/**
	 * Flag if the cell has focus
	 */
	TableCell.prototype.hasFocus = false;

	TableCell.prototype.activate = function () {
		var cell = this;
		var $elem = cell.obj;

		// wrap the created div into the contents of the cell
		$elem.wrapInner('<div/>');

		// create the editable wrapper for the cells
		var $wrapper = $elem.children('div').eq(0);
		$wrapper.contentEditable(true);
		$wrapper.addClass('aloha-table-cell-editable');

		// mark the editable wrapper as ephemeral
		Ephemera.markWrapper($wrapper);

		// attach events to the editable div-object
		$wrapper.on('focus', function ($event) {
			// activate the button for splitting cells if the clicked cell has an active row- or colspan
			if (Utils.colspan(cell.obj) > 1 || Utils.rowspan(cell.obj) > 1) {
				cell.tableObj.tablePlugin._splitcellsButton.enable(true);
			} else {
				cell.tableObj.tablePlugin._splitcellsButton.enable(false);
			}

			// ugly workaround for ext-js-adapter problem in
			// ext-jquery-adapter-debug.js:1020
			if ($event.currentTarget) {
				$event.currentTarget.indexOf = function () {
					return -1;
				};
			}
			cell._editableFocus($event);
		});

		$wrapper.on('mousedown', function ($event) {
			// ugly workaround for ext-js-adapter problem in ext-jquery-adapter-debug.js:1020
			if ($event.currentTarget) {
				$event.currentTarget.indexOf = function () {
					return -1;
				};
			}

			// prevent cell selection, if mousedown was on a block handle
			if (jQuery($event.target).hasClass('aloha-block-draghandle')) {
				return;
			}

			cell._editableMouseDown($event);

			cell.tableObj.selection.baseCellPosition = [cell._virtualY(), cell._virtualX()];

			if ($event.shiftKey) {
				// shift-click to select a coherent cell range
				//
				// in IE it's not possible to select multiple cells when you "select+drag" over other cells
				// click into the first cell and then "shift-click" into the last cell of the coherent cell range you want to select
				var right = cell.tableObj.selection.lastBaseCellPosition[1];
				var bottom = cell.tableObj.selection.lastBaseCellPosition[0];
				var topLeft = cell.tableObj.selection.baseCellPosition;
				var left = topLeft[1];
				if (left > right) {
					left = right;
					right = topLeft[1];
				}
				var top = topLeft[0];
				if (top > bottom) {
					top = bottom;
					bottom = topLeft[0];
				}
				var rect = {
					"top": top,
					"right": right,
					"bottom": bottom,
					"left": left
				};

				var table = cell.tableObj;
				var $rows = table.obj.children().children('tr');
				var grid = Utils.makeGrid($rows);

				table.selection.selectedCells = [];
				table.selection.currentRectangle = rect;
				var selectClass = table.get('classCellSelected');
				Utils.walkGrid(grid, function (cellInfo, j, i) {
					if (Utils.containsDomCell(cellInfo)) {
						if (i >= rect.top && i <= rect.bottom && j >= rect.left && j <= rect.right) {
							jQuery(cellInfo.cell).addClass(selectClass);
							table.selection.selectedCells.push(cellInfo.cell);
						} else {
							jQuery(cellInfo.cell).removeClass(selectClass);
						}
					}
				});

				table.selection.notifyCellsSelected();
			} else {
				cell.tableObj.selection.lastBaseCellPosition = cell.tableObj.selection.baseCellPosition;
				cell._editableMouseDown($event);
				cell._startCellSelection();
			}
		});

		$wrapper.on('blur', function ($event) {
			cell._editableBlur($event);
		});
		$wrapper.on('keyup', function ($event) {
			cell._editableKeyUp($event);
		});
		$wrapper.on('keydown', function ($event) {
			cell._editableKeyDown($event);
		});
		$wrapper.on('mouseover', function ($event) {
			cell._selectCellRange();
		});
		$elem.on('mouseover', function ($event) {
			cell._selectCellRange();
		});

		// we will treat the wrapper just like an editable
		$wrapper.contentEditableSelectionChange(function ($event) {
			Aloha.Selection.onChange($wrapper, $event);
			return $wrapper;
		});

		$elem.on('mousedown', function ($event) {
			// prevent cell selection, if mousedown was on a block handle
			if (jQuery($event.target).hasClass('aloha-block-draghandle')) {
				return;
			}

			// when clicked on something nested, prevent selection of whole cell
			if ($event.target != $elem[0]) {
				$event.stopPropagation();
				return;
			}

			window.setTimeout(function () {
				// Select the entire cell's content.
				cell.wrapper.trigger('focus');
				cell._selectAll($wrapper);
			}, 1);
			cell.tableObj.selection.baseCellPosition = [cell._virtualY(), cell._virtualX()];

			if (!cell.tableObj.selection.lastBaseCellPosition) {
				cell.tableObj.selection.lastBaseCellPosition = cell.tableObj.selection.baseCellPosition;
			}

			if ($event.shiftKey) {
				// shift-click to select a coherent cell range
				//
				// in IE it's not possible to select multiple cells when you "select+drag" over other cells
				// click into the first cell and then "shift-click" into the last cell of the coherent cell range you want to select
				var right = cell.tableObj.selection.lastBaseCellPosition[1];
				var bottom = cell.tableObj.selection.lastBaseCellPosition[0];
				var topLeft = cell.tableObj.selection.baseCellPosition;
				var left = topLeft[1];
				if (left > right) {
					left = right;
					right = topLeft[1];
				}
				var top = topLeft[0];
				if (top > bottom) {
					top = bottom;
					bottom = topLeft[0];
				}
				var rect = {
					"top": top,
					"right": right,
					"bottom": bottom,
					"left": left
				};

				var table = cell.tableObj;
				var $rows = table.obj.children().children('tr');
				var grid = Utils.makeGrid($rows);

				table.selection.selectedCells = [];
				var selectClass = table.get('classCellSelected');
				table.selection.currentRectangle = rect;
				Utils.walkGrid(grid, function (cellInfo, j, i) {
					if (Utils.containsDomCell(cellInfo)) {
						if (i >= rect.top && i <= rect.bottom && j >= rect.left && j <= rect.right) {
							jQuery(cellInfo.cell).addClass(selectClass);
							table.selection.selectedCells.push(cellInfo.cell);
						} else {
							jQuery(cellInfo.cell).removeClass(selectClass);
						}
					}
				});

				table.selection.notifyCellsSelected();
			} else {
				cell.tableObj.selection.lastBaseCellPosition = cell.tableObj.selection.baseCellPosition;
				cell._startCellSelection();
			}
			$event.stopPropagation();
		});

		if ($elem[0]) {
			$elem[0].onselectstart = Misc.eventPreventDefault;
		}

		$elem.on('mouseenter', function (evt) {
			Misc.addEditingHelpers($wrapper);
		});
		$elem.on('mouseleave', function (evt) {
			Misc.removeEditingHelpers($wrapper);
		});

		Aloha.bind('aloha-smart-content-changed', function (event, data) {
			if (data.editable.isActive && data.triggerType === 'block-change') {
				Misc.addEditingHelpers($wrapper);
			}
		});

		// set contenteditable wrapper div
		this.wrapper = $wrapper;
		if ($wrapper[0]) {
			var wrapper = $wrapper[0];

			wrapper.onselectstart = Misc.eventStopPropagation;
			// Disabled the dragging of content, since it makes cell selection
			// difficult.
			wrapper.ondragstart = Misc.eventPreventDefault;
		}

		return this;
	};

	/**
	 * The deactivate method removes the contenteditable helper div within the
	 * table-data field and wraps the innerHtml to the outerHTML
	 *
	 * @return void
	 */
	TableCell.prototype.deactivate = function () {
		var wrapper = jQuery(this.obj.children('.aloha-table-cell-editable'));

		if (wrapper.length) {
			Misc.removeEditingHelpers(wrapper);

			// unwrap cell contents without re-creating dom nodes
			wrapper.parent().append(
				wrapper.contents()
			);

			// remove the contenteditable div and its attached events
			wrapper.remove();


			// remove the click event of the
			this.obj.unbind('click');
			this.obj.unbind('mousedown');
			this.obj.unbind('mouseenter');
			this.obj.unbind('mouseleave');
			this.obj.get(0).onselectstart = null;

			if (jQuery.trim(this.obj.attr('class')) == '') {
				this.obj.removeAttr('class');
			}
		}
	}

	/**
	 * Native toString-method
	 *
	 * @return string name of the namespace
	 */
	TableCell.prototype.toString = function () {
		return 'TableCell';
	};

	/**
	 * Focus method for the contentediable div within a table data-field. The method
	 * requires the event-property Cell as a Cell object. If the
	 * Cell wasn't activated yet it does all relevant actions to activate the cell.
	 *
	 * @param e
	 *            the jquery event object
	 * @return void
	 */
	TableCell.prototype._editableFocus = function (e) {
		// only do activation stuff if the cell don't has the focus
		if (!this.hasFocus) {
			// set an internal flag to focus the table
			this.tableObj.focus();

			// add an active-class
			this.obj.addClass('aloha-table-cell_active');

			// set the focus flag
			this.hasFocus = true;

			// unset the selection type
			this.tableObj.selection.selectionType = 'cell';

		}
	};

	/**
	 * Blur event for the contenteditable div within a table-data field. The method
	 * requires the event-property TableCell as a TableCell object. It
	 * sets the hasFocus flag of the cell to false and removes the "active"
	 * css-class.
	 *
	 * @param jqEvent
	 *            the jquery event object
	 * @return void
	 */
	TableCell.prototype._editableBlur = function (jqEvent) {

		// reset the focus of the cell
		this.hasFocus = false;

		// remove "active class"
		this.obj.removeClass('aloha-table-cell_active');

		// if the editable wrapper in the table cell only contains a single, empty
		// paragraph, we remove that paragraph
		if (this.wrapper.children().length === 1) {
			this.wrapper.find('p').filter(function (index) {
				var clone = jQuery(this).clone();
				// the last br in the paragraph does not count, so we remove
				// it before checking the paragraph for emptiness
				clone.find('br:last-child').remove();
				return Dom.isEmpty(clone[0]);
			}).remove();
		}
	};

	/**
	 * Gives the X (column no) for a cell, after adding colspans
	 */
	TableCell.prototype._virtualX = function () {
		var $rows = this.tableObj.obj.children().children('tr');
		var rowIdx = this.obj.parent().index();
		var colIdx = this.obj.index();
		return Utils.cellIndexToGridColumn($rows, rowIdx, colIdx);
	};

	/**
	 * Gives the Y (row no) for a cell, after adding colspans
	 */
	TableCell.prototype._virtualY = function () {
		return this.obj.parent('tr').index();
	};

	/**
	 * Starts the cell selection mode
	 */
	TableCell.prototype._startCellSelection = function () {
		if(!this.tableObj.selection.cellSelectionMode) {

			//unselect currently selected cells
			this.tableObj.selection.unselectCells();

			// activate cell selection mode
			this.tableObj.selection.cellSelectionMode = true;

			//bind a global mouseup event handler to stop cell selection
			var that = this;
			jQuery('body').bind('mouseup.cellselection', function(event) {
				that._endCellSelection();
			});

			this.tableObj.selection.baseCellPosition = [this._virtualY(), this._virtualX()];
		}
	};

	/**
	 * Ends the cell selection mode
	 */
	TableCell.prototype._endCellSelection = function() {
		if (this.tableObj.selection.cellSelectionMode) {
			Utils.selectAnchorContents(this.tableObj.selection.selectedCells);

			this.tableObj.selection.cellSelectionMode = false;
			this.tableObj.selection.baseCellPosition = null;
			this.tableObj.selection.lastSelectionRange = null;

			this.tableObj.selection.selectionType = 'cell';

			//unbind the global cell selection event
			jQuery('body').unbind('mouseup.cellselection');
		}
	};

	TableCell.prototype._getSelectedRect = function () {
		var right = this._virtualX();
		var bottom = this._virtualY();
		var topLeft = this.tableObj.selection.baseCellPosition;
		var left = topLeft[1];
		if (left > right) {
			left = right;
			right = topLeft[1];
		}
		var top = topLeft[0];
		if (top > bottom) {
			top = bottom;
			bottom = topLeft[0];
		}
		return {
			"top": top,
			"right": right,
			"bottom": bottom,
			"left": left
		};
	};
	
	/**
	 * Toggles selection of cell.
	 * This works only when cell selection mode is active.
	 */
	TableCell.prototype._selectCellRange = function() {
		if(this.tableObj.selection.resizeMode || !this.tableObj.selection.cellSelectionMode) {
			return;
		}

		var rect = this._getSelectedRect();
		var table = this.tableObj;
		// if the range contains a single cell only, and no cells were selected before,
		// we do not select the whole cell. This enables selecting text in a single cell
		// without selecting the whole cell, even if - while selecting the text - the user
		// moves the mouse out of the text wrapper into the cell itself
		if (rect.top === rect.bottom && rect.left === rect.right && table.selection.selectedCells.length === 0) {
			return;
		}

		var $rows = table.obj.children().children('tr');
		var grid = Utils.makeGrid($rows);

		table.selection.selectedCells = [];
		table.selection.currentRectangle = rect;
		var selectClass = table.get('classCellSelected');
		Utils.walkGrid(grid, function (cellInfo, j, i) {
			if (Utils.containsDomCell(cellInfo)) {
				if (i >= rect.top && i <= rect.bottom && j >= rect.left && j <= rect.right) {
					jQuery(cellInfo.cell).addClass(selectClass);
					table.selection.selectedCells.push(cellInfo.cell);

				} else {
					jQuery(cellInfo.cell).removeClass(selectClass);
				}
			}
		});

		table.selection.notifyCellsSelected();
	};

	/**
	 * Selects all inner-contens of an contentEditable-object
	 *
	 * @param editableNode dom-representation of the editable node (div-element)
	 * @return void
	 */
	TableCell.prototype._selectAll = function (editableNode) {
		var e = (editableNode.jquery) ? editableNode.get(0) : editableNode;

		// Not IE
		if (!jQuery.browser.msie) {
			var s = window.getSelection();
			// WebKit
			if (s.setBaseAndExtent /*&& e> 0 */ ) {
				s.setBaseAndExtent(e, 0, e, Math.max(0, e.innerText.length - 1));
			}
			// Firefox and Opera
			else {
				// workaround for bug # 42885
				if (window.opera && e.innerHTML.substring(e.innerHTML.length - 4) == '<BR>') {
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
	};

	/**
	 * The mouse-down event for the editable-div in the thd-field. Unselect all
	 * cells when clicking on the editable-div.
	 *
	 * @param jqEvent
	 *            the jquery-event object
	 * @return void
	 */
	TableCell.prototype._editableMouseDown = function (jqEvent) {
		// deselect all highlighted cells registered in the this.tableObj.selection object
		this.tableObj.selection.unselectCells();

		if (this.tableObj.hasFocus) {
			if (typeof jqEvent.stopPropagation === 'function') {
				jqEvent.stopPropagation();
			} else if (typeof jqEvent.cancelBubble !== 'undefined') {
				jqEvent.cancelBubble = true;
			}
		}
	};

	/**
	 * The key-up event for the editable-div in the td-field. Just check if the div
	 * is empty and insert an &nbsp;
	 *
	 * @param jqEvent
	 *            the jquery-event object
	 * @return void
	 */
	TableCell.prototype._editableKeyUp = function (jqEvent) {
		//TODO do we need to check for empty cells and insert a space?
		//this._checkForEmptyEvent(jqEvent);
	};

	/**
	 * The key-down event for the ediable-div in the td-field. Check if the the div
	 * is empty and insert an &nbsp. Furthermore if cells are selected, unselect
	 * them.
	 *
	 * @param jqEvent
	 *            the jquery-event object
	 * @return void
	 */
	TableCell.prototype._editableKeyDown = function (jqEvent) {
		var KEYCODE_TAB = 9;
		this._checkForEmptyEvent(jqEvent);
		if (this.obj[0] === this.tableObj.obj.find('tr:last td:last')[0]) {
			// only add a row on a single key-press of tab (so check that alt-,
			// shift- or ctrl-key are NOT pressed)
			if (KEYCODE_TAB == jqEvent.keyCode && !jqEvent.altKey && !jqEvent.shiftKey && !jqEvent.ctrlKey) {
				var lastInsertedRow = this.tableObj.addRow(this.obj.parent().index() + 1);

				if (Browser.mozilla) {
					// After the row is inserted, mozilla sets the cursor outside
					// the Table in weird places.
					jqEvent.preventDefault();

					// Place focus into first editable cell of new row
					$(lastInsertedRow).find('td:nth-child(2) .aloha-table-cell-editable').focus();
				}
			}
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
	TableCell.prototype._checkForEmptyEvent = function (jqEvent) {
		var $wrapper = jQuery(this.wrapper),
			text = $wrapper.text();

		if ($wrapper.children().length > 0) {
			return;
		}

		// if empty insert a blank space and blur and focus the wrapper
		if (text === '') {
			this.wrapper.text('');
			this.wrapper.get(0).blur();
			this.wrapper.get(0).focus();
		}
	};

	/**
	 * Given a cell, will return the container element of the contents
	 * of the cell. The container element may be the given cell itself,
	 * or a wrapper element, in the case of activated cells.
	 *
	 * @param {DomNode} cell
	 *        the TH/TD of a TableCell that may or may not be actived.
	 * @return {DomNode}
	 *        the element that contains the contents of the given cell.
	 */
	TableCell.getContainer = function (cell) {
		if (jQuery(cell.firstChild).hasClass("aloha-table-cell-editable")) {
			return cell.firstChild;
		} else {
			return cell;
		}
	};

	return TableCell;
});
