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
	/**
	 * Abbreviation component
	 * @class
	 * @extends {ToggleButton}
	 */
	Component.define( "abbr", ToggleButton, {
		/**
		 * Localized label
		 * @type {string}
		 */
		label: i18n.t( "button.createAbbr.label" ),

		/**
		 * Whether or not to show only the icon
		 * @type {boolean}
		 */
		iconOnly: true,

		/**
		 * Which icon to render
		 * @type {string}
		 */
		icon: "aloha-icon aloha-icon-abbr",

		/**
		 * Click callback
		 * @override
		 */
		click: function() {
			var abbr = findAbbr( Surface.range );
			if ( abbr ) {
				Ui.util.removeAbbr( Surface.range );
			} else {
				Ui.util.createAbbr( "", Surface.range );
			}
		},

		/**
		 * Selection change callback
		 * @override
		 */
		selectionChange: function() {
			var abbr = findAbbr();
			this.setState( !!abbr );
		}
	});

	/**
	 * Edit abbreviation component
	 * @class
	 * @extends {Text}
	 */
	Component.define( "editAbbr", Text, {
		/**
		 * Selection change callback
		 * @override
		 */
		selectionChange: function() {
			var abbr = findAbbr();
			if ( abbr ) {
				this.show();
				this.element.val( abbr ? abbr.title : null );
			} else {
				this.hide();
			}
		},

		/**
		 * Sets the value of the abbreviation
		 * @param {string} value
		 * @override
		 */
		setValue: function( value ) {
			if ( value ) {
				findAbbr( Surface.range ).title = value;
			} else {
				Ui.util.removeAbbr( Surface.range );
			}
		}
	});

	/**
	 * Gets the normalize range
	 * @param {Aloha.Selection} range
	 * @return {RangeObject}
	 */
	function getRange( range ) {
		return new GENTICS.Utils.RangeObject(
			range || Aloha.getSelection().getRangeAt( 0 ) );
	}

	/**
	 * Finds an abbreviation from a range
	 * @param {Aloha.Selection} range
	 * @return {(DOMElement|null)}
	 */
	function findAbbr( range ) {
		return Ui.util.findElemFromRange( "abbr", range );
	}

	/**
	 * Creates an abbreviation in a range
	 * @param {string} title
	 * @param {Aloha.Selection} range
	 */
	Ui.util.createAbbr = function( title, range ) {
		GENTICS.Utils.Dom.addMarkup( getRange( range ),
			jQuery( "<abbr>", { title: title } ), false );
	};

	/**
	 * Removes an abbreviation from a range
	 * @param {Aloha.Selection} range
	 */
	Ui.util.removeAbbr = function( range ) {
		GENTICS.Utils.Dom.removeFromDOM( findAbbr( range ), getRange( range ), true );
	};
});
