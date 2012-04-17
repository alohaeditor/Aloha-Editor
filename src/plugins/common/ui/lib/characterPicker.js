define([
	"aloha/jquery",
	"i18n!ui/nls/i18n",
	"ui/component",
	"ui/surface",
	"ui/button"
],
function( jQuery, i18n, Component, Surface, Button ) {
	/**
	 * Character picker component
	 * @class
	 * @extends {Button}
	 */
	Component.define( "characterPicker", Button, {
		/**
		 * Localized label
		 * @type {string}
		 */
		label: i18n.t( "button.characterPicker.label" ),

		/**
		 * Whether or not to show only the icon
		 * @type {boolean}
		 */
		iconOnly: true,

		/**
		 * Which icon to render
		 * @type {string}
		 */
		icon: "aloha-icon aloha-icon-character-picker",

		/**
		 * Click callback
		 * @override
		 */
		click: function() {
			this._renderPicker();
			this._open();
		},

		/**
		 * Renders the character picker menu
		 */
		_renderPicker: function() {
			if ( this._rendered ) {
				return;
			}

			this._cols = this.editable.settings.characterPicker.columns;
			this._rows = 1;

			var tableHtml = "",
				characters = this.editable.settings.characterPicker.characters.split( " " ),
				i = 0,
				length = characters.length;
			for ( ; i < length; i++ ) {
				if ( i === 0 ) {
					tableHtml += "<tr>";
				} else if ( i % this._cols === 0 ) {
					tableHtml += "</tr><tr>";
					this._rows++;
				}
				tableHtml += "<td tabindex=-1>" + characters[ i ] + "</td>";
			}
			tableHtml = "<table><tbody>" + tableHtml + "</tr></tbody><table>";
			this._table = jQuery( tableHtml )
				.addClass( "aloha-characterpicker" )
				// TODO: append to component container, not direct parent
				.appendTo( this.element.parent() )
				.delegate( "td", "mouseenter", function() {
					jQuery( this ).addClass( "ui-state-hover" );
				})
				.delegate( "td", "mouseleave", function() {
					jQuery( this ).removeClass( "ui-state-hover" );
				})
				.delegate( "td", "focusin", function() {
					jQuery( this ).addClass( "ui-state-focus" );
				})
				.delegate( "td", "focusout", function() {
					jQuery( this ).removeClass( "ui-state-focus" );
				})
				.delegate( "td", "click", jQuery.proxy(function( event ) {
					this._select( jQuery( event.target ) );
				}, this ) )
				.bind( "keydown", jQuery.proxy( this, "_keydown" ) );
			this._firstChar = this._table.find( "td" ).eq( 0 );
			this._maxRow = this._rows - 1;
			this._maxCol = this._cols - 1;

			this._rendred = true;
		},

		/**
		 * Keydown event handler
		 * @param event
		 */
		_keydown: function( event ) {
			var keyCode = jQuery.ui.keyCode,
				focused = jQuery( event.target.ownerDocument.activeElement ),
				col = focused.index(),
				row = focused.parent().index();

			switch ( event.keyCode ) {
			case keyCode.RIGHT:
				if ( col < this._maxCol ) {
					focused.next().focus();
				}
				event.preventDefault();
				break;

			case keyCode.LEFT:
				if ( col > 0 ) {
					focused.prev().focus();
				}
				event.preventDefault();
				break;

			case keyCode.DOWN:
				if ( row < this._maxRow ) {
					focused.parent().next().children().eq( col ).focus();
				}
				event.preventDefault();
				break;

			case keyCode.UP:
				if ( row > 0 ) {
					focused.parent().prev().children().eq( col ).focus();
				}
				event.preventDefault();
				break;

			case keyCode.ENTER:
				this._select( focused );
				event.preventDefault();
				break;

			case keyCode.ESCAPE:
				this._close();
				event.preventDefault();
				break;
			}
		},

		/**
		 * Opens the character picker menu
		 */
		_open: function() {
			var that = this;

			this._table
				.show()
				.position({
					my: "left top",
					at: "left top",
					of: this.element,
					collision: "none"
				});
			this._firstChar.focus();
			this._isOpen = true;

			// if the user clicks outside the character picker, then close
			// delay so we don't capture the click that caused the open
			setTimeout(function() {
				if ( that._isOpen ) {
					jQuery( that.element[ 0 ].ownerDocument )
						.click( jQuery.proxy( that, "_clickOutside" ) );
				}
			}, 1 );
		},

		/**
		 * Selects a character
		 * @param {jQuery} elem
		 */
		_select: function( elem ) {
			var range = new GENTICS.Utils.RangeObject( Surface.range ),
				charNode = jQuery( document.createTextNode( elem.html() ) );
			GENTICS.Utils.Dom.insertIntoDOM( charNode, range,
				jQuery( Surface.editable ), true );
			range.select();
			this._close();
		},

		/**
		 * Closes the character picker menu
		 */
		_close: function() {
			this._isOpen = false;
			jQuery( this.element[ 0 ].ownerDocument )
				.unbind( "click", this._clickOutside );
			this._table.hide();
		},

		/**
		 * Handles click events outside the character picker menu
		 * @param event
		 */
		_clickOutside: function( event ) {
			if ( !jQuery.contains( this._table[ 0 ], event.target ) ) {
				this._close();
			}
		}
	});

	/**
	 * Default settings for character picker components
	 * @type {object}
	 */
	Aloha.settings.characterPicker = {
		characters: '&#38; &#34; &#162; &#8364; &#163; &#165; &#169; &#174; &#8482; &#8240; &#181; &#183; &#8226; &#8230; &#8242; &#8243; &#167; &#182; &#223; &#8249; &#8250; &#171; &#187; &#8216; &#8217; &#8220; &#8221; &#8218; &#8222; &#60; &#62; &#8804; &#8805; &#8211; &#8212; &#175; &#8254; &#164; &#166; &#168; &#161; &#191; &#710; &#732; &#176; &#8722; &#177; &#247; &#8260; &#215; &#185; &#178; &#179; &#188; &#189; &#190; &#402; &#8747; &#8721; &#8734; &#8730; &#8764; &#8773; &#8776; &#8800; &#8801; &#8712; &#8713; &#8715; &#8719; &#8743; &#8744; &#172; &#8745; &#8746; &#8706; &#8704; &#8707; &#8709; &#8711; &#8727; &#8733; &#8736; &#180; &#184; &#170; &#186; &#8224; &#8225; &#192; &#193; &#194; &#195; &#196; &#197; &#198; &#199; &#200; &#201; &#202; &#203; &#204; &#205; &#206; &#207; &#208; &#209; &#210; &#211; &#212; &#213; &#214; &#216; &#338; &#352; &#217; &#218; &#219; &#220; &#221; &#376; &#222; &#224; &#225; &#226; &#227; &#228; &#229; &#230; &#231; &#232; &#233; &#234; &#235; &#236; &#237; &#238; &#239; &#240; &#241; &#242; &#243; &#244; &#245; &#246; &#248; &#339; &#353; &#249; &#250; &#251; &#252; &#253; &#254; &#255; &#913; &#914; &#915; &#916; &#917; &#918; &#919; &#920; &#921; &#922; &#923; &#924; &#925; &#926; &#927; &#928; &#929; &#931; &#932; &#933; &#934; &#935; &#936; &#937; &#945; &#946; &#947; &#948; &#949; &#950; &#951; &#952; &#953; &#954; &#955; &#956; &#957; &#958; &#959; &#960; &#961; &#962; &#963; &#964; &#965; &#966; &#967; &#968; &#969; &#8501; &#982; &#8476; &#977; &#978; &#8472; &#8465; &#8592; &#8593; &#8594; &#8595; &#8596; &#8629; &#8656; &#8657; &#8658; &#8659; &#8660; &#8756; &#8834; &#8835; &#8836; &#8838; &#8839; &#8853; &#8855; &#8869; &#8901; &#8968; &#8969; &#8970; &#8971; &#9001; &#9002; &#9674; &#9824; &#9827; &#9829; &#9830;',
		columns: 15
	};
});
