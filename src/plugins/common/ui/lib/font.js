define([
	"aloha/core",
	"ui/ui",
	"ui/dropdown"
],
function( Aloha, Ui ) {
	Aloha.settings.font = [ "Arial", "Courier", "Georgia" ];
	Ui.create( "fontName", "dropdown", {
		options: function( editable ) {
			return editable.settings.font;
		},
		setValue: function( value ) {
			Aloha.execCommand( "fontName", null, value );
		},
		selectionChange: function() {
			var value = Aloha.queryCommandValue( "fontName" );
			this.element.val( value );
		}
	});
});
