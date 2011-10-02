/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com - way to over-lawyer it up Andrew :/
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define(
['aloha', 'aloha/jquery', 'aloha/plugin', 'aloha/pluginmanager', 'aloha/floatingmenu', 'i18n!table/nls/i18n', 'i18n!aloha/nls/i18n', 'css!table/css/table.css'],
function(Aloha, jQuery, Plugin, PluginManager, FloatingMenu, i18n, i18nCore) {

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

		FloatingMenu.addButton(
			this.name + '.cell',
			this.summary,
			i18n.t('floatingmenu.tab.table'),
			1
		);

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
				var Cell = new Table.Cell(col, this);
				this.cells.push(Cell);
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
		
		var grid = makeGrid(rows);
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
							var nCell = newCell().obj;
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
				grid = makeGrid(rows);
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

			var grid = makeGrid($rows);
			var selectColOffset = 1;
			if ( newRowIndex >= grid.length ) {
				for (var i = selectColOffset; i < grid[0].length; i++) {
					insertionRow.append(newCell().obj);
				}
			} else {
				for (var i = selectColOffset; i < grid[newRowIndex].length; ) {
					var cellInfo = grid[newRowIndex][i];
					if (containsDomCell(cellInfo)) {
						var colspan = cellInfo.colspan;
						while (colspan--) {
							var nCell = newCell();
							insertionRow.append(nCell.obj);
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
			
			var grid = makeGrid(rows);
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
						cellObj = new Table.Cell( cell.get(0), TablePlugin.activeTable );
						this.cells.push( cellObj );
						cellObj.activate();
						cell = cellObj.obj;
					}

					
					var leftCell = leftDomCell( grid, i, currentColIdx );
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
	/* -- END METHODS -- */

	/*****************************
	  +--------------------------+
	  | Table.Cell |
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
	 *            Table-Object which contains the cell
	 *
	 * @return the created table-data field as DOM-representation
	 */
	Table.Cell = function(originalTd, tableObj) {
		this.obj = jQuery(originalTd);
		this.tableObj = tableObj;
	};
	/* -- ATTRIBUTES -- */
	/**
	 * Reference to the jQuery-representation of the wrapping table
	 *
	 * @see Table.Cell.table
	 */
	Table.Cell.prototype.tableObj = undefined;

	/**
	 * Reference to the jQuery td-Object of the cell
	 */
	Table.Cell.prototype.obj = undefined;

	/**
	 * The jQuery wrapper of the cell
	 */
	Table.Cell.prototype.wrapper = undefined;

	/**
	 * Flag if the cell has focus
	 */
	Table.Cell.prototype.hasFocus = false;

	/**
	 * The jQuery wrapper of the cell
	 */
	Table.Cell.activeCell = undefined;

	/**
	 * The jQuery wrapper of the cell
	 */
	Table.Cell.lastActiveCell = undefined;
	/* -- END ATTRIBUTES -- */


	/**
	 * Focus method for the contentediable div within a table data-field. The method
	 * requires the event-property Cell as a Table.Cell object. If the
	 * Cell wasn't activated yet it does all relevant actions to activate the cell.
	 *
	 * @param e
	 *            the jquery event object
	 * @return void
	 */
	Table.Cell.prototype.editableFocus = function(e) {
		// only do activation stuff if the cell don't has the focus
		if (!this.hasFocus) {
			// set an internal flag to focus the table
			this.tableObj.focus();

			// set the clicked cell active as the active cell
			Table.Cell.activeCell = this;

			// set the clicked cell active as the last active cell (the difference
			// to activeCell is that lastActiveCell won't be reset on blur)
			Table.Cell.lastActiveCell = this;

			// add an active-class
			this.obj.addClass('aloha-table-cell_active');

			// set the focus flag
			this.hasFocus = true;

			// select the whole content in the table-data field
			this.selectAll(this.wrapper.get(0));

			// unset the selection type
			TableSelection.selectionType = 'cell';

		}
	};

	/**
	 * Blur event for the contenteditable div within a table-data field. The method
	 * requires the event-property Cell as a Table.Cell object. It
	 * sets the hasFocus flag of the cell to false and removes the "active"
	 * css-class.
	 *
	 * @param jqEvent
	 *            the jquery event object
	 * @return void
	 */
	Table.Cell.prototype.editableBlur = function(jqEvent){
		// no active cell
		Table.Cell.activeCell = undefined;

		// reset the focus of the cell
		this.hasFocus = false;

		// remove "active class"
		this.obj.removeClass('aloha-table-cell-active');
	};

	Table.Cell.prototype.activate = function() {
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
			TableSelection.unselectCells();
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
	Table.Cell.prototype.deactivate = function() {
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
  Table.Cell.prototype.virtualX = function(){
	  var $rows = this.tableObj.obj.children().children('tr');
	  var rowIdx = this.obj.parent().index();
	  var colIdx = this.obj.index();
	  return cellIndexToGridColumn($rows, rowIdx, colIdx);
  };

  /**
   * Gives the Y (row no) for a cell, after adding colspans 
   */
  Table.Cell.prototype.virtualY = function(){
	  return this.obj.parent('tr').index();
  };

  /**
   * Starts the cell selection mode
   */
	Table.Cell.prototype.startCellSelection = function(){
		if(!TableSelection.cellSelectionMode){

			//deactivate keepCellsSelected flag
			TableSelection.keepCellsSelected = false;

			//unselect currently selected cells
			TableSelection.unselectCells();

			// activate cell selection mode
			TableSelection.cellSelectionMode = true; 

			//bind a global mouseup event handler to stop cell selection
			var that = this;
			jQuery('body').bind('mouseup.cellselection', function(){
				that.endCellSelection();
			});

			TableSelection.baseCellPosition = [this.virtualY(), this.virtualX()];
		}
	};

  /**
   * Ends the cell selection mode
   */
  Table.Cell.prototype.endCellSelection = function(){
    if(TableSelection.cellSelectionMode){
      TableSelection.cellSelectionMode = false; 
      TableSelection.keepCellsSelected = true;
      TableSelection.baseCellPosition = null;
      TableSelection.lastSelectionRange = null; 

      TableSelection.selectionType = 'cell';

      //unbind the global cell selection event
      jQuery('body').unbind('mouseup.cellselection');
    }
  };

	/**
	 * Toggles selection of cell.
	 * This works only when cell selection mode is active. 
	 */
	Table.Cell.prototype.selectCellRange = function(){
		if(!TableSelection.cellSelectionMode) {
			return;
		}

		var cX = this.virtualX();
		var cY = this.virtualY();
		var basePos = TableSelection.baseCellPosition;
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
		var grid = makeGrid($rows);
		
		TableSelection.selectedCells = [];
		var selectClass = this.tableObj.get('classCellSelected');
		for (var i = 0; i < grid.length; i++) {
			for (var j = 0; j < grid[i].length; j++) {
				var cellInfo = grid[i][j];
				if ( containsDomCell(cellInfo) ) {
					if (i >= bY && i <= cY && j >= bX && j <= cX) {
						jQuery( cellInfo.cell ).addClass(selectClass);
						TableSelection.selectedCells.push(cellInfo.cell);
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
	Table.Cell.prototype.toString = function() {
		return 'Table.Cell';
	};

	/**
	 * Selects all inner-contens of an contentEditable-object
	 *
	 * @param editableNode dom-representation of the editable node (div-element)
	 * @return void
	 */
	Table.Cell.prototype.selectAll = function(editableNode) {
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
	 ;*
	 * @param jqEvent
	 *            the jquery-event object
	 * @return void
	 */
	Table.Cell.prototype.editableMouseDown = function(jqEvent) {
		// deselect all highlighted cells registered in the TableSelection object
		TableSelection.unselectCells();

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
//	Table.Cell.prototype.editableKeyUp = function(jqEvent) {
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
	Table.Cell.prototype.editableKeyDown = function(jqEvent) {
		
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
			if (TableSelection.selectedCells.length > 0 && TableSelection.selectedCells[0].length > 0) {
				TableSelection.selectedCells[0][0].firstChild.focus();
				TableSelection.unselectCells();
				jqEvent.stopPropagation();
			}
		}else if(jqEvent.shiftKey && TableSelection.selectedCells.length > 0){

			switch (TableSelection.selectionType) {
				case 'row':
					switch(jqEvent.keyCode) {
						case KEYCODE_ARROWUP:
							var firstSelectedRow = TableSelection.selectedCells[0][0].parentNode.rowIndex;
							if (firstSelectedRow > 1) {
								this.tableObj.rowsToSelect.push(firstSelectedRow - 1);
							}
							break;
						case KEYCODE_ARROWDOWN:
							var lastRowIndex = TableSelection.selectedCells.length - 1;
							var lastSelectedRow = TableSelection.selectedCells[lastRowIndex][0].parentNode.rowIndex;
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
							var firstColSelected = TableSelection.selectedCells[0][0].cellIndex;
							if (firstColSelected > 1) {
								this.tableObj.columnsToSelect.push(firstColSelected - 1);
							}
							break;
						case KEYCODE_ARROWRIGHT:
							var lastColIndex = TableSelection.selectedCells[0].length - 1;
							var lastColSelected = TableSelection.selectedCells[0][lastColIndex].cellIndex;
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
	Table.Cell.prototype.checkForEmptyEvent = function(jqEvent) {
		var
			$wrapper = jQuery(this.wrapper),
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
	/* -- END METHODS -- */


	/**************************************
	  +---------------------------------+
	  | Table.CreateLayer |
	  +---------------------------------+
	***************************************/
	/**
	 * Dummy initialize of the CreateLayer object
	 */
	Table.CreateLayer = function(){};

	/* -- ATTRIBUTES -- */
	/**
	 * Internal configuration of the create-table panel
	 */
	Table.CreateLayer.prototype.parameters = {
		elemId: 'aloha-table-createLayer', // id of the create-table panel
		className: 'aloha-table-createdialog',   // class-name of the create-table panel
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
	Table.CreateLayer.prototype.config = new Object();

	/**
	 * Flag wether the CreateLayer is currently visble or not
	 */
	Table.CreateLayer.prototype.visible = false;
	/* -- END ATTRIBUTES -- */

	/* -- METHODS -- */
	/**
	 * This function checks if there is an create-table-layer. If no layer exists, it creates one and puts it into the configuration.
	 * If the layer was already created it sets the position of the panel and shows it.
	 *
	 * @return void
	 */
	Table.CreateLayer.prototype.show = function(){
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
	Table.CreateLayer.prototype.create = function () {
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

					TablePlugin.createTable(cols, rows);
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
	Table.CreateLayer.prototype.handleMouseOver = function(e, table) {
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
	Table.CreateLayer.prototype.setPosition = function() {
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
	Table.CreateLayer.prototype.hide = function() {
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
	Table.CreateLayer.prototype.get = function(property) {
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
	Table.CreateLayer.prototype.set = function (key, value) {
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
	  | TableSelection |
	  +---------------------------+
	*********************************/
	/**
	 * The TableSelection object is a helper-object which consists of static/global attributes and functions
	 */
	var TableSelection = function(){};

	/* -- ATTRIBUTES -- */
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


	/* -- END ATTRIBUTES -- */

	/* -- METHODS -- */
	
	/**
	 * Marks all cells of the specified column or columns as selected
	 *
	 * @return void
	 */
	TableSelection.prototype.selectColumns = function ( columnsToSelect ) {
        if ( typeof TablePlugin.activeTable == 'undefined' || !TablePlugin.activeTable ) {
        	return;
        }

		this.unselectCells();

		var rows = TablePlugin.activeTable.obj.find("tr").toArray()
		// first row is the selection row (dump it, it's not needed)
		rows.shift();
			
		var grid = makeGrid(rows);
		for (var j = 0; j < columnsToSelect.length; j++) {
			// check if this column is already selected.
			if ( -1 !== jQuery.inArray(columnsToSelect[j], this.selectedColumnIdxs) ) {
				continue;
			}
			this.selectedColumnIdxs.push( columnsToSelect[j] );
			for (var i = 0; i < grid.length; i++) {
				var cellInfo = grid[i][columnsToSelect[j]];
				if ( containsDomCell(cellInfo) ) {
					jQuery(cellInfo.cell).addClass(TablePlugin.activeTable.get('classCellSelected'));
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
		  
		var 
			rows;

        if ( typeof TablePlugin.activeTable == 'undefined' || !TablePlugin.activeTable ) {
        	return;
        }

		this.unselectCells();

		rows = TablePlugin.activeTable.obj.find("tr").toArray();
		
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
					jQuery( rows[ rowsToSelect[i] ].cells[j] ).addClass( TablePlugin.activeTable.get('classCellSelected') );
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
		
        if ( typeof TablePlugin.activeTable == 'undefined' || !TablePlugin.activeTable ) {
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

    if ( typeof TablePlugin.activeTable == 'undefined' || !TablePlugin.activeTable ) {
    	return;
    }
    
    //don't unselect cells if cellSelectionMode is active
    if ( this.cellSelectionMode || this.keepCellsSelected ) {
    	return;
    }

	if (this.selectedCells.length > 0) {
			
			rows = TablePlugin.activeTable.obj.find("tr").toArray();
			
			for (var i = 0; i < rows.length; i++) {
			    for ( var j = 1; j < rows[i].cells.length; j++ ) {  
					// TODO make proper cell selection method
					jQuery( rows[i].cells[j] ).removeClass( TablePlugin.activeTable.get('classCellSelected') );
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
        var aRowId = jQuery(a).parent().prevAll('tr').length;
        var bRowId = jQuery(b).parent().prevAll('tr').length;

        var aColId = jQuery(a).prevAll('td, th').length;
        var bColId = jQuery(b).prevAll('td, th').length;

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

      var firstCell = jQuery(this.selectedCells.shift());

      //set the initial rowspan and colspan
      var rowspan = parseInt(firstCell.attr('rowspan')) || 1;
      var colspan = parseInt(firstCell.attr('colspan')) || 1;;

      var firstRowId = prevRowId = firstCell.parent().prevAll('tr').length;
      var firstColId = firstCell.parent().prevAll('tr').length;

      //iterate through remaining cells
			for (var i = 0; i < this.selectedCells.length; i++) {
        //get the current cell
        var curCell = jQuery(this.selectedCells[i]);

        var curRowId = curCell.parent().prevAll('tr').length;
        var curColId = curCell.parent().prevAll('tr').length;

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
      TableSelection.selectedCells = [firstCell];

      //reset flags
      TableSelection.cellSelectionMode = false; 
      TableSelection.keepCellsSelected = false;
      TableSelection.baseCellPosition = null;
      TableSelection.lastSelectionRange = null; 
      TableSelection.selectionType = 'cell';
		}
	};

	/**
	 * This method splits all selected cells (if they are already have row or column spans)
	 *
	 * @return void
	 */
	TableSelection.prototype.splitCells = function(){
		// split the selected cells or currently active cell
		var cells_to_split = (this.selectedCells.length > 0 ? this.selectedCells : [Table.Cell.lastActiveCell.obj[0]]);
		if (cells_to_split.length > 0) {

			//will be populated with rows that will get a new cell prepended
			var prepend = [];
			//will be populated with cells that will get a new cell inserted after
			var after = [];

			jQuery(cells_to_split).each(function(){
				var $cell = jQuery(this);
				var colspan = parseInt($cell.attr('colspan')) || 1;
				var rowspan = parseInt($cell.attr('rowspan')) || 1;

				var $row  = $cell.parent();
				var $rows = $row.parent().children();
				var rowIdx = $row.index();
				var colIdx = $cell.index();
				var grid = makeGrid($rows);
				var gridColumn = cellIndexToGridColumn($rows, rowIdx, colIdx);
				for (var i = 0; i < rowspan; i++) {
					for (var j = (0 === i ? 1 : 0); j < colspan; j++) {
						var leftCell = leftDomCell(grid, rowIdx + i, gridColumn);
						if (null == leftCell) {
							$rows.eq(rowIdx + i).prepend(newCell().obj);
						} else {
							jQuery( leftCell ).after(newCell().obj);
						}
					}
				}
				$cell.removeAttr('colspan');
				$cell.removeAttr('rowspan');
			});

			//reset flags
			TableSelection.cellSelectionMode = false; 
			TableSelection.keepCellsSelected = false;
			TableSelection.baseCellPosition = null;
			TableSelection.lastSelectionRange = null; 
			TableSelection.selectionType = 'cell';
		}
	};

	/* -- END METHODS -- */

	/**
	 * Initialize a new Object from the same object to get access to the prototype methods
	 */
	TableSelection = new TableSelection();
	Aloha.TableSelection = TableSelection;

	PluginManager.register(TablePlugin);
	//return TablePlugin;

	function newCell() {
		var $cell = jQuery('<td>&nbsp;</td>');
		var new_cell = new Table.Cell($cell.get(0), TablePlugin.activeTable);
		new_cell.activate();
		TablePlugin.activeTable.cells.push(new_cell);
		return new_cell;
	}
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
	function cellIndexToGridColumn(rows, rowIdx, colIdx) {
		var gridColumn = null;
		walkCells(rows, function(ri, ci, walkedGridColumn, rowspan, colspan) {
			if (ri === rowIdx && ci === colIdx) {
				gridColumn = walkedGridColumn;
				return false;
			}
		});
		return gridColumn;
	}
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
	function walkCells(rows, callback) {
		var adjust = [];
		for (var ri = 0; ri < rows.length; ri++) {
			var cells = rows[ri].cells;
			var skip = 0;
			for (var ci = 0; ci < cells.length; ci++) {
				var cell = cells[ci];
				var colspan = parseInt(jQuery(cell).attr('colspan')) || 1;
				var rowspan = parseInt(jQuery(cell).attr('rowspan')) || 1;
				
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
    }
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
	function makeGrid(rows) {
		var grid = [];
		walkCells(rows, function(ri, ci, gridCi, colspan, rowspan) {
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
	}
	/**
	 * A grid-cell is said to contain a dom-cell if it is located in the
	 * upper-left corner of a table-cell. A table-cell may have a
	 * rowspan and colspan, and as such may be comprised of several
	 * grid-cells, of which only one (the upper-left corner one)
	 * contains a dom-cell.
	 * @param cellInfo a cell in the grid returned by makeGrid()
	 * @return whether the given grid-cell maps to a dom-cell
	 */
	function containsDomCell(cellInfo) {
		return 0 === cellInfo.spannedX && 0 === cellInfo.spannedY;
	}
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
	function leftDomCell(grid, ri, gridCi) {
		do {
			var cellInfo = grid[ri][gridCi];
			if ( 0 === cellInfo.spannedY ) {
				return cellInfo.cell;
			} 
			gridCi -= cellInfo.spannedX + 1;
		} while (gridCi >= 0);
		return null;
	}
});
