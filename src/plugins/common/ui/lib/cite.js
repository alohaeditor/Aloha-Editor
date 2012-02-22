define([
	"aloha/jquery",
	"i18n!ui/nls/i18n",
	"ui/component",
	"ui/text",
	"ui/surface",
	"ui/toggleButton",
	"ui/ui",
	"ui/paragraph"
],
function( jQuery, i18n, Component, Text, Surface, ToggleButton, Ui ) {
	var citeId = 0;

	/**
	 * Quote component
	 * @class
	 * @extends {ToggleButton}
	 */
	Component.define( "quote", ToggleButton, {
		/**
		 * Localized label
		 * @type {string}
		 */
		label: i18n.t( "button.quote.label" ),

		/**
		 * Whether or not to show only the icon
		 * @type {boolean}
		 */
		iconOnly: true,

		/**
		 * Which icon to render
		 * @type {string}
		 */
		icon: "aloha-icon aloha-icon-quote",

		/**
		 * Click callback
		 * @override
		 */
		click: function() {
			var quote = findQuote( Surface.range ),
				referenceContainer = Ui.util.getReferenceContainer( this.editable );
			if ( quote ) {
				Ui.util.removeQuote( Surface.range, referenceContainer );
			} else {
				Ui.util.createQuote( "", Surface.range, referenceContainer );
			}
		},

		/**
		 * Selection change callback
		 * @override
		 */
		selectionChange: function() {
			var quote = findQuote();
			this.setState( !!quote );
		}
	});

	/**
	 * Edit quote component
	 * @class
	 * @extends {Text}
	 */
	Component.define( "editQuote", Text, {
		/**
		 * Selection change callback
		 * @override
		 */
		selectionChange: function() {
			var quote = findQuote();
			if ( quote ) {
				this.show();
				this.element.val( jQuery( quote ).attr( "cite" ) );
			} else {
				this.hide();
			}
		},

		/**
		 * Sets the value of the citation
		 * @param {string} value
		 * @override
		 */
		setValue: function( value ) {
			if ( value ) {
				Ui.util.updateQuote( findQuote( Surface.range ), value );
			} else {
				Ui.util.removeQuote( Surface.range,
					Ui.util.getReferenceContainer( Surface.active ) );
			}
		}
	});

	/**
	 * Cite details component
	 * @class
	 * @extends {Component}
	 */
	Component.define( "citeDetails", Component, {
		/**
		 * Initializes the cite details panel
		 * @override
		 */
		init: function() {
			this.element = jQuery( "<div>" );

			this.linkElem = jQuery( "<label>Link: <input></label>" )
				.appendTo( this.element )
				.children( "input" )
					.addClass( "aloha-ui-fill" )
					.bind( "keyup", function() {
						var quote = findQuote( Surface.range ) ||
							findBlockquote( Surface.range );
						Ui.util.updateQuote( quote, this.value );
					});

			this.noteElem = jQuery( "<label>Note: <input></label>" )
				.appendTo( this.element )
				.children( "input" )
					.addClass( "aloha-ui-fill" )
					.bind( "keyup", function() {
						var noteText = this.value,
							quote = jQuery(
								findQuote( Surface.range ) ||
								findBlockquote( Surface.range ) ),
							note = findNote( quote );
						note.children( ".aloha-cite-note" ).remove();
						jQuery( "<span>", {
							text: noteText,
							"class": "aloha-cite-note"
						}).appendTo( note );
					});
		},

		/**
		 * Selection change callback
		 * @override
		 */
		selectionChange: function() {
			var quote = findQuote() || findBlockquote();
			if ( quote ) {
				quote = jQuery( quote );
				this.show();
				this.linkElem.val( quote.attr( "cite" ) );
				this.noteElem.val( findNote( quote ).find( ".aloha-cite-note" ).text() );
			} else {
				this.hide();
			}
		}
	});

	/**
	 * Gets the normalized range
	 * @param {Aloha.Selection} range
	 * @return {RangeObject}
	 */
	function getRange( range ) {
		return new GENTICS.Utils.RangeObject(
			range || Aloha.getSelection().getRangeAt( 0 ) );
	}

	/**
	 * Finds a quote from a range
	 * @param {Aloha.Selection} range
	 * @return {(DOMElement|null)}
	 */
	function findQuote( range ) {
		return Ui.util.findElemFromRange( "q", range );
	}

	/**
	 * Finds a blockquote from a range
	 * @param {Aloha.Selection} range
	 * @return {(DOMElement|null)}
	 */
	function findBlockquote( range ) {
		return Ui.util.findElemFromRange( "blockquote", range );
	}

	/**
	 * Finds the note associated with a quote
	 * @param {jQuery} quote The quote element.
	 * @return {jQuery} The associated note.
	 */
	function findNote( quote ) {
		return jQuery( "#cite-note-" + quote.attr( "id" ).replace( /^\D+/, "" ) );
	}

	/**
	 * Creates an inline or block quote
	 * @param {string} nodeName
	 * @param {string} link
	 * @param {Aloha.Selection} range
	 * @param {jQuery} referenceContainer
	 * @todo blockquote needs to expand
	 */
	function createQuote( nodeName, link, range, referenceContainer ) {
		var quote, list,
			id = ++citeId,
			ref = "cite-ref-" + id,
			note = "cite-note-" + id;

		GENTICS.Utils.Dom.addMarkup( getRange( range ),
			jQuery( "<" + nodeName + ">", {
				id: ref,
				cite: link
			}), false );

		if ( referenceContainer ) {
			list = referenceContainer.find( "ol.references" );
			if ( !list.length ) {
				list = jQuery( "<ol>", { "class": "references" } )
					.appendTo( referenceContainer );
			}

			quote = jQuery( "#" + ref );
			jQuery( "<sup><a></a></sup>" )
				.prop( "contentEditable", false )
				.children()
					.attr( "href", "#" + note )
					.text( "[" + (list.children().length + 1) + "]" )
				.end()
				.appendTo( quote );

			jQuery( "<li><a></a></li>" )
				.attr( "id", note )
				.children()
					.attr( "href", "#" + ref )
					.text( "^" )
				.end()
				.appendTo( list );
		}
	}

	/**
	 * Creates an inline quote in a range
	 * @param {string} link
	 * @param {Aloha.Selection} range
	 * @param {jQuery} referenceContainer
	 */
	Ui.util.createQuote = function( link, range, referenceContainer ) {
		createQuote( "q", link, range, referenceContainer );
	};

	/**
	 * Creates a blockquote in a range
	 * @param {string} link
	 * @param {Aloha.Selection} range
	 * @param {jQuery} referenceContainer
	 */
	Ui.util.createBlockquote = function( link, range, referenceContainer ) {
		createQuote( "blockquote", link, range, referenceContainer );
	};

	Ui.util.updateQuote = function( quote, link ) {
		var note = findNote( jQuery( quote ).attr( "cite", link ) );
		note.children( ".aloha-cite-link" ).remove();
		jQuery( "<a>", {
			href: link,
			text: link,
			"class": "aloha-cite-link"
		}).insertAfter( note.children().first() );
	};

	/**
	 * Removes a quote from a range
	 * @param {Aloha.Selection} range
	 * @param {jQuery} referenceContainer
	 */
	Ui.util.removeQuote = function( range, referenceContainer ) {
		var references = referenceContainer.find( "ol.references" ),
			quote = jQuery( findQuote( range ) );
		// remove note
		findNote( quote ).remove();
		// remove note reference
		quote.find( "sup" ).remove();
		// unwrap quote
		GENTICS.Utils.Dom.removeFromDOM( quote[ 0 ], getRange( range ), true );

		// re-order references
		if ( !references.children().length ) {
			references.remove();
		} else {
			references.children().each(function( i ) {
				var index = i + 1,
					id = this.id.replace( /^\D+/, "" );
				jQuery( "#cite-ref-" + id ).find( "sup a" ).text( "[" + index + "]" );
			});
		}
	};

	/**
	 * Gets the reference container for an editable instance.
	 * @param {Aloha.Editable} editable
	 * @return {jQuery} Container element.
	 */
	Ui.util.getReferenceContainer = function( editable ) {
		var container = editable.cite && editable.cite.referenceContainer;
		if ( container === undefined ) {
			container = jQuery( editable.settings.cite.referenceContainer );
			if ( !container.length ) {
				container = null;
			}
			editable.cite = {
				referenceContainer: container
			};
		}
		return container;
	};

	/**
	 * Default settings for cite component
	 */
	Aloha.settings.cite = {
		referenceContainer: null
	};

	/**
	 * Blockquote settings for formatBlock component
	 */
	Component.components.formatBlock._buttons.blockquote = {
		label: i18n.t( "button.blockquote.label" ),
		icon: "aloha-large-icon-blockquote",
		click: function() {
			var quote = findBlockquote( Surface.range ),
				referenceContainer = Ui.util.getReferenceContainer( Surface.active );
			if ( quote ) {
				Ui.util.removeBlockquote( Surface.range, referenceContainer );
			} else {
				Ui.util.createBlockquote( "", Surface.range, referenceContainer );
			}
		},
		isActive: function() {
			return !!findBlockquote( getRange() );
		}
	};
});
