define([
	"aloha/core",
	"aloha/jquery",
	"i18n!ui/nls/i18n",
	"ui/component",
	"ui/surface",
	"ui/multiSplit"
],
function( Aloha, jQuery, i18n, Component, Surface, MultiSplit ) {
	/**
	 * Default settings for format block components
	 * @type {object}
	 */
	Aloha.settings.formatBlock = {
		blocks: [ "p", "h1", "h2", "h3", "h4", "h5", "h6", "pre" ],
		removeFormatting: [ "strong", "em", "b", "i", "cite", "q", "code", "abbr", "del", "sub", "sup" ]
	};

	/**
	 * Format block component
	 * @class
	 * @extends {MultiSplit}
	 */
	var FormatBlock = Component.define( "formatBlock", MultiSplit, {
		/**
		 * Gets the buttons for the multi split menu
		 * @returns {Array.<Object>}
		 */
		getButtons: function() {
			return jQuery.map( this.editable.settings.formatBlock.blocks, function( item ) {
				return FormatBlock._buttons[ item ];
			});
		},

		/**
		 * Gets the items for bottom of the multi split menu
		 * @returns {Array.<Object>}
		 */
		getItems: function() {
			var formatBlock = this;
			return [{
				label: i18n.t( "button.removeFormatting.label" ),
				click: function() {
					formatBlock.removeFormatting( Surface.range, this.editable );
				}
			}];
		},

		/**
		 * Removes formatting form a range
		 * @param {Aloha.Selection} range
		 * @param {Aloha.Editable} editable
		 */
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

	/**
	 * Settings for all format block buttons
	 * @type {Array.<Object>}
	 */
	FormatBlock._buttons = {};
	jQuery.each( Aloha.settings.formatBlock.blocks, function( i, block ) {
		FormatBlock._buttons[ block ] = {
			label: i18n.t( "button." + block + ".label" ),
			icon: "aloha-large-icon-" + block,
			click: function() {
				Aloha.execCommand( "formatBlock", false, block, Surface.range );
			},
			isActive: function() {
				return Aloha.queryCommandValue( "formatBlock" ) === block;
			}
		};
	});
});
