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

		/**
		 * Initializes the multisplit component
		 * @override
		 */
		init: function () {
			this._super();
			var editable = this.editable;
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
				}))(editable);
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
				}))(editable);
				return component.element[0];
			}).appendTo(content);
		},

		/**
		 * Selection change callback
		 * @override
		 */
		selectionChange: function () {
			var content = this.contentElement;
			this.element.find('.aloha-multisplit-active')
				.removeClass('aloha-multisplit-active');
			if (!content.is(':visible')) {
				return;
			}
			$.each(this.buttons, function () {
				if (this.settings.isActive()) {
					this.element.addClass('aloha-multisplit-active');
					content.css('top', -this.element.position().top);
					return false;
				}
			});
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
