define([
	"aloha/jquery",
	"ui/button"
],
function( jQuery, Button ) {
	var guid = 0;

	// The toggleButton extends the button component type to provide an easy
	// way to create buttons for commands that are either on or off.
	/**
	 * ToggleButton component type
	 * @class
	 * @extends {Button}
	 */
	var ToggleButton = Button.extend({
		// The `setState()` method updates the visual display of the toggleButton.
		/**
		 * Sets the state of the button
		 * @param {boolean} on
		 */
		setState: function( on ) {
			this.buttonElement.prop( "checked", on ).button( "refresh" );
		},

		/**
		 * Creates the element to be used as the button
		 * @override
		 * @returns {jQuery}
		 */
		createButtonElement: function() {
			// generate a unique id for the button until jQuery UI supports
			// implicit labels (http://bugs.jqueryui.com/ticket/6063)
			var id = "aloha-toggleButton-" + (guid++);
			this.element = jQuery( "<span>" );
			jQuery( "<label>", {
				text: this.label,
				"for": id
			}).appendTo( this.element );
			return this.buttonElement = jQuery( "<input type='checkbox'>" )
				.attr( "id", id )
				.appendTo( this.element );
		}
	});

	return ToggleButton;
});
