/*global define: true */
/**
 * The multiSplit component groups multiple buttons and other
 * button-like items into an expandable menu.
 */
define([
	'jquery',
	'ui/component',
	'ui/button',
	'ui/utils'
], function (
	$,
	Component,
	Button,
	Utils
) {
	'use strict';

	/**
	 * MultiSplit component type.
	 * @class
	 * @api
	 * @extends {Component}
	 */
	var MultiSplit = Component.extend({

		_activeButton: null,
		_isOpen: false,

		/**
		 * @override
		 */
		init: function () {
			this._super();
			var multiSplit = this;
			var element = this.element = $('<div>', {
				'class': 'aloha-multisplit'
			});
			var content = this.contentElement = $('<div>', {
				'class': 'aloha-multisplit-content'
			}).appendTo(element);
			var toggle = this.toggleButton = Utils.makeButtonElement({
				'class': 'aloha-multisplit-toggle',
				click: function () {
					multiSplit.toggle();
				}
			}).button().appendTo(element);

			this.buttons = [];

			var buttons = this.getButtons();

			if (0 === buttons.length) {
				element.hide();
			}

			$(buttons).map(function (i, button) {
				var component = new (Button.extend({
					tooltip: button.tooltip,
					icon: button.wide ? button.icon : 'aloha-large-icon ' + button.icon,
					iconOnly: button.wide ? false : true,
					init: function () {
						this._super();
						if (button.init) {
							button.init.call(this);
						}
					},
					click: function () {
						button.click.apply(multiSplit, arguments);
						multiSplit.close();
					}
				}))();
				if (!button.wide) {
					component.element.addClass('aloha-large-button');
				}

				multiSplit.buttons[button.name] = {
					settings: button,
					component: component,
					element: component.element,
					visible: true
				};

				return component.element[0];
			}).appendTo(content);

			var that = this;
			$('body').click(function (event) {
				if (that._isOpen &&
			        !that.element.is(event.target) &&
			        0 === that.element.find(event.target).length) {
					that.close();
				}
			});
		},

		/**
		 * @api
		 */
		setActiveButton: function (name) {
			if (!name) {
				name = null;
			}
			if (null !== this._activeButton) {
				this.buttons[this._activeButton]
				    .element.removeClass('aloha-multisplit-active');
			}
			this._activeButton = name;
			if (null !== name) {
				this.buttons[name]
				    .element.addClass('aloha-multisplit-active');
			}
		},

		/**
		 * Toggles the multisplit menu
		 * @api
		 */
		toggle: function () {
			this.element.toggleClass('aloha-multisplit-open');
			this._isOpen = !this._isOpen;
		},

		/**
		 * Opens the multisplit menu
		 * @api
		 */
		open: function () {
			this.element.addClass('aloha-multisplit-open');
			this._isOpen = true;
		},

		/**
		 * Closes the multisplit menu
		 * @api
		 */
		close: function () {
			this.element.removeClass('aloha-multisplit-open');
			this._isOpen = false;
		},

		/**
		 * Show the button with given index
		 * @api
		 * @param {Number} index button index
		 */
		show: function (name) {
			if (!name) {
				name = null;
			}
			if (null !== name && this.buttons[name] !== undefined) {
				this.buttons[name].element.show();
				this.buttons[name].visible = true;
				// since we show at least one button now, we need to show the multisplit button
				this.element.show();
			}
		},

		/**
		 * Hide the button with given index
		 * @api
		 * @param {Number} index button index
		 */
		hide: function (name) {
			var button, visible = false;

			if (!name) {
				name = null;
			}
			if (null !== name && this.buttons[name] !== undefined) {
				this.buttons[name].element.hide();
				this.buttons[name].visible = false;

				// now check, if there is a visible button
				for (button in this.buttons) {
					if (this.buttons.hasOwnProperty(button)) {
						if (this.buttons[button].visible) {
							this.element.show();
							visible = true;
							break;
						}
					}
				}

				if (!visible) {
					this.element.hide();
				}
			}
		}
	});

	/**
	 * This module is part of the Aloha API.
	 * It is valid to override this module via requirejs to provide a
	 * custom behaviour. An overriding module must implement all API
	 * methods. Every member must have an api annotation. No non-api
	 * members are allowed.
	 * @api
	 */
	return MultiSplit;
});
