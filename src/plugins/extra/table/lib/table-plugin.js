define(
['aloha', 'aloha/plugin', 'jquery', 'ui/ui', 'ui/button', 'ui/scopes',
    'ui/dialog', 'table/table-create-layer'],
function(Aloha, plugin, jQuery, Ui, Button, Scopes, Dialog, CreateLayer) {
    "use strict";

	var GENTICS = window.GENTICS;

	function prepareRangeContainersForInsertion(range, table){
		var	eNode = range.endContainer,
			sNode = range.startContainer,
			eNodeLength =(eNode.nodeType == 3)
				? eNode.length
				: eNode.childNodes.length;		
		
		if(sNode.nodeType == 3 &&
				sNode.parentNode.tagName == 'P' &&
					sNode.parentNode.childNodes.length == 1 &&
						/^(\s|%A0)$/.test( escape( sNode.data))){
			sNode.data = '';
			range.startOffset = 0;
			
			// In case ... <p> []</p>
			if(eNode == sNode){
				range.endOffset = 0;
			}
		}
		
		// If the table is not allowed to be nested inside the startContainer,
		// then it will have to be split in order to insert the table.
		// We will therefore check if the selection touches the start and/or
		// end of their container nodes.
		// If they do, we will mark their container so that after they are
		// split we can check whether or not they should be removed
		if(!GENTICS.Utils.Dom.allowsNesting(
				sNode.nodeType == 3 ? sNode.parentNode : sNode, table)){
			
			if(range.startOffset == 0){
				jQuery( sNode.nodeType == 3 ? sNode.parentNode : sNode)
					.addClass( 'aloha-table-cleanme');
			}
			
			if(range.endOffset == eNodeLength){
				jQuery( eNode.nodeType == 3 ? eNode.parentNode : eNode)
					.addClass( 'aloha-table-cleanme');
			}
		}
	}

	function cleanupAfterInsertion(){
		var dirty = jQuery('.aloha-table-cleanme').removeClass(
						'aloha-table-cleanme');
		
		for (var i=0; i<dirty.length; i++){
			if (jQuery.trim(jQuery(dirty[i]).html()) == '' &&
					!GENTICS.Utils.Dom.isEditingHost(dirty[i])){
				jQuery(dirty[i]).remove();
			}
		}
	}

	function isWithinTable(elem) {
		return (jQuery(elem).parents('.aloha-editable table').length > 0);
	}

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
	    isSelectionInTable: function (){
            var range = Aloha.Selection.getRangeObject();
            var container = jQuery(range.commonAncestorContainer);
            if (container.length == 0){
                return  false;
            }
            if (container.parents('.aloha-editable table').length){
                return true;
            }
            return false;
        },
	    preventNestedTables: function (){
            if (this.isSelectionInTable()) {
                Dialog.alert({
                    title : 'Table',
                    text  : 'Nested tables are not supported'
                });
                return true;
            }
            return false;
	    },
        createTable: function(cols, rows){
            if (this.preventNestedTables()){
                return;
            }
            
            // Check if there is an active Editable and that it contains an element (= .obj)
            if (Aloha.activeEditable && typeof Aloha.activeEditable.obj !== 'undefined'){
                // create a dom-table object
                var table = document.createElement('table');
                var tableId = table.id = GENTICS.Utils.guid();
                var tbody = document.createElement('tbody');

                // create "rows"-number of rows
                for (var i=0; i<rows; i++){
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
                
                prepareRangeContainersForInsertion(
                    Aloha.Selection.getRangeObject(), table);
                
                // insert the table at the current selection
                GENTICS.Utils.Dom.insertIntoDOM(jQuery(table),
                    Aloha.Selection.getRangeObject(), Aloha.activeEditable.obj);
                
                cleanupAfterInsertion();
            } else {
                this.error('There is no active Editable where the table can be inserted!');
            }
        },
        createLayer: undefined // Defined in init above.
    });
});
