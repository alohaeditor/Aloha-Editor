define([
	"aloha/core",
	"ui/ui",
	"ui/toggleButton"
],
function( Aloha, Ui ) {
	Ui.create( "link", "toggleButton", {
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
	
	Ui.create( "editLink", "text", {
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
