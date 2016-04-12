/* table-plugin.js is part of the Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * License http://aloha-editor.org/license.php
 */
define([
	'aloha',
	'jquery',
	'PubSub',
	'aloha/plugin',
	'aloha/pluginmanager',
	'aloha/content-rules',
	'ui/ui',
	'ui/scopes',
	'ui/button',
	'ui/toggleButton',
	'ui/dialog',
	'ui/port-helper-attribute-field',
	'ui/port-helper-multi-split',
	'i18n!table/nls/i18n',
	'i18n!aloha/nls/i18n',
	'table/table-create-layer',
	'table/table',
	'table/table-plugin-utils',
	'table/table-selection',
	'util/dom',
	'aloha/ephemera',
	'aloha/console'
], function (
	Aloha,
	$,
	PubSub,
	Plugin,
	PluginManager,
	ContentRules,
	Ui,
	Scopes,
	Button,
	ToggleButton,
	Dialog,
	AttributeField,
	MultiSplitButton,
	i18n,
	i18nCore,
	CreateLayer,
	Table,
	Utils,
	TableSelection,
	Dom,
	Ephemera,
	Console
) {
	var jQuery = $;
	var GENTICS = window.GENTICS;
	var configurations = {};

	/**
	 * Register the TablePlugin as Aloha.Plugin
	 */
	var TablePlugin = new Plugin('table');

	/**
	 * The Create-Layer Object of the TablePlugin
	 *
	 * @see Table.CreateLayer
	 */
	TablePlugin.createLayer = undefined;

	/**
	 * default button configuration
	 */
	TablePlugin.config = [ 'table' ];

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
	 * parameters-objects for tables
	 *
	 * @param className
	 *            The class of activated tables
	 */
	TablePlugin.parameters = {
		className            : 'aloha-table',                 // class of editable tables
		classSelectionRow    : 'aloha-table-selectcolumn',    // class for the upper table-row to select columns
		classSelectionColumn : 'aloha-table-selectrow',       // class for the left bound table-cells to select rows
		classLeftUpperCorner : 'aloha-table-leftuppercorner', // class for the left upper corner cell
		classTableWrapper    : 'aloha-table-wrapper',         // class of the outest table-wrapping div
		classCellSelected    : 'aloha-cell-selected',         // class of cell which are selected (row/column selection)
		waiRed               : 'aloha-wai-red',               // class that shows wai of div
		waiGreen             : 'aloha-wai-green',             // class that shows wai of div
		selectionArea        : 10                             // width/height of the selection rows (in pixel)
	};

	/**
	 * @hide
	 * {name:'green', text:'Green',tooltip:'Green',iconClass:'GENTICS_table GENTICS_button_green',cssClass:'green'}
	 */
	TablePlugin.checkConfig = function (c){
		if (typeof c == 'object' && c.length) {
			var newC = [];

			for (var i = 0; i < c.length; i++) {
				if (c[i]) {
					newC.push({
						name      : c[i].name,
						text	  : c[i].text	   ? c[i].text		: c[i].name,
						tooltip	  : c[i].tooltip   ? c[i].tooltip	: c[i].text,
						iconClass : c[i].iconClass ? c[i].iconClass	: 'aloha-icon-' + c[i].name,
						cssClass  : c[i].cssClass  ? c[i].cssClass	: c[i].name
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
	 * Update the WAI image
	 *
	 * @param {TablePlugin} tablePlugin tablePlugin
	 */
	function updateWaiImage(tablePlugin) {
		var $element = $(tablePlugin.summary.getInputElem()),
			waiRed = tablePlugin.activeTable.get('waiRed'),
			waiGreen = tablePlugin.activeTable.get('waiGreen');

		$element.removeClass(waiRed + ' ' + waiGreen);
		if (tablePlugin.activeTable.checkWai()) {
			$element.addClass(waiGreen);
		}
		else {
			$element.addClass(waiRed);
		}
	}

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
		var	i,
			j,
			allHeaders = table.selection.isHeader(),
			domCell, // representation of the cell in the dom
			bufferCell; // temporary buffer

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

			if (cell != null) {
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
			jQuery(table.selection.selectedCells[i]).bind('mousedown', function (jqEvent) {
				var wrapper = jQuery(this).children('div').eq(0);
				window.setTimeout(function () {
					wrapper.trigger( 'focus' );
				}, 1);
			});
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
			if (jQuery(sc[i]).attr('class').indexOf(cssClass) < 0 ) {
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
		} else {
			for (var i = 0; i < sc.length; i++) {
				jQuery(sc[i]).removeClass(cssClass);
			}
		}
	}

	/**
	 * Init method of the Table-plugin transforms all tables in the document
	 *
	 * @return void
	 */
	TablePlugin.init = function() {
		var that = this;

		Ephemera.classes(this.get('className'), this.get('classCellSelected'));

		this.tableConfig  = this.checkConfig(this.tableConfig  || this.settings.tableConfig);
		this.columnConfig = this.checkConfig(this.columnConfig || this.settings.columnConfig);
		this.rowConfig    = this.checkConfig(this.rowConfig    || this.settings.rowConfig);
		this.cellConfig   = this.checkConfig(this.cellConfig   || this.settings.cellConfig);

		this.tableResize  = this.settings.tableResize === undefined ? false : this.settings.tableResize;
		this.colResize    = this.settings.colResize   === undefined ? false : this.settings.colResize;
		this.rowResize    = this.settings.rowResize   === undefined ? false : this.settings.rowResize;
		this.defaultClass = this.settings.defaultClass;

		// disable table resize settings on browsers below IE8
		if (jQuery.browser.msie && parseInt(jQuery.browser.version, 10) < 8) {
			this.tableResize = false;
			this.colResize = false;
			this.rowResize = false;
		}

		// add reference to the create layer object
		this.createLayer = new CreateLayer(this);

		PubSub.sub('aloha.editable.created', function (message) {
			var editable = message.editable;
			var config = that.getEditableConfig(editable.obj);
			var enabled = config
			           && ($.inArray('table', config) > -1)
			           && ContentRules.isAllowed(editable.obj[0], 'table');

			configurations[editable.getId()] = !!enabled;

			editable.obj.bind('mousedown', function () {
				TablePlugin.setFocusedTable(undefined);
			});

			editable.obj.find('table').each(function (index, elem) {
				createNewTable(elem);
			});
		});

		// initialize the table buttons
		this.initTableButtons();

		Aloha.bind( 'aloha-table-selection-changed', function () {
			// check if selected cells are split/merge able and set button status
			if (!TablePlugin.activeTable || !TablePlugin.activeTable.selection) {
				return;
			}

			TablePlugin.updateFloatingMenuScope();

			if (TablePlugin.activeTable.selection.cellsAreSplitable()) {
				that._splitcellsButton.enable(true);
				that._splitcellsRowButton.enable(true);
				that._splitcellsColumnButton.enable(true);
			} else {
				that._splitcellsButton.enable(false);
				that._splitcellsRowButton.enable(false);
				that._splitcellsColumnButton.enable(false);
			}

			if (TablePlugin.activeTable.selection.cellsAreMergeable()) {
				that._mergecellsButton.enable(true);
				that._mergecellsRowButton.enable(true);
				that._mergecellsColumnButton.enable(true);
			} else {
				that._mergecellsButton.enable(false);
				that._mergecellsRowButton.enable(false);
				that._mergecellsColumnButton.enable(false);
			}
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

			// show hide buttons regarding configuration and DOM position
			if (configurations[Aloha.activeEditable.getId()] && Aloha.Selection.mayInsertTag('table') ) {
				that._createTableButton.show();
			} else {
				that._createTableButton.hide();
			}

			if (!that.activeTable) {
				TablePlugin.leaveTableScopes();
				return;
			}

			var table = range.findMarkup(function () {
				return this.nodeName === 'TABLE';
			}, editable.obj);

			if (table) {
				TablePlugin.updateFloatingMenuScope();
				TablePlugin.setActiveCellStyle();
			} else {
				TablePlugin.leaveTableScopes();
				that.activeTable.selection.cellSelectionMode = false;
				that.activeTable.selection.baseCellPosition = null;
				that.activeTable.selection.lastSelectionRange = null;
				that.activeTable.focusOut();
			}
		});

		PubSub.sub('aloha.editable.activated', function (message) {
			that._splitcellsButton.enable(false);
			that._mergecellsButton.enable(false);
			that._splitcellsRowButton.enable(false);
			that._mergecellsRowButton.enable(false);
			that._splitcellsColumnButton.enable(false);
			that._mergecellsColumnButton.enable(false);

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

		PubSub.sub('aloha.editable.deactivated', function () {
			if (TablePlugin.activeTable) {
				TablePlugin.activeTable.selection.unselectCells();
			}
			TablePlugin.setFocusedTable(undefined);
			var registry = TablePlugin.TableRegistry;
			for (var i = 0; i < registry.length; i++) {
				registry[i].deactivate();
			}
		});

		Aloha.bind('aloha-smart-content-changed', function () {
			if (Aloha.activeEditable) {
				Aloha.activeEditable.obj.find('table').each(function () {
					if (TablePlugin.indexOfTableInRegistry(this) == -1) {
						if (createNewTable(this)) {
							this.id = GENTICS.Utils.guid();
						}
					}
				});
			}
		});

		if (this.settings.summaryinsidebar) {
			Aloha.bind('aloha-plugins-loaded', function () {
				that.initSidebar(Aloha.Sidebar.right.show());
			});
		}
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

	TablePlugin.initSidebar = function (sidebar) {
		var pl = this;
		pl.sidebar = sidebar;
		pl.sidebarPanel = sidebar.addPanel({

			id       : nsClass('sidebar-panel'),
			title    : i18n.t('table.sidebar.title'),
			content  : '',
			expanded : true,
			activeOn : 'table',

			onInit   : function () {
				var that = this,
	            content = this.setContent(
	                '<label class="' + nsClass('label') + '" for="' + nsClass('textarea') + '" >' + i18n.t('table.label.target') + '</label>' +
	                	'<textarea id="' + nsClass('textarea') + '" class="' + nsClass('textarea') + '" />').content;

				jQuery(nsSel('textarea')).live('keyup', function () {
					//The original developer thought that escaping the
					//quote characters of the textarea value are
					//necessary to work around a bug in IE. I could not
					//reproduce the bug, so I commented the following
					//out.
					//.replace("\"", '&quot;').replace("'", "&#39;")
 					jQuery(that.effective).attr('summary', jQuery(nsSel('textarea')).val());
 					var waiDiv = jQuery('div[class*="wai"]', 'table#' + jQuery(that.effective).attr('id'));
 					waiDiv.removeClass(pl.get('waiGreen'));
 					waiDiv.removeClass(pl.get('waiRed'));

 					if (jQuery(nsSel('textarea')).val().trim() != '') {
 						waiDiv.addClass(pl.get('waiGreen'));
				    } else {
				    	waiDiv.addClass(pl.get('waiRed'));
				    }
 				});
            },

            onActivate: function (effective) {
            	var that = this;
				that.effective = effective;
				jQuery(nsSel('textarea')).val(jQuery(that.effective).attr('summary'));
            }

        });
		sidebar.show();
	};

	/**
	 * test if the table is editable
	 * @return boolean true if the table's parent element is contentEditable, false otherwise
	 */
	TablePlugin.isEditableTable = function (table) {
		return GENTICS.Utils.Dom.isEditable( table );
	};

	/**
	 * @param {DOMElement} table
	 * @return {Number}
	 */
	TablePlugin.indexOfTableInRegistry = function ( table ) {
		var registry = this.TableRegistry;

		for ( var i = 0; i < registry.length; i++ ) {
			// We need to find exactly the same object from the
			// registry since we could also deal with cloned objects
			if ( registry[ i ].obj[ 0 ].id == table.id ) {
				return i;
			}
		}

		return -1;
	};

	/**
	 * @param {DOMElement} table
	 * @return {Table}
	 */
	TablePlugin.getTableFromRegistry = function ( table ) {
		var i = this.indexOfTableInRegistry( table );
		if ( i > -1 ) {
			return this.TableRegistry[ i ];
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
		var container = jQuery( range.commonAncestorContainer );

		if ( container.length == 0 ) {
			return  false;
		}

		if ( container.parents( '.aloha-editable table' ).length ) {
			return true;
		}

		return false;
	};

	TablePlugin.preventNestedTables = function () {
		if ( this.isSelectionInTable() ) {
			Dialog.alert({
				title : i18n.t( 'Table' ),
				text  : i18n.t( 'table.createTable.nestedTablesNoSupported' )
			});

			return true;
		}

		return false;
	};

	TablePlugin.initMergeSplitCellsBtns = function(){
		// TODO current it is not possible to add the same buttons to
		//      multiple tabs. To work around this limitation we are
		//      defining the mergecells and splitcells components
		//      multiple times, once for each tab.

		this._mergecellsButton = Ui.adopt("mergecells", Button, {
			tooltip: i18n.t("button.mergecells.tooltip"),
			icon: "aloha-icon aloha-icon-mergecells",
			scope: this.name + '.cell',
			click: function() {
				if (TablePlugin.activeTable) {
					TablePlugin.activeTable.selection.mergeCells();
				}
			}
		});

		this._splitcellsButton = Ui.adopt("splitcells", Button, {
			tooltip: i18n.t("button.splitcells.tooltip"),
			icon: "aloha-icon aloha-icon-splitcells",
			scope: this.name + '.cell',
			click: function() {
				var activeCell;
				if (TablePlugin.activeTable) {
					if (TablePlugin.activeTable.selection.selectedCells.length > 0) {
						TablePlugin.activeTable.selection.splitCells();
					} else {
						// if there is currently no selection, the active cell is split instead
						activeCell = TablePlugin.selectedOrActiveCells();
						if (activeCell.length > 0) {
							Utils.splitCell(activeCell, function () {
								return TablePlugin.activeTable.newActiveCell().obj;
							});
							Aloha.trigger('aloha-table-selection-changed');
						}
					}
				}
			}
		});

		this._mergecellsRowButton = Ui.adopt("mergecellsRow", Button, {
			tooltip: i18n.t("button.mergecells.tooltip"),
			icon: "aloha-icon aloha-icon-mergecells",
			scope: this.name + '.row',
			click: function() {
				if (TablePlugin.activeTable) {
					TablePlugin.activeTable.selection.mergeCells();
				}
			}
		});

		this._splitcellsRowButton = Ui.adopt("splitcellsRow", Button, {
			tooltip: i18n.t("button.splitcells.tooltip"),
			icon: "aloha-icon aloha-icon-splitcells",
			scope: this.name + '.row',
			click: function() {
				if (TablePlugin.activeTable) {
					TablePlugin.activeTable.selection.splitCells();
				}
			}
		});

		this._mergecellsColumnButton = Ui.adopt("mergecellsColumn", Button, {
			tooltip: i18n.t("button.mergecells.tooltip"),
			icon: "aloha-icon aloha-icon-mergecells",
			scope: this.name + '.column',
			click: function() {
				if (TablePlugin.activeTable) {
					TablePlugin.activeTable.selection.mergeCells();
				}
			}
		});

		this._splitcellsColumnButton = Ui.adopt("splitcellsColumn", Button, {
			tooltip: i18n.t("button.splitcells.tooltip"),
			icon: "aloha-icon aloha-icon-splitcells",
			scope: this.name + '.column',
			click: function() {
				if (TablePlugin.activeTable) {
					TablePlugin.activeTable.selection.splitCells();
				}
			}
		});
	};

	TablePlugin.initNaturalFitBtn = function() {
		var that = this;

		if (this.colResize || this.rowResize) {
			this._tableNaturalFitButton = Ui.adopt("naturalFit", Button, {
				tooltip: i18n.t("button.naturalfit.tooltip"),
				icon: "aloha-icon aloha-icon-table-naturalfit",
				scope: this.name + '.cell',
				click: function() {
					if (that.activeTable) {
						var tableObj = that.activeTable.obj;
						tableObj.find('td, th').each(function() {
							jQuery(this).find('div').css('width', '');
							jQuery(this).css('width', '');
						});
						tableObj.find('tr').each(function() {
							jQuery(this).css('height', '');
						});
						tableObj.css('width','');
					}
				}
			});
		}
	};

	/**
	 * Adds default row buttons, and custom formatting buttons to floating menu
	 */
	TablePlugin.initRowsBtns = function () {
		var that = this;

		this._addrowbeforeButton = Ui.adopt("addrowbefore", Button, {
			tooltip: i18n.t( "button.addrowbefore.tooltip"),
			icon: "aloha-icon aloha-icon-addrowbefore",
			scope: this.name + '.row',
			click: function() {
				if (that.activeTable) {
					that.activeTable.addRowBeforeSelection();
				}
			}
		});

		this._addrowafterButton = Ui.adopt("addrowafter", Button, {
			tooltip: i18n.t("button.addrowafter.tooltip"),
			icon: "aloha-icon aloha-icon-addrowafter",
			scope: this.name + '.row',
			click: function() {
				if (that.activeTable) {
					that.activeTable.addRowAfterSelection();
				}
			}
		});

		this._deleterowsButton = Ui.adopt("deleterows", Button, {
			tooltip: i18n.t("button.delrows.tooltip"),
			icon: "aloha-icon aloha-icon-deleterows",
			scope: this.name + '.row',
			click: function() {
				if (that.activeTable) {
					var aTable = that.activeTable;
					Dialog.confirm({
						title: i18n.t('Table'),
						text: i18n.t('deleterows.confirm'),
						yes: function(){
							aTable.deleteRows();
						}
					});
				}
			}
		});

		this._rowheaderButton = Ui.adopt("rowheader", ToggleButton, {
			tooltip: i18n.t("button.rowheader.tooltip"),
			icon: "aloha-icon aloha-icon-rowheader",
			scope: this.name + '.row',
			click: function() {
				if (that.activeTable) {
					that.activeTable.refresh();

					toggleHeaderStatus(that.activeTable, 'col');

					// Update selection to the new row
					that.activeTable.selection.selectRows(that.activeTable.selection.selectedRowIdxs);
					that.activeTable.selection.unselectCells();
				}
			}
		});

		// generate formatting buttons
		this.rowMSItems = [];
		jQuery.each(this.rowConfig, function (j, itemConf) {
			that.rowMSItems.push({
				name: itemConf.name,
				text: i18n.t(itemConf.text),
				tooltip: i18n.t(itemConf.tooltip),
				iconClass: 'aloha-icon aloha-row-layout ' + itemConf.iconClass,
				click: function () {
					if (that.activeTable) {
						applyStyle(that.rowConfig, itemConf.cssClass, that.activeTable.selection.selectedCells);

						// selection could have changed.
						that.activeTable.selectRows();
					}
				}
			});
		});

		if (this.rowMSItems.length > 0) {
			this.rowMSItems.push({
				name    : 'removeFormat',
				text    : i18n.t('button.removeFormat.text'),
				tooltip : i18n.t('button.removeFormat.tooltip'),
				'cls'   : 'aloha-ui-multisplit-fullwidth',
				wide    : true,
				click   : function () {
					if (that.activeTable) {
						var sc = that.activeTable.selection.selectedCells;
						// if a selection was made, transform the selected cells
						for (var i = 0; i < sc.length; i++) {
							for (var f = 0; f < that.rowConfig.length; f++) {
								jQuery(sc[i]).removeClass(that.rowConfig[f].cssClass);
							}
						}
						// selection could have changed.
						that.activeTable.selectRows();
					}
				}
			});
		}

		this.rowMSButton = MultiSplitButton({
			items: this.rowMSItems,
			name: 'formatRow',
			hideIfEmpty: true,
			scope: this.name + '.row'
		});
	};

	/**
	 * Adds default column buttons, and custom formatting buttons to floating menu
	 */
	TablePlugin.initColumnBtns = function () {
		var that = this;

		this._addcolumnleftButton = Ui.adopt("addcolumnleft", Button, {
			tooltip: i18n.t("button.addcolleft.tooltip"),
			icon: "aloha-icon aloha-icon-addcolumnleft",
			scope: this.name + '.column',
			click: function() {
				if (that.activeTable) {
					that.activeTable.addColumnsLeft();
				}
			}
		});

		this._addcolumnrightButton = Ui.adopt("addcolumnright", Button, {
			tooltip: i18n.t("button.addcolright.tooltip"),
			icon: "aloha-icon aloha-icon-addcolumnright",
			scope: this.name + '.column',
			click: function() {
				if (that.activeTable) {
					that.activeTable.addColumnsRight();
				}
			}
		});

		this._deletecolumnsButton = Ui.adopt("deletecolumns", Button, {
			tooltip: i18n.t("button.delcols.tooltip"),
			icon: "aloha-icon aloha-icon-deletecolumns",
			scope: this.name + '.column',
			click: function() {
				if (that.activeTable) {
					var aTable = that.activeTable;
					Dialog.confirm({
						title: i18n.t('Table'),
						text: i18n.t('deletecolumns.confirm'),
						yes: function(){
							aTable.deleteColumns();
						}
					});
				}
			}
		});

		this._columnheaderButton = Ui.adopt("columnheader", ToggleButton, {
			tooltip: i18n.t("button.columnheader.tooltip"),
			icon: "aloha-icon aloha-icon-columnheader",
			scope: this.name + '.column',
			click: function() {
				if (that.activeTable) {
					that.activeTable.refresh();

					toggleHeaderStatus(that.activeTable, 'row');

					// Update selection to the new column
					that.activeTable.selection.selectColumns(that.activeTable.selection.selectedColumnIdxs);
					that.activeTable.selection.unselectCells();
				}
			}
		});

		// generate formatting buttons
		this.columnMSItems = [];
		jQuery.each(this.columnConfig, function (j, itemConf) {
			var item = {
				name	  : itemConf.name,
				text	  : i18n.t(itemConf.text),
				tooltip	  : i18n.t(itemConf.tooltip),
				iconClass : 'aloha-icon aloha-column-layout ' + itemConf.iconClass,
				click	  : function (x,y,z) {
					if (that.activeTable) {
						applyStyle(that.columnConfig, itemConf.cssClass, that.activeTable.selection.selectedCells);

						// selection could have changed.
						that.activeTable.selectColumns();
					}
				}
			};

			that.columnMSItems.push(item);
		});

		if (this.columnMSItems.length > 0) {
			this.columnMSItems.push({
				name	: 'removeFormat',
				text	: i18n.t('button.removeFormat.text'),
				tooltip	: i18n.t('button.removeFormat.tooltip'),
				'cls'   : 'aloha-ui-multisplit-fullwidth',
				wide	: true,
				click	: function () {
					if (that.activeTable) {
						var sc = that.activeTable.selection.selectedCells;
						// if a selection was made, transform the selected cells
						for (var i = 0; i < sc.length; i++) {
							for (var f = 0; f < that.columnConfig.length; f++) {
								jQuery(sc[i]).removeClass(that.columnConfig[f].cssClass);
							}
						}
						// selection could have changed.
						that.activeTable.selectColumns();
					}
				}
			});
		}

		this.columnMSButton = MultiSplitButton({
			items: this.columnMSItems,
			name: 'formatColumn',
			hideIfEmpty: true,
			scope: this.name + '.column'
		});
	};

	/**
	 * Adds custom formatting buttons for cells to floating menu
	 */
	TablePlugin.initCellBtns = function () {
		var that = this;

		// generate formatting buttons
		this.cellMSItems = [];
		jQuery.each(this.cellConfig, function (j, itemConf) {
			var item = {
				name	  : itemConf.name,
				text	  : i18n.t(itemConf.text),
				tooltip	  : i18n.t(itemConf.tooltip),
				iconClass : 'aloha-icon aloha-column-layout ' + itemConf.iconClass,
				click	  : function (x,y,z) {
					if (that.activeTable) {
						applyStyle(that.cellConfig, itemConf.cssClass, that.selectedOrActiveCells());

						that.setActiveCellStyle();
					}
				}
			};

			that.cellMSItems.push(item);
		});

		if (this.cellMSItems.length > 0) {
			this.cellMSItems.push({
				name	: 'removeFormat',
				text	: i18n.t('button.removeFormat.text'),
				tooltip	: i18n.t('button.removeFormat.tooltip'),
				'cls'   : 'aloha-ui-multisplit-fullwidth',
				wide	: true,
				click	: function () {
					if (that.activeTable) {
						var sc = that.selectedOrActiveCells();
						// if a selection was made, transform the selected cells
						for (var i = 0; i < sc.length; i++) {
							for (var f = 0; f < that.cellConfig.length; f++) {
								jQuery(sc[i]).removeClass(that.cellConfig[f].cssClass);
							}
						}

						that.setActiveCellStyle();
					}
				}
			});
		}

		this.cellMSButton = MultiSplitButton({
			items: this.cellMSItems,
			name: 'formatCell',
			hideIfEmpty: true,
			scope: this.name + '.cell'
		});
	};


	/**
	 * initialize the buttons and register them on floating menu
	 */
	TablePlugin.initTableButtons = function () {
		var that = this;

		// generate the new scopes
		Scopes.createScope(this.name + '.row', 'Aloha.continuoustext');
		Scopes.createScope(this.name + '.column', 'Aloha.continuoustext');
		Scopes.createScope(this.name + '.cell', 'Aloha.continuoustext');

		this._createTableButton = Ui.adopt("createTable", Button, {
			tooltip: i18n.t("button.createtable.tooltip"),
			icon: "aloha-icon aloha-icon-createTable",
			scope: 'Aloha.continuoustext',
			click: function() {
				TablePlugin.createDialog(this.element);
			}
		});

		// now the specific table buttons

		// generate formatting buttons for columns
		this.initColumnBtns();

		// generate formatting buttons for rows
		this.initRowsBtns();

		// generate formatting buttons for cells
		this.initCellBtns();

		this.initMergeSplitCellsBtns();

		this.initNaturalFitBtn();

		// generate formatting buttons for tables
		this.tableMSItems = [];

		var tableConfig = this.tableConfig;

		jQuery.each(tableConfig, function(j, itemConf){
			that.tableMSItems.push({
				name: itemConf.name,
				text: i18n.t(itemConf.text),
				tooltip: i18n.t(itemConf.tooltip),
				iconClass: 'aloha-icon aloha-table-layout ' + itemConf.iconClass,
				click: function(){
					// set table css class
					if (that.activeTable) {
						if (!that.activeTable.obj.hasClass(itemConf.cssClass)) {
							for (var f = 0; f < tableConfig.length; f++) {
								that.activeTable.obj.removeClass(tableConfig[f].cssClass);
							}
							that.activeTable.obj.addClass(itemConf.cssClass);
							that.tableMSButton.setActiveItem(itemConf.cssClass);
						} else {
							for (var f = 0; f < tableConfig.length; f++) {
								that.activeTable.obj.removeClass(tableConfig[f].cssClass);
							}
							that.tableMSButton.setActiveItem();
						}
					}
				}
			});
		});

		if(this.tableMSItems.length > 0) {
			this.tableMSItems.push({
				name    : 'removeFormat',
				text    : i18n.t('button.removeFormat.text'),
				tooltip : i18n.t('button.removeFormat.tooltip'),
				'cls'   : 'aloha-ui-multisplit-fullwidth',
				wide    : true,
				click   : function () {
					// remove all table classes
					if (that.activeTable) {
						for (var f = 0; f < tableConfig.length; f++) {
							that.activeTable.obj.removeClass(that.tableConfig[f].cssClass);
						}
						that.tableMSButton.setActiveItem();
					}
				}
			});
		}

		this.tableMSButton = MultiSplitButton({
			items : this.tableMSItems,
			name : 'formatTable',
			hideIfEmpty: true,
			scope: this.name + '.cell'
		});

		this._deleteTableButton = Ui.adopt("deleteTable", Button, {
			tooltip: i18n.t("button.deltable.tooltip"),
			icon: "aloha-icon aloha-icon-deletetable",
			scope: this.name + '.cell',
			click: function() {
				if (that.activeTable) {
					var aTable = that.activeTable;
					Dialog.confirm({
						title: i18n.t('Table'),
						text: i18n.t('deletetable.confirm'),
						yes: function(){
							aTable.deleteTable();
						}
					});
				}
			}
		});

		this._tableCaptionButton = Ui.adopt("tableCaption", ToggleButton, {
			tooltip: i18n.t("button.caption.tooltip"),
			icon: "aloha-icon aloha-icon-table-caption",
			scope: this.name + '.cell',
			click: function() {
				if (that.activeTable) {
					// look if table object has a child caption
					var $caption = that.activeTable.obj.children("caption");

					if ( $caption.is('caption') && $caption.is(':visible') ) {
						$caption.hide();
					} else {
						if (!$caption.is('caption')) {
							$caption = jQuery('<caption></caption>');
							that.activeTable.obj.prepend($caption);
						}
						$caption.show();
						if (jQuery.trim($caption.text()).length === 0) {
							$caption.text(i18n.t('empty.caption'));
						}

						that.makeCaptionEditable($caption, $caption.text());

						// get the editable span within the caption and select it
						var cDiv = $caption.find('div').eq(0);
						var captionContent = cDiv.contents().eq(0);
						if (captionContent.length > 0) {
							var newRange = new GENTICS.Utils.RangeObject();
							newRange.startContainer = newRange.endContainer = captionContent.get(0);
							newRange.startOffset = 0;
							newRange.endOffset = captionContent.text().length;

							// blur all editables within the table
							that.activeTable.obj.find('div.aloha-table-cell-editable').blur();

							cDiv.focus();
							newRange.select();
							Aloha.Selection.updateSelection();
						}
					}
				}
			}
		});

		this.summary = AttributeField( {
			width : 275,
			name  : 'tableSummary',
			noTargetHighlight: true,
			scope: this.name + '.cell',
			element: jQuery('<input id="aloha-attribute-field-tableSummary" class="aloha-wai-red" style="color: black; padding-left: 32px; background-color: white"/>')
		} );

		this.summary.addListener('keyup', function() {
			if (that.activeTable) {
				updateWaiImage(that);
			}
		});
	};

	/**
	 * Helper method to make the caption editable
	 * @param caption caption as jQuery object
	 * @param captionText default text for the caption
	 */
	TablePlugin.makeCaptionEditable = function(caption, captionText) {
		var that = this;
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
	 * This function adds the createDialog to the calling element
	 *
	 * @param callingElement
	 *            The element, which was clicked. It's needed to set the right
	 *            position to the create-table-dialog.
	 */
	TablePlugin.createDialog = function(callingElement) {
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
	TablePlugin.createTable = function(cols, rows) {
		if ( this.preventNestedTables() ) {
			return;
		}

		// Check if there is an active Editable and that it contains an element (= .obj)
		if ( Aloha.activeEditable && typeof Aloha.activeEditable.obj !== 'undefined' ) {
			// create a dom-table object
			var table = document.createElement( 'table' );
			// set the default class
			if (this.defaultClass) {
				table.className = this.defaultClass;
			}
			var tableId = table.id = GENTICS.Utils.guid();
			var tbody = document.createElement( 'tbody' );

			// create "rows"-number of rows
			for ( var i = 0; i < rows; i++ ) {
				var tr = document.createElement( 'tr' );
				// create "cols"-number of columns
				for ( var j = 0; j < cols; j++ ) {
					var text = document.createTextNode('');
					var td = document.createElement( 'td' );
					td.appendChild( text );
					tr.appendChild( td );
				}
				tbody.appendChild( tr );
			}
			table.appendChild( tbody );

			prepareRangeContainersForInsertion(
				Aloha.Selection.getRangeObject(), table );

			// insert the table at the current selection
			GENTICS.Utils.Dom.insertIntoDOM(
				jQuery( table ),
				Aloha.Selection.getRangeObject(),
				Aloha.activeEditable.obj
			);

			cleanupAfterInsertion();

			var tableReloadedFromDOM = document.getElementById( tableId );
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
					}, 20 );
				} else {
					tableObj.cells[0].wrapper.get(0).focus();
				}
			}

			Aloha.activeEditable.smartContentChange({type: 'block-change'});

			// The selection starts out in the first cell of the new
			// table. The table tab/scope has to be activated
			// accordingly.
			tableObj.focus();
			TablePlugin.activeTable.selection.selectionType = 'cell';
			TablePlugin.updateFloatingMenuScope();

		} else {
			this.error( 'There is no active Editable where the table can be\
				inserted!' );
		}
	};

	TablePlugin.setFocusedTable = function(focusTable) {
		var that = this;

		// clicking outside the table unselects the cells of the table
		if (null != this.activeTable ) {
			this.activeTable.selection.unselectCells();
		}

		for (var i = 0; i < TablePlugin.TableRegistry.length; i++) {
			TablePlugin.TableRegistry[i].hasFocus = false;
		}
		if (typeof focusTable != 'undefined') {
			this.summary.setTargetObject(focusTable.obj, 'summary');
			if ( focusTable.obj.children("caption").is('caption') ) {
				// set caption button
				this._tableCaptionButton.setState(true);
				var c = focusTable.obj.children("caption");
				that.makeCaptionEditable(c);
			}
			focusTable.hasFocus = true;
		}
		TablePlugin.activeTable = focusTable;
		if (TablePlugin.activeTable) {
			updateWaiImage(TablePlugin);
		}

		// show configured formatting classes
		for (var i = 0; i < this.tableMSItems.length; i++) {
			this.tableMSButton.showItem(this.tableMSItems[i].name);
		}
		this.tableMSButton.setActiveItem();

		if (this.activeTable) {
			for (var i = 0; i < this.tableConfig.length; i++) {
				if (this.activeTable.obj.hasClass(this.tableConfig[i].cssClass)) {
					this.tableMSButton.setActiveItem(this.tableConfig[i].name);
				}
			}
		}
	};

	/**
	 * Calls the Aloha.log function with 'error' level
	 *
	 * @see Aloha.log
	 * @param msg
	 *            The message to display
	 * @return void
	 */
	TablePlugin.error = function(msg) {
		Aloha.Log.error(this, msg);
	};

	/**
	 * Calls the Aloha.log function with 'debug' level
	 *
	 * @see Aloha.log
	 * @param msg
	 *            The message to display
	 * @return void
	 */
	TablePlugin.debug = function(msg) {
		Aloha.Log.debug(this, msg);
	};

	/**
	 * Calls the Aloha.log function with 'info' level
	 *
	 * @see Aloha.log
	 * @param msg
	 *            The message to display
	 * @return void
	 */
	TablePlugin.info = function(msg) {
		Aloha.Log.info(this, msg);
	};

	/**
	 * Calls the Aloha.log function with 'info' level
	 *
	 * @see Aloha.log
	 * @param msg
	 *            The message to display
	 * @return void
	 */
	TablePlugin.log = function(msg) {
		Aloha.log('log', this, msg);
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
	TablePlugin.set = function (key, value) {
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
	TablePlugin.makeClean = function ( obj ) {
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
	TablePlugin.toString = function() {
		return this.prefix;
	};

	/**
	 * Leaves all possible TableScopes in the floating menu
	 * expect those in the retainScopes array
	 *
	 * @param  {array} retainScopes the name of the scopes which should not be left
	 */
	TablePlugin.leaveTableScopes = function(retainScopes, force) {
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
	TablePlugin.updateFloatingMenuScope = function() {
		var i = 0,
			primaryScope,
			scopes;
		if (
			null != TablePlugin.activeTable &&
			null != TablePlugin.activeTable.selection.selectionType
		) {
			// save the primary scope
			primaryScope = Scopes.getPrimaryScope(),
			// get the new scopes
			scopes = TablePlugin.activeTable.selection.getCurrentSelectionTypes();
			// leave all scopes except the the current ones
			TablePlugin.leaveTableScopes(scopes);
			// Enter all needed table scopes
			for (i = 0; i < scopes.length; i++) {
				Scopes.enterScope(TablePlugin.name + '.' + scopes[i]);
			}
			// Check if the primaryScope changed and set the first scope as the currently active one
			if (scopes[0] !== primaryScope) {
				Scopes.setScope(TablePlugin.name + '.' + scopes[0]);
			}
		} else {
			// leave all scopes
			TablePlugin.leaveTableScopes();
		}
	};

	/**
	 * Set the cell-style to match the active item, if all selected cells have the same style
	 * TODO: Algorithm very similar to setActiveStyle in table.js, should be refactored
	 */
	TablePlugin.setActiveCellStyle = function() {
		var that = this;
		var allSelected = false;
		var className;

		// reset any selected cell styles
		this.cellMSButton.setActiveItem();

		var selectedCells = that.selectedOrActiveCells();

		for (var i = 0; i < that.cellConfig.length; i++) {
			if (jQuery(selectedCells[0]).hasClass(that.cellConfig[i].cssClass) ) {
				className = that.cellConfig[i].name;
				allSelected = true;
				break;
			}
		}

		// if all selected cells have the same class, set it as active
		jQuery(selectedCells).each(function(index) {
			if (!jQuery(this).hasClass(className)) {
				allSelected = false;
			}
		});
		if (allSelected) {
			this.cellMSButton.setActiveItem(className);
		}
	};

	TablePlugin.selectedOrActiveCells = function() {
		var that = this;
		var sc = this.activeTable.selection.selectedCells;

		// if there are no selected cells,
		// set the active cell as the selected cell.
		if (!sc || sc.length < 1) {
			var activeCell = function() {
			var range = Aloha.Selection.getRangeObject();
				if (Aloha.activeEditable) {
					return range.findMarkup( function() {
							return this.nodeName.toLowerCase() === 'td';
					}, Aloha.activeEditable.obj );
				} else {
					return null;
				}
			}

			var active_cell = activeCell();
			return (active_cell ? [ active_cell ] : []);
		} else {
			return sc;
		}
	};

	PluginManager.register(TablePlugin);

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
	function prepareRangeContainersForInsertion ( range, table ) {
		var	eNode = range.endContainer,
			sNode = range.startContainer,
			eNodeLength = ( eNode.nodeType == 3 )
				? eNode.length
				: eNode.childNodes.length;


		if ( sNode.nodeType == 3 &&
				sNode.parentNode.tagName == 'P' &&
					sNode.parentNode.childNodes.length == 1 &&
						/^(\s|%A0)$/.test( escape( sNode.data ) ) ) {
			sNode.data = '';
			range.startOffset = 0;

			// In case ... <p> []</p>
			if ( eNode == sNode ) {
				range.endOffset = 0;
			}
		}

		// If the table is not allowed to be nested inside the startContainer,
		// then it will have to be split in order to insert the table.
		// We will therefore check if the selection touches the start and/or
		// end of their container nodes.
		// If they do, we will mark their container so that after they are
		// split we can check whether or not they should be removed
		if ( !GENTICS.Utils.Dom.allowsNesting(
				sNode.nodeType == 3 ? sNode.parentNode : sNode, table ) ) {

			if ( range.startOffset == 0 ) {
				jQuery( sNode.nodeType == 3 ? sNode.parentNode : sNode )
					.addClass( 'aloha-table-cleanme' );
			}

			if ( range.endOffset == eNodeLength ) {
				jQuery( eNode.nodeType == 3 ? eNode.parentNode : eNode )
					.addClass( 'aloha-table-cleanme' );
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
	function cleanupAfterInsertion () {
		var dirty = jQuery( '.aloha-table-cleanme' ).removeClass(
						'aloha-table-cleanme' );

		for ( var i = 0; i < dirty.length; i++ ) {
			if ( jQuery.trim( jQuery( dirty[ i ] ).html() ) == '' &&
					!GENTICS.Utils.Dom.isEditingHost( dirty[ i ] ) ) {
				jQuery( dirty[ i ] ).remove();

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
