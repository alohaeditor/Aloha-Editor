define([
	"jquery",
	"ui/component"
], function (
	$,
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

		value: '',

		/** Type of the input */
		inputType: 'text',

		_inputElement$: null,
		_labelElement$: null,

		/**
		 * Initializes the text component
		 * @override
		 */
		init: function () {
			this._super();

			var id = 'aloha_input_' + counter;
			counter++;

			this._inputElement$ = $('<input>', {
				type: this.inputType,
				class: 'input-element',
				id: id,
				attr: {
					autocapitalize: 'off',
					autocomplete: 'off',
				}
			})
				.on('change', $.proxy(function (event) {
					this.touch();
					var value = event.target.value;
					if (typeof this.changeNotify === 'function') {
						this.changeNotify(value);
					}
				}, this))
				.on('focus', $.proxy(function (event) {
					this.touch();
				}, this));
			this._inputElement$[0].value = this.value || '';

			this._labelElement$ = $('<label>', {
				class: 'input-label',
				text: this.label,
				for: id,
			});

			this.element = $('<div>', { class: 'input-container' })
                .append(
                    this._labelElement$,
                    this._inputElement$
                );
		},

		setLabel: function(label) {
			this.label = label;
			this._labelElement$.text(label);
		},

		/**
		 * Sets the value of the input field
		 *
		 * @param {string} value The new value of the text input.
		 */
		setValue: function (value) {
			this._inputElement$[0].value = value || '';
		},

		/**
		 * The current value of the text component.
		 *
		 * @return {string} The current value of the text component.
		 */
		getValue: function () {
			return this._inputElement$.val();
		},

		enable: function () {
			this._super();
			this._inputElement$.removeAttr('disabled');
		},

		disable: function () {
			this._super();
			this._inputElement$.attr('disabled', 'disabled');
		}
	});

	return Input;
});
