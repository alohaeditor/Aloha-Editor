define([
	"aloha/jquery",
	"ui/component"
],
function( jQuery, Component ) {
	Component.define( "pipe", Component, {
		init: function() {
			this._super();
			this.element = jQuery( "<span>&nbsp;|&nbsp;</span>" );
		}
	});
});
