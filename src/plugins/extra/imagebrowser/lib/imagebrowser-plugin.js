/*!
 * Aloha Editor
 * Browser for images
 * Author & Copyright (c) 2011 Gentics Software GmbH
 * aloha-sales@gentics.com
 * Licensed under the terms of http://www.aloha-editor.com/license.html
 *
 * Author : Nicolas Karageuzian - http://nka.me
 */
define([
	// js
	'aloha',
	'jquery',
	'aloha/plugin',
	'aloha/pluginmanager',
	'ui/ui',
	'ui/button',
	'image/image-plugin',
	'RepositoryBrowser',
	// i18n
	'i18n!imagebrowser/nls/i18n',
	'i18n!aloha/nls/i18n'
], function(
	Aloha,
    jQuery,
    Plugin,
    PluginManager,
    Ui,
    Button,
    Images,
    RepositoryBrowser,
    i18n,
    i18nCore
) {
	'use strict';

	var ImageBrowser = RepositoryBrowser.extend( {

		init: function ( config ) {
			this._super( config );

			var browser = this;

			this._imageBrowserButton = Ui.adopt('imageBrowser', Button, {
				tooltip: i18n.t('button.addimage.tooltip'),
				icon: 'aloha-icon-tree',
				scope: 'Aloha.continuoustext',
				click: function () { browser.open(); }
			});

			this._imageBrowserButton.show(false);

			this.url = Aloha.getAlohaUrl() + '/../plugins/extra/imagebrowser/';

			Aloha.bind( 'aloha-image-selected', function ( event, rangeObject ) {
				browser._imageBrowserButton.show(true);
			});
			Aloha.bind( 'aloha-image-unselected', function ( event, rangeObject ) {
				browser._imageBrowserButton.show(false);
			});
		},
		onSelect: function ( item ) {
			if ( item.type.match( 'image' ) !== null ) {
				Images.ui.imgSrcField.setItem( item );
				Images.resetSize(); // reset to original image size
				this.close();
			}
		},

		/**
		 * Overrides browser list items to show only images in the grid panel
		 */
		listItems: function ( items ) {
			var browser = this;
			var list = this.list.clearGridData();

			jQuery.each( items, function () {
				var obj = this.resource;
				if ( obj.type.match( 'image' ) !== null ) {
					list.addRowData(
						obj.uid,
						jQuery.extend( { id: obj.id }, browser.renderRowCols( obj ) )
					);
				}
			});
		},

		 /**
		  * Overrides column rendering
		  */
		renderRowCols: function ( item ) {
			var row = {},
			    pluginUrl = this.url,
			    icon = '__page__',
			    idMatch = item.id.match( /(\d+)\./ );

			jQuery.each( this.columns, function ( colName, v ) {
				switch ( colName ) {
				case 'icon':
					if ( !item.renditions ) {
						break;
					}
					if ( item.renditions.length === 1 ) {
						if ( item.renditions[ 0 ].kind === 'thumbnail' ) {
							row.icon = '<img width="' + item.renditions[ 0 ].width
							+ '" height="' + item.renditions[ 0 ].height
							+ ' " src="' + item.renditions[ 0 ].url + '"/>';
						}
					}
					break;
				default:
					row[ colName ] = item[ colName ] || '--';
				}
			});

			return row;
		}

	});

	var ImageBrowserPlugin = Plugin.create( 'imagebrowser', {
		dependencies: [ 'image' ],
		browser: null,
		init: function () {
			var config = {
				repositoryManager : Aloha.RepositoryManager,
				repositoryFilter  : [],
				objectTypeFilter  : [ 'image' /*, '*' */ ],
				renditionFilter	  : [ '*' ],
				filter			  : [ 'language' ],
				columns : {
					icon : { title: '',     width: 75,  sortable: false, resizable: false },
					name : { title: 'Name', width: 320, sorttype: 'text' }
				},
				rootPath : Aloha.settings.baseUrl + '/vendor/repository-browser/'
			};
			this.browser = new ImageBrowser( config );
		}
	});

	return ImageBrowserPlugin;
});
