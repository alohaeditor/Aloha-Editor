/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com - way to over-lawyer it up Andrew :/
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define(
['aloha', 'aloha/jquery', 'aloha/plugin', 'aloha/pluginmanager', 'aloha/floatingmenu', 'i18n!table/nls/i18n', 'i18n!aloha/nls/i18n', 'table/table-cell', 'table/table-create-layer', 'table/table-selection', 'table/table-plugin-utils', 'css!table/css/table.css'],
function(Aloha, jQuery, Plugin, PluginManager, FloatingMenu, i18n, i18nCore, CellModuleConstructor, CreateLayerModuleConstructor, TableSelectionModuleConstructor, Utils) {

	var
		GENTICS = window.GENTICS;

	/**
	 * Register the TablePlugin as Aloha.Plugin
	 */
	var TablePlugin = new Plugin('table');

	/* -- ATTRIBUTES -- */
	/**
	 * The Create-Layer Object of the TablePlugin
	 *
	 * @see Table.CreateLayer
	 */
	TablePlugin.createLayer = undefined;

	/**
	 * Configure the available languages
	 */
	TablePlugin.languages = ['en', 'de', 'fr', 'eo', 'fi', 'ru', 'it', 'pl'];

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
		waiRed				 : 'aloha-wai-red',                     // class that shows wai of div
		waiGreen			 : 'aloha-wai-green',                   // class that shows wai of div
		selectionArea        : 10                                     // width/height of the selection rows (in pixel)
	};

	/* -- END ATTRIBUTES -- */

	/* -- METHODS -- */

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
            text	  : c[i].text	   ? c[i].text		: c[i].name,
            tooltip	  : c[i].tooltip   ? c[i].tooltip	: c[i].text,
            iconClass : c[i].iconClass ? c[i].iconClass	: 'aloha-button-' + c[i].name,
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
	 * Init method of the Table-plugin transforms all tables in the document
	 *
	 * @return void
	 */
	TablePlugin.init = function() {

    // apply settings
    this.tableConfig = this.checkConfig(this.tableConfig||this.settings.tableConfig);
    this.columnConfig = this.checkConfig(this.columnConfig||this.settings.columnConfig);
    this.rowConfig = this.checkConfig(this.rowConfig||this.settings.rowConfig);
    
		// add reference to the create layer object
		this.createLayer = new Table.CreateLayer();

		var that = this;

		// subscribe for the 'editableActivated' event to activate all tables in the editable
		Aloha.bind('aloha-editable-created', function(event, editable) {

			// add a mousedown event to all created editables to check if focus leaves a table
			editable.obj.bind('mousedown', function(jqEvent) {
				TablePlugin.setFocusedTable(undefined);
			});

      editable.obj.find('table').each(function () {
        // only convert tables which are editable
        if (that.isEditableTable(this)) {
          // instantiate a new table-object
          var table = new Table(this);

          table.parentEditable = editable;

          // activate the table
          // table.activate();

          // add the activated table to the TableRegistry
          TablePlugin.TableRegistry.push(table);
        }
      });
    });

    // initialize the table buttons
    this.initTableButtons();

    Aloha.bind('aloha-selection-changed', function (event, rangeObject) {

      if (Aloha.activeEditable) {
        // get Plugin configuration
        var config = that.getEditableConfig( Aloha.activeEditable.obj );

        // show hide buttons regarding configuration and DOM position
        if ( jQuery.inArray('table', config) != -1  && Aloha.Selection.mayInsertTag('table') ) {
          that.createTableButton.show();
        } else {
          that.createTableButton.hide();
        }

        var table = rangeObject.findMarkup(function () {
              return this.nodeName.toLowerCase() == 'table';
          }, Aloha.activeEditable.obj);

          // check wheater we are inside a table
          if ( table ) {
            // set the scope if either columns or rows are selected
            FloatingMenu.setScope(that.name + '.' + TableSelection.selectionType);
          } else {
            //reset cell selection flags
            TableSelection.cellSelectionMode = false; 
            TableSelection.keepCellsSelected = false;
            TableSelection.baseCellPosition = null;
            TableSelection.lastSelectionRange = null; 
            
            if ( that.activeTable ) {
              that.activeTable.focusOut();
            }
          }

          TableSelection.unselectCells();

        // TODO this should not be necessary here!
        FloatingMenu.doLayout();
      }
    });

    // subscribe for the 'editableActivated' event to activate all tables in the editable
    Aloha.bind('aloha-editable-activated', function (event, props) {
      props.editable.obj.find('table').each(function () {
        // shortcut for TableRegistry
        var tr = TablePlugin.TableRegistry;
        for (var i = 0; i < tr.length; i++) {
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
          var table = new Table(this);

          table.parentEditable = props.editable;

          // activate the table
          table.activate();

          // add the activated table to the TableRegistry
          TablePlugin.TableRegistry.push(table);
        }
      });
    });

    // subscribe for the 'editableDeactivated' event to deactivate all tables in the editable
    Aloha.bind('aloha-editable-deactivated', function (event, properties) {
      TablePlugin.setFocusedTable(undefined);
      TableSelection.unselectCells();
      // shortcut for TableRegistry
      var tr = TablePlugin.TableRegistry;
      for (var i = 0; i < tr.length; i++) {
        // activate the table
        tr[i].deactivate();
      }
    });
	if(this.settings.summaryinsidebar) {
		Aloha.ready(function () { 
			that.initSidebar(Aloha.Sidebar.right.show());  
		});
	}
};

//namespace prefix for this plugin
var ns = 'aloha-table';

function nsSel () {
    var strBldr = [], prx = ns;
    jQuery.each(arguments, function () { strBldr.push('.' + (this == '' ? prx : prx + '-' + this)); });
    return strBldr.join(' ').trim();
};

//Creates string with this component's namepsace prefixed the each classname
function nsClass () {
    var strBldr = [], prx = ns;
    jQuery.each(arguments, function () { strBldr.push(this == '' ? prx : prx + '-' + this); });
    return strBldr.join(' ').trim();
};

TablePlugin.processH = function(h) {
	var that = this;
	jQuery(h).attr('id',that.sanitize(jQuery(h).text()));
};
		
TablePlugin.sanitize = function(str) {
	return (str.replace(/[^a-z0-9]+/gi,'_'));
};

TablePlugin.initSidebar = function(sidebar) {
	var pl = this;
	pl.sidebar = sidebar;
	sidebar.addPanel({
            
            id         : nsClass('sidebar-panel'),
            title     : i18n.t('table.sidebar.title'),
            content     : '',
            expanded : true,
            activeOn : 'table',
            
            onInit     : function () {
            	 var that = this,
	                 content = this.setContent(
	                		 '<label class="' + nsClass('label') + '" for="' + nsClass('textarea') + '" >' + i18n.t('table.label.target') + '</label>' +
	                		 '<textarea id="' + nsClass('textarea') + '" class="' + nsClass('textarea') + '" />').content;
	             
            	 jQuery(nsSel('textarea')).live('keyup', function() { 
 					jQuery(that.effective).attr('summary', jQuery(nsSel('textarea')).val().replace("\"", '&quot;').replace("'", "&#39;"));
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
	sidebar.show().open();
};

  /**
   * test if the table is editable
   * @return boolean true if the table's parent element is contentEditable, false otherwise
   */
  TablePlugin.isEditableTable = function (table) {
	  return GENTICS.Utils.Dom.isEditable( table );
  };

  /**
   * Adds default row buttons, and custom formatting buttons to floating menu
   */
  TablePlugin.initRowsBtns = function () {
    var that = this;

    // add row before
		FloatingMenu.addButton(
			this.name + '.row',
			new Aloha.ui.Button({
				'iconClass' : 'aloha-button aloha-button-addRowBefore',
				'size' : 'small',
				'tooltip' : i18n.t('button.addrowbefore.tooltip'),
				'onclick' : function () {
					if (that.activeTable) {
						that.activeTable.addRowsBefore(true);
					}
				}
			}),
			i18n.t('floatingmenu.tab.table'),
			1
		);

    // add row after
		FloatingMenu.addButton(
			this.name + '.row',
			new Aloha.ui.Button({
				'iconClass' : 'aloha-button aloha-button-addRowAfter',
				'size' : 'small',
				'tooltip' : i18n.t('button.addrowafter.tooltip'),
				'onclick' : function () {
					if (that.activeTable) {
						that.activeTable.addRowsAfter(true);
					}
				}
			}),
			i18n.t('floatingmenu.tab.table'),
			1
		);

    // delete selected rows
		FloatingMenu.addButton(
			this.name + '.row',
			new Aloha.ui.Button({
				'iconClass' : 'aloha-button aloha-button-deleteRows',
				'size' : 'small',
				'tooltip' : i18n.t('button.delrows.tooltip'),
				'onclick' : function () {
					if (that.activeTable) {
						var aTable = that.activeTable;
						Aloha.showMessage(new Aloha.Message({
							title : i18n.t('Table'),
							text : i18n.t('deleterows.confirm'),
							type : Aloha.Message.Type.CONFIRM,
							callback : function (sel) {
								if (sel == 'yes') {
									aTable.deleteRows();
								}
							}
						}));
					}
				}
			}),
			i18n.t('floatingmenu.tab.table'),
			1
		);

    this.rowHeader = new Aloha.ui.Button({
      iconClass : 'aloha-button aloha-button-row-header',
      size	  :  'small',
      tooltip	  :  i18n.t('button.rowheader.tooltip'),
      toggle	  :  true,
      onclick	  :  function () {
        // table header
        if (that.activeTable) {
          var sc = TableSelection.selectedCells;
          that.rowsToSelect = [];
          var makeHeader = ( 
        		  sc[0] && sc[0].nodeName.toLowerCase() == 'td' && sc.length == 1 ||
        		  sc[0] && sc[0].nodeName.toLowerCase() == 'td' && 
        		  sc[1].nodeName.toLowerCase() == 'td' );
          // if a selection was made, transform the selected cells
          for (var i = 0; i < sc.length; i++) {
//            for (var j = 0; j < sc[i].length; j++) {
              if (i == 0) {
                that.rowsToSelect.push(sc[i].rowIndex);
              }
              
              if ( makeHeader ) {
            	  sc[i] = Aloha.Markup.transformDomObject(sc[i], 'th').attr('scope', 'col')[0];
              } else { 
            	  sc[i] = Aloha.Markup.transformDomObject(sc[i], 'td').removeAttr('scope')[0];
              }
              
              jQuery(sc[i]).bind('mousedown', function (jqEvent) {
                var wrapper = jQuery(this).children('div').eq(0);
                setTimeout(function () {
                  wrapper.trigger('focus');
                }, 1);
                // unselect cells
                TableSelection.unselectCells();
              });
              
              /*
                Destructive. For debugging.
                Indicate directionality of header
                jQuery(sc[i][j]).html('v');
              */
//            }
          }
          
          // selection could have changed.
          if (that.activeTable) {
            that.activeTable.refresh();
            that.activeTable.selectRows();
          }
        }
      }
    });
    
    FloatingMenu.addButton(
      this.name + '.row',
      this.rowHeader,
      i18n.t('floatingmenu.tab.table'),
      1
    );
    
    	// Add merge/split cells buttons
    FloatingMenu.addButton(
      this.name + '.row',
      new Aloha.ui.Button({
			'iconClass' : 'aloha-button aloha-button-merge-cells',
			'size' : 'small',
			'tooltip' : i18n.t('button.mergecells.tooltip'),
			'toggle' : false,
			'onclick' : function () {
        TableSelection.mergeCells();
			}
		}),
      i18n.t('floatingmenu.tab.table'),
      1
    );

    FloatingMenu.addButton(
      this.name + '.row',
      new Aloha.ui.Button({
			'iconClass' : 'aloha-button aloha-button-split-cells',
			'size' : 'small',
			'tooltip' : i18n.t('button.splitcells.tooltip'),
			'toggle' : false,
			'onclick' : function () {
        TableSelection.splitCells();
			}
		}),
      i18n.t('floatingmenu.tab.table'),
      1
    );
    
    // generate formatting buttons
    this.rowMSItems = [];
    
    jQuery.each(this.rowConfig, function (j, itemConf) {
      that.rowMSItems.push({
        name: itemConf.name,
        text: i18n.t(itemConf.text),
        tooltip: i18n.t(itemConf.tooltip),
        iconClass: 'aloha-button aloha-row-layout ' + itemConf.iconClass,
        click: function () {
          var sc = TableSelection.selectedCells;
          // if a selection was made, transform the selected cells
          for (var i = 0; i < sc.length; i++) {
            for (var j = 0; j < sc[i].length; j++) {
              // remove all row formattings
              for (var f = 0; f < that.rowConfig.length; f++) {
                jQuery(sc[i][j]).removeClass(that.rowConfig[f].cssClass);
              }
              // set new style 
              jQuery(sc[i][j]).addClass(itemConf.cssClass);
            }
          }
          
          // selection could have changed.
          if (that.activeTable) {
            that.activeTable.selectRows();
          }
        }
      });
    });
    
    if (this.rowMSItems.length > 0) {
      this.rowMSItems.push({
        name: 'removeFormat',
        text: i18n.t('button.removeFormat.text'),
        tooltip: i18n.t('button.removeFormat.tooltip'),
        iconClass: 'aloha-button aloha-button-removeFormat',
        wide: true,
        click: function () {
          var sc = TableSelection.selectedCells;
          // if a selection was made, transform the selected cells
          for (var i = 0; i < sc.length; i++) {
            for (var j = 0; j < sc[i].length; j++) {
              for (var f = 0; f < that.rowConfig.length; f++) {
                jQuery(sc[i][j]).removeClass(that.rowConfig[f].cssClass);
              }
            }
          }
          
          // selection could have changed.
          if (that.activeTable) {
            that.activeTable.selectRows();
          }
        }
      });
    }
    
    this.rowMSButton = new Aloha.ui.MultiSplitButton({
      items : this.rowMSItems
    });
    
    if (this.rowMSItems.length > 0) {
      FloatingMenu.addButton(
        this.name + '.row',
        this.rowMSButton,
        i18n.t('floatingmenu.tab.table'),
        3
      );
    }
  };

  /**
   * Adds default column buttons, and custom formatting buttons to floating menu
   */
  TablePlugin.initColumnBtns = function () {
    var that = this;

    // add column left btn
    FloatingMenu.addButton(
			this.name + '.column',
			new Aloha.ui.Button({
				'iconClass' : 'aloha-button aloha-button-addColumnLeft',
				'size' : 'small',
				'tooltip' : i18n.t('button.addcolleft.tooltip'),
				'onclick' : function () {
					if (that.activeTable) {
						that.activeTable.addColumnsLeft();
					}
				}
			}),
			i18n.t('floatingmenu.tab.table'),
			1
		);

    // add column right btn
		FloatingMenu.addButton(
			this.name + '.column',
			new Aloha.ui.Button({
				'iconClass' : 'aloha-button aloha-button-addColumnRight',
				'size' : 'small',
				'tooltip' : i18n.t('button.addcolright.tooltip'),
				'onclick' : function () {
					if (that.activeTable) {
						that.activeTable.addColumnsRight();
					}
				}
			}),
			i18n.t('floatingmenu.tab.table'),
			1
		);

    // delete columns btn
    FloatingMenu.addButton(
			this.name + '.column',
			new Aloha.ui.Button({
				'iconClass' : 'aloha-button aloha-button-deleteColumns',
				'size' : 'small',
				'tooltip' : i18n.t('button.delcols.tooltip'),
				'onclick' : function () {
					if (that.activeTable) {
						var aTable = that.activeTable;
						Aloha.showMessage(new Aloha.Message({
							title : i18n.t('Table'),
							text : i18n.t('deletecolumns.confirm'),
							type : Aloha.Message.Type.CONFIRM,
							callback : function (sel) {
								if (sel == 'yes') {
									aTable.deleteColumns();
								}
							}
						}));
					}
				}
			}),
			i18n.t('floatingmenu.tab.table'),
			1
		);

    this.columnHeader = new Aloha.ui.Button({
        iconClass : 'aloha-button aloha-button-col-header',
        size	  : 'small',
        tooltip	  : i18n.t('button.columnheader.tooltip'),
        toggle	  : true,
        onclick	  : function () {
    	 
    	    var 
    	  		selectedColumnIdxs = TableSelection.selectedColumnIdxs,
    	  		cell,
    	  		isHeader = TableSelection.isHeader();
    	  
			// table header
			if (that.activeTable) {
			    for (var j = 0; j < TableSelection.selectedCells.length; j++) {
			    	cell = TableSelection.selectedCells[j];
			        if ( isHeader ) {
			        	cell = Aloha.Markup.transformDomObject( cell, 'td').removeAttr( 'scope' ).get(0);
			        } else { 
			        	cell = Aloha.Markup.transformDomObject( cell, 'th').attr('scope', 'row').get(0);
			        }
			      
			        jQuery( TableSelection.selectedCells[j] ).bind( 'mousedown', function ( jqEvent ) {
			            var wrapper = jQuery(this).children('div').eq(0);
			            // lovely IE ;-)
			            setTimeout(function () {
			            	wrapper.trigger( 'focus' );
			            }, 1);
			            // unselect cells
			        });
			      
			    }
			    // selection the column.
			    if (that.activeTable) {
			        that.activeTable.refresh();
			        TableSelection.unselectCells();
			        TableSelection.selectColumns( selectedColumnIdxs );
			    }
			}
        }
    });
    
    FloatingMenu.addButton(
      this.name + '.column',
      this.columnHeader,
      i18n.t('floatingmenu.tab.table'),
      1
    );
    
    	// Add merge/split cells buttons
    FloatingMenu.addButton(
      this.name + '.column',
      new Aloha.ui.Button({
			'iconClass' : 'aloha-button aloha-button-merge-cells',
			'size' : 'small',
			'tooltip' : i18n.t('button.mergecells.tooltip'),
			'toggle' : false,
			'onclick' : function () {
        TableSelection.mergeCells();
			}
		}),
      i18n.t('floatingmenu.tab.table'),
      1
    );

    FloatingMenu.addButton(
      this.name + '.column',
      new Aloha.ui.Button({
			'iconClass' : 'aloha-button aloha-button-split-cells',
			'size' : 'small',
			'tooltip' : i18n.t('button.splitcells.tooltip'),
			'toggle' : false,
			'onclick' : function () {
        TableSelection.splitCells();
			}
		}),
      i18n.t('floatingmenu.tab.table'),
      1
    );

    
    // generate formatting buttons
    this.columnMSItems = [];
      jQuery.each(this.columnConfig, function (j, itemConf) {
      var item = {
        name	  : itemConf.name,
        text	  : i18n.t(itemConf.text),
        tooltip	  : i18n.t(itemConf.tooltip),
        iconClass : 'aloha-button aloha-column-layout ' + itemConf.iconClass,
        click	  : function (x,y,z) {
          var sc = TableSelection.selectedCells;
          // if a selection was made, transform the selected cells
          for (var i = 0; i < sc.length; i++) {
            for (var j = 0; j < sc[i].length; j++) {
              // remove all columnformattings
              for (var f = 0; f < that.columnConfig.length; f++) {
                jQuery(sc[i][j]).removeClass(that.columnConfig[f].cssClass);
              }
              // set new style
              jQuery(sc[i][j]).addClass(itemConf.cssClass);
            }
          }
          // selection could have changed.
          if (that.activeTable) {
            that.activeTable.selectColumns();
          }
        }
      };
      
      that.columnMSItems.push(item);
    });
    
    if (this.columnMSItems.length > 0) {
      this.columnMSItems.push({
        name	  : 'removeFormat',
        text	  : i18n.t('button.removeFormat.text'),
        tooltip	  : i18n.t('button.removeFormat.tooltip'),
        iconClass : 'aloha-button aloha-button-removeFormat',
        wide	  : true,
        click	  : function () {
          var sc = TableSelection.selectedCells;
          // if a selection was made, transform the selected cells
          for (var i = 0; i < sc.length; i++) {
            for (var j = 0; j < sc[i].length; j++) {
              for (var f = 0; f < that.columnConfig.length; f++) {
                jQuery(sc[i][j]).removeClass(that.columnConfig[f].cssClass);
              }
            }
          }
          
          // selection could have changed.
          if (that.activeTable) {
            that.activeTable.selectColumns();
          }
        }
      });
    }
    
    this.columnMSButton = new Aloha.ui.MultiSplitButton({
      items : this.columnMSItems
    });
    
    if (this.columnMSItems.length > 0) {
      FloatingMenu.addButton(
        this.name + '.column',
        this.columnMSButton,
        i18n.t('floatingmenu.tab.table'),
        3
      );
    }
  };

	/**
	 * initialize the buttons and register them on floating menu
	 */
	TablePlugin.initTableButtons = function () {
		var that = this;

		// generate the new scopes
		FloatingMenu.createScope(this.name + '.row', 'Aloha.global');
		FloatingMenu.createScope(this.name + '.column', 'Aloha.global');
		FloatingMenu.createScope(this.name + '.cell', 'Aloha.continuoustext');

		// the 'create table' button
		this.createTableButton = new Aloha.ui.Button({
			'iconClass' : 'aloha-button aloha-button-table',
			'size' : 'small',
			'tooltip' : i18n.t('button.createtable.tooltip'),
			'onclick' : function (element, event) {
				TablePlugin.createDialog(element.btnEl.dom);
			}
		});

		// add to floating menu
		FloatingMenu.addButton(
			'Aloha.continuoustext',
			this.createTableButton,
			i18nCore.t('floatingmenu.tab.insert'),
			1
		);

    // now the specific table buttons

    //---------------------------------------------------------------
    // generate formatting buttons for columns
    //---------------------------------------------------------------
    this.initColumnBtns();

    //---------------------------------------------------------------
    // generate formatting buttons for rows
    //---------------------------------------------------------------
    this.initRowsBtns();

    //---------------------------------------------------------------
    // generate formatting buttons for tables
    //---------------------------------------------------------------
    this.tableMSItems = [];
    
    var tableConfig = this.tableConfig;
    
    jQuery.each(tableConfig, function(j, itemConf){
      that.tableMSItems.push({
        name: itemConf.name,
        text: i18n.t(itemConf.text),
        tooltip: i18n.t(itemConf.tooltip),
        iconClass: 'aloha-button aloha-table-layout ' + itemConf.iconClass,
        click: function(){
          // set table css class
          if (that.activeTable) {
            for (var f = 0; f < tableConfig.length; f++) {
              that.activeTable.obj.removeClass(tableConfig[f].cssClass);
            }
            that.activeTable.obj.addClass(itemConf.cssClass);
          }
        }
      });
    });
    
    if(this.tableMSItems.length > 0) {
      this.tableMSItems.push({
        name: 'removeFormat',
        text: i18n.t('button.removeFormat.text'),
        tooltip: i18n.t('button.removeFormat.tooltip'),
        iconClass: 'aloha-button aloha-button-removeFormat',
        wide: true,
        click: function () {
          // remove all table classes
          if (that.activeTable) {
            for (var f = 0; f < tableConfig.length; f++) {
              that.activeTable.obj.removeClass(that.tableConfig[f].cssClass);
            }
          }
        }
      });
    }
    
    this.tableMSButton = new Aloha.ui.MultiSplitButton({
      items : this.tableMSItems
    });
    
    if(this.tableMSItems.length > 0) {
      FloatingMenu.addButton(
        this.name + '.cell',
        this.tableMSButton,
        i18n.t('floatingmenu.tab.tablelayout'),
        3
      );
    };

	// Add merge/split cells buttons
    FloatingMenu.addButton(
      this.name + '.cell',
      new Aloha.ui.Button({
			'iconClass' : 'aloha-button aloha-button-merge-cells',
			'size' : 'small',
			'tooltip' : i18n.t('button.mergecells.tooltip'),
			'toggle' : false,
			'onclick' : function () {
        TableSelection.mergeCells();
			}
		}),
      i18n.t('floatingmenu.tab.table'),
      1
    );

    FloatingMenu.addButton(
      this.name + '.cell',
      new Aloha.ui.Button({
			'iconClass' : 'aloha-button aloha-button-split-cells',
			'size' : 'small',
			'tooltip' : i18n.t('button.splitcells.tooltip'),
			'toggle' : false,
			'onclick' : function () {
        TableSelection.splitCells();
			}
		}),
      i18n.t('floatingmenu.tab.table'),
      1
    );

	// Add caption button
    this.captionButton = new Aloha.ui.Button({
			'iconClass' : 'aloha-button aloha-button-table-caption',
			'size' : 'small',
			'tooltip' : i18n.t('button.caption.tooltip'),
			'toggle' : true,
			'onclick' : function () {
				if (that.activeTable) {
					// look if table object has a child caption
					if ( that.activeTable.obj.children("caption").is('caption') ) {
						that.activeTable.obj.children("caption").remove();
						// select first cell of table
					} else {
						var captionText = i18n.t('empty.caption');
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
							that.activeTable.obj.find('div.aloha-table-cell-editable').blur();

							cDiv.focus();
							newRange.select();
							Aloha.Selection.updateSelection();
						}
					}
				}
			}
		});

		FloatingMenu.addButton(
			this.name + '.cell',
			this.captionButton,
			i18n.t('floatingmenu.tab.table'),
			1
		);

		// for cells
		// add summary field
		this.summary = new Aloha.ui.AttributeField({
			'width': 275
		});
		this.summary.addListener('keyup', function(obj, event) {
			that.activeTable.checkWai();
		});
		if(!this.settings.summaryinsidebar) {
			FloatingMenu.addButton(
				this.name + '.cell',
				this.summary,
				i18n.t('floatingmenu.tab.table'),
				1
			);
		}
	};

	/**
	 * Helper method to make the caption editable
	 * @param caption caption as jQuery object
	 * @param captionText default text for the caption
	 */
	TablePlugin.makeCaptionEditable = function(caption, captionText) {
		var that = this;

		var cSpan = caption.children('div').eq(0);
		if (cSpan.length == 0) {
			// generate a new div
			cSpan = jQuery('<div></div>');
			jQuery(cSpan).addClass('aloha-ui');
			jQuery(cSpan).addClass('aloha-editable-caption');
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
		// Check if there is an active Editable and that it contains an element (= .obj)
		if (Aloha.activeEditable != null && typeof Aloha.activeEditable.obj != 'undefined') {
			// create a dom-table object
			var table = document.createElement('table');
			var tableId = table.id = GENTICS.Utils.guid();
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
			GENTICS.Utils.Dom.insertIntoDOM(jQuery(table), Aloha.Selection.getRangeObject(), jQuery(Aloha.activeEditable.obj));

			// if the table is inserted
			var tableReloadedFromDOM = document.getElementById(tableId);

			var tableObj = new Table(tableReloadedFromDOM);

			tableObj.parentEditable = Aloha.activeEditable;

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

			TablePlugin.TableRegistry.push(tableObj);

		// no active editable => error
		}else{
			this.error('There is no active Editable where the table can be inserted!');
		}
	};

	TablePlugin.setFocusedTable = function(focusTable) {
		var that = this;
		for (var i = 0; i < TablePlugin.TableRegistry.length; i++) {
			TablePlugin.TableRegistry[i].hasFocus = false;
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
		TablePlugin.activeTable = focusTable;

    // show configured formatting classes
    for (var i = 0; i < this.tableMSItems.length; i++) {
      this.tableMSButton.extButton.showItem(this.tableMSItems[i].name);
    }
    
    this.tableMSButton.setActiveItem();
    
    if (this.activeTable) {
      for (var i = 0; i < this.tableConfig.length; i++) {
        if (this.activeTable.obj.hasClass(this.tableConfig[i].cssClass)) {
          this.tableMSButton.setActiveItem(this.tableConfig[i].name);
          // TODO ???? k = this.tableConfig.length;
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
	TablePlugin.makeClean = function (obj) {
		// find all table tags
		obj.find('table').each(function() {
			// instantiate a new table-object
			var table = new Table(this);
			// deactivate the table
			table.deactivate();
		});
	};

	/**
	 * String representation of the Table-object
	 *
	 * @return The plugins namespace (string)
	 */
	TablePlugin.toString = function() {
		return this.prefix;
	};
	/* -- END METHODS -- */

	/**************************
	  +---------------------+
	  | Table |
	  +---------------------+
	***************************/
	/**
	 * Constructor of the table object
	 *
	 * @param table
	 *            the dom-representation of the held table
	 * @return void
	 */
	var Table = function(table) {
		// set the table attribut "obj" as a jquery represenation of the dom-table
		this.obj = jQuery(table);

		if ( !this.obj.attr('id') ) {
			this.obj.attr('id', GENTICS.Utils.guid());
		}

		this.refresh();
	};  /* -- ATTRIBUTES -- */

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
		 * @see Aloha.Table.Cell
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

	/* -- END ATTRIBUTES -- */

	/* -- METHODS -- */
	/**
	 * @hide
	 */
	Table.prototype.refresh = function () {
		// find the dimensions of the table
		this.numCols = this.countVirtualCols();

		var rows = this.obj.find("tr");
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

	Table.prototype.countVirtualCols = function() {
		var $firstRow = this.obj.children().children('tr:first-child').children();
		return $firstRow.length - $firstRow.filter('.' + this.get('classLeftUpperCorner')).length;
	};

	/* -- METHODS -- */
	/**
	 * Wrapper-Mehotd to return a property of TablePlugin.get
	 *
	 * @see TablePlugin.get
	 * @param property
	 *            the property whichs value should be return
	 * @return the value associated with the property
	 */
	Table.prototype.get = function(property) {
		return TablePlugin.get(property);
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
	Table.prototype.set = function(key, value) {
		TablePlugin.set(key, value);
	};

	/**
	 * Transforms the existing dom-table into an editable aloha-table. In fact it
	 * replaces the td-elements with equivalent Table.Cell-elements
	 * with attached events.
	 * Furthermore it creates wrapping divs to realize a click-area for row- and
	 * column selection and also attaches events.
	 *
	 * @return void
	 */
	Table.prototype.activate = function() {
		if (this.isActive) {
			return;
		}
		var that = this,
			htmlTableWrapper, tableWrapper;

		// alter the table attributes
		this.obj.addClass(this.get('className'));
		this.obj.contentEditable(false);


		// set an id to the table if not already set
		if (this.obj.attr('id') == '') {
			this.obj.attr('id', GENTICS.Utils.guid() );
		}

		// unset the selection type
		TableSelection.selectionType = undefined;

		this.obj.bind('keydown', function(jqEvent){
			if (!jqEvent.ctrlKey && !jqEvent.shiftKey) {
				if (TableSelection.selectedCells.length > 0 && TableSelection.selectedCells[0].length > 0) {
					TableSelection.selectedCells[0][0].firstChild.focus();
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
		tableWrapper = jQuery('<div class="' + this.get('classTableWrapper') + '"></div>');
		tableWrapper.contentEditable(false);

		// wrap the tableWrapper around the table
		this.obj.wrap(tableWrapper);

		// :HINT The outest div (Editable) of the table is still in an editable
		// div. So IE will surround the the wrapper div with a resize-border
		// Workaround => just disable the handles so hopefully won't happen any ugly stuff.
		// Disable resize and selection of the controls (only IE)
		// Events only can be set to elements which are loaded from the DOM (if they
		// were created dynamically before) ;)
		htmlTableWrapper = this.obj.parents('.' + this.get('classTableWrapper'));
		htmlTableWrapper.get(0).onresizestart   = function(e) { return false; };
		htmlTableWrapper.get(0).oncontrolselect = function(e) { return false; };
		htmlTableWrapper.get(0).ondragstart = function(e) { return false; };
		htmlTableWrapper.get(0).onmovestart = function(e) { return false; };
		htmlTableWrapper.get(0).onselectstart = function(e) { return false; };

		this.tableWrapper     = this.obj.parents('.' + this.get('classTableWrapper')).get(0);

		jQuery(this.cells).each(function () {
			this.activate();
		});

		// after the cells where replaced with contentEditables ... add selection cells
		// first add the additional columns on the left side
		this.attachSelectionColumn();
		// then add the additional row at the top
		this.attachSelectionRow();

		// make the caption editable

		this.makeCaptionEditable();

		// check WAI status
		this.checkWai();

		// set flag, that the table is activated
		this.isActive = true;

		// throw a new event when the table has been activated
		Aloha.trigger('aloha-table-activated');
	};

	/**
	 * Make the table caption editable (if present)
	 */
	Table.prototype.makeCaptionEditable = function() {
		var caption = this.obj.find('caption').eq(0);
		if (caption) {
			TablePlugin.makeCaptionEditable(caption);
		}
	};

  /**
   * check the WAI conformity of the table and sets the attribute.
   */
  Table.prototype.checkWai = function () {
    var w = this.wai;
    
    w.removeClass(this.get('waiGreen'));
    w.removeClass(this.get('waiRed'));
    
    // Y U NO explain why we must check that summary is longer than 5 characters?
    // http://cdn3.knowyourmeme.com/i/000/089/665/original/tumblr_l96b01l36p1qdhmifo1_500.jpg

    if (this.obj[0].summary.trim() != '') {
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
	Table.prototype.attachSelectionColumn = function() {
		// create an empty cell
		var emptyCell = jQuery('<td>'),
			rowIndex, columnToInsert, rowObj, that = this, rows, i;

		// set the unicode '&nbsp;' code
		emptyCell.html('<div>\u00a0</div>');

		that = this;
		rows = this.obj.context.rows;

		// add a column before each first cell of each row
		for ( i = 0; i < rows.length; i++) {
			rowObj = jQuery(rows[i]);
			columnToInsert = emptyCell.clone();
			columnToInsert.addClass(this.get('classSelectionColumn'));
			columnToInsert.css('width', this.get('selectionArea') + 'px');
			//rowObj.find('td:first').before(columnToInsert);
			rowObj.children().first().before(columnToInsert);			
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
	Table.prototype.attachRowSelectionEventsToCell = function(cell){
		var that = this;

		// unbind eventually existing events of this cell
		cell.unbind('mousedown');
		cell.unbind('mouseover');

		// prevent ie from selecting the contents of the table
		cell.get(0).onselectstart = function() { return false; };

		cell.bind('mousedown', function(e){
			// set flag that the mouse is pressed
//TODO to implement the mousedown-select effect not only must the
//mousedown be set here but also be unset when the mouse button is
//released.
//			that.mousedown = true;
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
	Table.prototype.rowSelectionMouseDown = function (jqEvent) {

		// focus the table (if not already done)
		this.focus();

		// if no cells are selected, reset the selection-array
		if (TableSelection.selectedCells.length == 0) {
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
	Table.prototype.rowSelectionMouseOver = function (jqEvent) {
		var rowIndex = jqEvent.currentTarget.parentNode.rowIndex,
			indexInArray, start, end, i;

		// only select the row if the mouse was clicked and the clickedRowId isn't
		// from the selection-row (row-id = 0)
		if (this.mousedown && this.clickedRowId >= 0) {

			// select first cell
	//		var firstCell = this.obj.find('tr:nth-child(2) td:nth-child(2)').children('div[contenteditable=true]').get(0);
	//		jQuery(firstCell).get(0).focus();

			indexInArray = jQuery.inArray(rowIndex, this.rowsToSelect);

			start = (rowIndex < this.clickedRowId) ? rowIndex : this.clickedRowId;
			end = (rowIndex < this.clickedRowId) ? this.clickedRowId : rowIndex;

			this.rowsToSelect = new Array();
			for ( i = start; i <= end; i++) {
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
//    emptyCell.html('\u00a0');
	emptyCell.html('<div>\u00a0</div>');
    
    // get the number of columns in the table
    // iterate through all rows and find the maximum number of columns to add
    var numColumns = 0;
    for(var i = 0; i < this.obj.context.rows.length; i++){
      var curNumColumns = this.obj.context.rows[i].cells.length;
      if(numColumns < curNumColumns)
        numColumns = curNumColumns;
    }
    
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
        //set the colspan of selection column to match the colspan of first row columns
      } else {
        var columnToInsert = jQuery('<td>').clone();
        columnToInsert.addClass(this.get('classLeftUpperCorner'));
        this.wai =
          jQuery('<div/>')
            .width(25)
            .height(12)
            .click(function (e) {
              // select the Table 
              that.focus();
             
              FloatingMenu.userActivatedTab = i18n.t('floatingmenu.tab.table');
              FloatingMenu.doLayout();
              
              // jump in Summary field
              // attempting to focus on summary input field will occasionally result in the
              // following exception:
              //uncaught exception: [Exception... "Component returned failure code: 0x80004005 (NS_ERROR_FAILURE) [nsIDOMHTMLInputElement.setSelectionRange]" nsresult: "0x80004005 (NS_ERROR_FAILURE)" location: "JS frame :: src/dep/ext-3.2.1/ext-all.js :: <TOP_LEVEL> :: line 11" data: no]
              // this occurs when the tab in which the summary field is contained is not visible
              // TODO: I'm adding a try catch clause here for the time being, but a proper solution, which addresses the problem of how to handle invisible fields ought to be persued.

              try {
                TablePlugin.summary.focus();
                e.stopPropagation();
                e.preventDefault();
              } catch (e) {}

              return false;
            });
        
        columnToInsert.append(this.wai);
      }
      
      // add the cell to the row
      selectionRow.append(columnToInsert);
    }
    
    // global mouseup event to reset the selection properties
    jQuery(document).bind('mouseup', function(e) { that.columnSelectionMouseUp(e) } );
    
    this.obj.find('tr:first').before( selectionRow );
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
		cell.get(0).onselectstart = function() { return false; };

		cell.bind('mousedown',  function(e) { that.columnSelectionMouseDown(e) } );
		cell.bind('mouseover', function(e) { that.columnSelectionMouseOver(e) } );
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
	Table.prototype.columnSelectionMouseDown = function (jqEvent) {

		var 
			columnsToSelect = [],
			colIdx;

		this.focus();

		// if no cells are selected, reset the selection-array
//		if (TableSelection.selectedCells.length == 0) {
//			columnsToSelect = new Array();
//		}

		// store the id of the column which has been originally clicked
		colIdx = jqEvent.currentTarget.cellIndex;
		this.mouseDownColIdx = colIdx;

		if ( jqEvent.metaKey ) {
			var arrayIndex = jQuery.inArray(colIdx, columnsToSelect);
			if ( arrayIndex >= 0 ) {
				columnsToSelect.splice(arrayIndex, 1);
			} else {
				columnsToSelect.push( colIdx );
			}
		} else if ( jqEvent.shiftKey ) {
			columnsToSelect.sort( function( a, b ){ return a - b; } );
			var start = columnsToSelect[0];
			var end = colIdx;
			if (start > end) {
				start = end;
				end = columnsToSelect[0];
			}
			for (var i = start; i <= end; i++) {
				columnsToSelect.push(i);
			}
		} else {
			columnsToSelect = [ colIdx ];
		}

		// this does actually the column-selection.
		// it reads the columns which should be selected from "columnsToSelect"
		TablePlugin.activeTable.selectColumns( columnsToSelect );

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
	Table.prototype.columnSelectionMouseOver = function (jqEvent) {

		var 
			colIdx = jqEvent.currentTarget.cellIndex,
			columnsToSelect = [],
			start,
			end;
		
		// select all columns from the last clicked to the hoverd 
		if ( this.mouseDownColIdx ) {
			start = (colIdx < this.mouseDownColIdx) ? colIdx : this.mouseDownColIdx;
			end = (colIdx < this.mouseDownColIdx) ? this.mouseDownColIdx : colIdx;
			for (var i = start; i <= end; i++) {
				columnsToSelect.push(i);
			}
			this.selectColumns( columnsToSelect );
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
	Table.prototype.deleteRows = function() {
		var 
			rowIDs = [],
			rowsToDelete = {},
			Table = this;

		// flag if the table should be deleted
		var deleteTable = false;

		// if a selection was made, delete the selected cells
		if (TableSelection.selectedCells.length > 0) {
			for (var i = 0; i < TableSelection.selectedCells.length; i++) {
				rowsToDelete[TableSelection.selectedCells[i].parentNode.rowIndex] = true;
			}

		// if no rows were selected, delete the row, where the cursor is placed in
		}else if (typeof Table.Cell.lastActiveCell != 'undefined') {
			rowsToDelete[Table.Cell.lastActiveCell.obj.context.parentNode.rowIndex] = true;
		}
		
	    for (rowId in rowsToDelete) {
	       rowIDs.push(rowId);
	    }
	    
		// if all rows should be deleted, set flag to remove the WHOLE table
		if (rowIDs.length == this.numRows) {
			deleteTable = true;
		}

		// delete the whole table
		if (deleteTable) {
			var that = this;
			Aloha.showMessage(new Aloha.Message({
				title : i18n.t('Table'),
				text : i18n.t('deletetable.confirm'),
				type : Aloha.Message.Type.CONFIRM,
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

			// IE needs a timeout to work properly
			setTimeout( function() {
				var lastCell = jQuery( rows[1].cells[ focusColID +1 ] );
				lastCell.focus()
			}, 5);

			// finally unselect the marked cells
			TableSelection.unselectCells();
		}
	};

	/**
	 * Deletes the selected columns. If no columns are selected, delete the column, where the
	 * cursor is positioned. If all columns of the table should be deleted, the whole
	 * table is deleted from the dom and removed from the tableRegistry.
	 *
	 * @return void
	 */
	Table.prototype.deleteColumns = function() {
		var 
			colIDs = [],
			cellToDelete = [],
			// get all rows to iterate
			rows = this.obj.find('tr'),
			that = this,
			changeColspan = [],
			focusColID,
			cells,
			cellInfo;
		
		var grid = Utils.makeGrid(rows);
		var selectColWidth = 1; //width of the select-row column

		// if all columns should be deleted, remove the WHOLE table
		// delete the whole table
		if ( TableSelection.selectedColumnIdxs.length == grid[0].length - selectColWidth ) {
			
			Aloha.showMessage(new Aloha.Message({
				title : i18n.t('Table'),
				text : i18n.t('deletetable.confirm'),
				type : Aloha.Message.Type.CONFIRM,
				callback : function (sel) {
					if (sel == 'yes') {
						that.deleteTable();
					}
				}
			}));
			
		} else {
			
			colIDs.sort(function(a,b) {return a - b;} );
			
// TODO check which cell should be focused after the deletion
//			focusColID = colIDs[0];
//			if ( focusColID > (this.numCols - colIDs.length) ) {
//				focusColID --;
//			}

			//TODO there is a bug that that occurs if a column is
			//selected and deleted, and then a column with a greater
			//x-index is selected and deleted.

			//sorted so we delete from right to left to minimize interfernce of deleted rows
			var gridColumns = TableSelection.selectedColumnIdxs.sort(function(a,b){ return b - a; });
			for (var i = 0; i < gridColumns.length; i++) {
				var gridColumn = gridColumns[i];
				for (var j = 0; j < rows.length; j++) {
					var cellInfo = grid[j][gridColumn];
					if ( ! cellInfo ) {
						//TODO this case occurred because of a bug somewhere which should be fixed
						continue;
					}
					if ( 0 === cellInfo.spannedX ) {
						if (1 < cellInfo.colspan) {
							var nCell = TablePlugin.activeTable.newActiveCell().obj;
							jQuery( cellInfo.cell ).after(nCell);
							nCell.attr('rowspan', cellInfo.rowspan);
							nCell.attr('colspan', cellInfo.colspan - 1);
						}
						jQuery( cellInfo.cell ).remove();
					} else {
						jQuery( cellInfo.cell ).attr('colspan', cellInfo.colspan - 1);
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
			setTimeout( function() {
				var lastCell = jQuery( rows[1].cells[ focusColID +1 ] );
				lastCell.focus()
			}, 5);

			TableSelection.unselectCells();
		}
	};

	/**
	 * Deletes the table from the dom and remove it from the tableRegistry.
	 *
	 * @return void
	 */
	Table.prototype.deleteTable = function() {
		var deleteIndex = -1;
		for (var i = 0; i < TablePlugin.TableRegistry.length; i++){
			if (TablePlugin.TableRegistry[i].obj.attr('id') == this.obj.attr('id')) {
				deleteIndex = i;
				break;
			}
		}
		if (deleteIndex >= 0) {
			// before deleting the table, deactivate it
			this.deactivate();

			TableSelection.selectionType = undefined;
			TablePlugin.TableRegistry.splice(i, 1);

			// we will set the cursor right before the removed table
			var newRange = Aloha.Selection.rangeObject;
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
	 * @see Table.prototype.addRow
	 * @return
	 */
	Table.prototype.addRowsBefore = function(highlightNewRows) {
		this.addRows('before', highlightNewRows);
	};

	/**
	 * Wrapper function for this.addRow to add a row after the active row
	 *
	 * @param highlightNewRows flag if the newly created rows should be marked as selected
	 * @see Table.prototype.addRow
	 * @return
	 */
	Table.prototype.addRowsAfter = function(highlightNewRows) {
		this.addRows('after', highlightNewRows);
	};

	/**
	 * Adds new rows to the table. If rows were selected, the new rows will be
	 * inserted before/after the first/last selected row. If no rows are selected, a
	 * new row will be inserted before/after the row of the currently selected cell.
	 * As well the row-selection events have to be bound again.
	 *
	 * @param {string} position
	 *            could be 'after' or 'before'. defines the position where the new
	 *            rows should be inserted
	 * @param {boolean} highlightNewRows
	 *            flag if the newly created rows should be marked as selected
	 * @return void
	 */
	Table.prototype.addRows = function(position, highlightNewRows) {
		if (!TablePlugin.activeTable) {
			return;
		}

		var that = this;
		var rowsToInsert = 1;
		var newRowIndex = 0;
		
		// If rows were selected, then the selected number of rows will be the
		// quotient of all the number of selected cells / by the number of
		// columns. If no rows were selected, we insert 1 new row before/after
		// the row of the last active cell
		if (TableSelection.selectedCells.length > 0) {
			
			var cellOfInterest = null;
			
			// get the index where the new rows should be inserted
			switch (position) {
				case 'before':
					cellOfInterest = TableSelection.selectedCells[0];
					break;
				case 'after':
					cellOfInterest = TableSelection.selectedCells[
						TableSelection.selectedCells.length - 1
					];
					break;
			}
			
			if (cellOfInterest && cellOfInterest.nodeType == 1) {
				newRowIndex = cellOfInterest.parentNode.rowIndex;
			}
		} else if (typeof Table.Cell.lastActiveCell !== 'undefined') {
			newRowIndex = Table.Cell.lastActiveCell.obj.context.parentNode.rowIndex;
		}

		// save a copy of the new row index for the created row
		var currentRowIndex = newRowIndex;
		
		// If we are inserting the news rows 'after' the current row, then the
		// newRowIndex will be the 1 more than the actual row
		if (position == 'after') {
			++newRowIndex;
		}

		var numCols = this.countVirtualCols();
		var $rows = this.obj.children().children('tr');
		var rowIdArray = [];
		for (var j = 0; j < rowsToInsert; j++) {
			rowIdArray.push(newRowIndex);
			var insertionRow = jQuery('<tr>');

			// create the first column, the "select row" column
			var selectionColumn = jQuery('<td>');
			selectionColumn.addClass(this.get('classSelectionColumn'));
			this.attachRowSelectionEventsToCell(selectionColumn);
			insertionRow.append(selectionColumn);

			var grid = Utils.makeGrid($rows);
			var selectColOffset = 1;
			if ( newRowIndex >= grid.length ) {
				for (var i = selectColOffset; i < grid[0].length; i++) {
					insertionRow.append(TablePlugin.activeTable.newActiveCell().obj);
				}
			} else {
				for (var i = selectColOffset; i < grid[newRowIndex].length; ) {
					var cellInfo = grid[newRowIndex][i];
					if (Utils.containsDomCell(cellInfo)) {
						var colspan = cellInfo.colspan;
						while (colspan--) {
							insertionRow.append(TablePlugin.activeTable.newActiveCell().obj);
						}
					} else {
						jQuery( cellInfo.cell ).attr('rowspan', cellInfo.rowspan + 1);
					}
					i += cellInfo.colspan;
				}
			}

			switch (position) {
				case 'before':
				    $rows.eq(currentRowIndex).before(insertionRow);
					break;
				case 'after':
				    $rows.eq(currentRowIndex).after(insertionRow);
					break;
				default:
					this.warn(this, 'Wrong call of Table.prototype.addRow!');
			}

			++newRowIndex;
		}
		
		this.numRows += rowsToInsert;
		
		TableSelection.unselectCells();

		this.rowsToSelect = rowIdArray;
		
		if (highlightNewRows) {
			this.selectRows();
		}
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
	Table.prototype.addColumnsLeft = function() {
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
	Table.prototype.addColumns = function( position ) {
		var 
			that = this,
			emptyCell = jQuery('<td>'),
			rows = this.obj.find('tr'),
			cell,
			currentColIdx,
			columnsToSelect = [],
			selectedColumnIdxs = TableSelection.selectedColumnIdxs;
		
		
		if ( typeof TablePlugin.activeTable != 'undefined' ) {

			// sort the columns because next algorithm needs that
			if ( position == 'left' ) {
				selectedColumnIdxs.sort( function (a,b) { return a - b; } );
			} else {
				selectedColumnIdxs.sort( function (a,b) { return b - a; } );
			}
			
			var grid = Utils.makeGrid(rows);
			for (var i = 0; i < rows.length; i++) {
				for (var j = 0; j < selectedColumnIdxs.length; j++) {
					
					// prepare the cell to be inserted
					cell = emptyCell.clone();
					cell.html('\u00a0');

					currentColIdx = selectedColumnIdxs[j];

					// on first row correct the position of the selected columns
					if ( i == 0 ) {
						switch ( position ) {
						case 'left':
							for ( var c = 0; c < columnsToSelect.length; ++c ) {
								// if we insert before an already processed 
								// column move the selection 1 position right
								if ( columnsToSelect[c] >= currentColIdx ) {
									columnsToSelect[c]++;
								}
							}
							columnsToSelect.push( currentColIdx + j + 1 );
							break;
						case 'right':
							for ( var c = 0; c < columnsToSelect.length; ++c ) {
								// if we insert after an already processed 
								// column move the selection 1 position right
								if ( columnsToSelect[c] >= currentColIdx ) {
									columnsToSelect[c]++;
								}
							}
							columnsToSelect.push( currentColIdx );
							break;
						}

						// this is the first row, so make a column-selection cell
						this.attachColumnSelectEventsToCell( cell );

					} else {
						// activate the cell for this table
						cellObj = TablePlugin.activeTable.newActiveCell( cell.get(0) );
						cell = cellObj.obj;
					}

					
					var leftCell = Utils.leftDomCell( grid, i, currentColIdx );
					if ( null == leftCell ) {
						jQuery( rows[i] ).prepend( cell );
					} else {
						if ( 'left' === position ) {
							jQuery( leftCell ).before( cell );
						} else {//right
							jQuery( leftCell ).after( cell );
						}
					}

					this.numCols++;
				}
			}
			
			TableSelection.unselectCells();
			this.selectColumns( columnsToSelect );
		}
	};

	/**
	 * Helper method to set the focus-attribute of the table to true
	 *
	 * @return void
	 */
	Table.prototype.focus = function() {
		if (!this.hasFocus) {
			if (!this.parentEditable.isActive) {
				this.parentEditable.obj.focus();
			}

			TablePlugin.setFocusedTable(this);

			// select first cell
			// TODO put cursor in first cell without selecting
	//		var firstCell = this.obj.find('tr:nth-child(2) td:nth-child(2)').children('div[contenteditable=true]').get(0);
	//		jQuery(firstCell).get(0).focus();

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
	Table.prototype.focusOut = function() {
		if (this.hasFocus) {
			TablePlugin.setFocusedTable(undefined);
			TableSelection.selectionType = undefined;
		}
	};

  /**
   * Marks all cells of the specified column as marked (adds a special class)
   *
   * @return void
   */
	Table.prototype.selectColumns = function ( columns ) {
		
		var columnsToSelect;
		
		if ( columns ) {
			columnsToSelect = columns;
		} else {
			columnsToSelect = this.columnsToSelect;
		}

		// ====== BEGIN UI specific code - should be handled on event aloha-table-selection-changed by UI =======
		// activate all column formatting button
		for ( var i = 0; i < TablePlugin.columnMSItems.length; i++ ) {
			TablePlugin.columnMSButton.extButton.showItem(TablePlugin.columnMSItems[i].name);
		}
		
		FloatingMenu.setScope(TablePlugin.name + '.column');
		
		TablePlugin.columnHeader.setPressed( TableSelection.isHeader() );
		
		var rows = this.obj.find("tr").toArray();

		// set the first class found as active item in the multisplit button
		TablePlugin.columnMSButton.setActiveItem();
		for (var k = 0; k < TablePlugin.columnConfig.length; k++) {
			if ( jQuery(rows[0].cells[0]).hasClass(TablePlugin.columnConfig[k].cssClass) ) {
				TablePlugin.columnMSButton.setActiveItem(TablePlugin.columnConfig[k].name);
				k = TablePlugin.columnConfig.length;
			}
		}

		// ====== END UI specific code - should be handled by UI =======

		// blur all editables within the table
		this.obj.find('div.aloha-ui-table-cell-editable').blur();

		TableSelection.selectColumns( columnsToSelect );

	};


/**
 * Marks all cells of the specified row as marked (adds a special class)
 *
 * @return void
 */
Table.prototype.selectRows = function () {
    
//	// get the class which selected cells should have
//    var selectClass = this.get('classCellSelected');
//
//    //deactivate keepCellsSelected flag
//    TableSelection.keepCellsSelected = false;
//
//    // unselect selected cells
//    TableSelection.unselectCells();
    
    // activate all row formatting button
    for (var i = 0; i < TablePlugin.rowMSItems.length; i++ ) {
      TablePlugin.rowMSButton.extButton.showItem(TablePlugin.rowMSItems[i].name);
    }
    
//    this.rowsToSelect.sort(function (a,b) {return a - b;});


	// set the status of the table header button to the status of the 
	// frist 2 selected cells (index 1+2). First cell is for selection.
//	if ( this.rowsToSelect &&  this.rowsToSelect.length > 0 &&
//		rowCells && rowCells[0] ) {
//	    if ( rowCells[1]  ) {
//	    	TablePlugin.rowHeader.setPressed(
//	    			// take 1 column to detect if the header button is pressd
//	    			rowsCells[1].nodeName.toLowerCase() == 'th' &&
//	    			rowsCells[2].nodeName.toLowerCase() == 'th'
//	    	);
//	    } else {
//	    	TablePlugin.rowHeader.setPressed( rowCells[1].nodeName.toLowerCase() == 'th');
//	    }
//	}
// 
	for (var i = 0; i < this.rowsToSelect.length; i++) {
      var rowId = this.rowsToSelect[i];
      var rowCells = jQuery(this.obj.find('tr').get(rowId).cells).toArray();
      
      if (i == 0) {
        // set the status of the table header button to the status of the first 2 selected
        // cells (index 1 + 2). The first cell is the selection-helper
//        TablePlugin.rowHeader.setPressed(
//          rowCells[1].nodeName.toLowerCase() == 'th'  &&
//          rowCells[2].nodeName.toLowerCase() == 'th'
////          jQuery(rowCells[1]).attr('scope') == 'col'
//        );

        // set the first class found as active item in the multisplit button
        for (var j = 0; j < rowCells.length; j++) {
          TablePlugin.rowMSButton.setActiveItem();
          for ( var k = 0; k < TablePlugin.rowConfig.length; k++) {
            if (jQuery(rowCells[j]).hasClass(TablePlugin.rowConfig[k].cssClass) ) {
              TablePlugin.rowMSButton.setActiveItem(TablePlugin.rowConfig[k].name);
              k = TablePlugin.rowConfig.length;
            }
          }
        }
      }

//      // shift the first element (which is a selection-helper cell)
//      rowCells.shift();
//
//      TableSelection.selectedCells = TableSelection.selectedCells.concat(rowCells);
//      
//      jQuery(rowCells).addClass(this.get('classCellSelected'));
    }
    
//    TableSelection.selectionType = 'row';
    FloatingMenu.setScope(TablePlugin.name + '.row');
    
    TableSelection.selectRows( this.rowsToSelect );
	TablePlugin.columnHeader.setPressed( TableSelection.isHeader() );

    // blur all editables within the table
    this.obj.find('div.aloha-ui-table-cell-editable').blur();
  };

	/**
	 * Deactivation of a Aloha-table. Clean up ... remove the wrapping div and the
	 * selection-helper divs
	 *
	 * @return void
	 */
	Table.prototype.deactivate = function() {
		this.obj.removeClass(this.get('className'));
		if (jQuery.trim(this.obj.attr('class')) == '') {
			this.obj.removeAttr('class');
		}
		this.obj.removeAttr('contenteditable');
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
	 * toString-method for Table object
	 *
	 * @return void
	 */
	Table.prototype.toString = function() {
		return 'Table';
	};

	Table.prototype.newCell = function(domElement) {
		return new Table.Cell(domElement, this);
	};

	Table.prototype.newActiveCell = function(domElement) {
		var cell = new Table.Cell(domElement, this);
		cell.activate();
		return cell;
	};

	/* -- END METHODS -- */

	var TableSelection = new (TableSelectionModuleConstructor(TablePlugin))();

	Table.Cell = CellModuleConstructor(TableSelection);
	Table.CreateLayer = CreateLayerModuleConstructor(TablePlugin);

	Aloha.TableSelection = TableSelection;

	PluginManager.register(TablePlugin);
	//return TablePlugin;
});
