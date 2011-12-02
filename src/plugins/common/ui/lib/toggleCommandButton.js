define([ 'aloha/core', 'ui/ui', 'ui/togglebutton' ],
function( Aloha, Ui, ToggleButton ) {
	// The toggleCommandButton extends the toggleButton component type to provide an easy
	// way to create buttons for __commands__ that are either on or off.
	Ui.createType( "toggleCommandButton", ToggleButton, {
		// On click, we will always execute the command. Since toggleCommandButton is
		// used for binary commands, there is no need to provide a value
		click: function() {
			Aloha.execCommand( this.command, false, null, Ui.toolbar.range );
		},
		
		// When the selection changes, the button will query the current state
		// of the command to determine if the button should be rendered as
		// on or off.
		selectionChange: function() {
			this.setState( Aloha.queryCommandState( this.command ) );
		}
	});
	
	return Ui.toggleCommandButton;
});
