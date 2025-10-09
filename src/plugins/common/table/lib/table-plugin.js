/* table-plugin.js is part of the Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * License http://aloha-editor.org/license.php
 */
define([
	'jquery',
	'aloha',
	'PubSub',
	'aloha/plugin',
	'aloha/content-rules',
	'aloha/ephemera',
	'aloha/console',
	'ui/ui',
	'ui/ui-plugin',
	'ui/icons',
	'ui/scopes',
	'ui/button',
	'ui/contextToggleButton',
	'ui/contextButton',
	'ui/toggleButton',
	'ui/attributeButton',
	'ui/dialog',
	'ui/dynamicForm',
	'util/dom',
	'table/table',
	'table/table-plugin-utils',
	'table/table-selection',
	'table/table-size-select',
	'i18n!table/nls/i18n'
], function (
	$,
	Aloha,
	PubSub,
	Plugin,
	ContentRules,
	Ephemera,
	Console,
	Ui,
	UiPlugin,
	Icons,
	Scopes,
	Button,
	ContextToggleButton,
	ContextButton,
	ToggleButton,
	AttributeButton,
	Dialog,
	DynamicForm,
	Dom,
	Table,
	Utils,
	TableSelection,
	TableSizeSelect,
	i18n
) {
	var jQuery = $;
	var GENTICS = window.GENTICS;

	/**
	 * Register the TablePlugin as Aloha.Plugin
	 */
	var TablePlugin = Plugin.create('table', {});

	/**
	 * default button configuration
	 */
	TablePlugin.config = ['table'];

	/**
	 * An Array which holds all newly created tables contains DOM-Nodes of
	 * table-objects
	 */
	TablePlugin.TableRegistry = new Array();

	/**
	 * Holds the active table-object
	 */
	TablePlugin.activeTable = undefined;

	/**
	 * The ID of the Tab that contains the main controls for this Plugin.
	 * Will be swichted to automatically when present and a new table has been inserted.
	 */
	TablePlugin.tabId = 'table';

	/**
	 * parameters-objects for tables
	 *
	 * @param className
	 *            The class of activated tables
	 */
	TablePlugin.parameters = {
		className: 'aloha-table',                 // class of editable tables
		classSelectionRow: 'aloha-table-selectcolumn',    // class for the upper table-row to select columns
		classSelectionColumn: 'aloha-table-selectrow',       // class for the left bound table-cells to select rows
		classLeftUpperCorner: 'aloha-table-leftuppercorner', // class for the left upper corner cell
		classTableWrapper: 'aloha-table-wrapper',         // class of the outest table-wrapping div
		classCellSelected: 'aloha-cell-selected',         // class of cell which are selected (row/column selection)
		selectionArea: 10                             // width/height of the selection rows (in pixel)
	};

	/**
	 * @hide
	 * {name:'green', text:'Green',tooltip:'Green',iconClass:'GENTICS_table GENTICS_button_green',cssClass:'green'}
	 */
	TablePlugin.checkConfig = function (c) {
		if (typeof c == 'object' && c.length) {
			var newC = [];

			for (var i = 0; i < c.length; i++) {
				if (c[i]) {
					newC.push({
						name: c[i].name,
						text: c[i].text ? c[i].text : c[i].name,
						tooltip: c[i].tooltip ? c[i].tooltip : c[i].text,
						iconClass: c[i].iconClass ? c[i].iconClass : 'aloha-icon-' + c[i].name,
						cssClass: c[i].cssClass ? c[i].cssClass : c[i].name
					});
				}
			}

			c = newC;
		} else {
			c = [];
		}

		return c;
	};

	/**
	 * Checks whether the given DOM element is nested within a table.
	 *
	 * @param {jQuery.<HTMLElement>} $element
	 * @return {boolean} True if the given element is nested in a table.
	 */
	function isWithinTable($element) {
		return 0 < $element.parents('.aloha-editable table').length;
	}

	/**
	 * Checks whether the given DOM element is nested within an aloha block.
	 *
	 * @param {jQuery.<HTMLElement>} $element
	 * @return {boolean} True if the given element is nested in an aloha block.
	 */
	function isWithinBlock($element) {
		var i;
		var $node;
		var $parents = $element.parents();
		for (i = 0; i < $parents.length; i++) {
			$node = $parents.eq(i);
			if ($node.is('.aloha-editable')) {
				return false;
			}
			if ($node.is('.aloha-block')) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Checks whether the table is an editable element.
	 *
	 * @return {boolean} True if the table's parent element is contentEditable;
	 *                   false otherwise.
	 */
	function isEditableTable(table) {
		return GENTICS.Utils.Dom.isEditable(table);
	}

	/**
	 * Checks for the presence of nested tables in the given element.
	 *
	 * @param {jQuery.<HTMLElement>} $element jQuery unit set containing a DOM
	 *                                        element.
	 * @return {boolean} True if nested tables were detected; false otherwise.
	 */
	function checkForNestedTables($element) {
		var selector = $element.is('table') ? 'table' : 'table table';
		if ($element.find(selector).length) {
			Console.warn('Table Plugin',
				'Nested tables found. They will not be initialized.');
			return true;
		}
		return false;
	}

	/**
	 * Creates a table, if it is allowed, and registers a new Table object for
	 * the given table DOM element.
	 *
	 * If the table's editable parent is activated, the table will also
	 * automatically be activated.
	 *
	 * @param {HTMLElement} element HTML table element.
	 * @return {Table|null} The created Table object or null if it was not
	 *                      allowed to create the table.
	 */
	function createNewTable(element) {
		var $table = $(element);
		var create = isEditableTable(element)
			&& !isWithinTable($table)
			&& !isWithinBlock($table);
		if (create) {
			var table = new Table(element, TablePlugin);
			var $host = $(Dom.getEditingHostOf(element));
			table.parentEditable = Aloha.getEditableById($host.attr('id'));
			TablePlugin.TableRegistry.push(table);
			checkForNestedTables($table);
			applyDefaultClassesToTable($table.get(0));
			if (Aloha.activeEditable === table.parentEditable) {
				table.activate();
			}
			return table;
		}
		return null;
	}

	/**
	 * Sets the currently selected elements as headers of the table, or removes header-status
	 * if the whole selection is already used as a header
	 *
	 * @param {Aloha.Table} table the table-object for which the headers are to be set
	 * @param {string} scope for which the header should be used (i.e. 'row' or 'column')
	 */
	function toggleHeaderStatus(table, scope) {
		var i,
			j,
			allHeaders = table.selection.isHeader(),
			domCell, // representation of the cell in the dom
			bufferCell, // temporary buffer
			headerBtn = table.tablePlugin._tableSelectionHeaderButton;

		for (i = 0; i < table.selection.selectedCells.length; i++) {
			domCell = table.selection.selectedCells[i];

			// tries to match the current cell with a cell-object in the table
			for (j = 0; j < table.cells.length; j++) {
				if (domCell === table.cells[j].obj[0]) {
					cell = table.cells[j];
					break;
				}
			}

			// the transformed dom objects are first stored in a buffer, and only applied to
			// the table-cell-object if a match was found
			if (allHeaders) {
				bufferCell = Aloha.Markup.transformDomObject(domCell, 'td').removeAttr('scope').get(0);
			} else {
				bufferCell = Aloha.Markup.transformDomObject(domCell, 'th').attr('scope', scope).get(0);
			}
			headerBtn.setActive(!allHeaders);

			if (cell != null) {
				setCellDefaultClass(bufferCell, allHeaders);

				// assign the changed dom-element to the table-cell
				cell.obj[0] = bufferCell;

				// reactivate the table cell in order to bind events to the changed dom object
				// TODO: re-attaching event-handlers should be factored out into a utility function
				// so we don't have to do the whole activation/deactivation process for the cells
				cell.deactivate();
				cell.activate();
			}

			// uncommented code-segment, presumably added to force IE to target the wrapper
			// on mouse-down by applying a timeout after event propagation
			jQuery(table.selection.selectedCells[i]).on('mousedown', function (jqEvent) {
				var wrapper = jQuery(this).children('div').eq(0);
				window.setTimeout(function () {
					wrapper.trigger('focus');
				}, 1);
			});
		}

		Aloha.activeEditable.smartContentChange({ type: 'block-change', plugin: 'table-plugin' });
		var tableElement = table.obj && table.obj.get && table.obj.get(0);
		if (tableElement) {
			applyDefaultClassesToTable(tableElement);
		}
	}

	/**
	 * Apply the default classes as specified in the plugin config to the table.
	 *
	 * @param {HTMLTableElement} table
	 */
	function applyDefaultClassesToTable(table) {
		// set the default class
		if (TablePlugin.defaultClass) {
			$(table).addClass(TablePlugin.defaultClass);
		}
		for (var i = 0; i < table.rows.length; i++) {
			var row = table.rows[i];
			if (isEphemeral(row)) {
				continue;
			}
			var $row = $(row);
			var isHeader = isHeaderRow(row);
			if (isHeader) {
				$row.removeClass(TablePlugin.defaultRowClass);
				$row.addClass(TablePlugin.defaultHeaderRowClass);
			} else {
				$row.removeClass(TablePlugin.defaultHeaderRowClass);
				$row.addClass(TablePlugin.defaultRowClass);
			}
			for (var j = 0; j < row.cells.length; j++) {
				var cell = row.cells[j];
				setCellDefaultClass(cell, isHeader);
			}
		}
	}

	function setCellDefaultClass(cell, isHeader) {
		var $cell = $(cell);
		if (isHeader) {
			$cell.removeClass(TablePlugin.defaultCellClass);
			$cell.addClass(TablePlugin.defaultHeaderCellClass);
		} else {
			$cell.removeClass(TablePlugin.defaultHeaderCellClass);
			$cell.addClass(TablePlugin.defaultCellClass);
		}
	}

	/**
	 * Returns true if all the (non-ephemeral) cells in a given row are TH elements
	 * @param {HTMLTableRowElement} row
	 * @return {boolean}
	 */
	function isHeaderRow(row) {
		if (isEphemeral(row)) {
			return false;
		}
		for (var i = 0; i < row.cells.length; i++) {
			var cell = row.cells[i];
			var isTH = cell.tagName === 'TH';
			if (!isEphemeral(cell) && !isTH) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Returns true if the element has the aloha-ephemeral class
	 * @param {HTMLElement} element
	 * @return {boolean}
	 */
	function isEphemeral(element) {
		var ephemeraClass = 'aloha-ephemera';
		return -1 < element.className.indexOf(ephemeraClass);
	}

	/**
	 * Apply the given style to the table as a whole.
	 * @param config The style config.
	 * @param styleName The style to apply.
	 */
	function applyTableStyle(config, styleName) {
		if (!TablePlugin.activeTable) {
			return;
		}

		const tableObj = TablePlugin.activeTable.obj;
		const configItem = config.find(item => item.name === styleName);

		if (!configItem) {
			return;
		}

		const hasStyle = tableObj.hasClass(configItem.cssClass);

		for (const configItem of config) {
			tableObj.removeClass(configItem.cssClass);
		}

		if (!hasStyle) {
			tableObj.addClass(configItem.cssClass);
			TablePlugin._currentStyle = configItem.name;
		} else {
			TablePlugin._currentStyle = null;
		}
	}

	/**
	 * If the specified style is not already active in all selected cells, it is applied;
	 * otherwise, it is removed from the cells
	 *
	 * @param {Array} config defined styles as defined in the configuration
	 * @param {String} cssClass
	 * @param {Array} sc the selection of target table cells
	 */
	function applyStyle(config, cssClass, sc) {
		var appliedToAll = true;

		for (var i = 0; i < sc.length; i++) {
			if (jQuery(sc[i]).attr('class').indexOf(cssClass) < 0) {
				appliedToAll = false;
				break;
			}
		}

		if (!appliedToAll) {
			for (var i = 0; i < sc.length; i++) {
				jQuery(sc[i]).addClass(cssClass);
				for (var f = 0; f < config.length; f++) {
					if (config[f].cssClass != cssClass) {
						jQuery(sc[i]).removeClass(config[f].cssClass);
					}
				}
			}

			TablePlugin._currentStyle = cssClass;
		} else {
			for (var i = 0; i < sc.length; i++) {
				jQuery(sc[i]).removeClass(cssClass);
			}

			TablePlugin._currentStyle = '';
		}
	}

	function createTableSizeSelectFromConfig(
		config,
		name,
		applyChanges,
		validateFn,
		onChangeFn,
		onTouchFn
	) {
		var tmpOptions = config.options || {};
		var component = Ui.adopt(name, TableSizeSelect, {
			maxColumns: tmpOptions.maxColumns,
			maxRows: tmpOptions.maxRows,

			changeNotify: function (value) {
				applyChanges(value);
				validateFn(value);
				onChangeFn(value);
			},
			touchNotify: function () {
				onTouchFn();
			},
		});

		return component;
	}

	function checkVisibility(editable) {
		// If we have no editable, then we don't want to show the button
		if (editable == null || editable.obj == null) {
			TablePlugin._createTableButton.hide();
			return;
		}

		var config = TablePlugin.getEditableConfig(editable.obj);
		var enabled = config
			&& ($.inArray('table', config) > -1)
			&& ContentRules.isAllowed(editable.obj[0], 'table');

		if (enabled) {
			TablePlugin._createTableButton.show();
		} else {
			TablePlugin._createTableButton.hide();
		}
	}

	/**
	 * Init method of the Table-plugin transforms all tables in the document
	 *
	 * @return void
	 */
	TablePlugin.init = function () {
		DynamicForm.componentFactoryRegistry['table-size-select'] = createTableSizeSelectFromConfig;

		Ephemera.classes(TablePlugin.get('className'), TablePlugin.get('classCellSelected'));

		TablePlugin.tableConfig = TablePlugin.checkConfig(TablePlugin.tableConfig || TablePlugin.settings.tableConfig);
		TablePlugin.columnConfig = TablePlugin.checkConfig(TablePlugin.columnConfig || TablePlugin.settings.columnConfig);
		TablePlugin.rowConfig = TablePlugin.checkConfig(TablePlugin.rowConfig || TablePlugin.settings.rowConfig);
		TablePlugin.cellConfig = TablePlugin.checkConfig(TablePlugin.cellConfig || TablePlugin.settings.cellConfig);

		TablePlugin.tableResize = TablePlugin.settings.tableResize === undefined ? false : TablePlugin.settings.tableResize;
		TablePlugin.colResize = TablePlugin.settings.colResize === undefined ? false : TablePlugin.settings.colResize;
		TablePlugin.rowResize = TablePlugin.settings.rowResize === undefined ? false : TablePlugin.settings.rowResize;
		TablePlugin.defaultClass = TablePlugin.settings.defaultClass || '';
		TablePlugin.defaultRowClass = TablePlugin.settings.defaultRowClass || '';
		TablePlugin.defaultHeaderRowClass = TablePlugin.settings.defaultHeaderRowClass || '';
		TablePlugin.defaultCellClass = TablePlugin.settings.defaultCellClass || '';
		TablePlugin.defaultHeaderCellClass = TablePlugin.settings.defaultHeaderCellClass || '';

		// disable table resize settings on browsers below IE8
		if (jQuery.browser.msie && parseInt(jQuery.browser.version, 10) < 8) {
			TablePlugin.tableResize = false;
			TablePlugin.colResize = false;
			TablePlugin.rowResize = false;
		}

		// initialize the table buttons
		TablePlugin.initTableButtons();

		var actuallyLeftEditable = true;

		// Set the button visible if it's enabled via the config
		PubSub.sub('aloha.editable.activated', function (message) {
			actuallyLeftEditable = false;
			var editable = message.editable;
			checkVisibility(editable);

			// Disable these buttons, as we are not yet in a table context
			TablePlugin._tableCellsSplitButton.disable();
			TablePlugin._tableCellsMergeButton.disable();

			// Check existing tables in the editable, if they are registered/initialized
			message.editable.obj.find('table').each(function () {
				var registry = TablePlugin.TableRegistry;
				for (var i = 0; i < registry.length; i++) {
					if (registry[i].obj.attr('id') === jQuery(this).attr('id')) {
						registry[i].activate();
						return true;
					}
				}
				// Because table this is a new table that is not yet in the
				// registry
				createNewTable(this);
			});
		});

		// Reset and hide the button when leaving an editable
		PubSub.sub('aloha.editable.deactivated', function () {
			actuallyLeftEditable = true;
			TablePlugin._createTableButton.hide();

			if (TablePlugin.activeTable) {
				TablePlugin.activeTable.selection.unselectCells();
			}
			TablePlugin.setFocusedTable(undefined);
			var registry = TablePlugin.TableRegistry;
			for (var i = 0; i < registry.length; i++) {
				registry[i].deactivate();
			}
		});

		checkVisibility(Aloha.activeEditable);

		PubSub.sub('aloha.editable.created', function (message) {
			var editable = message.editable;

			// Just for safety
			if (editable == null || editable.obj == null) {
				return;
			}

			editable.obj.on('mousedown', function () {
				if (!TablePlugin.activeTable) {
					return;
				}

				TablePlugin.setFocusedTable(undefined);

				// Make sure the table tabs in the toolbar are hidden, since
				// we no longer have an active table.
				TablePlugin.leaveTableScopes();
				Scopes.leaveScope(TablePlugin.name);
			});

			editable.obj.find('table').each(function (index, elem) {
				createNewTable(elem);
			});
		});

		Aloha.bind('aloha-table-selection-changed', function () {
			TablePlugin.updateButtonStates();

			// check if selected cells are split/merge able and set button status
			if (!TablePlugin.activeTable || !TablePlugin.activeTable.selection) {
				return;
			}

			TablePlugin.updateFloatingMenuScope();
		});

		//		PubSub.sub('aloha.selection.context-change', function (message) {
		// Problem with this PubSub.sub event:
		// This event is only thrown if the context has changed. (selection.js:126:triggerSelectionContextChanged)
		// This makes that the scope changes to Aloha.continuoustext (scopes.js:43).
		// This is because selection is called a least twice (selection.js:525). The second time the context has not changed.
		Aloha.bind('aloha-selection-changed', function (event, rangeObject) {
			var range = rangeObject;
			var editable = Aloha.activeEditable;

			// this case probably occurs when the selection is empty?
			if (!range.startContainer || !editable) {
				TablePlugin.leaveTableScopes();
				return;
			}

			// If we have no active editable, we don't need to do anything
			if (!actuallyLeftEditable) {
				// show hide buttons regarding configuration and DOM position
				if (!Aloha.Selection.mayInsertTag('table')) {
					TablePlugin._createTableButton.hide();
				} else {
					checkVisibility(editable);
				}
			}

			if (!TablePlugin.activeTable) {
				TablePlugin.leaveTableScopes();
				return;
			}

			var table = range.findMarkup(function () {
				return this.nodeName === 'TABLE';
			}, editable.obj);

			if (table) {
				TablePlugin.updateButtonStates();
				TablePlugin.updateFloatingMenuScope();
				TablePlugin.setActiveCellStyle();
			} else {
				TablePlugin.leaveTableScopes();
				TablePlugin.activeTable.selection.cellSelectionMode = false;
				TablePlugin.activeTable.selection.baseCellPosition = null;
				TablePlugin.activeTable.selection.lastSelectionRange = null;
				TablePlugin.activeTable.focusOut();
			}
			TablePlugin.updateSummaryButton();
		});

		Aloha.bind('aloha-smart-content-changed', function (event, data) {
			if (!Aloha.activeEditable) {
				return;
			}
			Aloha.activeEditable.obj.find('table').each(function () {
				if (TablePlugin.indexOfTableInRegistry(this) !== -1) {
					return;
				}
				if (createNewTable(this)) {
					this.id = GENTICS.Utils.guid();
				}
			});
		});
	};

	var tableNamespace = 'aloha-table';

	function nsSel() {
		var stringBuilder = [], prefix = tableNamespace;
		jQuery.each(arguments, function () {
			stringBuilder.push('.' + (this == '' ? prefix : prefix + '-' + this));
		});
		return jQuery.trim(stringBuilder.join(' '));
	}

	//Creates string with this component's namepsace prefixed the each classname
	function nsClass() {
		var stringBuilder = [], prefix = tableNamespace;
		jQuery.each(arguments, function () {
			stringBuilder.push(this == '' ? prefix : prefix + '-' + this);
		});
		return jQuery.trim(stringBuilder.join(' '));
	}

	TablePlugin._cellStyleOptions = [];
	TablePlugin._currentStyle = '';
	TablePlugin._styleTypesById = {};

	TablePlugin.updateCellStyleOptions = function() {
		const haveTableConfig = Array.isArray(TablePlugin.settings.tableConfig) && TablePlugin.settings.tableConfig.length > 0;
		const haveCellConfig = Array.isArray(TablePlugin.settings.cellConfig) && TablePlugin.settings.cellConfig.length > 0;
		const haveColumnConfig = Array.isArray(TablePlugin.settings.columnConfig) && TablePlugin.settings.columnConfig.length > 0;
		const haveRowConfig = Array.isArray(TablePlugin.settings.rowConfig) && TablePlugin.settings.rowConfig.length > 0;

		const selType = TablePlugin.activeTable
			&& TablePlugin.activeTable.selection
			&& TablePlugin.activeTable.selection.selectionType;

		const getOptions = function (type, config, currentOptions) {
			for (let i = 0; i < config.length; i++) {
				const option = config[i];

				if (currentOptions[option.name]) {
					continue;
				}

				if (option.name && option.label) {
					currentOptions[option.name] = {
						id: option.name,
						type: type,
						icon: option.icon,
						iconHollow: option.iconHollow || false,
						label: option.label
					};
				}
			}

			return currentOptions;
		}

		var options = [];
		const currentOptions = {};

		if (haveCellConfig) {
			options = Object.values(getOptions('cell', TablePlugin.settings.cellConfig, currentOptions));
		}

		if (haveColumnConfig && (selType === 'column' || selType === 'all')) {
			options = Object.values(getOptions('column', TablePlugin.settings.columnConfig, currentOptions));
		}

		if (haveRowConfig && (selType === 'row' || selType === 'all')) {
			options = Object.values(getOptions('row', TablePlugin.settings.rowConfig, currentOptions));
		}

		if (haveTableConfig && selType === 'all') {
			options = Object.values(getOptions('table', TablePlugin.settings.tableConfig, currentOptions));
		}

		let optionTypes = {};

		for (const option of options) {
			optionTypes[option.id] = option.type;
		}

		TablePlugin._cellStyleOptions = options;
		TablePlugin._currentStyle = TablePlugin._getCurrentStyle(selType, options);
		TablePlugin._styleTypesById = optionTypes;
	};

	TablePlugin._getCurrentStyle = function (selType, options) {
		const tableObj = TablePlugin.activeTable ? TablePlugin.activeTable.obj : null;

		if (!tableObj || tableObj.length === 0) {
			return '';
		}

		if (selType === 'all') {
			for (const option of options) {
				if (tableObj.hasClass(option.id)) {
					return option.id;
				}
			}
		} else {
			for (const option of options) {
				let cells = [];

				try {
					cells = TablePlugin.selectedOrActiveCells();
				} catch (e) {
					return '';
				}

				let allCellsHaveStyle = true;

				for (const cell of TablePlugin.selectedOrActiveCells()) {
					if (!$(cell).hasClass(option.id)) {
						allCellsHaveStyle = false;

						break;
					}
				}

				if (allCellsHaveStyle) {
					return option.id;
				}
			}

		}

		return '';
	}

	TablePlugin.updateButtonStates = function () {
		var selection = TablePlugin
			&& TablePlugin.activeTable
			&& TablePlugin.activeTable.selection;

		if (selection != null && selection.cellsAreSplitable()) {
			TablePlugin._tableCellsSplitButton.enable();
		} else {
			TablePlugin._tableCellsSplitButton.disable();
		}

		if (selection != null && selection.cellsAreMergeable()) {
			TablePlugin._tableCellsMergeButton.enable();
		} else {
			TablePlugin._tableCellsMergeButton.disable();
		}

		if (selection != null && (selection.selectedCells == null || selection.selectedCells.length === 0)) {
			TablePlugin._tableRowAddBeforeButton.disable();
			TablePlugin._tableRowAddAfterButton.disable();
			TablePlugin._tableColumnAddLeftButton.disable();
			TablePlugin._tableColumnAddRightButton.disable();
		} else {
			TablePlugin._tableRowAddBeforeButton.enable();
			TablePlugin._tableRowAddAfterButton.enable();
			TablePlugin._tableColumnAddLeftButton.enable();
			TablePlugin._tableColumnAddRightButton.enable();
		}

		TablePlugin.updateCellStyleOptions();

		if (TablePlugin._cellStyleOptions.length === 0) {
			TablePlugin._tableCellStyleButton.disable();
		} else {
			TablePlugin._tableCellStyleButton.enable();
		}

		TablePlugin.updateSummaryButton();
	}

	/**
	 * Update the Summary Icon
	 */
	TablePlugin.updateSummaryButton = function () {
		if (TablePlugin.activeTable) {
			TablePlugin._summary.setTargetElement(TablePlugin.activeTable.obj);
			TablePlugin._summary.activateInput(true);
			TablePlugin._summary.enable();

			if (TablePlugin.activeTable.checkWai()) {
				TablePlugin._summary.setIcon('check_circle');
			} else {
				TablePlugin._summary.setIcon('cancel');
			}
		} else {
			TablePlugin._summary.setTargetElement(null);
			TablePlugin._summary.deactivateInput();
			TablePlugin._summary.disable();
			TablePlugin._summary.setIcon('description');
		}
	}

	/**
	 * test if the table is editable
	 * @return boolean true if the table's parent element is contentEditable, false otherwise
	 */
	TablePlugin.isEditableTable = function (table) {
		return GENTICS.Utils.Dom.isEditable(table);
	};

	/**
	 * @param {DOMElement} table
	 * @return {Number}
	 */
	TablePlugin.indexOfTableInRegistry = function (table) {
		var registry = TablePlugin.TableRegistry;

		for (var i = 0; i < registry.length; i++) {
			// We need to find exactly the same object from the
			// registry since we could also deal with cloned objects
			if (registry[i].obj[0].id == table.id) {
				return i;
			}
		}

		return -1;
	};

	/**
	 * @param {DOMElement} table
	 * @return {Table}
	 */
	TablePlugin.getTableFromRegistry = function (table) {
		var i = TablePlugin.indexOfTableInRegistry(table);
		if (i > -1) {
			return TablePlugin.TableRegistry[i];
		}
		return null;
	};

	/**
	 * Checks whether the current selection is inside a table within an
	 * editable
	 *
	 * @return {Boolean} true if we are inside a table
	 */
	TablePlugin.isSelectionInTable = function () {
		var range = Aloha.Selection.getRangeObject();
		var container = jQuery(range.commonAncestorContainer);

		if (container.length == 0) {
			return false;
		}

		if (container.parents('.aloha-editable table').length) {
			return true;
		}

		return false;
	};

	TablePlugin.toggleHeaderStatus = toggleHeaderStatus;

	TablePlugin.preventNestedTables = function () {
		if (TablePlugin.isSelectionInTable()) {
			Dialog.alert({
				title: i18n.t('Table'),
				text: i18n.t('table.createTable.nestedTablesNoSupported')
			});

			return true;
		}

		return false;
	};

	TablePlugin.initMergeSplitCellsBtns = function () {
		TablePlugin._tableCellsMergeButton = Ui.adopt("tableCellsMerge", Button, {
			tooltip: i18n.t("button.mergecells.tooltip"),
			icon: Icons.TABLE_MERGE_CELLS,
			click: function () {
				if (TablePlugin.activeTable) {
					TablePlugin.activeTable.selection.mergeCells();
				}
			}
		});

		TablePlugin._tableCellsSplitButton = Ui.adopt("tableCellsSplit", Button, {
			tooltip: i18n.t("button.splitcells.tooltip"),
			icon: Icons.TABLE_SPLIT_CELLS,
			click: function () {
				var activeCell;
				if (TablePlugin.activeTable) {
					if (TablePlugin.activeTable.selection.selectedCells.length > 0) {
						TablePlugin.activeTable.selection.splitCells();
					} else {
						// if there is currently no selection, the active cell is split instead
						activeCell = TablePlugin.selectedOrActiveCells();
						if (activeCell.length > 0) {
							Utils.splitCell(activeCell, function () {
								return TablePlugin.activeTable.newActiveCell(Utils.copyCellMarkup(activeCell[0])).obj;
							});


							Aloha.activeEditable.smartContentChange({ type: 'block-change', plugin: 'table-plugin' });
							Aloha.trigger('aloha-table-selection-changed');
						}
					}
				}
			}
		});

		TablePlugin._tableSelectionHeaderButton = Ui.adopt("tableSelectionHeader", ToggleButton, {
			tooltip: i18n.t("button.selectionheader.tooltip"),
			icon: Icons.TABLE_SELECTION_HEADER,
			pure: true,
			click: function () {
				if (!TablePlugin.activeTable) {
					return;
				}
				TablePlugin.activeTable.refresh();

				var rowSelection = TablePlugin.activeTable.selection.getCurrentSelectionTypes().indexOf('row') >= 0;

				toggleHeaderStatus(TablePlugin.activeTable, rowSelection ? 'row' : 'column');

				// Update selection to the new column/row.
				if (rowSelection) {
					TablePlugin.activeTable.selection.selectRows(TablePlugin.activeTable.selection.selectedRowIdxs);
				} else {
					TablePlugin.activeTable.selection.selectColumns(TablePlugin.activeTable.selection.selectedColumnIdxs);
				}
				TablePlugin.activeTable.selection.unselectCells();
			}
		});

		TablePlugin._tableSelectionDelete = Ui.adopt("tableSelectionDelete", Button, {
			tooltip: i18n.t("button.delrows.tooltip"),
			icon: Icons.TABLE_DELETE_SELECTION,
			click: function () {
				if (!TablePlugin.activeTable) {
					return;
				}

				var aTable = TablePlugin.activeTable;
				var rowSelection = aTable.selection.getCurrentSelectionTypes().indexOf('row') >= 0;
				var msg = rowSelection ? i18n.t('deleterows.confirm') : i18n.t('deletecolumns.confirm');

				Dialog.confirm({
					title: i18n.t('Table'),
					text: msg,
					yes: function () {
						if (rowSelection) {
							aTable.deleteRows();
						} else {
							aTable.deleteColumns();
						}
					}
				});
			}
		});
	};

	/**
	 * Adds default row buttons, and custom formatting buttons to floating menu
	 */
	TablePlugin.initRowsBtns = function () {
		TablePlugin._tableRowAddBeforeButton = Ui.adopt("tableRowAddBefore", Button, {
			tooltip: i18n.t("button.addrowbefore.tooltip"),
			icon: Icons.TABLE_ADD_ROW_BEFORE,
			iconHollow: true,
			click: function () {
				if (TablePlugin.activeTable) {
					TablePlugin.activeTable.addRowBeforeSelection();
				}
			}
		});

		TablePlugin._tableRowAddAfterButton = Ui.adopt("tableRowAddAfter", Button, {
			tooltip: i18n.t("button.addrowafter.tooltip"),
			icon: Icons.TABLE_ADD_ROW_AFTER,
			iconHollow: true,
			click: function () {
				if (TablePlugin.activeTable) {
					TablePlugin.activeTable.addRowAfterSelection();
				}
			}
		});
	};

	/**
	 * Adds default column buttons, and custom formatting buttons to floating menu
	 */
	TablePlugin.initColumnBtns = function () {
		TablePlugin._tableColumnAddLeftButton = Ui.adopt("tableColumnAddLeft", Button, {
			tooltip: i18n.t("button.addcolleft.tooltip"),
			icon: Icons.TABLE_ADD_COLUMN_LEFT,
			iconHollow: true,
			click: function () {
				if (TablePlugin.activeTable) {
					TablePlugin.activeTable.addColumnsLeft();
				}
			}
		});

		TablePlugin._tableColumnAddRightButton = Ui.adopt("tableColumnAddRight", Button, {
			tooltip: i18n.t("button.addcolright.tooltip"),
			icon: Icons.TABLE_ADD_COLUMN_RIGHT,
			iconHollow: true,
			click: function () {
				if (TablePlugin.activeTable) {
					TablePlugin.activeTable.addColumnsRight();
				}
			}
		});

		TablePlugin._tableCellStyleButton = Ui.adopt('tableCellStyle', ContextToggleButton, {
			contextType: 'dropdown',
			tooltip: i18n.t("button.cellstyle.tooltip"),
			icon: Icons.TABLE_STYLE_CELLS,
			context: function () {
				if (TablePlugin._cellStyleOptions.length === 0) {
					return null;
				}

				return {
					type: 'select-menu',
					options: {
						iconsOnly: false,
						options: TablePlugin._cellStyleOptions
					},
					initialValue: TablePlugin._currentStyle
				}
			},
			contextResolve: function (selection) {
				if (TablePlugin.activeTable) {
					const config = [];
					const configType = `${TablePlugin._styleTypesById[selection.id]}Config`;

					if (configType === 'tableConfig' && TablePlugin.tableConfig) {
						applyTableStyle(TablePlugin.tableConfig, selection.id);
					} else if (TablePlugin[configType]) {
						applyStyle(TablePlugin[configType], selection.id, TablePlugin.selectedOrActiveCells());
					}

					TablePlugin.setActiveCellStyle();
				}
			}
		});
	};

	/**
	 * initialize the buttons and register them on floating menu
	 */
	TablePlugin.initTableButtons = function () {
		// generate the new scopes
		Scopes.registerScope(TablePlugin.name, [Scopes.SCOPE_CONTINUOUS_TEXT]);
		Scopes.registerScope(TablePlugin.name + '.row', [TablePlugin.name]);
		Scopes.registerScope(TablePlugin.name + '.column', [TablePlugin.name]);
		Scopes.registerScope(TablePlugin.name + '.cell', [TablePlugin.name]);

		TablePlugin._createTableButton = Ui.adopt("createTable", ContextButton, {
			tooltip: i18n.t("button.createtable.tooltip"),
			icon: Icons.TABLE_CREATE,
			context: function () {
				// Can't open/insert a table without an editable to place it in
				if (Aloha.activeEditable == null || Aloha.activeEditable.obj == null) {
					return null;
				}

				return {
					type: 'table-size-select',
					options: {
						maxColumns: 10,
						maxRows: 10,
					}
				}
			},
			contextType: 'dropdown',
			contextResolve: function (size) {
				TablePlugin.createTable(size.columns, size.rows);
			}
		});

		// now the specific table buttons

		// generate formatting buttons for columns
		TablePlugin.initColumnBtns();

		// generate formatting buttons for rows
		TablePlugin.initRowsBtns();

		TablePlugin.initMergeSplitCellsBtns();

		TablePlugin._tableDeleteButton = Ui.adopt("tableDelete", Button, {
			tooltip: i18n.t("button.deltable.tooltip"),
			icon: Icons.TABLE_DELETE,
			click: function () {
				if (!TablePlugin.activeTable) {
					return;
				}

				var aTable = TablePlugin.activeTable;
				Dialog.confirm({
					title: i18n.t('Table'),
					text: i18n.t('deletetable.confirm'),
					yes: function () {
						aTable.deleteTable();
					}
				});
			}
		});

		TablePlugin._tableCaptionButton = Ui.adopt("tableCaption", ToggleButton, {
			tooltip: i18n.t("button.caption.tooltip"),
			icon: Icons.TABLE_CAPTION,
			pure: true,
			click: function () {
				if (!TablePlugin.activeTable) {
					return;
				}

				// look if table object has a child caption
				var $caption = TablePlugin.activeTable.obj.children("caption");

				if ($caption.is('caption') && $caption.is(':visible')) {
					$caption.hide();
					TablePlugin._tableCaptionButton.deactivate();
					return;
				}

				if (!$caption.is('caption')) {
					$caption = jQuery('<caption></caption>');
					TablePlugin.activeTable.obj.prepend($caption);
				}
				$caption.show();
				if (jQuery.trim($caption.text()).length === 0) {
					$caption.text(i18n.t('empty.caption'));
				}
				TablePlugin._tableCaptionButton.activate();

				TablePlugin.makeCaptionEditable($caption, $caption.text());

				// get the editable span within the caption and select it
				var cDiv = $caption.find('div').eq(0);
				var captionContent = cDiv.contents().eq(0);
				if (captionContent.length > 0) {
					var newRange = new GENTICS.Utils.RangeObject();
					newRange.startContainer = newRange.endContainer = captionContent.get(0);
					newRange.startOffset = 0;
					newRange.endOffset = captionContent.text().length;

					// blur all editables within the table
					TablePlugin.activeTable.obj.find('div.aloha-table-cell-editable').blur();

					cDiv.focus();
					newRange.select();
					Aloha.Selection.updateSelection();
				}
			}
		});

		TablePlugin._summary = Ui.adopt('tableSummary', AttributeButton, {
			targetAttribute: 'summary',
			icon: 'description',
			iconHollow: true,
			tooltip: i18n.t('button.summary.tooltip'),
			inputLabel: i18n.t('table.label.target'),
			panelTitle: i18n.t('table.sidebar.title'),
			click: function () {
				if (TablePlugin._summary && TablePlugin._summary.panelInputElement) {
					TablePlugin._summary.panelInputElement.focus();
				}
			},
			onChange: function () {
				TablePlugin.updateSummaryButton();
			}
		});
	};

	/**
	 * Helper method to make the caption editable
	 * @param caption caption as jQuery object
	 * @param captionText default text for the caption
	 */
	TablePlugin.makeCaptionEditable = function (caption, captionText) {
		var cSpan = caption.children('div');
		if (cSpan.length === 0) {
			// generate a new div
			cSpan = jQuery('<div></div>');
			cSpan.addClass('aloha-ui aloha-editable-caption aloha-block');

			// mark the editable wrapper as ephemeral
			Ephemera.markWrapper(cSpan);

			if (caption.contents().length > 0) {
				// when the caption has content, we wrap it with the new div
				cSpan.append(caption.contents());
				caption.append(cSpan);
			} else {
				// caption has no content, so insert the default caption text
				if (captionText) {
					cSpan.text(captionText);
				}
				// and append the div into the caption
				caption.append(cSpan);
			}
		} else if (cSpan.length > 1) {
			// merge multiple divs (they are probably created by IE)
			caption.children('div:not(:first-child)').each(function () {
				$this = jQuery(this);
				cSpan.eq(0).append($this.contents());
				$this.remove();
			});
			cSpan = cSpan.eq(0);
		}
		// make the div editable
		cSpan.contentEditable(true);
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
	TablePlugin.createTable = function (cols, rows) {
		if (TablePlugin.preventNestedTables()) {
			return;
		}

		// Check if there is an active Editable and that it contains an element (= .obj)
		if (!Aloha.activeEditable || typeof Aloha.activeEditable.obj == null) {
			TablePlugin.error('There is no active Editable where the table can be inserted!');
			return;
		}

		// create a dom-table object
		var table = document.createElement('table');
		var tableId = table.id = GENTICS.Utils.guid();
		var tbody = document.createElement('tbody');

		// create "rows"-number of rows
		for (var i = 0; i < rows; i++) {
			var tr = document.createElement('tr');
			// create "cols"-number of columns
			for (var j = 0; j < cols; j++) {
				var text = document.createTextNode('');
				var td = document.createElement('td');
				td.appendChild(text);
				tr.appendChild(td);
			}
			tbody.appendChild(tr);
		}
		applyDefaultClassesToTable(table);
		table.appendChild(tbody);

		prepareRangeContainersForInsertion(Aloha.Selection.getRangeObject(), table);

		// insert the table at the current selection
		GENTICS.Utils.Dom.insertIntoDOM(
			jQuery(table),
			Aloha.Selection.getRangeObject(),
			Aloha.activeEditable.obj
		);

		cleanupAfterInsertion();

		var tableReloadedFromDOM = document.getElementById(tableId);
		var tableObj = createNewTable(tableReloadedFromDOM);

		if (tableObj) {
			var range = Aloha.Selection.getRangeObject();

			range.startContainer = range.endContainer = tableObj.cells[0].wrapper[0];
			range.startOffset = range.endOffset = 0;
			range.select();

			// Because without the 10ms delay, we cannot place the cursor
			// automatically into the first cell in IE.
			if ($.browser.msie) {
				window.setTimeout(function () {
					tableObj.cells[0].wrapper.get(0).focus();
				}, 20);
			} else {
				tableObj.cells[0].wrapper.get(0).focus();
			}
		}

		Aloha.activeEditable.smartContentChange({ type: 'block-change', plugin: 'table-plugin' });

		// The selection starts out in the first cell of the new
		// table. The table tab/scope has to be activated
		// accordingly.
		tableObj.focus();
		TablePlugin.activeTable.selection.selectionType = 'cell';
		if (typeof TablePlugin.tabId === 'string' && TablePlugin.tabId) {
			UiPlugin.getActiveSurface().focusTab(TablePlugin.tabId);
		}
		TablePlugin.updateFloatingMenuScope();
		TablePlugin.updateButtonStates();
	};

	TablePlugin.setFocusedTable = function (focusTable) {
		// clicking outside the table unselects the cells of the table
		if (null != TablePlugin.activeTable) {
			TablePlugin.activeTable.selection.unselectCells();
		}

		for (var i = 0; i < TablePlugin.TableRegistry.length; i++) {
			TablePlugin.TableRegistry[i].hasFocus = false;
		}
		if (focusTable != null) {
			if (focusTable.obj.children("caption").is('caption')) {
				// set caption button
				TablePlugin._tableCaptionButton.setActive(true);
				var c = focusTable.obj.children("caption");
				TablePlugin.makeCaptionEditable(c);
			}
			focusTable.hasFocus = true;
		}

		TablePlugin.activeTable = focusTable;
		TablePlugin.updateButtonStates();
	};

	/**
	 * Calls the Aloha.log function with 'error' level
	 *
	 * @see Aloha.log
	 * @param msg
	 *            The message to display
	 * @return void
	 */
	TablePlugin.error = function (msg) {
		Aloha.Log.error(TablePlugin, msg);
	};

	/**
	 * Calls the Aloha.log function with 'debug' level
	 *
	 * @see Aloha.log
	 * @param msg
	 *            The message to display
	 * @return void
	 */
	TablePlugin.debug = function (msg) {
		Aloha.Log.debug(TablePlugin, msg);
	};

	/**
	 * Calls the Aloha.log function with 'info' level
	 *
	 * @see Aloha.log
	 * @param msg
	 *            The message to display
	 * @return void
	 */
	TablePlugin.info = function (msg) {
		Aloha.Log.info(TablePlugin, msg);
	};

	/**
	 * Calls the Aloha.log function with 'info' level
	 *
	 * @see Aloha.log
	 * @param msg
	 *            The message to display
	 * @return void
	 */
	TablePlugin.log = function (msg) {
		Aloha.log('log', TablePlugin, msg);
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
	TablePlugin.get = function (property) {
		if (TablePlugin.config[property]) {
			return TablePlugin.config[property];
		}
		if (TablePlugin.parameters[property]) {
			return TablePlugin.parameters[property];
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
	TablePlugin.set = function (key, value) {
		if (TablePlugin.config[key]) {
			TablePlugin.config[key] = value;
		} else {
			TablePlugin.parameters[key] = value;
		}
	};

	/**
	 * Make the given jQuery object (representing an editable) clean for saving
	 * Find all tables and deactivate them
	 * @param obj jQuery object to make clean
	 * @return void
	 */
	TablePlugin.makeClean = function (obj) {
		// it is generally not necessary to do anything here, because everything is handled by Ephemera.
		// the only exception is removing the cursor styles, because as of this moment, Ephemera is not capable
		// of removing css
		obj.find('td, th').css('cursor', '');
	};

	/**
	 * String representation of the Table-object
	 *
	 * @return The plugins namespace (string)
	 */
	TablePlugin.toString = function () {
		return TablePlugin.prefix;
	};

	/**
	 * Leaves all possible TableScopes in the floating menu
	 * expect those in the retainScopes array
	 *
	 * @param  {array} retainScopes the name of the scopes which should not be left
	 */
	TablePlugin.leaveTableScopes = function (retainScopes, force) {
		var i = 0,
			scopes = [];
		retainScopes = $.isArray(retainScopes) ? retainScopes : [];

		scopes = TableSelection.getPossibleSelectionTypes();
		for (i = 0; i < scopes.length; i++) {
			// leave all possible scopes expect those in the retainScopes array
			if ($.inArray(scopes[i], retainScopes) === -1) {
				// always force leaving the scope because otherwise we need to keep track of how
				// often we entered the scope and leave it accordingly
				Scopes.leaveScope(TablePlugin.name + '.' + scopes[i], undefined, true);
			}
		}
	}
	/**
	 * Update the current floating menu scope according to the
	 * selected cells
	 */
	TablePlugin.updateFloatingMenuScope = function () {
		var i = 0,
			scopes;
		if (
			null != TablePlugin.activeTable &&
			null != TablePlugin.activeTable.selection.selectionType
		) {
			// get the new scopes
			scopes = TablePlugin.activeTable.selection.getCurrentSelectionTypes();
			// leave all scopes except the the current ones
			TablePlugin.leaveTableScopes(scopes);
			// Enter all needed table scopes
			for (i = 0; i < scopes.length; i++) {
				Scopes.enterScope(TablePlugin.name + '.' + scopes[i]);
			}
		} else {
			// leave all scopes
			TablePlugin.leaveTableScopes();
			Scopes.leaveScope(TablePlugin.name);
		}
	};

	/**
	 * Set the cell-style to match the active item, if all selected cells have the same style
	 * TODO: Algorithm very similar to setActiveStyle in table.js, should be refactored
	 */
	TablePlugin.setActiveCellStyle = function () {
		var className;

		var selectedCells = TablePlugin.selectedOrActiveCells();

		for (var i = 0; i < TablePlugin.cellConfig.length; i++) {
			if (jQuery(selectedCells[0]).hasClass(TablePlugin.cellConfig[i].cssClass)) {
				className = TablePlugin.cellConfig[i].name;
				allSelected = true;
				break;
			}
		}

		// if all selected cells have the same class, set it as active
		jQuery(selectedCells).each(function (index) {
			if (!jQuery(this).hasClass(className)) {
				allSelected = false;
			}
		});
	};

	TablePlugin.selectedOrActiveCells = function () {
		var sc = TablePlugin.activeTable.selection.selectedCells;

		// if there are no selected cells,
		// set the active cell as the selected cell.
		if (!sc || sc.length < 1) {
			var activeCell = function () {
				var range = Aloha.Selection.getRangeObject();
				if (!Aloha.activeEditable) {
					return null;
				}
				return range.findMarkup(function () {
					var nodeName = this.nodeName.toLowerCase();

					return nodeName === 'td' || nodeName === 'th';
				}, Aloha.activeEditable.obj);
			}

			var active_cell = activeCell();
			return (active_cell ? [active_cell] : []);
		} else {
			return sc;
		}
	};

	/**
	 * Detects a situation where we are about to insert content into a
	 * selection that looks like this: <p> [</p>...
	 * We will assume that the nbsp inside the <p> node was placed there to
	 * "prop-up" the empty paragraph--that is--to make the empty paragraph
	 * visible in HTML5 conformant rendering engines, like WebKit. Without the
	 * white space, such browsers would correctly render an empty <p> as
	 * invisible.
	 *
	 * If we detect this situation, we remove the white space so that when we
	 * paste new content into the paragraph, it is not be split and leaving an
	 * empty paragraph on top of the pasted content.
	 *
	 * Note that we do not use <br />'s to prop up the paragraphs, as WebKit
	 * does, because IE, will break from the HTML5 specification and will
	 * display empty paragraphs if they are content-editable. So a <br />
	 * inside an empty content-editable paragraph will result in 2 lines to be
	 * shown instead of 1 in IE.
	 *
	 * @param {Object} range
	 * @param {DOMElement} table
	 */
	function prepareRangeContainersForInsertion(range, table) {
		var eNode = range.endContainer,
			sNode = range.startContainer,
			eNodeLength = (eNode.nodeType == 3)
				? eNode.length
				: eNode.childNodes.length;


		if (sNode.nodeType == 3 &&
			sNode.parentNode.tagName == 'P' &&
			sNode.parentNode.childNodes.length == 1 &&
			/^(\s|%A0)$/.test(escape(sNode.data))) {
			sNode.data = '';
			range.startOffset = 0;

			// In case ... <p> []</p>
			if (eNode == sNode) {
				range.endOffset = 0;
			}
		}

		// If the table is not allowed to be nested inside the startContainer,
		// then it will have to be split in order to insert the table.
		// We will therefore check if the selection touches the start and/or
		// end of their container nodes.
		// If they do, we will mark their container so that after they are
		// split we can check whether or not they should be removed
		if (!GENTICS.Utils.Dom.allowsNesting(
			sNode.nodeType == 3 ? sNode.parentNode : sNode, table)) {

			if (range.startOffset == 0) {
				jQuery(sNode.nodeType == 3 ? sNode.parentNode : sNode)
					.addClass('aloha-table-cleanme');
			}

			if (range.endOffset == eNodeLength) {
				jQuery(eNode.nodeType == 3 ? eNode.parentNode : eNode)
					.addClass('aloha-table-cleanme');
			}
		}
	};

	/**
	 * Looks for elements marked with "aloha-table-cleanme", and removes them
	 * if they are absolutely empty.
	 * Note that this will leave paragraphs which contain empty nested elements
	 * even though they are also invisible.
	 * We can consider removing these as well at a later stage, if needed.
	 */
	function cleanupAfterInsertion() {
		var dirty = jQuery('.aloha-table-cleanme').removeClass(
			'aloha-table-cleanme');
		// check all children of the element we want
		for (var i = 0; i < dirty.length; i++) {
			// get the children of the to be cleaned element for some checks
			var dirtyChildren = jQuery(dirty[i]).children();
			// is the element empty
			// is the first child <br class="aloha-end-br"> - placeholder element
			// is the element not the editing Host
			if ((jQuery.trim(jQuery(dirty[i]).html()) == '' ||
				(dirtyChildren.length === 1 &&
					dirtyChildren.first('br.aloha-end-br'))) &&
				!GENTICS.Utils.Dom.isEditingHost(dirty[i])) {
				jQuery(dirty[i]).remove();

				/*
				// For debugging: to see what we are deleting
				jQuery( dirty[ i ] ).css({
					border: '3px solid red',
					display: 'block'
				});
				*/
			}
		}
	};

	return TablePlugin;
});
