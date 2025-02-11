/**
 * Aloha Table Plugin
 * ------------------
 * This plugin provides advanced support for manipulating tables in Aloha
 * Editables.
 * Nested tables are not support. If nested tables are pasted into the
 * editable, they will simply be left alone.
 * Each (non-nested) table in the editable will have a corresponding Aloha
 * Table instance created for it, which will maintain internal state, and
 * information related to its DOM element.
 *
 * @todo: - selectRow/selectColumn should take into account the helper row/column.
 *			ie: selectRow(0) and selectColumn(0), should be zero indexed
 */
define([
	'aloha',
	'jquery',
	'ui/scopes',
	'ui/dialog',
	'i18n!table/nls/i18n',
	'table/table-cell',
	'table/table-selection',
	'table/table-plugin-utils',
	'aloha/ephemera',
	'util/html',
	'util/dom',
	'aloha/console'
], function (
	Aloha,
	jQuery,
	Scopes,
	Dialog,
	i18n,
	TableCell,
	TableSelection,
	Utils,
	Ephemera,
	Html,
	Dom,
	Console
) {
	var undefined = void 0;
	var GENTICS = window.GENTICS;

	/**
	 * Returns an Array with all elements and textnodes included in the
	 * hierarchy of the element received. Is Similar to do
	 * jQuery('*', element).contents(), the diference it's this function returns the
	 * array in the correct order of apparition
	 * @example
	 * <pre>
	 *		&gt;p&lt;
	 *			textnode
	 *			<b>b textnode</b>
	 *			another text node
	 *		&gt;/p&lt;
	 *
	 *		jQuery('*', lt).contents();
	 *			// returns ["textnode", "<b>", "another textnode", "b textnode"]
	 *		getPlainHierarchy(lt)
	 *			// returns ["textnode", "<b>", "b textnode", "another textnode"]
	 * </pre>
	 *
	 * @return {Array.<HTMLElement|TextNode>}
	 */
	function getPlainHierarchy(element) {
		if (element.jquery) {
			element = element[0];
		}
		var i, result = [], child;
		for (i = 0; i < element.childNodes.length; i++) {
			child = element.childNodes[i];
			result.push(child);
			if (child.nodeType === 1) {
				result = result.concat(getPlainHierarchy(child));
			}
		}

		return result;
	}

	/**
	 * Find the first or the last element inside a table, even if in a td
	 *
	 * @param {String} type Accepts two values: 'first' or 'last'
	 * @param {HTMLElement|jQuery} parent the parent element to search
	 *
	 * @return {jQuery}
	 */
	function getNewSelectedElement(type, parent) {
		var toSelectElement;
		if ('first' === type) {
			toSelectElement = jQuery('[contenteditable]', parent).first()[0]
				.firstChild;
			if (undefined === toSelectElement) {
				toSelectElement = jQuery('*', parent).first()[0].firstChild;
			}
		} else if ('last' === type) {
			toSelectElement = getPlainHierarchy(jQuery('td:last', parent))
				.reverse()[0];
		}

		return toSelectElement;
	}

	/**
	 * Constructor of the table object
	 *
	 * @param table
	 *            the dom-representation of the held table
	 * @return void
	 */
	var Table = function (table, tablePlugin) {
		// set the table attribut "obj" as a jquery represenation of the dom-table
		this.obj = jQuery(table);

		// setup a class to mark wrapping divs introduced by this plugin
		var wrapperMarkerClass = "aloha-table-container";
		// parent before wrapping
		var parent = this.obj.parent();
		// check config if table should be wrapped
		if (tablePlugin.settings.wrapClass !== undefined) {
			// combine configurable class with fixed
			var wrapClass = tablePlugin.settings.wrapClass + ' ' + wrapperMarkerClass;

			// If config for wrapping div exists and classes match, do nothing

			// If config for wrapping div exists,
			// and classes do not match,
			// and a wrapping div does exist allready,
			// --> change classes
			if (parent.attr('class') !== wrapClass && parent.hasClass(wrapperMarkerClass)) {
				parent.attr('class', wrapClass);
				// If config for wrapping div exists
				// and classes do not match
				// and wrapping div is not present (yet),
				// --> create
			} else if (parent.attr('class') !== wrapClass) {
				// add div with class from config
				this.obj.wrap('<div class="' + wrapClass + '"></div>');
			}
			// set parent of table element - the wrapping div - for further handling
			this.wrappedObj = this.obj.parent();
		} else {
			// If config for wrapping div does not exists
			// and there is a wrapping div
			// --> remove it
			if (parent.hasClass(wrapperMarkerClass)) {
				this.obj.unwrap();
			}
			// set table-element itself for further handling
			this.wrappedObj = this.obj;
		}

		correctTableStructure(this);

		if (!this.obj.attr('id')) {
			this.obj.attr('id', GENTICS.Utils.guid());
		}

		// mark table id as ephemeral
		Ephemera.markAttr(this.obj, 'id');

		this.tablePlugin = tablePlugin;
		this.selection = new TableSelection(this);
		this.refresh();
	};

	jQuery.extend(Table.prototype, {
		/**
		 * Attribute holding the jQuery-table-represenation
		 */
		obj: undefined,

		/**
		 * The DOM-element of the outest div-container wrapped around the cell
		 */
		tableWrapper: undefined,

		/**
		 * An array of all Cells contained in the Table
		 *
		 * @see TableCell
		 */
		cells: undefined,

		/**
		 * Number of rows of the table
		 */
		numRows: undefined,

		/**
		 * Number of rows of the table
		 */
		numCols: undefined,

		/**
		 * Flag wether the table is active or not
		 */
		isActive: false,

		/**
		 * Flag wether the table is focused or not
		 */
		hasFocus: false,

		/**
		 * The editable which contains the table
		 */
		parentEditable: undefined,

		/**
		 * Flag to check if the mouse was pressed. For row- and column-selection.
		 */
		mousedown: false,

		/**
		 * ID of the column which was pressed when selecting columns
		 */
		clickedColumnId: -1,

		/**
		 * ID of the row which was pressed when selecting rows
		 */
		clickedRowId: -1,

		/**
		 * collection of columnindexes of the columns which should be selected
		 */
		columnsToSelect: [],

		/**
		 * collection of rowindexes of the rows which should be selected
		 */
		rowsToSelect: [],

		/**
		 * contains the plugin id used for interaction with the floating menu
		 */
		fmPluginId: undefined
	});

	/**
	 * @hide
	 */
	Table.prototype.refresh = function () {
		// find the dimensions of the table
		this.numCols = this.countVirtualCols();

		var rows = this.getRows(true);
		this.numRows = rows.length;

		// init the cell-attribute with an empty array
		this.cells = [];

		// iterate over table cells and create Cell-objects
		for (var i = 0; i < rows.length; i++) {
			var row = jQuery(rows[i]);
			var cols = row.children();
			for (var j = 0; j < cols.length; j++) {
				var col = cols[j];
				var Cell = this.newCell(col);
			}
		}
	};

	Table.prototype.countVirtualCols = function () {
		var $firstRow = this.obj.children().children('tr:first-child').children();
		return $firstRow.length - $firstRow.filter('.' + this.get('classLeftUpperCorner')).length;
	};

	/**
	 * Wrapper-Mehotd to return a property of TablePlugin.get
	 *
	 * @see TablePlugin.get
	 * @param property
	 *            the property whichs value should be return
	 * @return the value associated with the property
	 */
	Table.prototype.get = function (property) {
		return this.tablePlugin.get(property);
	};

	/**
	 * Wrapper-Method for TablePlugin.set
	 *
	 * @see TablePlugin.set
	 * @param key
	 *            the key whichs value should be set
	 * @param value
	 *            the value for the key
	 * @return void
	 */
	Table.prototype.set = function (key, value) {
		this.tablePlugin.set(key, value);
	};

	/**
	 * Given an unbalanced table structure, pad it with the necessary cells to
	 * make it perfectly rectangular
	 *
	 * @param {Aloha.Table} tableObj
	 */
	function correctTableStructure(tableObj) {
		var table = tableObj.obj,

			i,
			j,
			row,
			rows = tableObj.getRows(),
			rowsNum = rows.length,

			cols,
			colsNum,

			colsCount,
			maxColsCount = 0,
			cachedColsCounts = [rowsNum],
			colsCountDiff,
			colSpan;

		for (i = 0; i < rowsNum; i++) {
			row = jQuery(rows[i]);
			cols = row.children('td, th');
			colsNum = cols.length;
			colsCount = Utils.cellIndexToGridColumn(rows, i, colsNum - 1) + 1;

			// Check if the last cell in this row has a col span, to account
			// for it in the total number of colums in this row

			colSpan = parseInt(cols.last().attr('colspan'), 10);

			if (colSpan === 0) {
				// TODO: support colspan=0
				// http://dev.w3.org/html5/markup/td.html#td.attrs.colspan
				// http://www.w3.org/TR/html401/struct/tables.html#adef-colspan
				// The value zero ("0") means that the cell spans all columns
				// from the current column to the last column of the column
				// group (COLGROUP) in which the cel
			} else if (!isNaN(colSpan)) {
				// The default value of this attribute is one ("1"), so where this
				// is the case, we will remove such superfluous colspan attributes
				if (colSpan == 1) {
					cols.last().removeAttr('colspan');
				}

				colsCount += (colSpan - 1);
			}

			// if a rowspan is set in the last element of the row, the row(s) below
			// are supposed to have one less column for every colspan the element has
			rowSpan = parseInt(cols.last().attr('rowspan'), 10);
			if (rowSpan > 1) {
				for (j = 1; j < rowSpan - 1; j++) {
					if (colSpan > 1) {
						cachedColsCounts[i + j] += colSpan;
					} else {
						cachedColsCounts[i + j] += 1;
					}
				}
			}

			cachedColsCounts[i] += colsCount;

			if (cachedColsCounts[i] > maxColsCount) {
				maxColsCount = cachedColsCounts[i];
			}
		}

		for (i = 0; i < rowsNum; i++) {
			colsCountDiff = maxColsCount - cachedColsCounts[i];
			if (colsCountDiff > 0) {
				// Create as many td's as we need to complete the row
				jQuery(rows[i]).append(
					(new Array(colsCountDiff + 1)).join('<td></td>')
				);
			}
		}
	}

	/**
	 * If all of the selected cells have been set to the same predefined style,
	 * then its style-button is toggled on. Otherwise, all style-buttons are toggled off.
	 *
	 * @param selectedCells the cells to be checked
	 * @param config the list of styles as defined in the aloha-configuration
	 * @param items the multisplit-toggle-items
	 * @param button a multisplit-button
	 *
	 * @return void
	 */
	function setActiveStyle(selectedCells, config, items, button) {
		var className;
		var allSelected = false;

		// activate all formatting buttons
		for (var i = 0; i < items.length; i++) {
			button.showItem(items[i].name);
		}

		// clear active style block
		button.setActiveItem();

		// select class of first element as reference
		for (var i = 0; i < config.length; i++) {
			if (jQuery(selectedCells[0]).hasClass(config[i].cssClass)) {
				allSelected = true;
				className = config[i].name;
				break;
			}
		}

		// if all selected cells have the same class, set it as active
		jQuery(selectedCells).each(function (index) {
			if (!jQuery(this).hasClass(className)) {
				allSelected = false;
			}
		});
		if (allSelected) {
			button.setActiveItem(className);
		}
	}

	/**
	 * Transforms the existing dom-table into an editable aloha-table. In fact it
	 * replaces the td-elements with equivalent TableCell-elements
	 * with attached events.
	 * Furthermore it creates wrapping divs to realize a click-area for row- and
	 * column selection and also attaches events.
	 *
	 * @return void
	 */
	Table.prototype.activate = function () {
		if (this.isActive) {
			return;
		}

		var that = this,
			htmlTableWrapper,
			tableWrapper, eventContainer, range = new Aloha.Selection.SelectionRange(true);

		// check whether the current selection is in this table
		if (jQuery(range.startContainer).closest('table').is(this.obj)
			|| jQuery(range.endContainer).closest('table').is(
				this.obj)) {
			// if the startContainer or endContainer are a tr, we move into the next td
			if (range.startContainer
				&& range.startContainer.nodeType === 1
				&& range.startContainer.nodeName.toLowerCase() === 'tr') {
				if (range.startOffset < range.startContainer.childNodes.length) {
					range.startContainer = range.startContainer.childNodes[range.startOffset];
					range.startOffset = 0;
				}
			}
			if (range.endContainer
				&& range.endContainer.nodeType === 1
				&& range.endContainer.nodeName.toLowerCase() === 'tr') {
				if (range.endOffset < range.endContainer.childNodes.length) {
					range.endContainer = range.endContainer.childNodes[range.endOffset];
					range.endOffset = 0;
				}
			}
		} else {
			range = null;
		}

		// alter the table attributes
		this.obj.addClass(this.get('className'));
		this.obj.contentEditable(false);

		// set an id to the table if not already set
		if (this.obj.attr('id') === '') {
			this.obj.attr('id', GENTICS.Utils.guid());
		}

		// unset the selection type
		this.selection.selectionType = undefined;

		// the eventContainer will be the tbody (if there is one), or the table (if no tbody exists)
		eventContainer = this.obj.children('tbody');
		if (eventContainer.length === 0) {
			eventContainer = this.obj;
		}

		eventContainer.on('keydown', function (jqEvent) {
			if (!jqEvent.ctrlKey && !jqEvent.shiftKey) {
				if (that.selection.selectedCells.length > 0 &&
					that.selection.selectedCells[0].length > 0) {
					that.selection.selectedCells[0][0].firstChild.focus();
				}
			}
		});

		this.obj.on('keydown', function (jqEvent) {
			// Delete button
			if (jqEvent.keyCode === 46) {
				if (that.selection.selectionType === 'row') {
					that.deleteRows();
				} else if (that.selection.selectionType === 'column') {
					that.deleteColumns();
				} else {
					return;
				}

				// jqEvent.stopPropagation doesn't support cancelBubble
				// in the last jQuery versions. (query/jquery@97fa97f#diff-031bb62d959e7e4949d1847c82507f33L676)
				if (typeof jqEvent.stopPropagation === 'function') {
					jqEvent.stopPropagation();
				} else {
					// Workaround for IE
					jqEvent.cancelBubble = true;
				}
			}
		});

		this.tablePlugin._tableCaptionButton.setActive(this.obj.children('caption').is('caption'));
		this.tablePlugin._tableCellsMergeButton.disable();
		this.tablePlugin._tableCellsSplitButton.disable();

		// handle column/row resize
		eventContainer.on('mousemove', 'th, td', function (e) {

			var jqObj = jQuery(this);
			// offset to be used for activating the resize cursor near a table border
			var mouseOffset = 3;

			// filter out the control cells
			if (jQuery(this).hasClass('aloha-table-selectrow') || jQuery(this).closest('tr').hasClass('aloha-table-selectcolumn'))
				return;

			var closeToLeftBorder = function (cell) {
				return ((e.pageX - cell.offset().left) < mouseOffset);
			};

			var closeToTopBorder = function (cell) {
				return ((e.pageY - cell.offset().top) < mouseOffset);
			};

			var closeToTableBottom = function (cell) {
				var row = cell.closest('tr');
				// check if it's the last row
				if (row.next('tr').length > 0) {
					return false;
				}

				var cursorOffset = e.pageY - (row.offset().top + row.outerHeight());
				return cursorOffset > (mouseOffset * -1) && cursorOffset < mouseOffset;
			};

			var colResize = that.tablePlugin.colResize;
			var rowResize = that.tablePlugin.rowResize;

			if (colResize && closeToLeftBorder(jqObj)) {
				jqObj.css('cursor', 'col-resize');
				return that.attachColumnResize(jqObj);
			} else if (rowResize && closeToTopBorder(jqObj)) {
				jqObj.css('cursor', 'row-resize');
				return that.attachRowResize(jqObj);
			} else if (rowResize && closeToTableBottom(jqObj)) {
				jqObj.css('cursor', 'row-resize');
				return that.attachRowResize(jqObj, true);
			} else {
				jqObj.css('cursor', 'default');
				return that.detachRowColResize(jqObj);
			}
		});

		eventContainer.on('mousemove', function (e) {

			var jqObj = jQuery(this).closest('table');

			var isTableRightBorder = function (table) {
				var cursorOffset = e.pageX - (table.offset().left + table.outerWidth());
				return cursorOffset > -5 && cursorOffset < 5;
			};

			var tableResize = that.tablePlugin.tableResize;

			if (tableResize && isTableRightBorder(jqObj)) {
				return that.attachTableResizeWidth(jqObj);
			}

		});

		eventContainer.on('mousedown', function (jqEvent) {
			// focus the table if not already done
			if (!that.hasFocus) {
				that.focus();
			}

			// DEACTIVATED by Haymo prevents selecting rows
			//		// if a mousedown is done on the table, just focus the first cell of the table
			//		setTimeout(function() {
			//			var firstCell = that.obj.find('tr:nth-child(2) td:nth-child(2)').children('div[contenteditable=true]').get(0);
			//			TableSelection.unselectCells();
			//			jQuery(firstCell).get(0).focus();
			//			// move focus in first cell
			//			that.obj.cells[0].wrapper.get(0).focus();
			//		}, 0);

			// stop bubbling and default-behaviour
			jqEvent.stopPropagation();
			jqEvent.preventDefault();
			return false;
		});

		// ### create a wrapper for the table (@see HINT below)
		// wrapping div for the table to suppress the display of the resize-controls of
		// the editable divs within the cells
		// tha data-block-skip-scope attribute will keep the block plugin from setting the
		// FloatingMenu's scope when the block is clicked
		tableWrapper = jQuery(
			'<div class="' + this.get('classTableWrapper') + ' aloha-block-collection" data-block-skip-scope="true"></div>'
		);
		tableWrapper.contentEditable(false);

		// mark the wrapper as ephemeral
		Ephemera.markWrapper(tableWrapper);

		// wrap the tableWrapper around the table
		this.wrappedObj.wrap(tableWrapper);

		// :HINT The outest div (Editable) of the table is still in an editable
		// div. So IE will surround the the wrapper div with a resize-border
		// Workaround => just disable the handles so hopefully won't happen any ugly stuff.
		// Disable resize and selection of the controls (only IE)
		// Events only can be set to elements which are loaded from the DOM (if they
		// were created dynamically before) ;)

		htmlTableWrapper = this.obj.parents('.' + this.get('classTableWrapper'));
		htmlTableWrapperElem = this.obj.parents('.' + this.get('classTableWrapper')).get(0);
		htmlTableWrapperElem.onresizestart = function (e) { return false; };
		htmlTableWrapperElem.oncontrolselect = function (e) { return false; };
		htmlTableWrapperElem.ondragstart = function (e) { return false; };
		htmlTableWrapperElem.onmovestart = function (e) { return false; };
		// the following handler prevents proper selection in the editable div in the caption!
		// htmlTableWrapperElem.onselectstart = function ( e ) { return false; };

		jQuery(this.cells).each(function () {
			this.activate();
		});

		// Check because the aloha block plugin may not be loaded
		// This is done, after the cells were made contenteditable, so that while initialization of the block,
		// contenteditable anchors do not get the attribute 'draggable' set to 'false' (in order to prevent browser drag'n'drop)
		// because this would make the anchors unclickable in IE
		if (htmlTableWrapper.alohaBlock) {
			htmlTableWrapper.alohaBlock();
		}

		// after the cells where replaced with contentEditables ... add selection cells
		// first add the additional columns on the left side
		this.attachSelectionColumn();
		// then add the additional row at the top
		this.attachSelectionRow();
		this.makeCaptionEditable();
		this.tablePlugin.updateSummaryButton();
		this.isActive = true;

		// when we stored the range, it was in the current table,
		// so we need to re-select (because we changed the DOM structure around the table)
		if (range) {
			// check whether the startContainer and/or endContainer are one of the table's cells.
			// if yes, replace the container with the editable wrapper
			jQuery(this.cells).each(function () {
				if (this.obj.is(range.startContainer)) {
					if (this.wrapper.contents().length === 0) {
						this.wrapper.html('&nbsp;');
					}
					range.startContainer = this.wrapper.contents().get(0);
					range.startOffset = 0;
				}
				if (this.obj.is(range.endContainer)) {
					if (this.wrapper.contents().length === 0) {
						this.wrapper.html('&nbsp;');
					}
					range.endContainer = this.wrapper.contents().get(0);
					range.endOffset = 0;
				}
			});
			this.focus();
			window.setTimeout(function () {
				range.select();
			}, 1);
		}

		Aloha.trigger('aloha-table-activated');
	};

	/**
	 * Make the table caption editable (if present)
	 */
	Table.prototype.makeCaptionEditable = function () {
		var caption = this.obj.find('caption').eq(0);
		if (caption) {
			this.tablePlugin.makeCaptionEditable(caption);
		}
	};

	/**
	 * Check the WAI conformity of the table
	 *
	 * @returns {boolean} True is WAI is valid
	 */
	Table.prototype.checkWai = function () {
		if (this.obj[0] == null || typeof this.obj[0].summary !== 'string') {
			return false;
		}

		return this.obj[0].summary.trim() !== '';
	};

	/**
	 * Add the selection-column to the left side of the table and attach the events
	 * for selection rows
	 *
	 * @return void
	 */
	Table.prototype.attachSelectionColumn = function () {
		// create an empty cell
		var emptyCell = jQuery('<td>'),
			rowIndex, columnToInsert, rowObj, that = this, rows, i;

		// set the unicode '&nbsp;' code
		emptyCell.html('\u00a0');

		that = this;
		rows = this.obj[0].rows;

		// add a column before each first cell of each row
		for (i = 0; i < rows.length; i++) {
			rowObj = jQuery(rows[i]);
			columnToInsert = emptyCell.clone();
			columnToInsert.addClass(this.get('classSelectionColumn'));
			columnToInsert.css('width', this.get('selectionArea') + 'px');
			//rowObj.find('td:first').before(columnToInsert);
			rowObj.prepend(columnToInsert);
			// rowIndex + 1 because an addtional row is still added
			rowIndex = i + 1;

			// this method sets the selection-events to the cell
			this.attachRowSelectionEventsToCell(columnToInsert);
		}
	};

	/**
	 * Binds the needed selection-mouse events to the given cell
	 *
	 * @param cell
	 *            The jquery object of the table-data field
	 * @return void
	 */
	Table.prototype.attachRowSelectionEventsToCell = function (cell) {
		var that = this;

		// mark cell as ephemeral
		Ephemera.markElement(cell);

		// unbind eventually existing events of this cell
		cell.unbind('mousedown');
		cell.unbind('mouseover');

		// prevent ie from selecting the contents of the table
		cell.get(0).onselectstart = function () { return false; };

		cell.on('mousedown', function (e) {
			// set flag that the mouse is pressed
			//TODO to implement the mousedown-select effect not only must the
			//mousedown be set here but also be unset when the mouse button is
			//released.
			//			that.mousedown = true;
			return that.rowSelectionMouseDown(e);
		});

		cell.on('mouseover', function (e) {
			// only select more crows if the mouse is pressed
			if (that.mousedown) {
				return that.rowSelectionMouseOver(e);
			}
		});
	};

	/**
	 * Mouse-Down event for the selection-cells on the left side of the table
	 *
	 * @param jqEvent
	 *            the jquery-event object
	 * @return void
	 */
	Table.prototype.rowSelectionMouseDown = function (jqEvent) {
		// focus the table (if not already done)
		this.focus();

		// if no cells are selected, reset the selection-array
		if (this.selection.selectedCells.length === 0) {
			this.rowsToSelect = [];
		}

		// set the origin-rowId of the mouse-click
		this.clickedRowId = jqEvent.currentTarget.parentNode.rowIndex;

		// set single column selection
		if (jqEvent.metaKey) {
			var arrayIndex = jQuery.inArray(this.clickedRowId, this.rowsToSelect);
			if (arrayIndex >= 0) {
				this.rowsToSelect.splice(arrayIndex, 1);
			} else {
				this.rowsToSelect.push(this.clickedRowId);
			}
			// block of columns selection
		} else if (jqEvent.shiftKey) {
			this.rowsToSelect.sort(function (a, b) { return a - b; });
			var start = this.rowsToSelect[0];
			var end = this.clickedRowId;
			if (start > end) {
				start = end;
				end = this.rowsToSelect[0];
			}
			this.rowsToSelect = [];
			for (var i = start; i <= end; i++) {
				this.rowsToSelect.push(i);
			}
			// single column
		} else {
			this.rowsToSelect = [this.clickedRowId];
		}

		// mark the selection visual
		this.selectRows();

		// prevent browser from selecting the table
		jqEvent.preventDefault();

		// stop bubble, otherwise the mousedown of the table is called ...
		jqEvent.stopPropagation();

		// prevent ff/chrome/safare from selecting the contents of the table
		return false;
	};

	/**
	 * The mouse-over event for the selection-cells on the left side of the table.
	 * On mouse-over check which column was clicked, calculate the span between
	 * clicked and mouse-overed cell and mark them as selected
	 *
	 * @param jqEvent
	 *            the jquery-event object
	 * @return void
	 */
	Table.prototype.rowSelectionMouseOver = function (jqEvent) {
		var rowIndex = jqEvent.currentTarget.parentNode.rowIndex,
			indexInArray, start, end, i;

		// only select the row if the mouse was clicked and the clickedRowId isn't
		// from the selection-row (row-id = 0)
		if (this.mousedown && this.clickedRowId >= 0) {

			// select first cell
			//var firstCell = this.obj.find('tr:nth-child(2) td:nth-child(2)').children('div[contenteditable=true]').get(0);
			//jQuery(firstCell).get(0).focus();

			indexInArray = jQuery.inArray(rowIndex, this.rowsToSelect);

			start = (rowIndex < this.clickedRowId) ? rowIndex : this.clickedRowId;
			end = (rowIndex < this.clickedRowId) ? this.clickedRowId : rowIndex;

			this.rowsToSelect = [];
			for (i = start; i <= end; i++) {
				this.rowsToSelect.push(i);
			}

			// this actually selects the rows
			this.selectRows();

			// prevent browser from selecting the table
			jqEvent.preventDefault();

			// stop bubble, otherwise the mousedown of the table is called ...
			jqEvent.stopPropagation();

			// prevent ff/chrome/safare from selecting the contents of the table
			return false;
		}
	};

	/**
	 * Binds the needed selection-mouse events to the given cell
	 *
	 * @param cell
	 *            The jquery object of the table-data field
	 * @return void
	 */
	Table.prototype.attachSelectionRow = function () {
		var that = this;

		// create an empty td
		var emptyCell = jQuery('<td>');
		emptyCell.html('\u00a0');

		// get the number of columns in the table (first row)
		// iterate through all rows and find the maximum number of columns to add
		var numColumns = 0;
		for (var i = 0; i < this.obj[0].rows.length; i++) {
			var curNumColumns = 0;

			for (var j = 0; j < this.obj[0].rows[i].cells.length; j++) {
				var colspan = Utils.colspan(this.obj[0].rows[i].cells[j]);
				curNumColumns += colspan;
			}

			if (numColumns < curNumColumns) {
				numColumns = curNumColumns;
			}
		}

		var selectionRow = jQuery('<tr>');
		selectionRow.addClass(this.get('classSelectionRow'));
		selectionRow.css('height', this.get('selectionArea') + 'px');

		// mark selection row as ephemeral
		Ephemera.markElement(selectionRow);

		for (var i = 0; i < numColumns; i++) {

			var columnToInsert = emptyCell.clone();
			// the first cell should have no function, so only attach the events for
			// the rest
			if (i > 0) {
				// bind all mouse-events to the cell
				this.attachColumnSelectEventsToCell(columnToInsert);
				//set the colspan of selection column to match the colspan of first row columns
			} else {
				columnToInsert = jQuery('<td>').clone();
				columnToInsert.addClass(this.get('classLeftUpperCorner'));
				var clickHandler = function (e) {
					// select the Table
					that.focus();
					that.selection.selectAll();

					// set the selection type before updating the scope
					that.tablePlugin.activeTable.selection.selectionType = 'cell';
					that.tablePlugin.updateFloatingMenuScope();

					// As side-effect of the following call the focus
					// will be set on the first selected cell.
					// This will be overwritten with the summary
					// attribute-field, if the setting summaryinsidebar
					// is false.
					that._removeCursorSelection();

					return false;
				};
				this._topLeftCornerCell$ = jQuery('<div/>').css("width", 25 + "px").css("height", 12 + "px").click(clickHandler);
				columnToInsert.append(this._topLeftCornerCell$);
			}

			// add the cell to the row
			selectionRow.append(columnToInsert);
		}

		// global mouseup event to reset the selection properties
		jQuery(document).on('mouseup', function (e) { that.columnSelectionMouseUp(e) });

		this.obj.find('tr:first').before(selectionRow);
	};

	/**
	 * Binds the events for the column selection to the given cell.
	 *
	 * @param cell
	 *            the jquery object of the td-field
	 * @return void
	 */
	Table.prototype.attachColumnSelectEventsToCell = function (cell) {
		var that = this;

		// unbind eventually existing events of this cell
		cell.unbind('mousedown');
		cell.unbind('mouseover');

		// prevent ie from selecting the contents of the table
		cell.get(0).onselectstart = function () { return false; };

		cell.on('mousedown', function (e) { that.columnSelectionMouseDown(e) });
		cell.on('mouseover', function (e) { that.columnSelectionMouseOver(e) });
	};

	/**
	 * Handles the mouse-down event for the selection-cells on the top of the
	 * menu
	 *
	 * @param {jQuery:Event} jqEvent - the jquery-event object
	 * @return void
	 */
	Table.prototype.columnSelectionMouseDown = function (jqEvent) {
		// focus the table (if not already done)
		this.focus();

		// if no cells are selected, reset the selection-array
		if (this.selection.selectedCells.length === 0) {
			this.columnsToSelect = [];
		}

		// set the origin-columnId of the mouse-click
		this.clickedColumnId = jQuery(jqEvent.currentTarget.parentNode)
			.children().index(jqEvent.currentTarget);

		// set single column selection
		if (jqEvent.metaKey) {
			var arrayIndex = jQuery.inArray(this.clickedColumnId, this.columnsToSelect);
			if (arrayIndex >= 0) {
				this.columnsToSelect.splice(arrayIndex, 1);
			} else {
				this.columnsToSelect.push(this.clickedColumnId);
			}
			// block of columns selection
		} else if (jqEvent.shiftKey) {
			this.columnsToSelect.sort(function (a, b) { return a - b; });
			var start = this.columnsToSelect[0];
			var end = this.clickedColumnId;
			if (start > end) {
				start = end;
				end = this.columnsToSelect[0];
			}
			this.columnsToSelect = [];
			for (var i = start; i <= end; i++) {
				this.columnsToSelect.push(i);
			}
			// single column
		} else {
			this.columnsToSelect = [this.clickedColumnId];
		}

		// mark the selection visual
		this.selectColumns();

		// prevent browser from selecting the table
		jqEvent.preventDefault();

		// stop bubble, otherwise the mousedown of the table is called ...
		jqEvent.stopPropagation();

		// prevent ff/chrome/safare from selecting the contents of the table
		return false;
	};

	/**
	 * Mouseover-event for the column-selection cell. This method calcluates the
	 * span between the clicked column and the mouse-overed cell and selects the
	 * columns inbetween. and mark them as selected
	 *
	 * @param jqEvent
	 *            the jquery-event object
	 * @return void
	 */
	Table.prototype.columnSelectionMouseOver = function (jqEvent) {

		var
			colIdx = jqEvent.currentTarget.cellIndex,
			columnsToSelect = [],
			start,
			end;

		// select all columns from the last clicked to the hoverd
		if (this.mouseDownColIdx) {
			start = (colIdx < this.mouseDownColIdx) ? colIdx : this.mouseDownColIdx;
			end = (colIdx < this.mouseDownColIdx) ? this.mouseDownColIdx : colIdx;
			for (var i = start; i <= end; i++) {
				columnsToSelect.push(i);
			}
			this.selectColumns(columnsToSelect);
		}
	};

	/**
	 * MouseUp-event for the column-selection. This method resets the
	 * selection mode
	 *
	 * @param jqEvent
	 *            the jquery-event object
	 * @return void
	 */
	Table.prototype.columnSelectionMouseUp = function (jqEvent) {
		this.mouseDownColIdx = false;
	};

	/**
	 * Deletes the selected rows. If no row are selected, delete the row, where the
	 * cursor is positioned. If all rows of the table should be deleted, the whole
	 * table is deletet and removed from the tableRegistry.
	 *
	 * @return void
	 */
	Table.prototype.deleteRows = function () {
		var
			rowIDs = [],
			rowsToDelete = {},
			table = this;

		// if a selection was made, delete the selected cells
		if (0 === this.selection.selectedCells.length) {
			return;
		}

		for (var i = 0; i < this.selection.selectedCells.length; i++) {
			rowsToDelete[this.selection.selectedCells[i].parentNode.rowIndex] = true;
		}

		for (var rowId in rowsToDelete) {
			rowIDs.push(rowId);
		}

		// if all rows should be deleted, set a flag to remove the WHOLE table
		var deleteTable = false;
		if (rowIDs.length == this.numRows) {
			deleteTable = true;
		}


		// delete the whole table
		if (deleteTable) {
			var that = this;
			Dialog.confirm({
				title: i18n.t('Table'),
				text: i18n.t('deletetable.confirm'),
				yes: function () {
					that.deleteTable();
				}
			});
		} else {

			rowIDs.sort(function (a, b) { return a - b; });

			// check which cell should be focused after the deletion
			var focusRowId = rowIDs[0];
			if (focusRowId > (this.numRows - rowIDs.length)) {
				focusRowId--;
			}

			// get all rows
			var rows = this.getRows();

			//splits all cells on the rows to be deleted
			jQuery.each(rowIDs, function (unused, rowId) {
				var row = rows[rowId];
				for (var i = 0; i < row.cells.length; i++) {
					Utils.splitCell(row.cells[i], function () {
						return table.newActiveCell().obj;
					});
				}
			});

			//decreases rowspans of cells that span the row to be deleted
			//and removes the row
			var grid = Utils.makeGrid(rows);
			jQuery.each(rowIDs, function (unused, rowId) {
				var row = grid[rowId];
				for (var j = 0; j < row.length;) {
					var cellInfo = row[j];
					var rowspan = Utils.rowspan(cellInfo.cell);
					if (1 < rowspan) {
						jQuery(cellInfo.cell).attr('rowspan', rowspan - 1);
					}
					j += cellInfo.colspan;
				}
				jQuery(rows[rowId]).remove();
			});

			// reduce the attribute storing the number of rows in the table
			this.numRows -= rowIDs.length;

			// IE needs a timeout to work properly
			window.setTimeout(function () {
				var lastCell = jQuery(rows[1].cells[focusRowId + 1]);
				lastCell.focus();
			}, 5);

			// finally unselect the marked cells
			this.selection.unselectCells();
		}

		Aloha.activeEditable.smartContentChange({ type: 'block-change', plugin: 'table-plugin' });
	};

	/**
	 * Deletes the selected columns. If no columns are selected, delete the column, where the
	 * cursor is positioned. If all columns of the table should be deleted, the whole
	 * table is deleted from the dom and removed from the tableRegistry.
	 *
	 * @return void
	 */
	Table.prototype.deleteColumns = function () {
		var
			colIDs = [],
			cellToDelete = [],
			// get all rows to iterate
			rows = this.getRows(),
			that = this,
			changeColspan = [],
			cells,
			cellInfo;

		var grid = Utils.makeGrid(rows);
		var selectColWidth = 1; //width of the select-row column
		var selectedColumnIdxs = this.selection.selectedColumnIdxs;
		// if at least on whole table column was selected using cell selection
		// it should also be possible to delete the column
		// therefore we need to determine which columns are selected using the
		// current rectangle
		if (
			(!selectedColumnIdxs || selectedColumnIdxs.length === 0) &&
			// check if the current rectangle is active
			this.selection.currentRectangle &&
			// check if a whole column is selected
			this.selection.currentRectangle.top === 1 &&
			this.selection.currentRectangle.bottom >= this.numRows &&
			// check if there are really meaningful values in the rectangle
			this.selection.currentRectangle.right > 0 &&
			this.selection.currentRectangle.left > 0
		) {
			selectedColumnIdxs = [];
			for (var l = this.selection.currentRectangle.left; l <= this.selection.currentRectangle.right; l++) {
				selectedColumnIdxs.push(l);
			}
		}

		// if all columns should be deleted, remove the WHOLE table
		// delete the whole table
		if (selectedColumnIdxs.length == grid[0].length - selectColWidth) {
			Dialog.confirm({
				title: i18n.t('Table'),
				text: i18n.t('deletetable.confirm'),
				yes: function () {
					that.deleteTable();
				}
			});

		} else {

			colIDs.sort(function (a, b) { return a - b; });

			//TODO there is a bug that that occurs if a column is
			//selected and deleted, and then a column with a greater
			//x-index is selected and deleted.

			//sorted so we delete from right to left to minimize interfernce of deleted rows

			var gridColumns = selectedColumnIdxs.sort(function (a, b) { return b - a; });
			for (var i = 0; i < gridColumns.length; i++) {
				var gridColumn = gridColumns[i];
				for (var j = 0; j < rows.length; j++) {
					cellInfo = grid[j][gridColumn];
					if (!cellInfo) {
						//TODO this case occurred because of a bug somewhere which should be fixed
						continue;
					}
					if (0 === cellInfo.spannedX) {
						if (1 < cellInfo.colspan) {
							var nCell = this.newActiveCell().obj;
							jQuery(cellInfo.cell).after(nCell);
							nCell.attr('rowspan', cellInfo.rowspan);
							nCell.attr('colspan', cellInfo.colspan - 1);
						}
						jQuery(cellInfo.cell).remove();
					} else {
						jQuery(cellInfo.cell).attr('colspan', cellInfo.colspan - 1);
					}
					//ensures that always 0 === cellInfo.spannedY
					j += cellInfo.rowspan - 1;
				}
				//rebuild the grid to reflect the table structure change
				grid = Utils.makeGrid(rows);
			}

			// reduce the attribute storing the number of rows in the table
			this.numCols -= colIDs.length;

			// IE needs a timeout to work properly
			window.setTimeout(function () {
				var lastCell = jQuery(rows[1].cells[1]);
				lastCell.focus();
			}, 5);

			this.selection.unselectCells();
		}

		Aloha.activeEditable.smartContentChange({ type: 'block-change', plugin: 'table-plugin' });
	};

	/**
	 * Deletes the table from the dom and remove it from the tableRegistry.
	 *
	 * @return void
	 */
	Table.prototype.deleteTable = function () {

		var deleteIndex = -1;
		for (var i = 0; i < this.tablePlugin.TableRegistry.length; i++) {
			if (this.tablePlugin.TableRegistry[i].obj.attr('id') == this.obj.attr('id')) {
				deleteIndex = i;
				break;
			}
		}
		if (deleteIndex >= 0) {
			// before deleting the table, deactivate it
			this.deactivate();

			this.selection.selectionType = undefined;
			this.tablePlugin.TableRegistry.splice(i, 1);

			// we will set the cursor right before the removed table
			var newRange = Aloha.Selection.rangeObject;
			// TODO set the correct range here (cursor shall be right before the removed table)
			newRange.endContainer = this.wrappedObj.get(0).parentNode;
			newRange.startContainer = newRange.endContainer;

			newRange.endOffset = Dom.getIndexInParent(this.wrappedObj.get(0));
			newRange.startOffset = newRange.endOffset;

			newRange.clearCaches();

			this.wrappedObj.remove();

			var that = this;
			// IE needs a timeout to work properly
			window.setTimeout(function () {
				that.parentEditable.obj.focus();
			}, 5);

			// select the new range
			newRange.correctRange();
			newRange.select();
		}
	};

	/**
	 * @param {string} position
	 *            could be 'after' or 'before'. defines the position where the new
	 *            rows should be inserted
	 */
	function rowIndexFromSelection(position, selection) {

		var newRowIndex = -1;

		// get the index where the new rows should be inserted
		var cellOfInterest = null;
		if ('before' === position) {
			cellOfInterest = selection.selectedCells[0];
		} else if ('after' === position) {
			var offset = selection.selectedCells.length - 1;
			cellOfInterest = selection.selectedCells[offset];
		}

		if (cellOfInterest && cellOfInterest.nodeType == 1) {
			newRowIndex = cellOfInterest.parentNode.rowIndex;
		}

		return newRowIndex;
	}

	/**
	 * Wrapper function for this.addRow to add a row before the active row
	 *
	 * @see Table.prototype.addRow
	 */
	Table.prototype.addRowBeforeSelection = function (highlightNewRows) {
		var newRowIndex = rowIndexFromSelection('before', this.selection);
		if (-1 !== newRowIndex) {
			this.addRow(newRowIndex);
		}
	};

	/**
	 * Wrapper function for this.addRow to add a row after the active row
	 *
	 * @see Table.prototype.addRow
	 */
	Table.prototype.addRowAfterSelection = function () {
		var newRowIndex = rowIndexFromSelection('after', this.selection);
		if (-1 !== newRowIndex) {
			this.addRow(newRowIndex + 1);
		}
	};

	/**
	 * Adds a new row to the table.
	 *
	 * @param {int} rowIndex
	 *        the index at which the new row shall be inserted
	 * @return <HTMLElemenet> last row inserted
	 */
	Table.prototype.addRow = function (newRowIndex) {
		var rowsToInsert = 1;
		var $insertionRow;
		var classSelectionColumn = this.get('classSelectionColumn');

		var $rows = this.obj.children().children('tr');
		for (var j = 0; j < rowsToInsert; j++) {
			$insertionRow = jQuery('<tr>');

			$insertionRow.addClass(this.tablePlugin.defaultRowClass);

			// create the first column, the "select row" column
			var $selectionColumn = jQuery('<td>');
			$selectionColumn.addClass(classSelectionColumn);
			this.attachRowSelectionEventsToCell($selectionColumn);
			$insertionRow.append($selectionColumn);

			var grid = Utils.makeGrid($rows);
			var selectColOffset = 1;
			if (newRowIndex >= grid.length) {
				for (var i = selectColOffset; i < grid[0].length; i++) {
					$insertionRow.append(this.newActiveCell().obj);
				}
			} else {
				var newRow = grid[newRowIndex];
				for (var i = selectColOffset, len = newRow.length; i < len;) {
					var cellInfo = newRow[i];
					if (Utils.containsDomCell(cellInfo)) {
						var colspan = cellInfo.colspan;
						while (colspan--) {
							$insertionRow.append(this.newActiveCell().obj);
						}
					} else {
						jQuery(cellInfo.cell).attr('rowspan', cellInfo.rowspan + 1);
					}
					i += cellInfo.colspan;
				}
			}

			if (newRowIndex >= $rows.length) {
				$rows.eq($rows.length - 1).after($insertionRow);
			} else {
				$rows.eq(newRowIndex).before($insertionRow);
			}
		}

		this.numRows += rowsToInsert;

		Aloha.activeEditable.smartContentChange({ type: 'block-change', plugin: 'table-plugin' });

		return $insertionRow[0];
	};

	/**
	 * Wrapper method to add columns on the right side
	 *
	 * @see Table.addColumns
	 * @return void
	 */
	Table.prototype.addColumnsRight = function () {
		this.addColumns('right');
	};

	/**
	 * Wrapper method to add columns on the left side
	 *
	 * @see Table.addColumns
	 * @return void
	 */
	Table.prototype.addColumnsLeft = function () {
		this.addColumns('left');
	};

	/**
	 * Inserts new columns into the table. Either on the right or left side. If
	 * columns are selected, the amount of selected columns will be inserted on the
	 * 'right' or 'left' side. If no cells are selected, 1 new column will be
	 * inserted before/after the column of the last active cell.
	 * As well all column-selection events must be bound to the firsts row-cell.
	 *
	 * @param position
	 *            could be 'left' or 'right'. defines the position where the new
	 *            columns should be inserted
	 * @return void
	 */
	Table.prototype.addColumns = function (position) {
		var
			that = this,
			emptyCell = jQuery('<td>'),
			rows = this.getRows(),
			cell,
			currentColIdx,
			columnsToSelect = [],
			selectedColumnIdxs = this.selection.selectedColumnIdxs;

		if (0 === selectedColumnIdxs.length) {
			return;
		}

		selectedColumnIdxs.sort(function (a, b) { return a - b; });

		// refuse to insert a column unless a consecutive range has been selected
		if (!Utils.isConsecutive(selectedColumnIdxs)) {
			Dialog.alert({
				title: i18n.t('Table'),
				text: i18n.t('table.addColumns.nonConsecutive')
			});
			return;
		}

		if ('left' === position) {
			currentColIdx = selectedColumnIdxs[0];
			// inserting a row before the selected column indicies moves
			// all selected columns one to the right
			for (var i = 0; i < this.selection.selectedColumnIdxs.length; i++) {
				this.selection.selectedColumnIdxs[i] += 1;
			}
		} else {//"right" == position
			currentColIdx = selectedColumnIdxs[selectedColumnIdxs.length - 1];
		}

		var grid = Utils.makeGrid(rows);

		for (var i = 0; i < rows.length; i++) {
			// prepare the cell to be inserted
			cell = emptyCell.clone();
			cell.html('\u00a0');

			// on first row correct the position of the selected columns
			if (i === 0) {
				// this is the first row, so make a column-selection cell
				this.attachColumnSelectEventsToCell(cell);
			} else {
				// activate the cell for this table
				cellObj = this.newActiveCell(cell.get(0));
				cell = cellObj.obj;
			}

			var leftCell = Utils.leftDomCell(grid, i, currentColIdx);
			if (null === leftCell) {
				jQuery(rows[i]).prepend(cell);
			} else {
				if ('left' === position && Utils.containsDomCell(grid[i][currentColIdx])) {
					jQuery(leftCell).before(cell);
				} else {//right
					jQuery(leftCell).after(cell);
				}
			}

			this.numCols++;
		}

		Aloha.activeEditable.smartContentChange({ type: 'block-change', plugin: 'table-plugin' });
	};

	/**
	 * Helper method to set the focus-attribute of the table to true
	 *
	 * @return void
	 */
	Table.prototype.focus = function () {
		if (!this.hasFocus) {
			if (!this.parentEditable.isActive) {
				this.parentEditable.obj.focus();
			}

			// @iefix
			this.tablePlugin.setFocusedTable(this);

			// select first cell
			// TODO put cursor in first cell without selecting
			//var firstCell = this.obj.find('tr:nth-child(2) td:nth-child(2)').children('div[contenteditable=true]').get(0);
			//jQuery(firstCell).get(0).focus();

		}

		// TODO workaround - fix this. the selection is updated later on by the browser
		// using setTimeout here is hideous, but a simple execution-time call will fail
		// DEACTIVATED by Haymo prevents selecting rows
		//	setTimeout('Aloha.Selection.updateSelection(false, true)', 50);

	};

	/**
	 * Helper method to set the focus-attribute of the table to false
	 *
	 * @return void
	 */
	Table.prototype.focusOut = function () {
		if (this.hasFocus) {
			this.tablePlugin.setFocusedTable(undefined);
			this.selection.selectionType = undefined;
		}
	};

	/**
	 * Undoes the cursor-selection after cells have been selected.  This
	 * is done to be more consistent in the UI - there should either be
	 * a cursor-selection or a cell-selection, but not both.
	 */
	Table.prototype._removeCursorSelection = function () {
		// We can't remove the selection on IE because whenever a
		// row/column is selected, and then another row/column is
		// selected, the browser windows scrolls to the top of the page
		// (som kind of browser bug).

		// This is no problem for IE because IE removes the
		// cursor-selection by itself and shows a frame around the
		// table, with resize handles (the frame seems useless).

		// On other browsers, we can't remove the selection because the
		// floating menu will disappear when one selects a rows/column
		// and types a key (that's the same effect as when one clicks
		// outside the editable).

		//TODO: currently, removing the cursor selection can't be
		//     reliably implemented.
		//if ( ! jQuery.browser.msie ) {
		//    Aloha.getSelection().removeAllRanges();
		//}

		// The following is a workaround for the above because we can't
		// leave the cursor-selection outside of the table, since
		// otherwise the floating menu scope will be incorrect when one
		// CTRL-clicks on the rows or columns.

		var selection = Aloha.getSelection();

		if (!selection ||
			!selection._nativeSelection ||
			selection._nativeSelection._ranges.length === 0) {
			return;
		}

		var range = selection.getRangeAt(0);
		if (null === range.startContainer) {
			return;
		}

		// if the selection is  already in the table, do nothing
		if (0 !== jQuery(range.startContainer).closest('table').length) {
			return;
		}

		// if no cells are selected, do nothing
		if (0 === this.selection.selectedCells.length) {
			return;
		}

		// set the foces to the first selected cell
		var container = TableCell.getContainer(this.selection.selectedCells[0]);
		jQuery(container).focus();
	};

	/**
	 * Marks all cells of the specified column as marked (adds a special class)
	 *
	 * @return void
	 */
	Table.prototype.selectColumns = function (columns) {
		var columnsToSelect;

		if (columns) {
			columnsToSelect = columns;
		} else {
			columnsToSelect = this.columnsToSelect;
		}

		this.selection.selectColumns(columnsToSelect);
		this.tablePlugin._tableSelectionHeaderButton.setActive(this.selection.isHeader());

		// blur all editables within the table
		this.obj.find('div.aloha-ui-table-cell-editable').blur();

		Utils.selectAnchorContents(this.selection.selectedCells);

		this.tablePlugin.activeTable.selection.selectionType = 'column';

		this.selection.notifyCellsSelected();
		this._removeCursorSelection();
	};

	/**
	 * Marks all cells of the specified row as marked (adds a special class)
	 *
	 * @return void
	 */
	Table.prototype.selectRows = function () {

		this.selection.selectRows(this.rowsToSelect);
		this.tablePlugin._tableSelectionHeaderButton.setActive(this.selection.isHeader());

		// blur all editables within the table
		this.obj.find('div.aloha-ui-table-cell-editable').blur();

		Utils.selectAnchorContents(this.selection.selectedCells);

		this.tablePlugin.activeTable.selection.selectionType = 'row';

		this.selection.notifyCellsSelected();
		this._removeCursorSelection();
	};

	/**
	 * Deactivation of a Aloha-table. Clean up ... remove the wrapping div and the
	 * selection-helper divs
	 *
	 * @return void
	 */
	Table.prototype.deactivate = function () {
		// preserve the current selection
		var range = new Aloha.Selection.SelectionRange(true);

		// unblockify the table wrapper
		var parent = this.wrappedObj.parent();
		if (parent.mahaloBlock) {
			parent.mahaloBlock();
		}

		this.obj.removeClass(this.get('className'));
		if (jQuery.trim(this.obj.attr('class')) === '') {
			this.obj.removeAttr('class');
		}
		this.obj.removeAttr('contenteditable');
		//	this.obj.removeAttr('id');

		// unwrap the selectionLeft-div if available
		if (this.wrappedObj.parents('.' + this.get('classTableWrapper')).length) {
			this.wrappedObj.unwrap();
		}

		// remove the selection row
		this.obj.find('tr.' + this.get('classSelectionRow') + ':first').remove();
		// remove the selection column (first column left)
		var that = this;
		jQuery.each(this.obj[0].rows, function () {
			jQuery(this).children('td.' + that.get('classSelectionColumn')).remove();
		});

		// remove the "selection class" from all td and th in the table
		this.obj.find('td, th').removeClass(this.get('classCellSelected'));
		this.obj.find('td, th').removeClass('aloha-table-cell_active');

		// remove cursor-styles
		this.obj.find('td, th').css('cursor', '');

		this.obj.unbind();
		this.obj.children('tbody').unbind();

		// wrap the inner html of the contentEditable div to its outer html
		for (var i = 0; i < this.cells.length; i++) {
			var Cell = this.cells[i];
			Cell.deactivate();
		}

		// remove editable span in caption (if any)
		this.obj.find('caption div').each(function () {
			jQuery(this).contents().unwrap();
		});

		this.tablePlugin._tableCaptionButton.deactivate();
		this.tablePlugin._tableSelectionHeaderButton.deactivate();

		// better unset ;-) otherwise activate() may think you're activated.
		this.isActive = false;

		// select the selection, because the dom around the selection might have changed (e.g. when an editable in the table was clicked)
		if (typeof range.startContainer !== 'undefined' && typeof range.endContainer !== 'undefined') {
			range.select();
		}
	};

	/**
	 * Attach the event for column resize for the given cell.
	 * @param {DOMElement} tableCell
	 *
	 * @return void
	 */
	Table.prototype.attachColumnResize = function (cell) {

		var that = this;

		//unbind any exisiting resize event handlers
		that.detachRowColResize(cell);

		var rows = cell.closest('tbody').children('tr');
		var cellRow = cell.closest('tr');
		var gridId = Utils.cellIndexToGridColumn(rows,
			rows.index(cellRow),
			cellRow.children().index(cell)
		);

		var resizeColumns = function (pixelsMoved) {
			var expandToWidth, reduceToWidth;

			Utils.walkCells(rows, function (ri, ci, gridCi, colspan, rowspan) {
				var currentCell = jQuery(jQuery(rows[ri]).children()[ci]);

				// skip the select & cells with colspans
				if (currentCell.hasClass('aloha-table-selectrow') || currentCell.closest('tr').hasClass('aloha-table-selectcolumn') || colspan > 1) {
					return true;
				}

				if (gridCi === gridId) {
					if (!reduceToWidth) {
						reduceToWidth = currentCell.width() - pixelsMoved;
					}

					Utils.resizeCellWidth(currentCell, reduceToWidth);

				} else if (gridCi === gridId - 1) {
					if (!expandToWidth) {
						expandToWidth = currentCell.width() + pixelsMoved;
					}

					Utils.resizeCellWidth(currentCell, expandToWidth);

				}

				return true;
			});

			if (that.tablePlugin.colResize == '%') {
				Utils.convertCellWidthToPercent(rows);
			}
		};

		cell.on('mousedown.resize', function ($event) {
			// prevent cell resizing, if mousedown was on a block handle
			if (jQuery($event.target).hasClass('aloha-block-draghandle')) {
				return;
			}

			var $guide = jQuery('<div></div>');
			var isResizing = false;

			Utils.getCellResizeBoundaries(gridId, rows, function (maxPageX, minPageX) {
				isResizing = true;

				// unset the selection type
				that.selection.resizeMode = true;

				// move the guide while dragging
				jQuery('body').on('mousemove.dnd_col_resize', function (e) {
					// limit the maximum resize
					if (e.pageX > minPageX && e.pageX < maxPageX) {
						$guide.css('left', e.pageX);
					}
				});

				// do the actual resizing after drag stops
				jQuery('body').on('mouseup.dnd_col_resize', function (e) {
					var pixelsMoved = 0;

					if (e.pageX < minPageX) {
						pixelsMoved = minPageX - cell.offset().left;
					} else if (e.pageX > minPageX && e.pageX < maxPageX) {
						pixelsMoved = e.pageX - cell.offset().left;
					} else if (e.pageX > maxPageX) {
						pixelsMoved = maxPageX - cell.offset().left;
					}

					if (pixelsMoved !== 0) {
						resizeColumns(pixelsMoved);
					}

					jQuery('body').unbind('mousemove.dnd_col_resize');
					jQuery('body').unbind('mouseup.dnd_col_resize');

					// unset the selection resize mode
					that.selection.resizeMode = false;

					$guide.remove();
				});
			});

			if (!isResizing) {
				return;
			}

			var $cell = jQuery(cell);
			var width = $cell.outerWidth() - $cell.innerWidth();
			var height = $cell.closest('tbody').innerHeight();

			$guide.css({
				'height': (height < 1) ? 1 : height,
				'width': (width < 1) ? 1 : width,
				'top': $cell.closest('tbody').offset().top,
				'left': $cell.offset().left,
				'position': 'absolute',
				'background-color': '#80B5F2'
			}).appendTo('body');
		});

	};

	/**
	 * Attach the event handler for row resize for the given cell.
	 * @param {DOMElement} tableCell
	 *
	 * @return void
	 */
	Table.prototype.attachRowResize = function (cell, lastRow) {

		var that = this;

		//unbind any exisiting resize event handlers
		that.detachRowColResize(cell);

		var resizeRows = function (pixelsMoved) {
			var expandingRow;

			if (lastRow) {
				expandingRow = cell.closest('tr');
			} else {
				expandingRow = cell.closest('tr').prev('tr');
			}

			var currentRowHeight = expandingRow.height();
			var expandToHeight = currentRowHeight + pixelsMoved;

			// correct if the height is a minus value
			if (expandToHeight < 0) {
				expandToHeight = 1;
			}

			expandingRow.css('height', expandToHeight);
		};

		cell.on('mousedown.resize', function ($event) {
			// prevent cell selection, if mousedown was on a block handle
			if (jQuery($event.target).hasClass('aloha-block-draghandle')) {
				return;
			}

			// create a guide
			var guide = jQuery('<div></div>');

			var guideTop = function () {
				if (lastRow) {
					return cell.offset().top + cell.outerHeight();
				} else {
					return cell.offset().top;
				}
			};

			var width = cell.closest('tbody').innerWidth();
			var height = cell.outerHeight() - cell.innerHeight();

			guide.css({
				'width': (width < 1) ? 1 : width,
				'height': (height < 1) ? 1 : height,
				'top': guideTop(),
				'left': cell.closest('tbody').offset().left,
				'position': 'absolute',
				'background-color': '#80B5F2'
			});
			jQuery('body').append(guide);

			// set the minimum resize
			var minHeight = function () {
				if (lastRow) {
					return cell.closest('tr').offset().top;
				} else {
					return cell.closest('tr').prev('tr').offset().top;
				}
			};

			// set the selection resize mode
			that.selection.resizeMode = true;

			// move the guide while dragging
			jQuery('body').on('mousemove.dnd_row_resize', function (e) {
				if (e.pageY > minHeight()) {
					guide.css('top', e.pageY);
				}
			});

			// do the actual resizing after drag stops
			jQuery('body').on('mouseup.dnd_row_resize', function (e) {

				var pixelsMoved = 0;

				if (lastRow) {
					pixelsMoved = e.pageY - (cell.offset().top + cell.outerHeight());
				} else {
					pixelsMoved = e.pageY - cell.offset().top;
				}

				resizeRows(pixelsMoved);

				jQuery('body').unbind('mousemove.dnd_row_resize');
				jQuery('body').unbind('mouseup.dnd_row_resize');

				// unset the selection resize mode
				that.selection.resizeMode = false;

				guide.remove();
			});

		});

	};

	/**
	 * Attach the table width resize event.
	 * @param {DOMElement} table
	 *
	 * @return void
	 */
	Table.prototype.attachTableResizeWidth = function (table) {

		var that = this;
		var tableContainer = table.closest('.aloha-table-wrapper');
		var trSelector = "tr:not(.aloha-table-selectcolumn)";
		var lastColumn = table.find(trSelector + " th:last-child, " +
			trSelector + " td:last-child");
		var lastCell;

		jQuery.each(lastColumn, function () {
			// don't use colspanned cell as the base cell
			if (!jQuery(this).attr('colspan') || jQuery(this).attr('colspan') < 2) {
				lastCell = jQuery(this);
				return false;
			}
		});

		// change the cursor
		lastColumn.css('cursor', 'col-resize');

		var resizeColumns = function (pixelsMoved) {
			var rows = table.find('tr');
			var lastCellRow = lastCell.closest('tr');
			var gridId = Utils.cellIndexToGridColumn(
				rows,
				rows.index(lastCellRow),
				lastCellRow.children().index(lastCell)
			);
			var expandToWidth = pixelsMoved - Utils.getCellBorder(lastCell) - Utils.getCellPadding(lastCell),
				cellChanges = [],
				gridCellWidthBefore = 0,
				tableWidthBefore = table.width();

			Utils.walkCells(rows, function (ri, ci, gridCi, colspan, rowspan) {
				var currentCell = jQuery(jQuery(rows[ri]).children()[ci]);

				// skip the select cells and cells with colspans
				if (currentCell.hasClass('aloha-table-selectrow') || currentCell.closest('tr').hasClass('aloha-table-selectcolumn') || colspan > 1) {
					return true;
				}

				// we keep a list of changes an apply them in a second run
				// in order to not change the values we are calculating with during the process
				if (gridCi === gridId) {
					gridCellWidthBefore = currentCell.width();
					cellChanges.push({ cell: currentCell, width: expandToWidth });
				} else {
					cellChanges.push({ cell: currentCell, width: currentCell.width() });
				}
				return true;
			});

			// now we apply the changes to the table cells
			jQuery.each(cellChanges, function (index, item) {
				Utils.resizeCellWidth(item.cell, item.width);
			});

			// set the width on the table to ensure that the table actually shrinks
			// and that we can use percent values on the columns
			table.css('width', (tableWidthBefore + (expandToWidth - gridCellWidthBefore)) + 'px');

			if (that.tablePlugin.colResize == '%') {
				Utils.convertCellWidthToPercent(rows);
			}
		};

		lastColumn.on('mousedown.resize', function () {

			// create a guide
			var guide = jQuery('<div></div>');

			var height = table.children('tbody').innerHeight();
			var width = lastCell.outerWidth() - lastCell.innerWidth();

			guide.css({
				'height': (height < 1) ? 1 : height,
				'width': (width < 1) ? 1 : width,
				'top': table.find('tbody').offset().top,
				'left': table.offset().left + table.outerWidth(),
				'position': 'absolute',
				'background-color': '#80B5F2'
			});
			jQuery('body').append(guide);

			// set the maximum and minimum resize
			var maxPageX = tableContainer.offset().left + tableContainer.width();
			var minPageX = lastCell.offset().left + (lastCell.innerWidth() - lastCell.width()) + Utils.getMinColWidth(lastCell);

			// unset the selection type
			that.selection.resizeMode = true;

			// move the guide while dragging
			jQuery('body').on('mousemove.dnd_col_resize', function (e) {
				// limit the maximum resize
				if (e.pageX > minPageX && e.pageX < maxPageX) {
					guide.css('left', e.pageX);
				}
			});

			// do the actual resizing after drag stops
			jQuery('body').on('mouseup.dnd_col_resize', function (e) {
				var pixelsMoved = 0;

				if (e.pageX <= minPageX) {
					pixelsMoved = minPageX - lastCell.offset().left;
				} else if (e.pageX > minPageX && e.pageX < maxPageX) {
					pixelsMoved = e.pageX - lastCell.offset().left;
				} else if (e.pageX > maxPageX) {
					pixelsMoved = maxPageX - lastCell.offset().left;
				}
				// set the table width
				resizeColumns(pixelsMoved);

				// unbind the events and reset the cursor
				jQuery('body').unbind('mousemove.dnd_col_resize');
				jQuery('body').unbind('mouseup.dnd_col_resize');
				lastColumn.unbind('mousedown.resize');
				lastColumn.css('cursor', 'default');

				// unset the selection resize mode
				that.selection.resizeMode = false;

				guide.remove();
			});

		});

	};

	/**
	 * Detach any column/row resize event handlers attached to the cell.
	 * @param {DOMElement} tableCell
	 *
	 * @return void
	 */
	Table.prototype.detachRowColResize = function (cell) {
		return cell.unbind('mousedown.resize');
	};

	/**
	 * toString-method for Table object
	 *
	 * @return void
	 */
	Table.prototype.toString = function () {
		return 'Table';
	};

	Table.prototype.newCell = function (domElement) {
		return new TableCell(domElement, this);
	};

	Table.prototype.newActiveCell = function (domElement) {
		var cell = new TableCell(domElement, this);
		cell.activate();
		return cell;
	};

	/**
	 * @param {Boolean} filterSelectionRow filter selection row
	 * @return the rows of the table as an array of DOM nodes
	 */
	Table.prototype.getRows = function (filterSelectionRow) {
		//W3C DOM property .rows supported by all modern browsers
		var rows = this.obj.get(0).rows;
		//converts the HTMLCollection to a real array
		rows = jQuery.makeArray(rows);
		if (filterSelectionRow) {
			rows = rows.filter(function (elt, i, array) {
				return !jQuery(elt).hasClass('aloha-ephemera');
			});
		}
		return rows;
	};

	return Table;
});
