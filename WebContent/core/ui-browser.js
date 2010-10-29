/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

/**
 * !!!! ATTENTION !!!!
 * This is work in progress. This implemenation may change heavily.
 * Not yet implemented:
 * - onSelect Event!
 * - configuring and templating the list
 * - DnD
 * - passing all possible query attributes to the repository
 * - query of subtree
 * - icon representation
 */
GENTICS.Aloha.ui.Browser = function () {

	/**
	 * @cfg Function called when an element is selected
	 */
	this.onSelect = null;
	
	var that = this;
	this.exploreStore = new Ext.data.Store( {
		proxy : new Ext.data.AlohaProxy(),
		reader : new Ext.data.AlohaObjectReader()
	});
	
	this.colModel = new Ext.grid.ColumnModel([ {
		id : 'name',
		header : 'Name',
		width : 100,
		sortable : true,
		dataIndex : 'name'
	}, {
		header : 'URL',
		renderer : function(val) {
			return val;
		},
		width : 300,
		sortable : true,
		dataIndex : 'url'
	} ]);
	// define the grid that represents the filelist
	this.grid = new Ext.grid.GridPanel( {
		region : 'center',
		autoScroll : true,
		// the datastore can be used by the gridpanel to fetch data from
		// repository manager
		store : this.exploreStore,
		colModel : this.colModel,
		stripeRows : true,
		autoExpandColumn : 'name',
		height : 350,
		width : 600,
		title : 'Objectlist',
		stateful : true,
		stateId : 'grid',
		selModel: new Ext.grid.RowSelectionModel({singleSelect:true}),
		listeners : {
			'dblclick' : function(e) {
				that.onItemSelect();
			}
		}
	});
    this.grid.getSelectionModel().on({
    	'selectionchange' : function(sm, n, node){
    		var resourceItem = that.grid.getSelectionModel().getSelected();
    		if (resourceItem) {
                this.win.buttons[1].enable();
    		} else {
                this.win.buttons[1].disable();
    		}
        },
        scope:this
    });


	// define the treepanel
	this.tree = new Ext.tree.TreePanel( {
		region : 'center',
		useArrows : true,
		autoScroll : true,
		animate : true,
		enableDD : true,
		containerScroll : true,
		border : false,
		loader : new Ext.tree.AlohaTreeLoader(),
		root : {
			nodeType : 'async',
			text : 'Aloha Repositories',
			draggable : false,
			id : 'aloha'
		},
		rootVisible : false,
		listeners : {
			'beforeload' : function(node) {
				this.loader.baseParams = {
					node : node.attributes
				};
			}
		}
	});
    this.tree.getSelectionModel().on({
        'selectionchange' : function(sm, node){
            if (node) {
            	try{            		
            		// sets the ui object containing the items list
            		resourceItem.viewGrid = this.grid;
            		var resourceItem = node.attributes;
            		resourceItem.viewGrid = this.grid;
            		if (resourceItem.colModel) {
            			this.grid.reconfigure(this.exploreStore,resourceItem.colModel);
            		} else {
            			this.grid.reconfigure(this.exploreStore,this.colModel);
            		}
            	} catch (error) {}
            	this.grid.setTitle(node.text);
            	//this.win.doLayout();
            	this.exploreStore.load({ params: {
        			inFolderId: resourceItem.id,
        			objectTypeFilter: that.objectTypeFilter,
        			repositoryId: resourceItem.repositoryId
        		}});
            }
        },
        scope:this
    });

	// nest the tree within a panel
	this.nav = new Ext.Panel( {
		title : 'Navigation',
		region : 'west',
		width : 300,
		layout : 'fit',
		collapsible : true,
		items : [ this.tree ]
	});
				
	// add the nested tree and grid (filelist) to the window
	this.win = new Ext.Window( {
		title : 'Resource Selector',
		layout : 'border',
		width : 800,
		height : 300,
		closeAction : 'hide',
		onEsc: function () { 
			this.hide();
		},
		defaultButton: this.nav,
		plain : true,
		initHidden: true,
		items : [ this.nav, this.grid ],
		buttons : [{
			text : 'Close',
			handler : function() {
				that.win.hide();
			}
		}, {
			text : 'Select',
			disabled : true,
			handler : function() {
				that.onItemSelect();
			}
		}],
	    toFront : function(e) {
	        this.manager = this.manager || Ext.WindowMgr;
	        this.manager.bringToFront(this); 
	        this.setZIndex(9999999999); // bring really to front (floating menu is not registered as window...)
	        return this;
	    }
	});
	
	this.onItemSelect = function () {
		var sm =  this.grid.getSelectionModel();
		var sel = (sm) ? sm.getSelected() : null;
		var resourceItem = (sel) ? sel.data : null;
		this.win.hide();
		if ( typeof this.onSelect == 'function' ) {
			this.onSelect.call(this, resourceItem);
		}
	};
};
	
GENTICS.Aloha.ui.Browser.prototype.setObjectTypeFilter = function(otf) {
	this.objectTypeFilter = otf;
};

GENTICS.Aloha.ui.Browser.prototype.getObjectTypeFilter = function() {
	return this.objectTypeFilter;
};

GENTICS.Aloha.ui.Browser.prototype.show = function() {
	this.win.show(); // first show,
	this.win.toFront(true);
	this.win.focus();
};
