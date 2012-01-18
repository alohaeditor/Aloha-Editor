define([
	"aloha/jquery",
	"ui/component"
],
function( jQuery, Component ) {
	var Text = Component.extend({
		init: function() {
			this.element = jQuery( "<input>" )
				.bind( "change", jQuery.proxy(function( event ) {
					this.setValue( event.target.value );
				}, this ) );
		},

		// invoked when the user has changed the value
		setValue: function( value ) {}
	});

	return Text;
});
