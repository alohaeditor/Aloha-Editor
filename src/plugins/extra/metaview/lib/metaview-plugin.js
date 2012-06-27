/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
define([
	'aloha/plugin',
	'ui/component',
	'ui/componentState',
	'ui/toggleButton',
	'flag-icons/flag-icons-plugin',
	'i18n!metaview/nls/i18n',
	'i18n!aloha/nls/i18n',
	'jquery',
	'css!metaview/css/metaview.css'
], function(Plugin,
            Component,
			ComponentState,
			ToggleButton,
			FlagIcons,
			i18n,
			i18nCore,
			jQuery) {
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
							ComponentState.setState('toggleMetaView', 'show', true);
						} else {
							ComponentState.setState('toggleMetaView', 'show', false);
							return;
						}
						
						if ( /* that.button && */ jQuery(Aloha.activeEditable.obj).hasClass('aloha-metaview')) {
							ComponentState.setState('toggleMetaView', 'state', true);
						} else {
							ComponentState.setState('toggleMetaView', 'state', false);
						}
					}
			);
		},
		
		buttonClick: function() {
			var that = this;
			if(jQuery(Aloha.activeEditable.obj).hasClass('aloha-metaview')) {
				jQuery(Aloha.activeEditable.obj).removeClass('aloha-metaview');
				ComponentState.setState('toggleMetaView', 'state', false);
			} else {
				jQuery(Aloha.activeEditable.obj).addClass('aloha-metaview');
				ComponentState.setState('toggleMetaView', 'state', true);
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
				scope: 'Aloha.continuoustext',
				click : function () { that.buttonClick(); }
			});
		}
	});
});
