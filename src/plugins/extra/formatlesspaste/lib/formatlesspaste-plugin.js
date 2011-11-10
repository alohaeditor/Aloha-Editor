/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define(
['aloha/core', 'aloha/plugin', 'aloha/jquery', 'aloha/floatingmenu', 
 'formatlesspaste/formatlesshandler', 'aloha/contenthandlermanager',
 'i18n!formatlesspaste/nls/i18n', 'i18n!aloha/nls/i18n','css!formatlesspaste/css/formatless.css'],
function(Aloha, Plugin, jQuery, FloatingMenu, FormatlessPasteHandler, ContentHandlerManager, i18n, i18nCore) {
	"use strict";

	

	// Public Methods
	return Plugin.create('formatlesspaste', {
		
		
		/**
		 * Configure Formatless pasting
		 */
		formatlessPasteOption: false, 

		/**
		 * Initialize the PastePlugin
		 */
		init: function() {
			var that = this;

			if ( typeof this.settings.formatlessPasteOption !== 'undefined') {
				this.formatlessPasteOption = this.settings.formatlessPasteOption;
			}

			

			  if(this.formatlessPasteOption) {
				this.registerFormatlessPasteHandler(); 
			  };


		},

		/**
		 * Register Formatless paste handler
		 */
		registerFormatlessPasteHandler: function(){
		
		  ContentHandlerManager.register( 'formatless', FormatlessPasteHandler );

		  // add button to toggle format-less pasting
		  this.formatlessPasteButton = new Aloha.ui.Button({
					'iconClass' : 'aloha-button aloha-button-formatless-paste',
					'size' : 'small',
					'onclick' : function () { 
			  //toggle the value of allowFormatless
			  FormatlessPasteHandler.enabled = !FormatlessPasteHandler.enabled;
			},
					'tooltip' : i18n.t('button.formatlessPaste.tooltip'),
					'toggle' : true
				});
		  FloatingMenu.addButton(
					'Aloha.continuoustext',
					this.formatlessPasteButton,
					i18nCore.t('floatingmenu.tab.format'),
					1
				);
		},
	});
});
