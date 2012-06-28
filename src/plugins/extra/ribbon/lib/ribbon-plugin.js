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
	'i18n!aloha/nls/i18n',
	'aloha/jquery-ui'
], function($, Plugin, lib, i18nCore) {
	"use strict";

	var ribbon = Plugin.create('ribbon', {
		init: function () {
			if ( ! this.settings.enable ) {
				return;
			}

			var that = this;
			this._visible = false;
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
						//'border-top-width': '30px'
					});
					fadeIn.hide();
				})
			    .appendTo(this._toolbar);

			var fadeOut = $("<button class='aloha-ribbon-out'></button>")
				.button()
				.click(function(){
					that._toolbar.animate({
						'left': -that._toolbar.outerWidth() + fadeIn.outerWidth() + 10
					});
					$('body').animate({
						//'border-top-width': 0
						paddingTop: 0
					});
					fadeIn.show();
				})
				.appendTo(this._toolbar);

			var wrapper = $('<div class="aloha-ribbon"></div>')
				.appendTo("body");

			this._icon = $('<div></div>')
				.prependTo(this._toolbar);
			this.setIcon('');

			this._toolbar.appendTo(wrapper);

			$('body').css({
				//position: 'relative',
				//border: '30px solid transparent'
				paddingTop: '30px'
			});
		},
		
		/**
		 * Sets the icon class for the ribbon icon
		 * @param {String} iconClass CSS class for the icon
		 */
		setIcon: function (iconClass) {
			if (!this._icon) {
				return;
			}
			this._icon.attr('class', 'aloha-ribbon-icon ' + iconClass);
		},

		addButton: function(props) {
			if (!this._toolbar) {
				return;
			}
			props = $.extend({}, props, {'siblingContainer': this._toolbar});
			this._toolbar.append(lib.makeMenuButton(props));
		},

		/**
		 * Shows the Ribbon
		 */
		hide: function () {
			if (!this._toolbar) {
				return;
			}
			this._toolbar.hide();
			this._visible = false;
		},

		/**
		 * Hides the Ribbon
		 */
		show: function () {
			if (!this._toolbar) {
				return;
			}
			this._toolbar.show();
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
