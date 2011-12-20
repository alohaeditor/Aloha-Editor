define([
	"aloha/jquery",
	"ui/ui"
],
function( jQuery, Ui ) {
	Ui.createType( "multiSplit", {
		init: function() {
			var editable = this.editable,
				multiSplit = this,
				element = this.element = jQuery( "<div>", {
					"class": "aloha-multisplit"
				}),
				content = this.contentElement = jQuery( "<div>", {
					"class": "aloha-multisplit-content"
				})
					.appendTo( element ),
				toggle = this.toggleButton = jQuery( "<button>", {
					"class": "aloha-multisplit-toggle",
					text: "x",
					click: function() {
						multiSplit.toggle();
					}
				})
					.button()
					.appendTo( element );
			
			this.buttons = [];
			jQuery( this.getButtons() ).map(function( i, button ) {
				var component = new Aloha.ui.button( editable, {
					label: button.label,
					icon: "aloha-large-icon " + button.icon,
					iconOnly: true,
					click: function() {
						button.click.apply( multiSplit, arguments );
						multiSplit.close();
					}
				});
				component.element.addClass( "aloha-large-button" );
				
				multiSplit.buttons.push({
					settings: button,
					component: component,
					element: component.element
				});
				
				return component.element[ 0 ];
			})
			.appendTo( content );
			
			jQuery( this.getItems() ).map(function( i, item ) {
				var component = new Aloha.ui.button( editable, {
					label: item.label,
					icon: item.icon,
					click: function() {
						item.click.apply( multiSplit, arguments );
						multiSplit.close();
					}
				});
				return component.element[ 0 ];
			})
			.appendTo( content );
		},
		
		selectionChange: function() {
			var content = this.contentElement;
			this.element.find( ".aloha-multisplit-active" )
				.removeClass( "aloha-multisplit-active" );
			jQuery.each( this.buttons, function() {
				if ( this.settings.isActive() ) {
					this.element.addClass( "aloha-multisplit-active" );
					content.css( "top", -this.element.position().top );
					return false;
				}
			});
		},
		
		toggle: function() {
			this.element.toggleClass( "aloha-multisplit-open" );
		},
		
		open: function() {
			this.element.addClass( "aloha-multisplit-open" );
		},
		
		close: function() {
			this.element.removeClass( "aloha-multisplit-open" );
		}
	});
	
	return Ui.multiSplit;
});
