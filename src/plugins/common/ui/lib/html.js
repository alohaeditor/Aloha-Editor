define([
	"aloha/jquery",
	"ui/component"
],
function( jQuery, Component ) {
	var Html = Component.extend({
		init: function() {
			this.element = jQuery( this.html );
		}
	});

	return Html;
});
