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

			for (var i = 0; i < buttons.length; i++) {
				this.addButton(buttons[i]);
			}

			$('body').click(function (event) {
				if (multiSplit._isOpen &&
			        !multiSplit.element.is(event.target) &&
			        0 === multiSplit.element.find(event.target).length) {
					multiSplit.close();
				}
			});
		},

		/**
		 * Adds a button to this multisplit component.
		 *
		 * @param button
		 *        - name 
		 *          The name of the button.
		 *          Used by setActiveButton(name), show(name),
		 *          hide(name) to identify the correct button.
		 *
		 *        - tooltip
		 *        - icon
		 *          The tooltip and icon. 
		 *
		 *        - wide
		 *          A boolean indicating whether the button should
		 *          extend the entire width of the multi split button.
		 *
		 *        - init
		 *          An optional init function. Will be invoked with the
		 *          button component instance as context.
		 *
		 *        - click
		 *          A click handler for the button.
		 * @api
		 */
		addButton: function (props) {
			var multiSplit = this;

			var component = new (Button.extend({
				tooltip: props.tooltip,
				icon: props.wide ? props.icon : 'aloha-large-icon ' + props.icon,
				iconOnly: props.wide ? false : true,
				init: function () {
					this._super();
					if (props.init) {
						props.init.call(this);
					}
				},
				click: function () {
					props.click.apply(multiSplit, arguments);
					multiSplit.close();
				}
			}))();
			if (!props.wide) {
				component.element.addClass('aloha-large-button');
			}

			multiSplit.buttons[props.name] = {
				settings: props,
				component: component,
				element: component.element,
				visible: true
			};

			// Ensure non-wide buttons always come before wide buttons
			var fullwidthButtons = this.contentElement.children('.aloha-ui-multisplit-fullwidth');
			if (!props.wide && fullwidthButtons.length) {
				fullwidthButtons.before(component.element[0]);
			} else {
				this.contentElement.append(component.element[0]);
			}
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
