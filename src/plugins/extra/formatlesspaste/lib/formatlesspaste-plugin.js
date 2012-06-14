/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define(
['aloha/core',
 'aloha/plugin',
 'aloha/jquery',
 'ui/component', 
 'ui/toggleButton',
 'formatlesspaste/formatlesshandler',
 'aloha/contenthandlermanager',
 'i18n!formatlesspaste/nls/i18n',
 'i18n!aloha/nls/i18n',
 'css!formatlesspaste/css/formatless.css'],
function(Aloha, Plugin, jQuery, Component, ToggleButton, FormatlessPasteHandler, ContentHandlerManager, i18n, i18nCore) {
	"use strict";

	

	// Public Methods
	return Plugin.create('formatlesspaste', {
		
		
		/**
		 * Configure Formatless pasting
		 */
		formatlessPasteOption: false, 
		
		//Here we removes the text-level semantic and edit elements (http://dev.w3.org/html5/spec/text-level-semantics.html#usage-summary)
		strippedElements : [
			"a",
			"em",
			"strong",
			"small",
			"s",
			"cite",
			"q",
			"dfn",
			"abbr",
			"time",
			"code",
			"var",
			"samp",
			"kbd",
			"sub",
			"sup",
			"i",
			"b",
			"u",
			"mark",
			"ruby",
			"rt",
			"rp",
			"bdi",
			"bdo",
			"ins",
			"del" 
		],

		/**
		 * Initialize the PastePlugin
		 */
		init: function() {
			var that = this;

			if ( typeof this.settings.formatlessPasteOption !== 'undefined') {
				this.formatlessPasteOption = this.settings.formatlessPasteOption;
			}
			
			if ( typeof this.settings.strippedElements !== 'undefined') {
				this.strippedElements = this.settings.strippedElements;
			}

			if ( this.formatlessPasteOption ) {
				this.registerFormatlessPasteHandler(); 
			};

		},

		/**
		 * Register Formatless paste handler
		 */
		registerFormatlessPasteHandler: function(){
		
			ContentHandlerManager.register( 'formatless', FormatlessPasteHandler );
			FormatlessPasteHandler.strippedElements = this.strippedElements;
			// add button to toggle format-less pasting

			Component.define("toggleFormatlessPaste", ToggleButton, {
					icon: 'aloha-button aloha-button-formatless-paste',
					label: i18n.t('button.formatlessPaste.tooltip'),
					click: function () { 
						//toggle the value of allowFormatless
						FormatlessPasteHandler.enabled = !FormatlessPasteHandler.enabled;
					}
			});

			this.formatlessPasteButton = Component.getGlobalInstance("toggleFormatlessPaste");
		}
	});
});
