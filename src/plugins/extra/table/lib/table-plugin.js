define(
['aloha', 'aloha/plugin', 'jquery', 'ui/ui', 'ui/button', 'ui/scopes',
	'table/table-create-layer'],
function(Aloha, plugin, jQuery, Ui, Button, Scopes, CreateLayer) {
    "use strict";

	var GENTICS = window.GENTICS;

    return plugin.create('table', {
        defaults: {
        },
        init: function(){
            console && console.log('Initialising tables plugin');
            this.createLayer = new CreateLayer(this);
            this.initButtons();
        },
        initButtons: function(){
            var that = this;
            // generate the new scopes
            Scopes.createScope(this.name + '.row', 'Aloha.continuoustext');
            Scopes.createScope(this.name + '.column', 'Aloha.continuoustext');
            Scopes.createScope(this.name + '.cell', 'Aloha.continuoustext');

            this._createTableButton = Ui.adopt("createTable", Button, {
                tooltip: "Create Table",
                icon: "aloha-icon aloha-icon-createTable",
                scope: 'Aloha.continuoustext',
                click: function(e){
                    that.createLayer.show(e);
                }
            });
        },
        createTable: function(cols, rows){
            return;
            if (this.preventNestedTables()){
                return;
            }
            
            // Check if there is an active Editable and that it contains an element (= .obj)
            if ( Aloha.activeEditable && typeof Aloha.activeEditable.obj !== 'undefined' ) {
                // create a dom-table object
                var table = document.createElement( 'table' );
                var tableId = table.id = GENTICS.Utils.guid();
                var tbody = document.createElement( 'tbody' );

                // create "rows"-number of rows
                for ( var i = 0; i < rows; i++ ) {
                    var tr = document.createElement( 'tr' );
                    // create "cols"-number of columns
                    for ( var j = 0; j < cols; j++ ) {
                        var text = document.createTextNode( '\u00a0' );
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

                if ( !TablePlugin.isWithinTable( tableReloadedFromDOM ) ) {
                    var tableObj = new Table( tableReloadedFromDOM, TablePlugin );
                    tableObj.parentEditable = Aloha.activeEditable;
                    // transform the table to be editable
                    tableObj.activate();

                    // after creating the table, trigger a click into the first cell to
                    // focus the content
                    // for IE set a timeout of 10ms to focus the first cell, other wise it
                    // won't work
                    if ( jQuery.browser.msie ) {
                        window.setTimeout( function () {
                            tableObj.cells[ 0 ].wrapper.get( 0 ).focus();
                        }, 20 );
                    } else {
                        tableObj.cells[ 0 ].wrapper.get( 0 ).focus();
                    }

                    TablePlugin.TableRegistry.push( tableObj );
                }
                
                TablePlugin.checkForNestedTables( Aloha.activeEditable.obj );

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
        },
        createLayer: undefined
    });
});
