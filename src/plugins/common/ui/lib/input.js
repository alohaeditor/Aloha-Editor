/** @typedef {import('./component').Component} Component */
/** @typedef {'button' | 'checkbox' | 'color' | 'date' | 'datetime-local' | 'email' | 'file' | 'hidden' | 'image' | 'month' | 'number' | 'password' | 'radio' | 'range' | 'reset' | 'search' | 'submit' | 'tel' | 'text' | 'time' | 'url' | 'week'} InputType */
/**
 * @typedef {object} InputProperties
 * @property {'input'} type
 * @property {InputType} inputType The type of the input. @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#type
 * @property {string=} label The label describing what the input is for
 * @property {string=} hint Additional text for further description of the input, usually for password guidelines or similar.
 * 
 * @property {function(string): void} setLabel Updates the `label` of the instance
 * @property {function(string): void} setHint Updates the `hint` of the instance
 */
/**
 * Implements a simple input component, with basic reactive wrapper and options.
 * @typedef {Component & InputProperties} Input
 */

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
	 * @type {Input}
	 */
	var Input = Component.extend(/** @type {Input} */({
		type: 'input',

		/** Label for the input */
		label: '',

		/**
		 * Hint/Description text for the input.
		 * Commonly used for password inputs, with the requirements of the password.
		 */
		hint: '',

		/** The value of the input */
		value: '',

		/** Type of the input */
		inputType: 'text',

		/** @type {JQuery} */
		_inputElement$: null,
		/** @type {JQuery} */
		_labelElement$: null,
		/** @type {JQuery} */
		_hintElement$: null,

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

			this._hintElement$ = $('<div>', {
				class: 'input-hint',
				text: this.hint,
			});

			this.element = $('<div>', { class: 'input-container' })
                .append(
                    this._labelElement$,
                    this._inputElement$,
					this._hintElement$
                );
		},

		setLabel: function(label) {
			this.label = label;
			this._labelElement$.text(label);
		},
		setHint: function(hint) {
			this.hint = hint;
			this._hintElement$.text(hint);
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
	}));

	return Input;
});
