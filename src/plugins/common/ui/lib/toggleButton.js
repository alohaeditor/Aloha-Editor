define([
	'aloha/jquery',
	'ui/button'
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

		/**
		 * Sets the state of the toggleButton and updates its visual display
		 * accordingly.
		 *
		 * @param {boolean} toggled Whether the button is to be set to the
		 *                          "toggled/checked" state.
		 */
		setState: function( toggled ) {
			this.buttonElement.prop( 'checked', toggled ).button( 'refresh' );
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
				text: this.label,
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
