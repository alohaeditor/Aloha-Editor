define([
	"aloha/core",
	"i18n!ui/nls/i18n",
	"ui/ui",
	"ui/surface",
	"ui/button",
	"ui/toggleCommandButton"
],
function( Aloha, i18n, Ui, Surface ) {
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
	
	function inList() {
		return Aloha.queryCommandState( "insertorderedlist" ) ||
			Aloha.queryCommandState( "insertunorderedlist" );
	}
	
	Ui.create( "indentList", "button", {
		label: i18n.t( "button.indent.label" ),
		icon: "aloha-icon aloha-icon-indent",
		iconOnly: true,
		click: function() {
			Aloha.execCommand( "indent", null, false, Surface.range );
		},
		selectionChange: function() {
			if ( inList() ) {
				this.show();
			} else {
				this.hide();
			}
		}
	});
	
	Ui.create( "outdentList", "button", {
		label: i18n.t( "button.outdent.label" ),
		icon: "aloha-icon aloha-icon-outdent",
		iconOnly: true,
		click: function() {
			Aloha.execCommand( "outdent", null, false, Surface.range );
		},
		selectionChange: function() {
			if ( inList() ) {
				this.show();
			} else {
				this.hide();
			}
		}
	});
	
	Aloha.Markup.addKeyHandler( 9, function( event ) {
		if ( inList() ) {
			Aloha.execCommand( event.shiftKey ? "outdent" : "indent" );
		}
	});
});
