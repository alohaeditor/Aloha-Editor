define([
	"aloha/core",
	"ui/ui",
	"i18n!ui/nls/i18n",
	"ui/button",
	"ui/toggleCommandButton"
],
function( Aloha, Ui, i18n ) {
	Ui.create( "orderedList", "toggleCommandButton", {
		label: i18n.t( "button.ol.label" ),
		command: "insertorderedlist",
		icon: "aloha-icon aloha-icon-orderedlist",
		iconOnly: true
	});
	
	Ui.create( "unorderedList", "toggleCommandButton", {
		label: i18n.t( "button.ul.label" ),
		command: "insertunorderedlist",
		icon: "aloha-icon aloha-icon-unorderedlist",
		iconOnly: true
	});
	
	Ui.create( "indentList", "button", {
		label: i18n.t( "button.indent.label" ),
		icon: "aloha-icon aloha-icon-indent",
		iconOnly: true,
		click: function() {
			Aloha.execCommand( "indent", null, false, Ui.toolbar.range );
		}
	});
	
	Ui.create( "outdentList", "button", {
		label: i18n.t( "button.outdent.label" ),
		icon: "aloha-icon aloha-icon-outdent",
		iconOnly: true,
		click: function() {
			Aloha.execCommand( "outdent", null, false, Ui.toolbar.range );
		}
	});
});
