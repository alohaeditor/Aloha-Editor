/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/********************************
  +---------------------------+
  | GENTICS.Aloha.TablePlugin |
  +---------------------------+
 ********************************/
/**
 * Register the TablePlugin as GENTICS.Aloha.Plugin
 */
GENTICS.Aloha.TablePlugin = new GENTICS.Aloha.Plugin('table');


/* -- ATTRIBUTES -- */
/**
 * The Create-Layer Object of the TablePlugin
 *
 * @see GENTICS.Aloha.Table.CreateLayer
 */
GENTICS.Aloha.TablePlugin.createLayer = undefined;

/**
 * Configure the available languages
 */
GENTICS.Aloha.TablePlugin.languages = ['en', 'de', 'fr', 'eo', 'fi', 'ru', 'it', 'pl'];

/**
 * default button configuration
 */
GENTICS.Aloha.TablePlugin.config = [ 'table' ];

/**
 * An Array which holds all newly created tables contains DOM-Nodes of
 * table-objects
 */
GENTICS.Aloha.TablePlugin.TableRegistry = new Array();

/**
 * Holds the active table-object
 */
GENTICS.Aloha.TablePlugin.activeTable = undefined;

/**
 * parameters-objects for tables
 *
 * @param className
 *            The class of activated tables
 */
GENTICS.Aloha.TablePlugin.parameters = {
	className            : 'GENTICS_Aloha_Table',                 // class of editable tables
	classSelectionRow    : 'GENTICS_Aloha_Table_selectColumn',    // class for the upper table-row to select columns
	classSelectionColumn : 'GENTICS_Aloha_Table_selectRow',       // class for the left bound table-cells to select rows
	classLeftUpperCorner : 'GENTICS_Aloha_Table_leftUpperCorner', // class for the left upper corner cell
	classTableWrapper    : 'GENTICS_Aloha_Table_wrapper',         // class of the outest table-wrapping div
	classCellSelected    : 'GENTICS_Aloha_Cell_selected',         // class of cell which are selected (row/column selection)
	waiRed				 : 'GENTICS_WAI_RED',                     // class that shows wai of div
	waiGreen			 : 'GENTICS_WAI_GREEN',                   // class that shows wai of div
	selectionArea        : 10                                     // width/height of the selection rows (in pixel)
};

/* -- END ATTRIBUTES -- */

/* -- METHODS -- */
/**
 * Init method of the Table-plugin transforms all tables in the document
 *
 * @return void
 */
GENTICS.Aloha.TablePlugin.init = function() {
	// add reference to the create layer object
	this.createLayer = new GENTICS.Aloha.Table.CreateLayer();

	var that = this;

	// subscribe for the 'editableActivated' event to activate all tables in the editable
	GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'editableCreated', function(event, editable) {

		// add a mousedown event to all created editables to check if focus leaves a table
		editable.obj.bind('mousedown', function(jqEvent) {
			GENTICS.Aloha.TablePlugin.setFocusedTable(undefined);
		});

		editable.obj.find('table').each(function() {
			// only convert tables which are editable
			if (that.isEditableTable(this)) {

				// instantiate a new table-object
				var table = new GENTICS.Aloha.Table(this);

				table.parentEditable = editable;

				// activate the table
//				table.activate();

				// add the activated table to the TableRegistry
				GENTICS.Aloha.TablePlugin.TableRegistry.push(table);
			}
		});
	});

	// initialize the table buttons
	this.initTableButtons();

	GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'selectionChanged', function(event, rangeObject) {

		if (GENTICS.Aloha.activeEditable) {
			// get Plugin configuration
			var config = that.getEditableConfig( GENTICS.Aloha.activeEditable.obj );

			// show hide buttons regarding configuration and DOM position
			if ( jQuery.inArray('table', config) != -1  && GENTICS.Aloha.Selection.mayInsertTag('table') ) {
				that.createTableButton.show();
			} else {
				that.createTableButton.hide();
			}

			GENTICS.Aloha.TableHelper.unselectCells();

			var table = rangeObject.findMarkup(function() {
		        return this.nodeName.toLowerCase() == 'table';
		    }, GENTICS.Aloha.activeEditable.obj);

			// check wheater we are inside a table
			if ( table ) {
				// set the scope if either columns or rows are selected
				GENTICS.Aloha.FloatingMenu.setScope(that.getUID(GENTICS.Aloha.TableHelper.selectionType));
			} else {
				if ( that.activeTable ) {
					that.activeTable.focusOut();
				}
			}

			// TODO this should not be necessary here!
			GENTICS.Aloha.FloatingMenu.doLayout();
		}
	});

	// subscribe for the 'editableActivated' event to activate all tables in the editable
	GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'editableActivated', function(event, props) {
		props.editable.obj.find('table').each(function() {
			// shortcut for TableRegistry
			var tr = GENTICS.Aloha.TablePlugin.TableRegistry;
			for (var i = 0; i < tr.length; i++){
				if (tr[i].obj.attr('id') == jQuery(this).attr('id')) {
					// activate the table
					tr[i].activate();
					// and continue with the next table tag
					return true;
				}
			}

			// if we come here, we did not find the table in our registry, so we need to create a new one
			// only convert tables which are editable
			if (that.isEditableTable(this)) {

				// instantiate a new table-object
				var table = new GENTICS.Aloha.Table(this);

				table.parentEditable = props.editable;

				// activate the table
				table.activate();

				// add the activated table to the TableRegistry
				GENTICS.Aloha.TablePlugin.TableRegistry.push(table);
			}
		});
	});

	// subscribe for the 'editableDeactivated' event to deactivate all tables in the editable
	GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'editableDeactivated', function(event, properties) {
		GENTICS.Aloha.TablePlugin.setFocusedTable(undefined);
		GENTICS.Aloha.TableHelper.unselectCells();
		// shortcut for TableRegistry
		var tr = GENTICS.Aloha.TablePlugin.TableRegistry;
		for (var i = 0; i < tr.length; i++){
			// activate the table
			tr[i].deactivate();
		}
	});
};

/**
 * test if the table is editable
 * @return boolean true if the table's parent element is contentEditable, false otherwise
 */
GENTICS.Aloha.TablePlugin.isEditableTable = function(table) {
	var parent = jQuery(table.parentNode);
	if (parent.contentEditable() == 'true') {
		return true;
	} else {
		return false;
	}
};

/**
 * initialize the buttons and register them on floating menu
 */
GENTICS.Aloha.TablePlugin.initTableButtons = function () {
	var that = this;

	// generate the new scopes
	GENTICS.Aloha.FloatingMenu.createScope(this.getUID('row'), 'GENTICS.Aloha.global');
	GENTICS.Aloha.FloatingMenu.createScope(this.getUID('column'), 'GENTICS.Aloha.global');
	GENTICS.Aloha.FloatingMenu.createScope(this.getUID('cell'), 'GENTICS.Aloha.continuoustext');

	// the 'create table' button
	this.createTableButton = new GENTICS.Aloha.ui.Button({
		'iconClass' : 'GENTICS_button GENTICS_button_table',
		'size' : 'small',
		'tooltip' : this.i18n('button.createtable.tooltip'),
		'onclick' : function (element, event) {
			GENTICS.Aloha.TablePlugin.createDialog(element.btnEl.dom);
		}
	});

	// add to floating menu
	GENTICS.Aloha.FloatingMenu.addButton(
		'GENTICS.Aloha.continuoustext',
		this.createTableButton,
		GENTICS.Aloha.i18n(GENTICS.Aloha, 'floatingmenu.tab.insert'),
		1
	);

	// now the specific table buttons
	// for columns
	GENTICS.Aloha.FloatingMenu.addButton(
		this.getUID('column'),
		new GENTICS.Aloha.ui.Button({
			'iconClass' : 'GENTICS_button GENTICS_button_addColumnLeft',
			'size' : 'small',
			'tooltip' : this.i18n('button.addcolleft.tooltip'),
			'onclick' : function () {
				if (that.activeTable) {
					that.activeTable.addColumnsLeft();
				}
			}
		}),
		GENTICS.Aloha.i18n(this, 'floatingmenu.tab.table'),
		1
	);
	GENTICS.Aloha.FloatingMenu.addButton(
		this.getUID('column'),
		new GENTICS.Aloha.ui.Button({
			'iconClass' : 'GENTICS_button GENTICS_button_addColumnRight',
			'size' : 'small',
			'tooltip' : this.i18n('button.addcolright.tooltip'),
			'onclick' : function () {
				if (that.activeTable) {
					that.activeTable.addColumnsRight();
				}
			}
		}),
		GENTICS.Aloha.i18n(this, 'floatingmenu.tab.table'),
		1
	);
	GENTICS.Aloha.FloatingMenu.addButton(
		this.getUID('column'),
		new GENTICS.Aloha.ui.Button({
			'iconClass' : 'GENTICS_button GENTICS_button_deleteColumns',
			'size' : 'small',
			'tooltip' : this.i18n('button.delcols.tooltip'),
			'onclick' : function () {
				if (that.activeTable) {
					var aTable = that.activeTable;
					GENTICS.Aloha.showMessage(new GENTICS.Aloha.Message({
						title : GENTICS.Aloha.i18n(that, 'Table'),
						text : GENTICS.Aloha.i18n(that, 'deletecolumns.confirm'),
						type : GENTICS.Aloha.Message.Type.CONFIRM,
						callback : function (sel) {
							if (sel == 'yes') {
								aTable.deleteColumns();
							}
						}
					}));
				}
			}
		}),
		GENTICS.Aloha.i18n(this, 'floatingmenu.tab.table'),
		1
	);

	// for rows
	GENTICS.Aloha.FloatingMenu.addButton(
		this.getUID('row'),
		new GENTICS.Aloha.ui.Button({
			'iconClass' : 'GENTICS_button GENTICS_button_addRowBefore',
			'size' : 'small',
			'tooltip' : this.i18n('button.addrowbefore.tooltip'),
			'onclick' : function () {
				if (that.activeTable) {
					that.activeTable.addRowsBefore(true);
				}
			}
		}),
		GENTICS.Aloha.i18n(this, 'floatingmenu.tab.table'),
		1
	);
	GENTICS.Aloha.FloatingMenu.addButton(
		this.getUID('row'),
		new GENTICS.Aloha.ui.Button({
			'iconClass' : 'GENTICS_button GENTICS_button_addRowAfter',
			'size' : 'small',
			'tooltip' : this.i18n('button.addrowafter.tooltip'),
			'onclick' : function () {
				if (that.activeTable) {
					that.activeTable.addRowsAfter(true);
				}
			}
		}),
		GENTICS.Aloha.i18n(this, 'floatingmenu.tab.table'),
		1
	);
	GENTICS.Aloha.FloatingMenu.addButton(
		this.getUID('row'),
		new GENTICS.Aloha.ui.Button({
			'iconClass' : 'GENTICS_button GENTICS_button_deleteRows',
			'size' : 'small',
			'tooltip' : this.i18n('button.delrows.tooltip'),
			'onclick' : function () {
				if (that.activeTable) {
					var aTable = that.activeTable;
					GENTICS.Aloha.showMessage(new GENTICS.Aloha.Message({
						title : GENTICS.Aloha.i18n(that, 'Table'),
						text : GENTICS.Aloha.i18n(that, 'deleterows.confirm'),
						type : GENTICS.Aloha.Message.Type.CONFIRM,
						callback : function (sel) {
							if (sel == 'yes') {
								aTable.deleteRows();
							}
						}
					}));
				}
			}
		}),
		GENTICS.Aloha.i18n(this, 'floatingmenu.tab.table'),
		1
	);

	this.captionButton = new GENTICS.Aloha.ui.Button({
		'iconClass' : 'GENTICS_button GENTICS_button_table_caption',
		'size' : 'small',
		'tooltip' : this.i18n('button.caption.tooltip'),
        'toggle' : true,
		'onclick' : function () {
			if (that.activeTable) {
				// look if table object has a child caption
				if ( that.activeTable.obj.children("caption").is('caption') ) {
					that.activeTable.obj.children("caption").remove();
					// select first cell of table
				} else {
					var captionText = that.i18n('empty.caption');
					var c = jQuery('<caption></caption>');
					that.activeTable.obj.append(c);
					that.makeCaptionEditable(c, captionText);

					// get the editable span within the caption and select it
					var cDiv = c.find('div').eq(0);
					var captionContent = cDiv.contents().eq(0);
					if (captionContent.length > 0) {
						var newRange = new GENTICS.Utils.RangeObject();
						newRange.startContainer = newRange.endContainer = captionContent.get(0);
						newRange.startOffset = 0;
						newRange.endOffset = captionContent.text().length;

						// blur all editables within the table
						that.activeTable.obj.find('div.GENTICS_Table_Cell_editable').blur();

						cDiv.focus();
						newRange.select();
						GENTICS.Aloha.Selection.updateSelection();
					}
				}
			}
		}
	});
	GENTICS.Aloha.FloatingMenu.addButton(
		this.getUID('cell'),
		this.captionButton,
		GENTICS.Aloha.i18n(this, 'floatingmenu.tab.table'),
		1
	);

	// for cells
    // add summary field
    this.summary = new GENTICS.Aloha.ui.AttributeField({
    	'width':350
    });
    this.summary.addListener('keyup', function(obj, event) {
    	that.activeTable.checkWai();
    });
    GENTICS.Aloha.FloatingMenu.addButton(
        this.getUID('cell'),
        this.summary,
        GENTICS.Aloha.i18n(this, 'floatingmenu.tab.table'),
        1
    );
};

/**
 * Helper method to make the caption editable
 * @param caption caption as jQuery object
 * @param captionText default text for the caption
 */
GENTICS.Aloha.TablePlugin.makeCaptionEditable = function(caption, captionText) {
	var that = this;

	var cSpan = caption.children('div').eq(0);
	if (cSpan.length == 0) {
		// generate a new div
		cSpan = jQuery('<div></div>');
		if (caption.contents().length > 0) {
			// when the caption has content, we wrap it with the new div
			caption.contents().wrap(cSpan);
		} else {
			// caption has no content, so insert the default caption text
			if (captionText) {
				cSpan.text(captionText);
			}
			// and append the div into the caption
			caption.append(cSpan);
		}
	}
	// make the div editable
	cSpan.contentEditable(true);
	cSpan.unbind('mousedown');
	// focus on click
	cSpan.bind('mousedown', function(jqEvent) {
		cSpan.focus();

		// stop bubble, otherwise the mousedown of the table is called ...
		jqEvent.preventDefault();
		jqEvent.stopPropagation();
		return false;
	});
};

/**
 * This function adds the createDialog to the calling element
 *
 * @param callingElement
 *            The element, which was clicked. It's needed to set the right
 *            position to the create-table-dialog.
 */
GENTICS.Aloha.TablePlugin.createDialog = function(callingElement) {
	// set the calling element to the layer the calling element mostly will be
	// the element which was clicked on it is used to position the createLayer
	this.createLayer.set('target', callingElement);

	// show the createLayer
	this.createLayer.show();

};

/**
 * Creates a normal html-table, "activates" this table and inserts it into the
 * active Editable
 *
 * @param cols
 *            number of colums for the created table
 * @param cols
 *            number of rows for the created table
 * @return void
 */
GENTICS.Aloha.TablePlugin.createTable = function(cols, rows) {
	// Check if there is an active Editable and that it contains an element (= .obj)
	if (GENTICS.Aloha.activeEditable != null && typeof GENTICS.Aloha.activeEditable.obj != 'undefined') {
		// create a dom-table object
		var table = document.createElement('table');
		var tableId = table.id = GENTICS.Aloha.TableHelper.getNewTableID();
		var tbody = document.createElement('tbody');

		// create "rows"-number of rows
		for (var i = 0; i < rows; i++) {
			var tr = document.createElement('tr');
			// create "cols"-number of columns
			for (var j = 0; j < cols; j++) {
				var text = document.createTextNode('\u00a0');
				var td = document.createElement('td');
				td.appendChild(text);
				tr.appendChild(td);
			}
			tbody.appendChild(tr);
		}
		table.appendChild(tbody);

		// insert at current cursor position
		GENTICS.Utils.Dom.insertIntoDOM(jQuery(table), GENTICS.Aloha.Selection.getRangeObject(), jQuery(GENTICS.Aloha.activeEditable.obj));

		// if the table is inserted
		var tableReloadedFromDOM = document.getElementById(tableId);

		var tableObj = new GENTICS.Aloha.Table(tableReloadedFromDOM);

		tableObj.parentEditable = GENTICS.Aloha.activeEditable;

		// transform the table to be editable
		tableObj.activate();

		// after creating the table, trigger a click into the first cell to
		// focus the content
		// for IE set a timeout of 10ms to focus the first cell, other wise it
		// won't work
		if (jQuery.browser.msie) {
			window.setTimeout(function() { tableObj.cells[0].wrapper.get(0).focus(); }, 20);
		} else {
			tableObj.cells[0].wrapper.get(0).focus();
		}

		GENTICS.Aloha.TablePlugin.TableRegistry.push(tableObj);

	// no active editable => error
	}else{
		this.error('There is no active Editable where the table can be inserted!');
	}
};

GENTICS.Aloha.TablePlugin.setFocusedTable = function(focusTable) {
	var that = this;
	for (var i = 0; i < GENTICS.Aloha.TablePlugin.TableRegistry.length; i++) {
		GENTICS.Aloha.TablePlugin.TableRegistry[i].hasFocus = false;
	}
	if (typeof focusTable != 'undefined') {
        this.summary.setTargetObject(focusTable.obj, 'summary');
        if ( focusTable.obj.children("caption").is('caption') ) {
        	// set caption button
        	that.captionButton.setPressed(true);
        	var c = focusTable.obj.children("caption");
        	that.makeCaptionEditable(c);
        }
		focusTable.hasFocus = true;
	}
	GENTICS.Aloha.TablePlugin.activeTable = focusTable;
};

/**
 * Calls the GENTICS.Aloha.log function with 'error' level
 *
 * @see GENTICS.Aloha.log
 * @param msg
 *            The message to display
 * @return void
 */
GENTICS.Aloha.TablePlugin.error = function(msg) {
	GENTICS.Aloha.Log.error(this, msg);
};

/**
 * Calls the GENTICS.Aloha.log function with 'debug' level
 *
 * @see GENTICS.Aloha.log
 * @param msg
 *            The message to display
 * @return void
 */
GENTICS.Aloha.TablePlugin.debug = function(msg) {
	GENTICS.Aloha.Log.debug(this, msg);
};

/**
 * Calls the GENTICS.Aloha.log function with 'info' level
 *
 * @see GENTICS.Aloha.log
 * @param msg
 *            The message to display
 * @return void
 */
GENTICS.Aloha.TablePlugin.info = function(msg) {
	GENTICS.Aloha.Log.info(this, msg);
};

/**
 * Calls the GENTICS.Aloha.log function with 'info' level
 *
 * @see GENTICS.Aloha.log
 * @param msg
 *            The message to display
 * @return void
 */
GENTICS.Aloha.TablePlugin.log = function(msg) {
	GENTICS.Aloha.log('log', this, msg);
};

/**
 * The "get"-method returns the value of the given key.
 * First it searches in the config for the property.
 * If there is no property with the given name in the
 * "config"-object it returns the entry associated with
 * in the parameters-object
 *
 * @param property
 * @return void
 *
 */
GENTICS.Aloha.TablePlugin.get = function (property) {
	if (this.config[property]) {
		return this.config[property];
	}
	if (this.parameters[property]) {
		return this.parameters[property];
	}
	return undefined;
};

/**
 * The "set"-method takes a key and a value. It checks if there is a
 * key-value pair in the config-object. If so it saves the data in the
 * config-object. If not it saves the data in the parameters-object.
 *
 * @param key the key which should be set
 * @param value the value which should be set for the associated key
 */
GENTICS.Aloha.TablePlugin.set = function (key, value) {
	if (this.config[key]) {
		this.config[key] = value;
	}else{
		this.parameters[key] = value;
	}
};

/**
 * Make the given jQuery object (representing an editable) clean for saving
 * Find all tables and deactivate them
 * @param obj jQuery object to make clean
 * @return void
 */
GENTICS.Aloha.TablePlugin.makeClean = function (obj) {
	// find all table tags
	obj.find('table').each(function() {
		// instantiate a new table-object
		var table = new GENTICS.Aloha.Table(this);
		// deactivate the table
		table.deactivate();
	});
};

/**
 * String representation of the Table-object
 *
 * @return The plugins namespace (string)
 */
GENTICS.Aloha.TablePlugin.toString = function() {
	return this.prefix;
};
/* -- END METHODS -- */


/**************************
  +---------------------+
  | GENTICS.Aloha.Table |
  +---------------------+
***************************/
/**
 * Constructor of the table object
 *
 * @param table
 *            the dom-representation of the held table
 * @return void
 */
GENTICS.Aloha.Table = function(table) {
	// set the table attribut "obj" as a jquery represenation of the dom-table
	this.obj = jQuery(table);

	if ( !this.obj.attr('id') ) {
		this.obj.attr('id', GENTICS.Utils.guid());
	}

	// find the dimensions of the table
	var rows = this.obj.find("tr");
	var firstRow = jQuery(rows.get(0));
	this.numCols = firstRow.children("td, th").length;
	this.numRows = rows.length;

	// init the cell-attribute with an empty array
	this.cells = new Array();

	// iterate over table cells and create Cell-objects
	var rows = this.obj.find('tr');
	for (var i = 0; i < rows.length; i++) {
		var row = jQuery(rows[i]);
		var cols = row.children();
		for (var j = 0; j < cols.length; j++) {
			var col = cols[j];
			var Cell = new GENTICS.Aloha.Table.Cell(col, this);
			this.cells.push(Cell);
		}
	}
};
/* -- ATTRIBUTES -- */
/**
 * Attribute holding the jQuery-table-represenation
 */
GENTICS.Aloha.Table.prototype.obj = undefined;

/**
 * The DOM-element of the outest div-container wrapped around the cell
 */
GENTICS.Aloha.Table.prototype.tableWrapper = undefined;

/**
 * An array of all Cells contained in the Table
 *
 * @see GENTICS.Aloha.Table.Cell
 */
GENTICS.Aloha.Table.prototype.cells = undefined;

/**
 * Number of rows of the table
 */
GENTICS.Aloha.Table.prototype.numRows = undefined;

/**
 * Number of rows of the table
 */
GENTICS.Aloha.Table.prototype.numCols = undefined;

/**
 * Flag wether the table is active or not
 */
GENTICS.Aloha.Table.prototype.isActive = false;

/**
 * Flag wether the table is focused or not
 */
GENTICS.Aloha.Table.prototype.hasFocus = false;

/**
 * The editable which contains the table
 */
GENTICS.Aloha.Table.prototype.parentEditable = undefined;

/**
 * Flag to check if the mouse was pressed. For row- and column-selection.
 */
GENTICS.Aloha.Table.prototype.mousedown = false;

/**
 * ID of the column which was pressed when selecting columns
 */
GENTICS.Aloha.Table.prototype.clickedColumnId = -1;

/**
 * ID of the row which was pressed when selecting rows
 */
GENTICS.Aloha.Table.prototype.clickedRowId = -1;

/**
 * collection of columnindexes of the columns which should be selected
 */
GENTICS.Aloha.Table.prototype.columnsToSelect = new Array();

/**
 * collection of rowindexes of the rows which should be selected
 */
GENTICS.Aloha.Table.prototype.rowsToSelect = new Array();

/**
 * contains the plugin id used for interaction with the floating menu
 */
GENTICS.Aloha.Table.prototype.fmPluginId = undefined;

/* -- END ATTRIBUTES -- */

/* -- METHODS -- */
/**
 * Wrapper-Mehotd to return a property of GENTICS.Aloha.TablePlugin.get
 *
 * @see GENTICS.Aloha.TablePlugin.get
 * @param property
 *            the property whichs value should be return
 * @return the value associated with the property
 */
GENTICS.Aloha.Table.prototype.get = function(property) {
	return GENTICS.Aloha.TablePlugin.get(property);
};

/**
 * Wrapper-Method for GENTICS.Aloha.TablePlugin.set
 *
 * @see GENTICS.Aloha.TablePlugin.set
 * @param key
 *            the key whichs value should be set
 * @param value
 *            the value for the key
 * @return void
 */
GENTICS.Aloha.Table.prototype.set = function(key, value) {
	GENTICS.Aloha.TablePlugin.set(key, value);
};

/**
 * Transforms the existing dom-table into an editable aloha-table. In fact it
 * replaces the td-elements with equivalent GENTICS.Aloha.Table.Cell-elements
 * with attached events.
 * Furthermore it creates wrapping divs to realize a click-area for row- and
 * column selection and also attaches events.
 *
 * @return void
 */
GENTICS.Aloha.Table.prototype.activate = function() {
	if (this.isActive) {
		return;
	}
	var that = this;

	// alter the table attributes
	this.obj.addClass(this.get('className'));
	this.obj.contentEditable(false);

	// set an id to the table if not already set
	if (this.obj.attr('id') == '') {
		this.obj.attr('id', GENTICS.Aloha.TableHelper.getNewTableID());
	}

	// unset the selection type
	GENTICS.Aloha.TableHelper.selectionType = undefined;

	this.obj.bind('keydown', function(jqEvent){
		if (!jqEvent.ctrlKey && !jqEvent.shiftKey) {
			if (GENTICS.Aloha.TableHelper.selectedCells.length > 0 && GENTICS.Aloha.TableHelper.selectedCells[0].length > 0) {
				GENTICS.Aloha.TableHelper.selectedCells[0][0].firstChild.focus();
			}
		}
	});

	// handle click event of the table
//	this.obj.bind('click', function(e){
//		// stop bubbling the event to the outer divs, a click in the table
//		// should only be handled in the table
//		e.stopPropagation();
//		return false;
//	});

	this.obj.bind('mousedown', function(jqEvent) {
		// focus the table if not already done
		if (!that.hasFocus) {
			that.focus();
		}

// DEACTIVATED by Haymo prevents selecting rows
//		// if a mousedown is done on the table, just focus the first cell of the table
//		setTimeout(function() {
//			var firstCell = that.obj.find('tr:nth-child(2) td:nth-child(2)').children('div[contenteditable=true]').get(0);
//			GENTICS.Aloha.TableHelper.unselectCells();
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
	var tableWrapper = jQuery('<div class="' + this.get('classTableWrapper') + '"></div>');
	tableWrapper.contentEditable(false);

	// wrap the tableWrapper around the table
	this.obj.wrap(tableWrapper);

	// :HINT The outest div (Editable) of the table is still in an editable
	// div. So IE will surround the the wrapper div with a resize-border
	// Workaround => just disable the handles so hopefully won't happen any ugly stuff.
	// Disable resize and selection of the controls (only IE)
	// Events only can be set to elements which are loaded from the DOM (if they
	// were created dynamically before) ;)
	var htmlTableWrapper = this.obj.parents('.' + this.get('classTableWrapper'));
	htmlTableWrapper.get(0).onresizestart   = function(e) { return false; };
	htmlTableWrapper.get(0).oncontrolselect = function(e) { return false; };

	this.tableWrapper     = this.obj.parents('.' + this.get('classTableWrapper')).get(0);

	jQuery(this.cells).each(function () {
		this.activate();
	});

	// after the cells where replaced with contentEditables ... add selection cells
	// first add the additional columns on the left side
	this.attachSelectionColumn();
	// then add the additional row at the top
	this.attachSelectionRow();

	// attach events for the last cell
	this.attachLastCellEvents();

	// make the caption editable

	this.makeCaptionEditable();

	// check WAI status
	this.checkWai();

	// set flag, that the table is activated
	this.isActive = true;

	// throw a new event when the table has been activated
	GENTICS.Aloha.EventRegistry.trigger(
			new GENTICS.Aloha.Event(
					'tableActivated',
					GENTICS.Aloha,
					[ this ]
			)
	);
};

/**
 * Make the table caption editable (if present)
 */
GENTICS.Aloha.Table.prototype.makeCaptionEditable = function() {
	var caption = this.obj.find('caption').eq(0);
	if (caption) {
		GENTICS.Aloha.TablePlugin.makeCaptionEditable(caption);
	}
};

/**
 * check the WAI conformity of the table and sets the attribute.
 */
GENTICS.Aloha.Table.prototype.checkWai = function() {
	var w = this.wai;
	w.removeClass(this.get('waiGreen'));
	w.removeClass(this.get('waiRed'));
	if (this.obj[0].summary.length > 5 ) {
		w.addClass(this.get('waiGreen'));
	} else {
		w.addClass(this.get('waiRed'));
	}
};

/**
 * Add the selection-column to the left side of the table and attach the events
 * for selection rows
 *
 * @return void
 */
GENTICS.Aloha.Table.prototype.attachSelectionColumn = function() {
	// create an empty cell
	var emptyCell = jQuery('<td>');
	// set the unicode '&nbsp;' code
	emptyCell.html('\u00a0');

	var that = this;
	var rows = this.obj.context.rows;
	// add a column before each first cell of each row
	for (var i = 0; i < rows.length; i++) {
		var rowObj = jQuery(rows[i]);
		var columnToInsert = emptyCell.clone();
		columnToInsert.addClass(this.get('classSelectionColumn'));
		columnToInsert.css('width', this.get('selectionArea') + 'px');
		rowObj.find('td:first').before(columnToInsert);

		// rowIndex + 1 because an addtional row is still added
		var rowIndex = i + 1;

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
GENTICS.Aloha.Table.prototype.attachRowSelectionEventsToCell = function(cell){
	var that = this;

	// unbind eventually existing events of this cell
	cell.unbind('mousedown');
	cell.unbind('mouseover');

	// prevent ie from selecting the contents of the table
	cell.get(0).onselectstart = function() { return false; };

	cell.bind('mousedown', function(e){
		// set flag that the mouse is pressed
		that.mousedown = true;
		return that.rowSelectionMouseDown(e);
	});

	cell.bind('mouseover', function(e){
		// only select more crows if the mouse is pressed
		if ( that.mousedown ) {
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
GENTICS.Aloha.Table.prototype.rowSelectionMouseDown = function (jqEvent) {

	// focus the table (if not already done)
	this.focus();

	// if no cells are selected, reset the selection-array
	if (GENTICS.Aloha.TableHelper.selectedCells.length == 0) {
		this.rowsToSelect = new Array();
	}

	// set the origin-rowId of the mouse-click
	this.clickedRowId = jqEvent.currentTarget.parentNode.rowIndex;

	// set single column selection
	if (jqEvent.metaKey) {
		var arrayIndex = jQuery.inArray(this.clickedRowId, this.rowsToSelect);
		if (arrayIndex >= 0) {
			this.rowsToSelect.splice(arrayIndex, 1);
		}else{
			this.rowsToSelect.push(this.clickedRowId);
		}
	// block of colums selection
	} else if (jqEvent.shiftKey) {
		this.rowsToSelect.sort(function(a,b){return a - b;});
		var start = this.rowsToSelect[0];
		var end = this.clickedRowId;
		if (start > end) {
			start = end;
			end = this.rowsToSelect[0];
		}
		this.rowsToSelect = new Array();
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
GENTICS.Aloha.Table.prototype.rowSelectionMouseOver = function (jqEvent) {
	var rowIndex = jqEvent.currentTarget.parentNode.rowIndex;

	// only select the row if the mouse was clicked and the clickedRowId isn't
	// from the selection-row (row-id = 0)
	if (this.mousedown && this.clickedRowId >= 0) {

		// select first cell
//		var firstCell = this.obj.find('tr:nth-child(2) td:nth-child(2)').children('div[contenteditable=true]').get(0);
//		jQuery(firstCell).get(0).focus();

		var indexInArray = jQuery.inArray(rowIndex, this.rowsToSelect);

		var start = (rowIndex < this.clickedRowId) ? rowIndex : this.clickedRowId;
		var end = (rowIndex < this.clickedRowId) ? this.clickedRowId : rowIndex;

		this.rowsToSelect = new Array();
		for (var i = start; i <= end; i++) {
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
GENTICS.Aloha.Table.prototype.attachSelectionRow = function() {
	var that = this;

	// create an empty td
	var emptyCell = jQuery('<td>');
	emptyCell.html('\u00a0');

	// get the number of columns in the table (length of the cells in the first row)
	var numColumns = this.obj.context.rows[0].cells.length;
	var selectionRow = jQuery('<tr>');
	selectionRow.addClass(this.get('classSelectionRow'));
	selectionRow.css('height', this.get('selectionArea') + 'px');
	for (var i = 0; i < numColumns; i++) {

		var columnToInsert = emptyCell.clone();
		// the first cell should have no function, so only attach the events for
		// the rest
		if (i > 0) {
			// bind all mouse-events to the cell
			this.attachColumnSelectEventsToCell(columnToInsert);
		} else {
			var columnToInsert = jQuery('<td>').clone();
			columnToInsert.addClass(this.get('classLeftUpperCorner'));
			this.wai = jQuery('<div/>');
			this.wai.width(25);
			this.wai.height(12);
			this.wai.click( function(e) {

				// select Table
				that.focus();

				// select first cell
//				var firstCell = that.obj.find('tr:nth-child(2) td:nth-child(2)').children('div[contenteditable=true]').get(0);
//				jQuery(firstCell).get(0).focus();

			    GENTICS.Aloha.FloatingMenu.userActivatedTab = GENTICS.Aloha.TablePlugin.i18n('floatingmenu.tab.table');
				GENTICS.Aloha.FloatingMenu.doLayout();

				// jump in Summary field
			    GENTICS.Aloha.TablePlugin.summary.focus();
				e.stopPropagation();
				e.preventDefault();
				return false;
			});
			columnToInsert.append(this.wai);
		}

		// add the cell to the row
		selectionRow.append(columnToInsert);
	}
	// global mouseup event to reset the selection properties
	jQuery(document).bind('mouseup', function(e) {
		that.mousedown = false;
		that.clickedColumnId = -1;
		that.clickedRowId = -1;
	});
	this.obj.find('tr:first').before(selectionRow);
};

/**
 * Binds the events for the column selection to the given cell.
 *
 * @param cell
 *            the jquery object of the td-field
 * @return void
 */
GENTICS.Aloha.Table.prototype.attachColumnSelectEventsToCell = function (cell) {
	var that = this;

	// unbind eventually existing events of this cell
	cell.unbind('mousedown');
	cell.unbind('mouseover');

	// prevent ie from selecting the contents of the table
	cell.get(0).onselectstart = function() { return false; };

	cell.bind('mousedown',  function(e) {
		// set the mousedown flag
		that.mousedown = true;
		that.columnSelectionMouseDown(e);

	});

	cell.bind('mouseover', function (e) {
		// only select more crows if the mouse is pressed
		if ( that.mousedown ) {
			that.columnSelectionMouseOver(e);
		}
	});
};

/**
 * Mouse-down event for a columns-selection cell. It adds the index of the
 * clicked column to the "columnsToSelect"-Array and calls the method which
 * selects the column.
 *
 * @param jqEvent
 *            the jquery event-object
 * @return void
 */
GENTICS.Aloha.Table.prototype.columnSelectionMouseDown = function (jqEvent) {

	this.focus();

	// select first cell
//	var firstCell = this.obj.find('tr:nth-child(2) td:nth-child(2)').children('div[contenteditable=true]').get(0);
//	jQuery(firstCell).get(0).focus();

	// if no cells are selected, reset the selection-array
	if (GENTICS.Aloha.TableHelper.selectedCells.length == 0) {
		this.columnsToSelect = new Array();
	}

	// store the id of the column which has been originally clicked
	this.clickedColumnId = jqEvent.currentTarget.cellIndex;
	if (jqEvent.metaKey) {
		var arrayIndex = jQuery.inArray(this.clickedColumnId, this.columnsToSelect);
		if (arrayIndex >= 0) {
			this.columnsToSelect.splice(arrayIndex, 1);
		}else{
			this.columnsToSelect.push(this.clickedColumnId);
		}
	}else if (jqEvent.shiftKey) {
		this.columnsToSelect.sort(function(a,b){return a - b;});
		var start = this.columnsToSelect[0];
		var end = this.clickedColumnId;
		if (start > end) {
			start = end;
			end = this.columnsToSelect[0];
		}
		this.columnsToSelect = new Array();
		for (var i = start; i <= end; i++) {
			this.columnsToSelect.push(i);
		}
	}else{
		this.columnsToSelect = [this.clickedColumnId];
	}

	// this does actually the column-selection.
	// it reads the columns which should be selected from "columnsToSelect"
	this.selectColumns();

	// prevent browser from selecting the table
	jqEvent.preventDefault();

	// stop bubble, otherwise the mousedown of the table is called ...
	jqEvent.stopPropagation();

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
GENTICS.Aloha.Table.prototype.columnSelectionMouseOver = function (jqEvent) {
	var colIndex = jqEvent.currentTarget.cellIndex;
	if (this.mousedown && this.clickedColumnId > 0) {
		var indexInArray = jQuery.inArray(colIndex, this.columnsToSelect);

		var start = (colIndex < this.clickedColumnId) ? colIndex : this.clickedColumnId;
		var end = (colIndex < this.clickedColumnId) ? this.clickedColumnId : colIndex;

		this.columnsToSelect = new Array();
		for (var i = start; i <= end; i++) {
			this.columnsToSelect.push(i);
		}

		this.selectColumns();
	}
};

/**
 * Unbinds all events of the last cell
 *
 * @return void
 */
GENTICS.Aloha.Table.prototype.releaseLastCellEvents = function() {
	this.obj.find('tr:last td:last').unbind();
};

/**
 * Attach a keydown-event for the last cell
 *
 * @see GENTICS.Aloha.Table.lastCellKeyDown
 * @return void
 */
GENTICS.Aloha.Table.prototype.attachLastCellEvents = function() {
	var that = this;
	this.obj.find('tr:last td:last').bind('keydown', function(jqEvent) {
		that.lastCellKeyDown(jqEvent);
	});
};

/**
 * If the tab-key was pressed in the last cell create a new row and jump into
 * the first cell of the next row.
 * Only add a new row if no addtional key was pressed (shift, alt, ctrl)
 *
 * @param jqEvent
 *            the jquery-event object
 * @return
 */
GENTICS.Aloha.Table.prototype.lastCellKeyDown = function(jqEvent) {
	var KEYCODE_TAB = 9;

	// only add a row on a single key-press of tab (so check if alt-, shift- or
	// ctrl-key are NOT pressed)
	if (KEYCODE_TAB == jqEvent.keyCode && !jqEvent.altKey && !jqEvent.shiftKey && !jqEvent.ctrlKey) {
		// add a row after the current row (false stands for not highlighting the new row)
		this.addRowsAfter(false);

		// stop propagation because this should overwrite all other events
		jqEvent.stopPropagation();

		// for ie make a special case ... focus the first cell of the new row
		if (jQuery.browser.msie) {
			this.obj.find('tr:last td:nth-child(1) div.GENTICS_Table_Cell_editable').get(0).focus();
			return false;
		}
	}
};

/**
 * Deletes the selected rows. If no row are selected, delete the row, where the
 * cursor is positioned. If all rows of the table should be deleted, the whole
 * table is deletet and removed from the tableRegistry.
 *
 * @return void
 */
GENTICS.Aloha.Table.prototype.deleteRows = function() {
	var rowIDs = new Array();

	// flag if the table should be deleted
	var deleteTable = false;

	// if a selection was made, delete the selected cells
	if (GENTICS.Aloha.TableHelper.selectedCells.length > 0) {
		for (var i = 0; i < GENTICS.Aloha.TableHelper.selectedCells.length; i++) {
			rowIDs.push(GENTICS.Aloha.TableHelper.selectedCells[i][0].parentNode.rowIndex);
		}

	// if no rows were selected, delete the row, where the cursor is placed in
	}else if (typeof GENTICS.Aloha.Table.Cell.lastActiveCell != 'undefined') {
		rowIDs.push(GENTICS.Aloha.Table.Cell.lastActiveCell.obj.context.parentNode.rowIndex);
	}

	// if all rows should be deleted, set flag to remove the WHOLE table
	if (rowIDs.length == this.numRows) {
		deleteTable = true;
	}

	// delete the whole table
	if (deleteTable) {
		var that = this;
		GENTICS.Aloha.showMessage(new GENTICS.Aloha.Message({
			title : GENTICS.Aloha.i18n(GENTICS.Aloha.TablePlugin, 'Table'),
			text : GENTICS.Aloha.i18n(GENTICS.Aloha.TablePlugin, 'deletetable.confirm'),
			type : GENTICS.Aloha.Message.Type.CONFIRM,
			callback : function (sel) {
				if (sel == 'yes') {
					that.deleteTable();
				}
			}
		}));
	} else {
		rowIDs.sort(function(a,b){return a - b;});
		// check which cell should be focused after the deletion
		var focusRowId = rowIDs[0];
		if (focusRowId > (this.numRows - rowIDs.length)) {
			focusRowId --;
		}

		// release the events of the last cell
		this.releaseLastCellEvents();

		// get all rows
		var rows = this.obj.find('tr');
		var rows2delete = new Array();

		// build the array with the row-ids of th rows which should be deleted
		for (var i = 0; i < rowIDs.length; i++) {
			rows2delete.push(jQuery(rows[rowIDs[i]]));
		}

		// delete cells from cells-array
		for (var i = 0; i < rows2delete.length; i ++) {
			var cols = rows2delete[i].children("td").toArray();
			for (var j = 0; j < cols.length; j++) {
				for (var m = 0; m < this.cells.length; m ++) {
					if (cols[j] == this.cells[m].obj.get(0)) {
						this.cells.splice(m, 1);
						m = this.cells.length;
					}
				}
			}
		}

		// remove the rows
		for (var i = 0; i < rows2delete.length; i++) {
			rows2delete[i].remove();
		}

		// reduce the attribute storing the number of rows in the table
		this.numRows -= rows2delete.length;

		if (jQuery.browser.msie){
			setTimeout(this.obj.find('tr:nth-child(' + (focusRowId + 1) + ') td:nth-child(2) div.GENTICS_Table_Cell_editable').get(0).focus, 5);
		}else{
			this.obj.find('tr:nth-child(' + (focusRowId + 1) + ') td:nth-child(2) div.GENTICS_Table_Cell_editable').get(0).focus();
		}

		// re-attach the events for the last cell
		this.attachLastCellEvents();

		// finally unselect the marked cells
		GENTICS.Aloha.TableHelper.unselectCells();
	}
};

/**
 * Deletes the selected columns. If no columns are selected, delete the column, where the
 * cursor is positioned. If all columns of the table should be deleted, the whole
 * table is deleted from the dom and removed from the tableRegistry.
 *
 * @return void
 */
GENTICS.Aloha.Table.prototype.deleteColumns = function() {
	var colIDs = new Array();

	// flag if the table should be deleted
	var deleteTable = false;

	// if a selection was made, delete the selected cells
	if (GENTICS.Aloha.TableHelper.selectedCells.length > 0) {
		for (var i = 0; i < GENTICS.Aloha.TableHelper.selectedCells[0].length; i++) {
			colIDs.push(GENTICS.Aloha.TableHelper.selectedCells[0][i].cellIndex);
		}

	// if no columns were selected, delete the column, where the cursor is placed in
	}else if (typeof GENTICS.Aloha.Table.Cell.lastActiveCell != 'undefined') {
		colIDs.push(GENTICS.Aloha.Table.Cell.lastActiveCell.obj.context.cellIndex);
	}

	// if all columns should be deleted, set flag to remove the WHOLE table
	if (colIDs.length == this.numCols) {
		deleteTable = true;
	}

	// delete the whole table
	if (deleteTable) {
		var that = this;
		GENTICS.Aloha.showMessage(new GENTICS.Aloha.Message({
			title : GENTICS.Aloha.i18n(GENTICS.Aloha.TablePlugin, 'Table'),
			text : GENTICS.Aloha.i18n(GENTICS.Aloha.TablePlugin, 'deletetable.confirm'),
			type : GENTICS.Aloha.Message.Type.CONFIRM,
			callback : function (sel) {
				if (sel == 'yes') {
					that.deleteTable();
				}
			}
		}));
	} else {
		colIDs.sort(function(a,b){return a - b;});
		// check which cell should be focused after the deletion
		var focusColID = colIDs[0];
		if (focusColID > (this.numCols - colIDs.length)) {
			focusColID --;
		}

		// release the events of the last cell
		this.releaseLastCellEvents();

		// get all rows to iterate
		var rows = this.obj.find('tr');
		var cols2delete = new Array();

		// build the array with the row-ids of th rows which should be deleted
		for (var i = 0; i < rows.length; i++) {
			var cells = jQuery(rows[i]).children("td").toArray();
			for (var j = 0; j < colIDs.length; j++) {
				cols2delete.push(cells[colIDs[j]]);
			}
		}

		// delete cells from cells-array
		for (var i = 0; i < cols2delete.length; i ++) {
			for (var j = 0; j < this.cells.length; j++) {
				if (cols2delete[i] == this.cells[j].obj.get(0)) {
					this.cells.splice(j, 1);
					j = this.cells.length;
				}
			}
		}

		// remove the columns
		for (var i = 0; i < cols2delete.length; i++) {
			jQuery(cols2delete[i]).remove();
		}

		// reduce the attribute storing the number of rows in the table
		this.numCols -= colIDs.length;

		if (jQuery.browser.msie){
			setTimeout(this.obj.find('tr:nth-child(2) td:nth-child(' + (focusColID + 1) + ') div.GENTICS_Table_Cell_editable').get(0).focus, 5);
		}else{
			this.obj.find('tr:nth-child(2) td:nth-child(' + (focusColID + 1) + ') div.GENTICS_Table_Cell_editable').get(0).focus();
		}

		// re-attach the events for the last cell
		this.attachLastCellEvents();

		GENTICS.Aloha.TableHelper.unselectCells();
	}
};

/**
 * Deletes the table from the dom and remove it from the tableRegistry.
 *
 * @return void
 */
GENTICS.Aloha.Table.prototype.deleteTable = function() {
	var deleteIndex = -1;
	for (var i = 0; i < GENTICS.Aloha.TablePlugin.TableRegistry.length; i++){
		if (GENTICS.Aloha.TablePlugin.TableRegistry[i].obj.attr('id') == this.obj.attr('id')) {
			deleteIndex = i;
			break;
		}
	}
	if (deleteIndex >= 0) {
		// before deleting the table, deactivate it
		this.deactivate();

		GENTICS.Aloha.TableHelper.selectionType = undefined;
		GENTICS.Aloha.TablePlugin.TableRegistry.splice(i, 1);

		// we will set the cursor right before the removed table
		var newRange = GENTICS.Aloha.Selection.rangeObject;
		// TODO set the correct range here (cursor shall be right before the removed table)
		newRange.startContainer = newRange.endContainer = this.obj.get(0).parentNode;
		newRange.startOffset = newRange.endOffset = GENTICS.Utils.Dom.getIndexInParent(this.obj.get(0).parentNode);
		newRange.clearCaches();

		this.obj.remove();
		this.parentEditable.obj.focus();
		// select the new range
		newRange.correctRange();
		newRange.select();
	}
};

/**
 * Wrapper function for this.addRow to add a row before the active row
 *
 * @param highlightNewRows flag if the newly created rows should be marked as selected
 * @see GENTICS.Aloha.Table.prototype.addRow
 * @return
 */
GENTICS.Aloha.Table.prototype.addRowsBefore = function(highlightNewRows) {
	this.addRows('before', highlightNewRows);
};

/**
 * Wrapper function for this.addRow to add a row after the active row
 *
 * @param highlightNewRows flag if the newly created rows should be marked as selected
 * @see GENTICS.Aloha.Table.prototype.addRow
 * @return
 */
GENTICS.Aloha.Table.prototype.addRowsAfter = function(highlightNewRows) {
	this.addRows('after', highlightNewRows);
};

/**
 * Adds new rows to the table. If rows were selected, the new rows will be
 * inserted before/after the first/last selected row. If no rows are selected, a
 * new row will be inserted before/after the row of the currently selected cell.
 * As well the row-selection events have to be bound again.
 *
 * @param position
 *            could be 'after' or 'before'. defines the position where the new
 *            rows should be inserted
 * @param highlightNewRows
 *            flag if the newly created rows should be marked as selected
 * @return void
 */
GENTICS.Aloha.Table.prototype.addRows = function(position, highlightNewRows) {
	if (typeof GENTICS.Aloha.TablePlugin.activeTable != 'undefined') {
		// release listening events of the last cell
		this.releaseLastCellEvents();

		var that = this;
		var numCols = this.numCols;

		// number of rows to insert
		var rowsToInsert = 1;
		// index where new rows should be inserted
		var rowId = 1;

		// if rows were selected take the amount of selected cells for the new rows
		if (GENTICS.Aloha.TableHelper.selectedCells.length > 0) {
			rowsToInsert = GENTICS.Aloha.TableHelper.selectedCells.length;

			// get the index where the new rows should be inserted
			switch (position) {
				case 'before':
					if (GENTICS.Aloha.TableHelper.selectedCells[0].length){
						rowId = GENTICS.Aloha.TableHelper.selectedCells[0][0].parentNode.rowIndex;
					}
					break;
				case 'after':
					var lastRow = GENTICS.Aloha.TableHelper.selectedCells.length - 1;
					if (GENTICS.Aloha.TableHelper.selectedCells[lastRow].length){
						rowId = GENTICS.Aloha.TableHelper.selectedCells[lastRow][0].parentNode.rowIndex;
					}
					break;
			}

		// no rows selected, insert 1 new row before/after the row of the last active cell
		}else if (typeof GENTICS.Aloha.Table.Cell.lastActiveCell != 'undefined') {
			rowId = GENTICS.Aloha.Table.Cell.lastActiveCell.obj.context.parentNode.rowIndex;
		}

		// the new row index for the created row
		var newRowIndex = rowId;
		// if the new rows should be inserted after the last selected row
		// increase the rowindex will be one more than the actual row
		if (position == 'after') {
			newRowIndex += 1;
		}

		var rowIdArray = new Array();
		for (var j = 0; j < rowsToInsert; j++) {
			rowIdArray.push(newRowIndex);
			var insertionRow = jQuery('<tr>');

			// create the first column, the "select row" column
			var selectionColumn = jQuery('<td>');
			selectionColumn.addClass(this.get('classSelectionColumn'));
			this.attachRowSelectionEventsToCell(selectionColumn);
			insertionRow.append(selectionColumn);

			for (i = 0; i < numCols; i++) {
				var newCol = jQuery('<td>');
				newCol.html('\u00a0');
				var cell = new GENTICS.Aloha.Table.Cell(newCol.get(0), GENTICS.Aloha.TablePlugin.activeTable);
				cell.activate();
				this.cells.push(cell);

				insertionRow.append(cell.obj);
			}


			var currentRow = jQuery(GENTICS.Aloha.TablePlugin.activeTable.obj.find("tr").get(rowId));

			switch (position) {
				case 'before':
					currentRow.before(insertionRow);
					break;
				case 'after':
					currentRow.after(insertionRow);
					break;
				default:
					this.warn(this, 'Wrong call of GENTICS.Aloha.Table.prototype.addRow!');
			}
			newRowIndex ++;
			this.numRows ++;
		}
		GENTICS.Aloha.TableHelper.unselectCells();

		this.rowsToSelect = rowIdArray;
		if (highlightNewRows) {
			this.selectRows();
		}

		// re-attach events of the last cell
		this.attachLastCellEvents();
	}
};

/**
 * Wrapper method to add columns on the right side
 *
 * @see GENTICS.Aloha.Table.addColumns
 * @return void
 */
GENTICS.Aloha.Table.prototype.addColumnsRight = function () {
	this.addColumns('right');
};

/**
 * Wrapper method to add columns on the left side
 *
 * @see GENTICS.Aloha.Table.addColumns
 * @return void
 */
GENTICS.Aloha.Table.prototype.addColumnsLeft = function() {
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
GENTICS.Aloha.Table.prototype.addColumns = function (position) {
	if (typeof GENTICS.Aloha.TablePlugin.activeTable != 'undefined') {
		// release listening events of the last cell
		this.releaseLastCellEvents();

		var that = this;

		// amount of columns to insert
		var columnsToInsert = 1;
		// index of the column from where the new columns should be inserted
		var colId = 1;

		// if columns are selected, get the column-index of the column on the left/right selected end
		if (GENTICS.Aloha.TableHelper.selectedCells.length > 0) {
			columnsToInsert = GENTICS.Aloha.TableHelper.selectedCells[0].length;
			switch (position) {
				case 'left':
					if (GENTICS.Aloha.TableHelper.selectedCells[0].length){
						colId = GENTICS.Aloha.TableHelper.selectedCells[0][0].cellIndex;
					}
					break;
				case 'right':
					var lastColumn = GENTICS.Aloha.TableHelper.selectedCells[0].length - 1;
					if (GENTICS.Aloha.TableHelper.selectedCells[0].length){
						colId = GENTICS.Aloha.TableHelper.selectedCells[0][lastColumn].cellIndex;
					}
					break;
			}
		// otherwise take the column-index of the last active cell
		}else if (typeof GENTICS.Aloha.Table.Cell.lastActiveCell != 'undefined') {
			colId = GENTICS.Aloha.Table.Cell.lastActiveCell.obj.context.cellIndex;
		}

		// the new col index for the created column
		var newColId = colId;

		var emptyCell = jQuery('<td>');
		var rows = this.obj.find('tr');
		var colIdArray = new Array();
		for (var i = 0; i < rows.length; i++){
			var currentColId = newColId;
			var row = rows[i];

			for (var j = 0; j < columnsToInsert; j++) {
				var cell = emptyCell.clone();
				cell.html('\u00a0');
				// this is the first row, so make a column-selection cell
				if (i == 0) {
					this.attachColumnSelectEventsToCell(cell);

				}else{
					cellObj = new GENTICS.Aloha.Table.Cell(cell.get(0), GENTICS.Aloha.TablePlugin.activeTable);
					this.cells.push(cellObj);
					cellObj.activate();
					cell = cellObj.obj;
				}

				var insertionColumn = jQuery(jQuery(row).find("td").get(newColId));
				switch (position) {
					case 'left':
						if (jQuery.inArray(currentColId, colIdArray) < 0) {
							colIdArray.push(currentColId);
						}
						insertionColumn.before(cell);
						break;
					case 'right':
						if (jQuery.inArray((currentColId + 1), colIdArray) < 0) {
							colIdArray.push(currentColId + 1);
						}
						insertionColumn.after(cell);
						break;
				}
				currentColId ++;
			}
		}
		this.numCols += columnsToInsert;
		GENTICS.Aloha.TableHelper.unselectCells();
		this.columnsToSelect = colIdArray;
		this.selectColumns();

		// re-attach events of the last cell
		this.attachLastCellEvents();
	}
};

/**
 * Helper method to set the focus-attribute of the table to true
 *
 * @return void
 */
GENTICS.Aloha.Table.prototype.focus = function() {
	if (!this.hasFocus) {
		if (!this.parentEditable.isActive) {
			this.parentEditable.obj.focus();
		}

		GENTICS.Aloha.TablePlugin.setFocusedTable(this);

		// select first cell
		// TODO put cursor in first cell without selecting
//		var firstCell = this.obj.find('tr:nth-child(2) td:nth-child(2)').children('div[contenteditable=true]').get(0);
//		jQuery(firstCell).get(0).focus();

	}

	// TODO workaround - fix this. the selection is updated later on by the browser
	// using setTimeout here is hideous, but a simple execution-time call will fail
// DEACTIVATED by Haymo prevents selecting rows
//	setTimeout('GENTICS.Aloha.Selection.updateSelection(false, true)', 50);

};

/**
 * Helper method to set the focus-attribute of the table to false
 *
 * @return void
 */
GENTICS.Aloha.Table.prototype.focusOut = function() {
	if (this.hasFocus) {
		GENTICS.Aloha.TablePlugin.setFocusedTable(undefined);
		GENTICS.Aloha.TableHelper.selectionType = undefined;
	}
};

/**
 * Marks all cells of the specified column as marked (adds a special class)
 *
 * @return void
 */
GENTICS.Aloha.Table.prototype.selectColumns = function() {
	// get the class which selected cells should have
	var selectClass = this.get('classCellSelected');

	// unselect selected cells
	GENTICS.Aloha.TableHelper.unselectCells();

	GENTICS.Aloha.TableHelper.selectionType = 'column';
	GENTICS.Aloha.FloatingMenu.setScope(GENTICS.Aloha.TablePlugin.getUID('column'));

	this.columnsToSelect.sort(function(a,b){return a - b;});

	var rows = this.obj.find("tr").toArray();
	// first row is the selection row (dump it => not needed)
	rows.shift();
	var toSelect = new Array();
	for (var i = 0; i < rows.length; i++){
		var rowCells = rows[i].cells;

		var selectedCellsInCol = new Array();
		for (var j = 0; j < this.columnsToSelect.length; j++) {
			var colIndex = this.columnsToSelect[j];
			var cell = rowCells[colIndex];
			toSelect.push(cell);
			selectedCellsInCol.push(cell);
		}
		GENTICS.Aloha.TableHelper.selectedCells.push(selectedCellsInCol);
	};
	// blur all editables within the table
	this.obj.find('div.GENTICS_Table_Cell_editable').blur();

	// add the class (visually selecting the cells)
	jQuery(toSelect).addClass(selectClass);
};


/**
 * Marks all cells of the specified row as marked (adds a special class)
 *
 * @return void
 */
GENTICS.Aloha.Table.prototype.selectRows = function() {
	// get the class which selected cells should have
	var selectClass = this.get('classCellSelected');

	// unselect selected cells
	GENTICS.Aloha.TableHelper.unselectCells();
	this.rowsToSelect.sort(function(a,b){return a - b;});

	for (var i = 0; i < this.rowsToSelect.length; i++) {
		var rowId = this.rowsToSelect[i];
		var rowCells = jQuery(this.obj.find('tr').get(rowId).cells).toArray();

		// shift the first element (which is a selection-helper cell)
		rowCells.shift();

		GENTICS.Aloha.TableHelper.selectedCells.push(rowCells);
		jQuery(rowCells).addClass(this.get('classCellSelected'));
	}
	GENTICS.Aloha.TableHelper.selectionType = 'row';
	GENTICS.Aloha.FloatingMenu.setScope(GENTICS.Aloha.TablePlugin.getUID('row'));

	// blur all editables within the table
	this.obj.find('div.GENTICS_Table_Cell_editable').blur();
};


/**
 * Deactivation of a Aloha-Table. Clean up ... remove the wrapping div and the
 * selection-helper divs
 *
 * @return void
 */
GENTICS.Aloha.Table.prototype.deactivate = function() {
	this.obj.removeClass(this.get('className'));
	if (jQuery.trim(this.obj.attr('class')) == '') {
		this.obj.removeAttr('class');
	}
//	this.obj.contentEditable('');
//	this.obj.removeAttr('id');

	// unwrap the selectionLeft-div if available
	if (this.obj.parents('.' + this.get('classTableWrapper')).length){
		this.obj.unwrap();
	}

	// remove the selection row
	this.obj.find('tr.' + this.get('classSelectionRow') + ':first').remove();
	// remove the selection column (first column left)
	var that = this;
	jQuery.each(this.obj.context.rows, function(){
		jQuery(this).children('td.' + that.get('classSelectionColumn')).remove();
	});

	// remove the "selection class" from all td and th in the table
	this.obj.find('td, th').removeClass(this.get('classCellSelected'));
	this.obj.unbind();
	// wrap the inner html of the contentEditable div to its outer html
	for (var i = 0; i < this.cells.length; i++) {
		var Cell = this.cells[i];
		Cell.deactivate();
	}

	// remove editable span in caption (if any)
	this.obj.find('caption div').each(function() {
		jQuery(this).contents().unwrap();
	});

	// better unset ;-) otherwise activate() may think you're activated.
	this.isActive = false;
};

/**
 * toString-method for GENTICS.Aloha.Table object
 *
 * @return void
 */
GENTICS.Aloha.Table.prototype.toString = function() {
	return 'GENTICS.Aloha.Table';
};
/* -- END METHODS -- */


/*****************************
  +--------------------------+
  | GENTICS.Aloha.Table.Cell |
  +--------------------------+
******************************/

/**
 * The constructor for the Cell-Objects takes a DOM td-object, attaches
 * events, adds an wrapper into the cell and returns the modified td-object as
 * DOM representation
 *
 * @param originalTd
 *            The original td-field which should will be transformed
 * @param colId
 *            the internal id of the corresponding col (begin with 0)
 * @param rowId
 *            the internal id of the corresponding row (begin with 0)
 * @param tableObj
 *            GENTICS.Aloha.Table-Object which contains the cell
 *
 * @return the created table-data field as DOM-representation
 */
GENTICS.Aloha.Table.Cell = function(originalTd, tableObj) {
	this.obj = jQuery(originalTd);
	this.tableObj = tableObj;
};
/* -- ATTRIBUTES -- */
/**
 * Reference to the jQuery-representation of the wrapping table
 *
 * @see GENTICS.Aloha.Table.Cell.table
 */
GENTICS.Aloha.Table.Cell.prototype.tableObj = undefined;

/**
 * Reference to the jQuery td-Object of the cell
 */
GENTICS.Aloha.Table.Cell.prototype.obj = undefined;

/**
 * The jQuery wrapper of the cell
 */
GENTICS.Aloha.Table.Cell.prototype.wrapper = undefined;

/**
 * Flag if the cell has focus
 */
GENTICS.Aloha.Table.Cell.prototype.hasFocus = false;

/**
 * The jQuery wrapper of the cell
 */
GENTICS.Aloha.Table.Cell.activeCell = undefined;

/**
 * The jQuery wrapper of the cell
 */
GENTICS.Aloha.Table.Cell.lastActiveCell = undefined;
/* -- END ATTRIBUTES -- */


/**
 * Focus method for the contentediable div within a table data-field. The method
 * requires the event-property Cell as a GENTICS.Aloha.Table.Cell object. If the
 * Cell wasn't activated yet it does all relevant actions to activate the cell.
 *
 * @param e
 *            the jquery event object
 * @return void
 */
GENTICS.Aloha.Table.Cell.prototype.editableFocus = function(e) {
	// only do activation stuff if the cell don't has the focus
	if (!this.hasFocus) {
		// set an internal flag to focus the table
		this.tableObj.focus();

		// set the clicked cell active as the active cell
		GENTICS.Aloha.Table.Cell.activeCell = this;

		// set the clicked cell active as the last active cell (the difference
		// to activeCell is that lastActiveCell won't be reset on blur)
		GENTICS.Aloha.Table.Cell.lastActiveCell = this;

		// add an active-class
		this.obj.addClass('GENTICS_Table_Cell_active');

		// set the focus flag
		this.hasFocus = true;

		// select the whole content in the table-data field
		this.selectAll(this.wrapper.get(0));

		// unset the selection type
		GENTICS.Aloha.TableHelper.selectionType = 'cell';
//		GENTICS.Aloha.FloatingMenu.setScope(GENTICS.Aloha.TablePlugin.getUID('cell'));

	}
};

/**
 * Blur event for the contenteditable div within a table-data field. The method
 * requires the event-property Cell as a GENTICS.Aloha.Table.Cell object. It
 * sets the hasFocus flag of the cell to false and removes the "active"
 * css-class.
 *
 * @param jqEvent
 *            the jquery event object
 * @return void
 */
GENTICS.Aloha.Table.Cell.prototype.editableBlur = function(jqEvent){
	// no active cell
	GENTICS.Aloha.Table.Cell.activeCell = undefined;

	// reset the focus of the cell
	this.hasFocus = false;

	// remove "active class"
	this.obj.removeClass('GENTICS_Table_Cell_active');
};

GENTICS.Aloha.Table.Cell.prototype.activate = function() {
	// wrap the created div into the contents of the cell
	this.obj.wrapInner('<div/>');

	// create the editable wrapper for the cells
	var wrapper = this.obj.children('div').eq(0);

	wrapper.contentEditable(true);
	wrapper.addClass('GENTICS_Table_Cell_editable');


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
	});
	wrapper.bind('blur',      function(jqEvent) { that.editableBlur(jqEvent);      });
	wrapper.bind('keyup',     function(jqEvent) { that.editableKeyUp(jqEvent);     });
	wrapper.bind('keydown',   function(jqEvent) { that.editableKeyDown(jqEvent);   });

	// we will treat the wrapper just like an editable
	wrapper.GENTICS_contentEditableSelectionChange(function (event) {
		GENTICS.Aloha.Selection.onChange(wrapper, event);
		return wrapper;
	});

	this.obj.bind('mousedown', function(jqEvent) {
		setTimeout(function() {
			that.wrapper.trigger('focus');
		}, 1);

		// unselect cells
		GENTICS.Aloha.TableHelper.unselectCells();

		jqEvent.stopPropagation();
	});
	this.obj.get(0).onselectstart = function (jqEvent) { return false; };


	// set contenteditable wrapper div
	this.wrapper = this.obj.children();
	this.wrapper.get(0).onselectstart = function() {
		window.event.cancelBubble = true;
	};

	return this;
};

/**
 * The deactivate method removes the contenteditable helper div within the
 * table-data field and wraps the innerHtml to the outerHTML
 *
 * @return void
 */
GENTICS.Aloha.Table.Cell.prototype.deactivate = function() {
	var wrapper = this.obj.children('.GENTICS_Table_Cell_editable');

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
};

/**
 * Native toString-method
 *
 * @return string name of the namespace
 */
GENTICS.Aloha.Table.Cell.prototype.toString = function() {
	return 'GENTICS.Aloha.Table.Cell';
};

/**
 * Selects all inner-contens of an contentEditable-object
 *
 * @param editableNode dom-representation of the editable node (div-element)
 * @return void
 */
GENTICS.Aloha.Table.Cell.prototype.selectAll = function(editableNode) {
	var e = (editableNode.jquery) ? editableNode.get(0) : editableNode;

	// Not IE
	if (!jQuery.browser.msie) {
		var s = window.getSelection();
		// Safari
		if (s.setBaseAndExtent) {
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

	GENTICS.Aloha.Selection.updateSelection(editableNode);
};

/**
 * The mouse-down event for the editable-div in the thd-field. Unselect all
 * cells when clicking on the editable-div.
 *
 * @param jqEvent
 *            the jquery-event object
 * @return void
 */
GENTICS.Aloha.Table.Cell.prototype.editableMouseDown = function(jqEvent) {
	// deselect all highlighted cells registered in the TableHelper object
	GENTICS.Aloha.TableHelper.unselectCells();

	if (this.tableObj.hasFocus) {
		jqEvent.stopPropagation();
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
GENTICS.Aloha.Table.Cell.prototype.editableKeyUp = function(jqEvent) {
	this.checkForEmptyEvent(jqEvent);
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
GENTICS.Aloha.Table.Cell.prototype.editableKeyDown = function(jqEvent) {
	this.checkForEmptyEvent(jqEvent);
	if (!jqEvent.ctrlKey && !jqEvent.shiftKey) {
		if (GENTICS.Aloha.TableHelper.selectedCells.length > 0 && GENTICS.Aloha.TableHelper.selectedCells[0].length > 0) {
			GENTICS.Aloha.TableHelper.selectedCells[0][0].firstChild.focus();
			GENTICS.Aloha.TableHelper.unselectCells();
			jqEvent.stopPropagation();
		}
	}else if(jqEvent.shiftKey && GENTICS.Aloha.TableHelper.selectedCells.length > 0){
		var KEYCODE_ARROWLEFT = 37;
		var KEYCODE_ARROWUP = 38;
		var KEYCODE_ARROWRIGHT = 39;
		var KEYCODE_ARROWDOWN = 40;
		switch (GENTICS.Aloha.TableHelper.selectionType) {
			case 'row':
				switch(jqEvent.keyCode) {
					case KEYCODE_ARROWUP:
						var firstSelectedRow = GENTICS.Aloha.TableHelper.selectedCells[0][0].parentNode.rowIndex;
						if (firstSelectedRow > 1) {
							this.tableObj.rowsToSelect.push(firstSelectedRow - 1);
						}
						break;
					case KEYCODE_ARROWDOWN:
						var lastRowIndex = GENTICS.Aloha.TableHelper.selectedCells.length - 1;
						var lastSelectedRow = GENTICS.Aloha.TableHelper.selectedCells[lastRowIndex][0].parentNode.rowIndex;
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
						var firstColSelected = GENTICS.Aloha.TableHelper.selectedCells[0][0].cellIndex;
						if (firstColSelected > 1) {
							this.tableObj.columnsToSelect.push(firstColSelected - 1);
						}
						break;
					case KEYCODE_ARROWRIGHT:
						var lastColIndex = GENTICS.Aloha.TableHelper.selectedCells[0].length - 1;
						var lastColSelected = GENTICS.Aloha.TableHelper.selectedCells[0][lastColIndex].cellIndex;
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
GENTICS.Aloha.Table.Cell.prototype.checkForEmptyEvent = function(jqEvent) {
	if (jQuery(this.wrapper).children().length > 0) {
		return;
	}

	// get the editable contents
	var text = this.wrapper.text();

	// if empty insert a blank space and blur and focus the wrapper
	if (text == ''){
		this.wrapper.text('\u00a0');
		this.wrapper.get(0).blur();
		this.wrapper.get(0).focus();
	}
};
/* -- END METHODS -- */


/**************************************
  +---------------------------------+
  | GENTICS.Aloha.Table.CreateLayer |
  +---------------------------------+
***************************************/
/**
 * Dummy initialize of the CreateLayer object
 */
GENTICS.Aloha.Table.CreateLayer = function(){};

/* -- ATTRIBUTES -- */
/**
 * Internal configuration of the create-table panel
 */
GENTICS.Aloha.Table.CreateLayer.prototype.parameters = {
	elemId: 'GENTICS_Aloha_Table_createLayer', // id of the create-table panel
	className: 'GENTICS_Table_Createdialog',   // class-name of the create-table panel
	numX: 10,	         // Number of cols in the create-layer
	numY: 10,            // Number of rows in the create-layer vertically
	layer: undefined,    // Attribute holding the create-layer
	target: undefined    // the clicktarget which was clicked on (mostly the button of the floatingmenu)
};

/**
 * The configuration-object for the implementer of the plugin. All keys of
 * the "parameters" object could be overwritten within this object and will
 * simply be used instead.
 */
GENTICS.Aloha.Table.CreateLayer.prototype.config = new Object();

/**
 * Flag wether the CreateLayer is currently visble or not
 */
GENTICS.Aloha.Table.CreateLayer.prototype.visible = false;
/* -- END ATTRIBUTES -- */

/* -- METHODS -- */
/**
 * This function checks if there is an create-table-layer. If no layer exists, it creates one and puts it into the configuration.
 * If the layer was already created it sets the position of the panel and shows it.
 *
 * @return void
 */
GENTICS.Aloha.Table.CreateLayer.prototype.show = function(){
	var layer = this.get('layer');

	// create the panel if the layer doesn't exist
	if (layer == null) {
		this.create();
	}else {
		// or reposition, cleanup and show the layer
		this.setPosition(layer);
		layer.find('td').removeClass('hover');
		layer.show();
	}
	this.visible = true;
};
/**
 * Creates the div-layer which holds a table with the given number of rows and cols.
 * It sets click and mouseover-events to the table data fields
 *
 * @return void
 */
GENTICS.Aloha.Table.CreateLayer.prototype.create = function () {
	var that = this;
	var layer = jQuery('<div></div>');
	layer.id = this.get('elemId');
	layer.addClass(this.get('className'));

	var table = jQuery('<table></table>');
	table.css('width', (this.get('numX') + 6) * 15);
	var tr;
	var td;

	for (var i = 0; i < this.get('numY'); i++) {
		tr = jQuery('<tr></tr>');

		for (var j = 0; j < this.get('numX'); j++) {
			td = jQuery('<td>\u00a0</td>');

			if (i == 0 && j == 0) {
				td.addClass('hover');
			}

			td.bind('mouseover', {rowId: i, colId: j}, function(e) {
				that.handleMouseOver(e, table);
			});

			td.bind('click', {rowId: i, colId: j}, function(e){
				var rows = e.data.rowId + 1;
				var cols = e.data.colId + 1;

				GENTICS.Aloha.TablePlugin.createTable(cols, rows);
				that.hide();
			});

			tr.append(td);
		}
		table.append(tr);
	}
	layer.append(table);

	// set attributes
	this.set('layer', layer);
	this.setPosition();

	// stop bubbling the click on the create-dialog up to the body event
	layer.bind('click', function(e) {
		e.stopPropagation();
	}).mousedown(function(e) {
		e.stopPropagation();
	});

	// append layer to body and
	// hide the create layer if user clicks anywhere in the body
	jQuery('body').append(layer).bind('click', function(e) {
		if (e.target != that.get('target') && that.visible) {
			that.hide();
		}
	});
};

/**
 * handles the mose over state for a cell
 * @param e event object
 * @param table the aeffected table
 * @return void
 */
GENTICS.Aloha.Table.CreateLayer.prototype.handleMouseOver = function(e, table) {
	var rowId = e.data.rowId;
	var colId = e.data.colId;
	var innerRows = table.find('tr');

	for (var n = 0; n <= innerRows.length; n++) {
		var innerCells = jQuery(innerRows[n]).find('td');

		for (var k = 0; k <= innerCells.length; k++) {
			if (n <= rowId && k <= colId) {
				jQuery(innerCells[k]).addClass('hover');
			} else {
				jQuery(innerCells[k]).removeClass('hover');
			}
		}
	}
};

/**
 * Sets the "left" and "top" style-attributes according to the clicked target-button
 *
 *  @return void
 */
GENTICS.Aloha.Table.CreateLayer.prototype.setPosition = function() {
	var targetObj = jQuery(this.get('target'));
	var pos = targetObj.offset();
	this.get('layer').css('left', pos.left + 'px');
	this.get('layer').css('top', (pos.top + targetObj.height()) + 'px');
};


/**
 * Hides the create-table panel width the jQuery-method hide()
 *
 * @see jQuery().hide()
 * @return void
 */
GENTICS.Aloha.Table.CreateLayer.prototype.hide = function() {
	this.get('layer').hide();
	this.visible = false;
};

/**
 * The "get"-method returns the value of the given key. First it searches in the
 * config for the property. If there is no property with the given name in the
 * "config"-object it returns the entry associated with in the parameters-object
 *
 * @param property
 * @return void
 */
GENTICS.Aloha.Table.CreateLayer.prototype.get = function(property) {
	// return param from the config
	if (this.config[property]) {
		return this.config[property];
	}
	// if config-param was not found return param from the parameters-object
	if (this.parameters[property]) {
		return this.parameters[property];
	}
	return undefined;
};

/**
 * The "set"-method takes a key and a value. It checks if there is a key-value
 * pair in the config-object. If so it saves the data in the config-object. If
 * not it saves the data in the parameters-object.
 *
 * @param key
 *            the key which should be set
 * @param value
 *            the value which should be set for the associated key
 */
GENTICS.Aloha.Table.CreateLayer.prototype.set = function (key, value) {
	// if the key already exists in the config-object, set it to the config-object
	if (this.config[key]) {
		this.config[key] = value;

	// otherwise "add" it to the parameters-object
	}else{
		this.parameters[key] = value;
	}
};
/* -- END METHODS -- */



/********************************
  +---------------------------+
  | GENTICS.Aloha.TableHelper |
  +---------------------------+
*********************************/
/**
 * The TableHelper object is a helper-object which consists of static/global attributes and functions
 */
GENTICS.Aloha.TableHelper = function(){};

/* -- ATTRIBUTES -- */
/**
 * Gives the type of the cell-selection
 * possible values are "row" or "col"
 */
GENTICS.Aloha.TableHelper.prototype.selectionType = undefined;

/**
 * Holds all currently selected table cells as an array of DOM "td" representations
 */
GENTICS.Aloha.TableHelper.prototype.selectedCells = new Array();
/* -- END ATTRIBUTES -- */

/* -- METHODS -- */
/**
 * This method removes the "selected" class from all selected cells
 *
 * @return void
 */
GENTICS.Aloha.TableHelper.prototype.unselectCells = function(){
	if (this.selectedCells.length > 0) {
		for (var i = 0; i < this.selectedCells.length; i++) {
			jQuery(this.selectedCells[i]).removeClass(GENTICS.Aloha.TablePlugin.get('classCellSelected'));
		}
		this.selectedCells = new Array();
		this.selectionType = undefined;
	}
};

GENTICS.Aloha.TableHelper.prototype.getNewTableID = function() {
	var idPrefix = 'GENTICS_Table_';
	var factor = 1000000;
	for (this.tableCounter; true; this.tableCounter ++) {
		var id = idPrefix + (Math.ceil(Math.random() * factor));
		// fill up the id with zeros
		for (var j = id.length; j < idPrefix.length + factor.toString().length; j++) {
			id += '0';
		}
		if (!jQuery('#' + id).length) {
			return id;
		}
	}
};
/* -- END METHODS -- */

/**
 * Initialize a new Object from the same object to get access to the prototype methods
 */
GENTICS.Aloha.TableHelper = new GENTICS.Aloha.TableHelper();
