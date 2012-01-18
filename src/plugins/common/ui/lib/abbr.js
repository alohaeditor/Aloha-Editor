define([
	"aloha/core",
	"aloha/jquery",
	"i18n!ui/nls/i18n",
	"ui/component",
	"ui/surface",
	"ui/toggleButton",
	"ui/text",
	"ui/ui"
],
function( Aloha, jQuery, i18n, Component, Surface, ToggleButton, Text, Ui ) {
	Component.define( "abbr", ToggleButton, {
		label: i18n.t( "button.createAbbr.label" ),
		icon: "aloha-icon aloha-icon-abbr",
		iconOnly: true,

		click: function() {
			var abbr = findAbbr( Surface.range );
			if ( abbr ) {
				Ui.util.removeAbbr( Surface.range );
			} else {
				Ui.util.createAbbr( "", Surface.range );
			}
		},

		selectionChange: function() {
			var abbr = findAbbr();
			this.setState( !!abbr );
		}
	});

	Component.define( "editAbbr", Text, {
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
				findAbbr( Surface.range ).title = value;
			} else {
				Ui.util.removeAbbr( Surface.range );
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
