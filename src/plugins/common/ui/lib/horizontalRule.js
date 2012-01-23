define([
	"i18n!ui/nls/i18n",
	"ui/component",
	"ui/surface",
	"ui/button"
],
function( i18n, Component, Surface, Button ) {
	Component.define( "horizontalRule", Button, {
		label: i18n.t( "button.horizontalRule.label" ),
		iconOnly: true,
		icon: "aloha-icon aloha-icon-horizontal-rule",
		click: function() {
			Aloha.execCommand( "inserthorizontalrule", null, false, Surface.range );
		}
	});
});
