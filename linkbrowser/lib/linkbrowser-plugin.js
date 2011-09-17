/**
 * Aloha.Browser
 *
 * The browser is an interface to interact with a Repository Managers.
 *
 * Reference:
 *		www.aloha-editor.org/wiki/Repository
 * 3rd party tools:
 *		www.jstree.com/documentation/core
 *		www.trirand.com/blog/ (jqGrid)
 *		layout.jquery-dev.net/
 */
define([

	// js
	'aloha/jquery',
	'aloha/plugin',
	'aloha/pluginmanager',
	'aloha/floatingmenu',
	'link/link-plugin',
	'browser/browser-plugin', 
	// i18n
	'i18n!linkbrowser/nls/i18n',
	'i18n!aloha/nls/i18n'

], function($,
			Plugin,
			PluginManager,
			FloatingMenu,
			Links,
			Browser, // Browser "super class". Needs to be extended. 
			i18n,
			i18nCore) {
	
	'use strict';
	
	// FIXME: user aloha/core to get aloha, not window
	var Aloha = window.Aloha;
	
	var config = {
		repositoryFilter : [ 'wai-languages' ],
		objectTypeFilter : [ 'website', 'files', 'images', 'language' /*, '*' */ ],
		renditionFilter	 : [ '*' ],
		filter			 : [ 'language' ],
		
		columns : {
			icon         : { title: '',     width: 30,  sortable: false, resizable: false },
			name         : { title: 'Name', width: 320, sorttype: 'text' },
			language     : { title: '',     width: 30,  sorttype: 'text' },
			translations : { title: '',     width: 350, sorttype: 'text' }
		}
	};
	
	return new (Browser.extend({
		
		_constructor: function (pluginPrefix) {
			this.id = this.prefix = pluginPrefix;
			PluginManager.register(this);
			
			this.init(config);
			
			this.url = Aloha.getAlohaUrl() + '/../plugins/extra/linkbrowser/';
			
			// Duck typing the init method in the LinkPlugin so that we can add
			// our buttons to it's FloatingMenu scope only after the Link
			// plugin has initialized and therefore the scope exists. We need
			// to do this because, the plugins loading mechanism currently does
			// not guarantee that the required plugin's init method is invoked
			// before our constructor is
			var that = this;
			Links.init = (function(orig) {
				return function () {
					// Invoke the LinkPlugin's original init method first
					orig.apply(Links, arguments);
					
					var repositoryButton = new Aloha.ui.Button({
						iconClass : 'aloha-button-big aloha-button-tree',
						size      : 'large',
						onclick   : function () { that.show(); },
						tooltip   : i18n.t('button.addlink.tooltip'),
						toggle    : false
					});
					
					FloatingMenu.addButton(
						Links.getUID('link'),
						repositoryButton,
						i18n.t('floatingmenu.tab.link'),
						1
					);
					
					Links.init = orig;
				};
			})(Links.init);
		},
		
		onSelect: function (item) {
			Links.hrefField.setItem(item);
			Links.hrefChange();
		},
		
		renderRowCols: function (item) {
			var row  = {};
			var host = this.host;
			var pluginUrl = this.url;
			var icon = 'page';
			var idMatch = item.id.match(/(\d+)\./);
			
			if (idMatch) {
				var objTypeId = idMatch[1];
				
				switch (objTypeId) {
				case '10008':
					icon = 'file';
					break;
				case '10009':
					icon = 'image';
					break;
				//case '10007':
				default:
					icon = 'page';
					break;
				}
			}
			
			$.each(this.columns, function (colName, v) {
				switch (colName) {
				case 'icon':
					row.icon = '<div class="aloha-browser-icon aloha-browser-icon-' + icon + '"></div>';
					break;
				case 'translations':
					var rends = item.renditions;
					var j;
					
					if (rends && (j = rends.length)) {
						var strBldr = [];
						var r;
						
						while (--j >= 0) {
							r = rends[j];
							if (r.kind == 'translation') {
								strBldr.push(
									//'<a href="' + repo_host + r.url + '">' +
									'<img src="'  + pluginUrl  + 'img/flags/' + r.language + '.png"\
											 alt="'   + r.language + '"\
											 title="' + r.filename + '" />'
									//'</a>'
								);
							}
						}
						
						row.translations = strBldr.join('');
					}
					break;
				case 'language':
					row.language = item.language;
					break;
				default:
					row[colName] = item[colName] || '--';
				}
			});
			
			return row;
		}
	
	}))('LinkBrowser');
	
});
