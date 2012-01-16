define([
	"aloha/jquery",
	"i18n!ui/nls/i18n",
	"ui/ui",
	"ui/surface",
	"ui/button"
],
function( jQuery, i18n, Ui, Surface ) {
	Ui.create( "horizontalRule", "button", {
		label: i18n.t( "button.horizontalRule.label" ),
		iconOnly: true,
		icon: "aloha-icon aloha-icon-horizontal-rule",
		click: function() {
			Aloha.execCommand( "inserthorizontalrule", null, false, Surface.range );
		}
	});
});
