define([
	"aloha/jquery",
	"ui/component",
	"ui/button"
],
function( jQuery, Component, Button ) {
	/**
	 * MultiSplit component type
	 * @class
	 * @extends {Component}
	 */
	var MultiSplit = Component.extend({
		/**
		 * Initializes the multisplit component
		 * @override
		 */
		init: function() {
			this._super();
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
				var component = new (Button.extend({
					label: button.label,
					icon: "aloha-large-icon " + button.icon,
					iconOnly: true,
					click: function() {
						button.click.apply( multiSplit, arguments );
						multiSplit.close();
					}
				}))( editable );
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
				var component = new (Button.extend({
					label: item.label,
					icon: item.icon,
					click: function() {
						item.click.apply( multiSplit, arguments );
						multiSplit.close();
					}
				}))( editable );
				return component.element[ 0 ];
			})
			.appendTo( content );
		},

		/**
		 * Selection change callback
		 * @override
		 */
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

		/**
		 * Toggles the multisplit menu
		 */
		toggle: function() {
			this.element.toggleClass( "aloha-multisplit-open" );
		},

		/**
		 * Opens the multisplit menu
		 */
		open: function() {
			this.element.addClass( "aloha-multisplit-open" );
		},

		/**
		 * Closes the multisplit menu
		 */
		close: function() {
			this.element.removeClass( "aloha-multisplit-open" );
		}
	});

	return MultiSplit;
});
