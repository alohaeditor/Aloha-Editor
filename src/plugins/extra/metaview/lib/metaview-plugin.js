/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
define([
	'aloha/plugin',
	'ui/component',
	'ui/toggleButton',
	'flag-icons/flag-icons-plugin',
	'i18n!metaview/nls/i18n',
	'i18n!aloha/nls/i18n',
	'jquery',
	'ui/port-helper-floatingmenu',
	'css!metaview/css/metaview.css'
], function(Plugin,
            Component,
			ToggleButton,
			FlagIcons,
			i18n,
			i18nCore,
			jQuery,
			FloatingmenuPortHelper) {
	'use strict';

	var GENTICS = window.GENTICS,
		Aloha = window.Aloha;

     return Plugin.create('metaview', {
		_constructor: function(){
			this._super('metaview');
		},
		
		/**
		 * Configure the available languages
		 */
		languages: ['en', 'de'],

		
		/**
		 * Initialize the plugin
		 */
		init: function () {
			var that = this;
			
			this.createButtons();
	
			// mark active Editable with a css class
			Aloha.bind(
					"aloha-editable-activated",
					function (jEvent, aEvent) {
						var config;
						config = that.getEditableConfig( Aloha.activeEditable.obj );
						if ( config && jQuery.inArray( 'metaview', config ) !== -1 ) {
							//that.button.show();
							FloatingmenuPortHelper.showAll('toggleMetaView');
						} else {
							//that.button.hide();
							FloatingmenuPortHelper.hideAll('toggleMetaView');
							return;
						}
						
						if ( /* that.button && */ jQuery(Aloha.activeEditable.obj).hasClass('aloha-metaview')) {
							//that.button.setState(true);
							FloatingmenuPortHelper.setStateTrueAll('toggleMetaView');
						} else {
							//that.button.setState(false);
							FloatingmenuPortHelper.setStateFalseAll('toggleMetaView');
						}
					}
			);
		},
		
		buttonClick: function() {
			var that = this;
			if(jQuery(Aloha.activeEditable.obj).hasClass('aloha-metaview')) {
				jQuery(Aloha.activeEditable.obj).removeClass('aloha-metaview');
				FloatingmenuPortHelper.setStateFalseAll('toggleMetaView');
				//that.button.setState(false);
			} else {
				jQuery(Aloha.activeEditable.obj).addClass('aloha-metaview');
				FloatingmenuPortHelper.setStateTrueAll('toggleMetaView');
				//that.button.setState(true);
			}
		},
		
		/**
		 * Initialize the buttons
		 */
		createButtons: function () {
			var that = this;
	
			Component.define("toggleMetaView", ToggleButton, {
				tooltip : i18n.t('button.switch-metaview.tooltip'),
				icon: 'aloha-icon aloha-icon-metaview',
				click : function () { that.buttonClick(); }
			});

			//that.button = Component.getGlobalInstance("toggleMetaView");
		}
	});
});
