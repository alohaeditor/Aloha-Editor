define([ 'aloha/jquery', 'ui/ui' ],
function( jQuery, Ui ) {
	Ui.createType( "multiSplit", {
		init: function( editable, settings ) {
			this._super( editable, settings );
			
			var multiSplit = this,
				element = this.element = jQuery( "<div>", {
					"class": "aloha-multi-split"
				});
			
			this.buttons = [];
			jQuery( settings.items( editable ) ).map(function( i, button ) {
				var component = new Aloha.ui.button();
				component.init( editable, {
					label: button.label,
					icon: "aloha-ui-large-icon " + button.icon,
					iconOnly: true,
					click: button.click
				});
				component.element.addClass( "aloha-ui-large-button" );
				
				multiSplit.buttons.push({
					settings: button,
					component: component,
					element: component.element
				});
				
				return component.element[ 0 ];
			})
			.appendTo( element );
		},
		
		selectionChange: function() {
			this.element.find( ".aloha-ui-multisplit-active" )
				.removeClass( "aloha-ui-multisplit-active" );
			jQuery.each( this.buttons, function() {
				if ( this.settings.isActive() ) {
					this.element.addClass( "aloha-ui-multisplit-active" );
					return false;
				}
			});
		}
	});
	
	return Ui.multiSplit;
});
