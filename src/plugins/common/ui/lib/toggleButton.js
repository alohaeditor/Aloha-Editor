define([
	"aloha/jquery",
	"ui/button"
],
function( jQuery, Button ) {
	var guid = 0;

	// The toggleButton extends the button component type to provide an easy
	// way to create buttons for commands that are either on or off.
	var ToggleButton = Button.extend({
		// The `setState()` method updates the visual display of the toggleButton.
		setState: function( on ) {
			this.buttonElement.prop( "checked", on ).button( "refresh" );
		},

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
