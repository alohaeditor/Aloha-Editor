define([
	"aloha/core",
	"ui/ui",
	"i18n!ui/nls/i18n",
	"aloha/jquery",
	"ui/multiSplit"
],
function( Aloha, Ui, i18n, jQuery ) {
	Aloha.settings.formatBlock = {
		blocks: [ "p", "h1", "h2", "h3", "h4", "h5", "h6", "pre" ],
		removeFormatting: [ "strong", "em", "b", "i", "cite", "q", "code", "abbr", "del", "sub", "sup" ]
	};
	
	Ui.create( "formatBlock", "multiSplit", {
		_buttons: {},
		getButtons: function() {
			return jQuery.map( this.editable.settings.formatBlock.blocks, function( item ) {
				return Aloha.ui.components.formatBlock._buttons[ item ];
			});
		},
		
		getItems: function() {
			var formatBlock = this;
			return [{
				label: "Remove formatting",
				click: function() {
					formatBlock.removeFormatting( Ui.toolbar.range, this.editable );
				}
			}];
		},
		
		removeFormatting: function( range, editable ) {
			range = new GENTICS.Utils.RangeObject( range || Aloha.getSelection().getRangeAt( 0 ) );
			if ( range.collapsed ) {
				return;
			}
			
			var formats = editable.settings.formatBlock.removeFormatting,
				i = 0,
				length = formats.length;
			
			for ( ; i < length; i++ ) {
				GENTICS.Utils.Dom.removeMarkup( range, jQuery( "<" + formats[i] + ">" ), editable.obj );
			}
		}
	});
	
	jQuery.each( Aloha.settings.formatBlock.blocks, function( i, block ) {
		Aloha.ui.components.formatBlock._buttons[ block ] = {
			label: i18n.t( "button." + block + ".label" ),
			icon: "aloha-large-icon-" + block,
			click: function() {
				Aloha.execCommand( "formatBlock", false, block, Ui.toolbar.range );
			},
			isActive: function() {
				return Aloha.queryCommandValue( "formatBlock" ) === block;
			}
		};
	});
});
