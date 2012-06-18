define([
	'aloha/jquery',
	'ui/button',
	'aloha/jquery-ui'
],
function( jQuery, Button ) {
	'use strict';

	var idCounter = 0;

	/**
	 * ToggleButton control. Extends the Button component type to provide an
	 * easy way to create buttons that can transition between "checked" and
	 * "unchecked" states.
	 *
	 * @class
	 * @name ToggleButton
	 * @extends {Button}
	 */
	var ToggleButton = Button.extend({

		_checked: false,

		/**
		 * Sets the state of the toggleButton and updates its visual display
		 * accordingly.
		 *
		 * @param {boolean} toggled Whether the button is to be set to the
		 *                          "toggled/checked" state.
		 */
		setState: function( toggled ) {
			this._checked = toggled;
			this.buttonElement.prop('checked', toggled).button('refresh');
		},

		getState: function() {
			return this._checked;
		},

		_onClick: function() {
			this._checked = ! this._checked;
			// Implementations of the click method must be able to
			// change the toggled state reliably with setState(). For
			// some reason that doesn't work as the state of the button
			// is sometimes wrong after the event handler returns if the
			// state was modified with
			// this.buttonElement.prop('checked', toggled).button('refresh')
			// It is not known why updating the state this way in an event handler
			// sets the button state incorrectly and it should be further investigated.
			// To work around this issue we call the click method in a timeout which
			// seems to work fine. This problem occurs with Chrome.
			setTimeout(jQuery.proxy(this.click, this), 0);
		},

		/**
		 * @override
		 */
		createButtonElement: function() {
			// Generate a unique id for the button until jQuery UI supports
			// implicit labels (http://bugs.jqueryui.com/ticket/6063).
			var id = 'aloha-toggleButton-' + ( ++idCounter );
			this.element = jQuery( '<span>' );

			jQuery( '<label>', {
				text: this.text,
				'for': id
			}).appendTo( this.element );

			this.buttonElement = jQuery( '<input type="checkbox">' )
				.attr( 'id', id )
				.appendTo( this.element );

			return this.buttonElement;
		}

	});

	return ToggleButton;
});
