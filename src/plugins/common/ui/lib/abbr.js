define([
	"aloha/core",
	"ui/ui",
	"i18n!ui/nls/i18n", 
	"aloha/jquery",
	"ui/toggleButton",
	"ui/text"
],
function( Aloha, Ui, i18n, jQuery, Browser ) {
	Ui.create( "abbr", "toggleButton", {
		label: i18n.t( "button.createAbbr.label" ),
		icon: "aloha-icon aloha-icon-abbr",
		iconOnly: true,
		
		click: function() {
			var abbr = findAbbr( Ui.toolbar.range );
			if ( abbr ) {
				Ui.util.removeAbbr( Ui.toolbar.range );
			} else {
				Ui.util.createAbbr( "", Ui.toolbar.range );
			}
		},
		
		selectionChange: function() {
			var abbr = findAbbr();
			this.setState( !!abbr );
		}
	});
	
	Ui.create( "editAbbr", "text", {
		selectionChange: function() {
			var abbr = findAbbr();
			if ( abbr ) {
				this.show();
				this.element.val( abbr ? abbr.title : null );
			} else {
				this.hide();
			}
		},
		
		setValue: function( value ) {
			if ( value ) {
				findAbbr( Ui.toolbar.range ).title = value;
			} else {
				Ui.util.removeAbbr( Ui.toolbar.range );
			}
		}
	});
	
	function getRange( range ) {
		return new GENTICS.Utils.RangeObject(
			range || Aloha.getSelection().getRangeAt( 0 ) );
	}
	
	function findAbbr( range ) {
		return Ui.util.findElemFromRange( "abbr", range );
	}
	
	Ui.util.createAbbr = function( title, range ) {
		GENTICS.Utils.Dom.addMarkup( getRange( range ),
			jQuery( "<abbr>", { title: title } ), false );
	};
	
	Ui.util.removeAbbr = function( range ) {
		GENTICS.Utils.Dom.removeFromDOM( findAbbr( range ), getRange( range ), true );
	};
});
