/**
 * Code for embedding the resource selector
 * <input type="button" id="show-btn" value="Hello World" />
 * <div id="hello-win" class="x-hidden">
 * <div class="x-window-header">Resource Selector</div>
 * </div>
 */

Ext
		.onReady(function() {

			// Dummy data for gridview
			var myData = [ [ '3m Co', 71702 ], [ 'Alcoa Inc', 29201 ],
					[ 'Altria Group Inc', 428381 ], ];

			var formatSize = function(size) {
				if (size < 1024) {
					return size + " bytes";
				} else {
					return (Math.round(((size * 10) / 1024)) / 10) + " KB";
				}
			}

			var filesizeRenderer = function(val) {
				return formatSize(val);
			}

			// the datastore can be used by the gridpanel to fetch data from
			// resource manager
			var store = new Ext.data.Store( {
				proxy : new Ext.data.AlohaProxy(),
				reader : new Ext.data.AlohaResourceReader()
			});

			// define the grid that represents the filelist
			var grid = new Ext.grid.GridPanel( {

				region : 'center',
				autoScroll : true,

				store : store,
				columns : [ {
					id : 'name',
					header : 'Name',
					width : 160,
					sortable : true,
					dataIndex : 'name'
				}, {
					header : 'Filesize',
					renderer : filesizeRenderer,
					width : 75,
					sortable : true,
					dataIndex : 'filesize'
				} ],
				stripeRows : true,
				autoExpandColumn : 'name',
				height : 350,
				width : 600,
				title : 'Filelist',
				stateful : true,
				stateId : 'grid',
				listeners : {
					// resource object types could have changed
					'beforequery' : function(obj, event) {
						if (this.store != null && this.store.proxy != null) {
							this.store.proxy.setResourceObjectTypes(this
									.getResourceObjectTypes());
						}
					}
				},

				setResourceObjectTypes : function(otypes) {
					this.resourceObjectTypes = otypes;
				},
				getResourceObjectTypes : function() {
					return this.resourceObjectTypes;
				}

			});

			// define the treepanel
			var tree = new Ext.tree.TreePanel( {
				region : 'center',
				useArrows : true,
				autoScroll : true,
				animate : true,
				enableDD : true,
				containerScroll : true,
				border : false,
				loader : new Ext.tree.AlohaTreeLoader( {
					resourceObjectTypes : []
				}),
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
					},
					'click' : function(n) {
						var resourceItem = n.attributes;
						Ext.Msg.alert('Aloha Tree Click',
								'You clicked: "' + resourceItem.id + '"');
					}
				}
			});

			// nest the tree within a panel
			var nav = new Ext.Panel( {
				title : 'Navigation',
				region : 'west',
				width : 300,
				layout : 'fit',
				collapsible : true,
				items : [ tree ]
			});

			var formatData = function(data) {
				data.shortName = data.name.ellipse(15);
				data.sizeString = formatSize(data);
				data.dateString = new Date(data.lastmod).format("m/d/Y g:i a");
				this.lookup[data.name] = data;
				return data;
			};
			
			// add the nested tree and grid (filelist) to the window
			var win = new Ext.Window( {
				title : 'Resource Selector',
				layout : 'border',
				width : 800,
				height : 300,
				closeAction : 'hide',
				plain : true,
				items : [ nav, grid ],
				buttons : [ {
					text : 'Submit',
					disabled : true
				}, {
					text : 'Close',
					handler : function() {
						win.hide();
					}
				} ]
			});

			var button = Ext.get('show-btn');
			button.on('click', function() {
				grid.setResourceObjectTypes([]);
				win.show(this);
			});
		});