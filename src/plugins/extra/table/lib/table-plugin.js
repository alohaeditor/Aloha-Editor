define(
['aloha', 'aloha/plugin', 'jquery', 'ui/ui', 'ui/button', 'PubSub',
    'ui/dialog', 'table/table-create-layer', 'css!table/css/table.css'],
function(Aloha, plugin, jQuery, Ui, Button, PubSub, Dialog, CreateLayer) {
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

    function createRow(cols, tagname){
        tagname = tagname || 'td';
        var tr = document.createElement('tr');
        for (var i=0; i<cols; i++) {
            var text = document.createTextNode('\u00a0');
            var td = document.createElement(tagname);
            td.appendChild(text);
            tr.appendChild(td);
        }
        return tr;
    }

    function getActiveCell(){
        var range = Aloha.Selection.getRangeObject();
        var cell = jQuery(range.commonAncestorContainer);
        if (cell.parents('.aloha-editable table').length == 0){
            return null;
        }
        return cell.closest('td,th');
    }

    function getActiveRow(){
        var cell = getActiveCell();
        if (cell === 0){
            return null;
        }
        return cell.closest('tr');
    }

    function prepareTable(plugin, table){
        // Wrap table in ui-wrappper
        var w1 = jQuery('<div class="canvas-wrap aloha-ui-wrapper" />');
        var w2 = jQuery('<div class="table canvas aloha-ui-wrapper" />');
        var w3 = jQuery('<div class="canvas-inner aloha-ui-wrapper" />');

        table.wrap(w1).wrap(w2).wrap(w3);

        w1.attr('contentEditable', 'false');
        // glue a mouseover event onto it
        table.on('mouseenter', function(e){
            // We will later use this to bring up ui
            //console && console.log(e.target);
        });
        table.on('mouseleave', function(e){
            // We will later use this to hide ui
            //console && console.log(e.target);
        });
    }

    return plugin.create('table', {
        defaults: {
        },
        init: function(){
            var plugin = this;
            this.createLayer = new CreateLayer(this);
            this.initButtons();
            Aloha.bind('aloha-editable-created', function(event, editable){
                editable.obj.find('table').each(function(){
                    prepareTable(plugin, jQuery(this));
                });
            });
            PubSub.sub('aloha.selection.context-change', function(m){
                if ($(m.range.markupEffectiveAtStart).parent('table')
                        .length > 0) {
                    // We're inside a table, enable those functions
                    plugin._addrowbeforeButton.enable(true);
                    plugin._addrowafterButton.enable(true);
                    plugin._deleterowButton.enable(true);
                    plugin._deleteColumnButton.enable(true);
                    plugin._addColumnBefore.enable(true);
                    plugin._addColumnAfter.enable(true);
                } else {
                    // Disable table functions
                    plugin._addrowbeforeButton.enable(false);
                    plugin._addrowafterButton.enable(false);
                    plugin._deleterowButton.enable(false);
                    plugin._deleteColumnButton.enable(false);
                    plugin._addColumnBefore.enable(false);
                    plugin._addColumnAfter.enable(false);
                }
            });
        },
        initButtons: function(){
            var that = this;
            this._createTableButton = Ui.adopt("createTable", Button, {
                tooltip: "Create Table",
                icon: "aloha-icon aloha-icon-createTable",
                scope: 'Aloha.continuoustext',
                click: function(e){
                    var layer = that.createLayer.show(e);
                    layer.on('table-create-layer.closed', function(){
                        // Once we've managed to make menus sticky, we
                        // will close the menus here.
                        //alert('closed');
                    });
                }
            });

            this._addrowbeforeButton = Ui.adopt("addrowbefore", Button, {
                tooltip: "Add new row before",
                icon: "aloha-icon aloha-icon-addrowbefore",
                scope: this.name + '.row',
                click: function(){
                    var row = getActiveRow();
                    if (row === null){
                        this.error('Selection is not in a table!');
                        return;
                    }
                    var rowcount = row.find('*').length;
                    var newrow = createRow(rowcount);
                    row.before(newrow);
                }
            });

            this._addrowafterButton = Ui.adopt("addrowafter", Button, {
                tooltip: "Add new row after",
                icon: "aloha-icon aloha-icon-addrowafter",
                scope: this.name + '.row',
                click: function(){
                    var row = getActiveRow();
                    if (row === null){
                        this.error('Selection is not in a table!');
                        return;
                    }
                    var rowcount = row.find('*').length;
                    var newrow = createRow(rowcount);
                    row.after(newrow);
                }
            });
            this._deleterowButton = Ui.adopt("deleterow", Button, {
                tooltip: "Delete row",
                icon: "aloha-icon aloha-icon-deleterow",
                scope: this.name + '.row',
                click: function(){
                    var row = getActiveRow();
                    if (row === null){
                        this.error('Selection is not in a table!');
                        return;
                    }
                    row.remove();
                }
            });
            this._deleteColumnButton = Ui.adopt("deletecolumn", Button, {
                tooltip: "Delete column",
                icon: "aloha-icon aloha-icon-deletecolumn",
                scope: this.name + '.column',
                click: function(){
                    var cell = getActiveCell();
                    if(cell === null){ return; }
                    var idx = cell[0].cellIndex;
                    var table = cell.parents('.aloha-editable table');
                    table.find("tr").each(function(){
                        this.removeChild(this.cells[idx]);
                    });
                    // If the table is now devoid of any rows, delete it
                    if(table.find("td,th").length==0){
                        table.remove();
                    }
                }
            });
            this._addColumnBefore = Ui.adopt("addcolumnbefore", Button, {
                tooltip: "Add new column before",
                icon: "aloha-icon aloha-icon-addcolumnbefore",
                scope: this.name + '.column',
                click: function(){
                    var cell = getActiveCell();
                    if(cell === null){ return; }
                    var idx = cell[0].cellIndex;
                    var table = cell.parents('.aloha-editable table');
                    table.find("tr").each(function(){
                        var toclone = $(this).find('td,th').eq(idx);
                        var newcell = toclone.clone().html('\u00a0');
                        toclone.before(newcell);
                    });
                }
            });
            this._addColumnAfter = Ui.adopt("addcolumnafter", Button, {
                tooltip: "Add new column after",
                icon: "aloha-icon aloha-icon-addcolumnafter",
                scope: this.name + '.column',
                click: function(){
                    var cell = getActiveCell();
                    if(cell === null){ return; }
                    var idx = cell[0].cellIndex;
                    var table = cell.parents('.aloha-editable table');
                    table.find("tr").each(function(){
                        var toclone = $(this).find('td,th').eq(idx);
                        var newcell = toclone.clone().html('\u00a0');
                        toclone.after(newcell);
                    });
                }
            });
            // Disable the table functions by default, they are enabled when
            // a selection is inside a table
            this._addrowbeforeButton.enable(false);
            this._addrowafterButton.enable(false);
            this._deleterowButton.enable(false);
            this._deleteColumnButton.enable(false);
            this._addColumnBefore.enable(false);
            this._addColumnAfter.enable(false);
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
        createTable: function(cols, rows, headerrows){
            if (this.preventNestedTables()){
                return;
            }
            
            // Check if there is an active Editable and that it contains an element (= .obj)
            if (Aloha.activeEditable && typeof Aloha.activeEditable.obj !== 'undefined'){
                // create a dom-table object
                var table = document.createElement('table');
                var tableId = table.id = GENTICS.Utils.guid();
                var tbody = document.createElement('tbody');

                // Create caption
                var caption = document.createElement('caption');
                var captiontext = document.createTextNode('Table ' + (jQuery('.aloha-editable table').length+1));
                caption.appendChild(captiontext);
                table.appendChild(caption);

                // Create headerrows of headers
                for(var i=0; i<headerrows; i++){
                    var tr = document.createElement('tr');
                    // create "cols"-number of columns
                    for (var j = 0; j < cols; j++) {
                        var text = document.createTextNode('\u00a0');
                        var td = document.createElement('th');
                        td.appendChild(text);
                        tr.appendChild(td);
                    }
                    tbody.appendChild(tr);
                }

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
                prepareTable(this, jQuery(table));
                var ev = jQuery.Event();
                ev.type = 'blur';
                Aloha.activeEditable.smartContentChange(ev);
            } else {
                this.error('There is no active Editable where the table can be inserted!');
            }
        },
	    error: function(msg){
            Aloha.Log.error(this, msg);
        },
        createLayer: undefined // Defined in init above.
    });
});
