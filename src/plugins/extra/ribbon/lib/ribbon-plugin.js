/*
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*
*/

define([
	'jquery',
	'aloha/plugin',
	'ribbon/ribbon',
	'i18n!aloha/nls/i18n'
], function($, Plugin, lib, i18nCore) {
	"use strict";

	var ribbon = Plugin.create('ribbon', {
		init: function () {
			if ( ! this.settings.enable ) {
				return;
			}
			var that = this;
			
			this._visible = false;
			this._menubar = false;

			this._toolbar = $('<div class="aloha-ribbon-toolbar ui-menubar ui-widget-header ui-helper-clearfix"></div>');

			var fadeIn = $("<button class='aloha-ribbon-in'></button>")
				.button()
				.hide()
				.click(function(){
					that._toolbar.animate({
						'left': 0
					});
					$('body').animate({
						paddingTop: '30px'
					});
					fadeIn.hide();
				})
			    .appendTo(this._toolbar);

			var fadeOut = $("<button class='aloha-ribbon-out'></button>")
				.button()
				.click(function(){
					that._toolbar.animate({
						'left': -that._toolbar.outerWidth() + 30
					});
					$('body').animate({
						paddingTop: 0
					});
					fadeIn.show();
				})
				.appendTo(this._toolbar);

			var wrapper = $('<div class="aloha-ribbon"></div>')
				.appendTo("body");

			this._icon = $('<div></div>')
				.prependTo(this._toolbar);
			this.setIcon("");

			this._toolbar.appendTo(wrapper);

			$('body').css('paddingTop', '30px');
		},
		
		/**
		 * Sets the icon class for the ribbon icon
		 * @param {String} iconClass CSS class for the icon
		 */
		setIcon: function (iconClass) {
			this._icon.attr("class", "aloha-ribbon-icon " + iconClass);
		},

		/**
		 * props.label
		 * props.toggle
		 * props.icon
		 * props.pressed
		 * props.iconCls
		 * props.menu
		 */
		_addButton: function (props) {
			if ( ! this._toolbar.children("ul").length ) {
				$('<ul class="aloha-ribbon-menubar"></ul>').appendTo(this._toolbar);
			}
			lib.setupButton(this._toolbar.children("ul"), props);
		},

		addButton: function(props) {
			this._toolbar.append(lib.makeSplitButton(props));
		},

		refresh: function(){
			if ( ! this._toolbar.children("ul").children().length ) {
				return;
			}
			if (this._menubar) {
				this._toolbar.children("ul").menubar("destroy");
			} else {
				this._menubar = true;
			}
			this._toolbar.children("ul").menubar({
				select: lib.onSelect,
				buttons: true,
				menuIcon: true
				// autoExpand causes a bug that doesn't occur in the
				// demo but does occur with the combination of jquery-ui
				// from master and the menu and menubar plugins from the
				// menubar branch (not sure if this discrepancy is the
				// cause)
				//autoExpand: true,
			});
		},

		/**
		 * Shows the Ribbon
		 */
		hide: function () {
			this._toolbar.fadeOut();
			this._visible = false;
		},

		/**
		 * Hides the Ribbon
		 */
		show: function () {
			this._toolbar.fadeIn();
			this._visible = true;
		},

		/**
		 * Check whether the ribbon is visible right now
		 * @return true when the ribbon is visible, false when not
		 */
		isVisible: function () {
			return this._visible;
		}
	});

	return ribbon;
});