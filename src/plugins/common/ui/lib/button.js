define([
	"aloha/jquery",
	"ui/component"
],
function( jQuery, Component ) {
	// The button component type creates a simple button.
	// Buttons have no state, they only respond to click events.
	var Button = Component.extend({
		// The `init` method is invoked when the component is rendered, not when it
		// is created. This is necessary to allow multiple renderings of the same
		// component. For example, you may want a component to be in the toolbar
		// and in the sidebar.
		init: function() {
			this.createButtonElement()
				.button({
					label: this.label,
					text: !this.iconOnly,
					icons: {
						primary: this.icon
					}
				})
				.button( "widget" )
					.tooltip({
						position: {
							my: "left top",
							at: "right bottom"
						}
					})
					.click( jQuery.proxy(function() {
						this.click();
					}, this ) );
		},

		// The `click()` method is invoked whenever the user clicks the rendered button.
		click: function() {},

		createButtonElement: function() {
			return this.element = this.buttonElement = jQuery( "<button>" );
		}
	});

	return Button;
});
