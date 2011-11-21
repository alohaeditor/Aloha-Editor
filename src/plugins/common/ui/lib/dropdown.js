// The main UI objects are components.
// Components can be placed inside any container, such as a toolbar or sidebar.
// Mark this click as handled by Aloha Editor
define([ 'aloha/jquery', 'ui/ui' ],
function ( jQuery, Ui ) {
	Ui.createType( "dropdown", {
		init: function( editable, settings ) {
			this._super( editable, settings );
			
			this.element = jQuery( "<select>", {
				'class': 'aloha-select'
			})
			.change( jQuery.proxy( function( event ) {
				this.setValue( jQuery( event.target ).val() );
			}, this ) );
			
			jQuery.each( this.settings.options( this.editable ), jQuery.proxy( function( i, option ) {
				jQuery( "<option>", {
					text: option,
					value: option
				}).appendTo( this.element );
			}, this ) );
		},
		
		setValue: function( value ) {
			this.settings.setValue.apply( this, arguments );
		}
	});
	
	return Ui.dropdown;
});
