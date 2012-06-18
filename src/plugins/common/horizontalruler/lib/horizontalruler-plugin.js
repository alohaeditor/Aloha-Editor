/*
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
define(
['aloha',
 'aloha/jquery',
 'aloha/plugin',
 'ui/component',
 'ui/button',
 'i18n!horizontalruler/nls/i18n',
 'i18n!aloha/nls/i18n',
 'css!horizontalruler/css/horizontalruler.css'],
function(Aloha, jQuery, Plugin, Component, Button, i18n, i18nCore) {
	"use strict";

	var
		GENTICS = window.GENTICS;

	return Plugin.create('horizontalruler', {
		_constructor: function(){
			this._super('horizontalruler');
		},
		languages: ['en'],
		config: ['hr'],
		init: function() {
			var that = this;

			Component.define("insertHorizontalRule", Button, {
				tooltip: i18n.t('button.addhr.tooltip'),
				iconOnly: true,
				icon: 'aloha-icon-horizontalruler',
				click: function(){
					that.insertHR();
				}
			});

			this.insertButton = Component.getGlobalInstance("insertHorizontalRule");

			Aloha.bind( 'aloha-editable-activated', function ( event, rangeObject ) {
				if (Aloha.activeEditable) {
					that.cfg = that.getEditableConfig( Aloha.activeEditable.obj );

					if ( jQuery.inArray( 'hr', that.cfg ) != -1 ) {
		        		that.insertButton.show();
		        	} else {
		        		that.insertButton.hide();
		        		return;
		        	}
				}
			});

		},
		insertHR: function(character) {
			var self = this;
			var range = Aloha.Selection.getRangeObject();
			if(Aloha.activeEditable) {
				var hr = jQuery('<hr>');
				GENTICS.Utils.Dom.insertIntoDOM(
					hr,
					range,
					jQuery(Aloha.activeEditable.obj),
					true
				);
				range.select();
			}
		}
	});

});

