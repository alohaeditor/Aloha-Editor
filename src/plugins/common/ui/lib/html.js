define([
	"aloha/jquery",
	"ui/ui"
],
function( jQuery, Ui ) {
	Ui.createType( "html", {
		init: function() {
			this.element = jQuery( this.html );
		}
	});
	
	return Ui.html;
});
