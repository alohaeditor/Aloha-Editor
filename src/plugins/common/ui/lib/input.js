define([
	"jquery",
	"ui/component"
], function (
	jQuery,
	Component
) {
	'use strict';

	var counter = 0;

	/**
	 * Input component type
	 * @class
	 * @extend {Component}
	 */
	var Input = Component.extend({
		type: 'input',

		/** Label for the input */
		label: '',

		/** Type of the input */
		inputType: 'text',

		inputElement: null,

		/**
		 * Initializes the text component
		 * @override
		 */
		init: function () {
			this._super();

			var id = 'aloha_input_' + counter;
			counter++;

			this.inputElement = jQuery('<input>', {
				type: this.inputType,
				class: 'input-element',
				id: id,
				attr: {
					autocapitalize: 'off',
					autocomplete: 'off',
				}
			})
				.on('change', jQuery.proxy(function (event) {
					this.touch();
					var value = event.target.value;
					if (typeof this.changeNotify === 'function') {
						this.changeNotify(value);
					}
				}, this))
				.on('focus', jQuery.proxy(function (event) {
					this.touch();
				}, this));

			this.element = $('<div>', { class: 'input-container' })
                .append(
                    $('<label>', {
                        class: 'input-label',
                        text: this.label,
                        for: id,
                    }),
                    this.inputElement
                );
		},

		/**
		 * Sets the value of the input field
		 *
		 * @param {string} value The new value of the text input.
		 */
		setValue: function (value) {
			this.element.val(value);
		},

		/**
		 * The current value of the text component.
		 *
		 * @return {string} The current value of the text component.
		 */
		getValue: function () {
			return this.element.val();
		},

		enable: function () {
			this._super();
			this.inputElement.removeAttr('disabled');
		},

		disable: function () {
			this._super();
			this.inputElement.attr('disabled', 'disabled');
		}
	});

	return Input;
});
