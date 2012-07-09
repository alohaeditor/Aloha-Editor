/**
 * Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH
 * aloha-sales@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */
define([
    'jquery',
    'aloha/plugin',
    'ui/menuButton',
    'ui/utils',
    'aloha/jquery-ui',
    'css!./css/ribbon.css'
], function (
	$,
	Plugin,
	MenuButton,
	Utils
) {
	'use strict';

	var ribbon = Plugin.create('ribbon', {

		init: function () {
			if (!this.settings.enable &&
				typeof this.settings.enable !== 'undefined') {
				return;
			}

			var that = this;
			this._visible = false;
            this._toolbar = $('<div>', {'class':
				'aloha-ribbon-toolbar ui-menubar ui-widget-header ui-helper-clearfix'});

			var fadeIn = Utils.makeButtonElement({'class': 'aloha-ribbon-in'})
				.button()
				.hide()
				.click(function () {
					that._toolbar.animate({
						'left': 0
					});
					$('body').animate({marginTop: 30});
					fadeIn.hide();
				})
			    .appendTo(this._toolbar);

			var fadeOut = Utils.makeButtonElement({'class': 'aloha-ribbon-out'})
				.button()
				.click(function () {
					that._toolbar.animate({
						'left': -that._toolbar.outerWidth()
						        + fadeIn.outerWidth()
						        + 10
					});
					$('body').animate({marginTop: 0});
					fadeIn.show();
				})
				.appendTo(this._toolbar);

			var wrapper = $('<div>', {'class': 'aloha aloha-ribbon'})
				.appendTo('body');

			this._icon = $('<div>').prependTo(this._toolbar);
			this.setIcon('');

			this._toolbar.appendTo(wrapper);

			$('body').css({
				position: 'relative',
				marginTop: 30
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

		addButton: function (props) {
			if (!this._toolbar) {
				return;
			}
			props = $.extend({}, props, {'siblingContainer': this._toolbar});
			this._toolbar.append(MenuButton.makeMenuButton(props));
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
