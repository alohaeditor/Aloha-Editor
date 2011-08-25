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
define(
[
 'aloha/plugin',
 'aloha/floatingmenu', 
 'i18n!linkbrowser/nls/i18n',
 'i18n!aloha/nls/i18n',
 'browser/browser-plugin',
 'link/link-plugin'
],
function(Plugin, FloatingMenu, i18n, i18nCore) {
	"use strict";
	
	var $ = jQuery,
		GENTICS = window.GENTICS,
		Aloha = window.Aloha;

	
	
	return Plugin.create('linkbrowser', {
	
		/** Attach the browser to the link plugin**/
		init: function() {
			var that = this;
			var linkplugin = require('link/link-plugin');
			
			this.browser = require('browser/browser-plugin');
			this.browser.setObjectTypeFilter(this.objectTypeFilter);
			this.browser.onSelect = function( item ) {
				// set href Value
				that.hrefField.setItem( item );
				// call hrefChange
				that.hrefChange();
			};
			// Repository is broken, disabling feature for now
			this.repositoryButton = new Aloha.ui.Button({
				'iconClass' : 'aloha-button-big aloha-button-tree',
				'size' : 'large',
				'onclick' : function () {
					that.browser.show();
				},
				'tooltip' : i18n.t('button.addlink.tooltip'),
				'toggle' : false
			});

			// COMMENT IN AND TEST THE BROWSER
			FloatingMenu.addButton(
				linkplugin.getUID('link'),
				this.repositoryButton,
				i18n.t('floatingmenu.tab.link'),
				1
			); 
		}
	
	});
});
