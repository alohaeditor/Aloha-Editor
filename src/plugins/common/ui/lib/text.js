define([ "aloha/jquery", "ui/ui" ],
function( jQuery, Ui ) {
	Aloha.ui.createType( "text", {
		init: function() {
			this.element = jQuery( "<input>", {
				keyup: jQuery.proxy( function( event ) {
					if ( event.keyCode === 13 ) {
						this.setValue( event.target.value );
					}
				}, this )
			});
		},
		
		// invoked when the user presses enter
		// TODO: invoke on blur?
		setValue: function( value ) {}
	});
});
