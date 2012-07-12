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
	 * @extends {Component}
	 */
	var MultiSplit = Component.extend({

		_activeButton: null,

		/**
		 * Initializes the multisplit component
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
					icon: 'aloha-large-icon ' + button.icon,
					iconOnly: true,
					click: function () {
						button.click.apply(multiSplit, arguments);
						multiSplit.close();
					}
				}))();
				component.element.addClass('aloha-large-button');

				multiSplit.buttons.push({
					settings: button,
					component: component,
					element: component.element
				});

				return component.element[0];
			}).appendTo(content);

			$(this.getItems()).map(function (i, item) {
				var component = new (Button.extend({
					tooltip: item.tooltip,
					icon: item.icon,
					init: function () {
						this._super();
						if (item.init) {
							item.init.call(this);
						}
					},
					click: function () {
						item.click.apply(multiSplit, arguments);
						multiSplit.close();
					}
				}))();
				return component.element[0];
			}).appendTo(content);
		},

		setActiveButton: function(index) {
			if (null !== this._activeButton) {
				this.buttons[this._activeButton].element.removeClass('aloha-multisplit-active');
			}
			this._activeButton = index;
			this.buttons[index].element.addClass('aloha-multisplit-active');			
		},

		/**
		 * Toggles the multisplit menu
		 */
		toggle: function () {
			this.element.toggleClass('aloha-multisplit-open');
		},

		/**
		 * Opens the multisplit menu
		 */
		open: function () {
			this.element.addClass('aloha-multisplit-open');
		},

		/**
		 * Closes the multisplit menu
		 */
		close: function () {
			this.element.removeClass('aloha-multisplit-open');
		}
	});

	return MultiSplit;
});
