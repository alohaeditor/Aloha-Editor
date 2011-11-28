define([ 'aloha/jquery', 'ui/ui' ],
function ( jQuery, Ui ) {

	// The button component type creates a simple button.
	// Buttons have no state, they only respond to click events.
	Ui.createType( "button", {
		
		// The `init` method is invoked when the component is rendered, not when it
		// is created. This is necessary to allow multiple renderings of the same
		// component. For example, you may want a component to be in the toolbar
		// and in the sidebar.
		init: function( editable, settings ) {
			this._super( editable, settings );
			
			this.element = jQuery( "<button>", {
				'class': 'aloha-ui aloha-button'
			})
			.text( this.settings.label )
			.button({
				text: !settings.iconOnly,
				icons: {
					primary: settings.icon
				}
			})
			.click( jQuery.proxy( function() {
				this.click();
			}, this ) );
		},
		
		// The `click()` method is invoked whenever the user clicks the rendered button.
		click: function() {
			this.settings.click.apply( this, arguments );
		}
	});
	
	return Ui.button;
});