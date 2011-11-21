define([ 'aloha/jquery', 'ui/ui' ],
function ( jQuery, Ui ) {
	
	Aloha.ui.createType( "text", {
		init: function( editable, settings ) {
			this._super( editable, settings );
			
			this.element = jQuery( "<input>", {
				'class': 'aloha-ui aloha-text'
			})
			.keyup( jQuery.proxy( function( event ) {
				if ( event.keyCode === 13 ) {
					this.setValue( event.target.value );
				}
			}, this ) );
		},
		
		setValue: function( value ) {
			this.settings.setValue.apply( this, arguments );
		}
	});
});
