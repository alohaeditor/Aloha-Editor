
// The main UI objects are components.
// Components can be placed inside any container, such as a toolbar or sidebar.
// Mark this click as handled by Aloha Editor
define([ 'aloha/core', 'ui/ui', 'ui/button' ],
function ( Aloha, Ui, Button ) {

	
	// The second part of the bold plugin is the bold component.
	// The bold component is a [toggleCommandButton](toggleCommandButton.html) that ties into the bold command.
	// The button will automatically update its state whenever the selection changes
	// and it will apply or remove the bold styling when the button is clicked.
	// This functionality comes from the toggleButton which knows how to hook into
	// the associated command.
	Ui.create( "toggleCommandButton", "bold", {
		command: "bold"
	});
	

	Aloha.settings.font = [ "Arial", "Courier", "Georgia" ];
	Ui.create( "dropdown", "fontName", {
		options: function( editable ) {
			return editable.settings.font;
		},
		setValue: function( value ) {
			Aloha.execCommand( "fontName", null, value );
		},
		selectionChange: function() {
			var value = Aloha.queryCommandValue( "fontName" );
			this.element.val( value );
		}
	});
	
	
	Ui.create( "toggleCommandButton", "italic", {
		command: "italic"
	});
	
	
	Ui.create( "toggleButton", "link", {
		command: "createLink",
		click: function() {
			var state = Aloha.queryCommandValue( "createLink" );
			if ( state ) {
				Aloha.execCommand( "unlink" );
			} else {
				Aloha.execCommand( "createLink", false, "http://example.com" );
			}
		},
		selectionChange: function() {
			var value = Aloha.queryCommandValue("createLink");
			this.setState( !(value == '' || value === null ) );
		}

	});

	
	Ui.create( "text", "editLink", {
		selectionChange: function() {
			var value = Aloha.queryCommandValue( "createLink" );
			if ( value ) {
				this.show();
				this.element.val( value );
			} else {
				// this needs to be commented out to actually be able to use
				// the component (see comment in setValue about range management)
				this.hide();
			}
		},
		setValue: function( value ) {
			Aloha.execCommand( "createLink", false, value );
		}
	});
});