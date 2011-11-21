// The main UI objects are components.
// Components can be placed inside any container, such as a toolbar or sidebar.
// Mark this click as handled by Aloha Editor
define([ 'aloha/core', 'ui/ui', 'ui/button' ],
function ( Aloha, Ui, Button ) {
	
	// The toggleButton extends the button component type to provide an easy
	// way to create buttons for commands that are either on or off.
	Ui.createType( "toggleButton", Button, {
		// The `setState()` method updates the visual display of the toggleButton.
		setState: function( on ) {
			this.element.toggleClass( "aloha-button-on", on );
		}
	});
	
	return Ui.toggleButton;
});
