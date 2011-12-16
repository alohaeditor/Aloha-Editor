define([
	"aloha/jquery",
	"ui/ui"
],
function( jQuery, Ui ) {
	Ui.createType( "text", {
		init: function() {
			this.element = jQuery( "<input>" )
				.bind( "change", jQuery.proxy(function( event ) {
					this.setValue( event.target.value );
				}, this ) );
		},
		
		// invoked when the user has changed the value
		setValue: function( value ) {}
	});
});
