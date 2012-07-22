/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
define([
	'aloha/plugin',
	'ui/ui',
	'ui/toggleButton',
	'flag-icons/flag-icons-plugin',
	'i18n!metaview/nls/i18n',
	'i18n!aloha/nls/i18n',
	'jquery'
], function(
	Plugin,
    Ui,
	ToggleButton,
	FlagIcons,
	i18n,
	i18nCore,
	jQuery
) {
	'use strict';

	var GENTICS = window.GENTICS,
		Aloha = window.Aloha;

     return Plugin.create('metaview', {
		_constructor: function(){
			this._super('metaview');
		},
		
		config: [ 'metaview' ],
		
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
 						if (jQuery.type(config) === 'array' && jQuery.inArray( 'metaview', config ) !== -1) {
							that._toggleMetaViewButton.show(true);
						} else {
							that._toggleMetaViewButton.show(false);
							return;
						}
						
						if ( /* that.button && */ jQuery(Aloha.activeEditable.obj).hasClass('aloha-metaview')) {
							that._toggleMetaViewButton.setState(true);
						} else {
							that._toggleMetaViewButton.setState(false);
						}
					}
			);
		},
		
		buttonClick: function() {
			if(jQuery(Aloha.activeEditable.obj).hasClass('aloha-metaview')) {
				jQuery(Aloha.activeEditable.obj).removeClass('aloha-metaview');
				this._toggleMetaViewButton.setState(false);
			} else {
				jQuery(Aloha.activeEditable.obj).addClass('aloha-metaview');
				this._toggleMetaViewButton.setState(true);
			}
		},
		
		/**
		 * Initialize the buttons
		 */
		createButtons: function () {
			var that = this;
	
			this._toggleMetaViewButton = Ui.adopt("toggleMetaView", ToggleButton, {
				tooltip : i18n.t('button.switch-metaview.tooltip'),
				icon: 'aloha-icon aloha-icon-metaview',
				scope: 'Aloha.continuoustext',
				click : function () { that.buttonClick(); }
			});
		}
	});
});
