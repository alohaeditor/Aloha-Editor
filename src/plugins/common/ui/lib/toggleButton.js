// The main UI objects are components.
// Components can be placed inside any container, such as a toolbar or sidebar.
define([ 'aloha/core', 'aloha/jquery', 'ui/ui', 'ui/button' ],
function ( Aloha, jQuery, Ui, Button ) {
	var i = 0;
	// The toggleButton extends the button component type to provide an easy
	// way to create buttons for commands that are either on or off.
	Ui.createType( "toggleButton", Button, {
		init: function( editable, settings ) {
			this._super( editable, settings );
		},
		
		// The `setState()` method updates the visual display of the toggleButton.
		setState: function( on ) {
			this.buttonElement.prop( "checked", on ).button( "refresh" );
		},
		
		createButtonElement: function() {
			var id = "a-" + (i++);
			this.element = jQuery( "<span>" );
			jQuery( "<label>", {
				text: this.settings.label,
				"for": id
			}).appendTo( this.element );
			return this.buttonElement = jQuery( "<input type='checkbox'>" )
				.attr( "id", id )
				.appendTo( this.element );
		}
	});
	
	return Ui.toggleButton;
});
