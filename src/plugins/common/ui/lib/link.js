define([
	"aloha/core",
	"ui/ui",
	"i18n!ui/nls/i18n",
	"ui/text",
	"ui/toggleButton"
],
function( Aloha, Ui, i18n ) {
	Ui.create( "link", "toggleButton", {
		label: i18n.t( "button.createLink.label" ),
		icon: "aloha-icon aloha-icon-link",
		iconOnly: true,
		click: function() {
			var state = Aloha.queryCommandValue( "createLink", Ui.toolbar.range );
			if ( state ) {
				Aloha.execCommand( "unlink", false, null, Ui.toolbar.range );
			} else {
				Aloha.execCommand( "createLink", false, "http://example.com", Ui.toolbar.range );
			}
		},
		selectionChange: function() {
			var value = Aloha.queryCommandValue( "createLink" );
			this.setState( !!value );
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
			Aloha.execCommand( "createLink", false, value, Ui.toolbar.range );
		}
	});
});
