define([
	"aloha/core",
	"ui/ui",
	"i18n!ui/nls/i18n", 
	"aloha/jquery",
	"ui/autocomplete",
	"ui/toggleButton",
	// TODO: remove (just for testing)
	'ui/../../link/extra/linklist'
],
function( Aloha, Ui, i18n, jQuery ) {
	Ui.create( "link", "toggleButton", {
		label: i18n.t( "button.createLink.label" ),
		icon: "aloha-icon aloha-icon-link",
		iconOnly: true,
		
		click: function() {
			var state = Aloha.queryCommandValue( "createLink", Ui.toolbar.range );
			if ( state ) {
				Aloha.execCommand( "unlink", false, null, Ui.toolbar.range );
			} else {
				Aloha.execCommand( "createLink", false, "http://example.com", Ui.toolbar.range );
			}
		},
		
		selectionChange: function() {
			var value = Aloha.queryCommandValue( "createLink" );
			this.setState( !!value );
		}
	});
	
	Ui.create( "editLink", "autocomplete", {
		itemTemplate: "{{name}}<br>{{url}}",
		
		selectionChange: function() {
			var value = Aloha.queryCommandValue( "createLink" );
			if ( value ) {
				this.show();
				value = jQuery( findAnchor() ).attr( "data-name" ) || value;
				this.element.val( value );
			} else {
				// this needs to be commented out to actually be able to use
				// the component (see comment in setValue about range management)
				this.hide();
			}
		},
		
		setValue: function( value, item ) {
			var anchor = findAnchor( Ui.toolbar.range ),
				href = item ? item.url : value;
			Aloha.execCommand( "createLink", false, href, Ui.toolbar.range );
			Aloha.RepositoryManager.markObject( anchor, item );
			jQuery( anchor ).attr( "data-name", item ? item.name : null ); 
		}
	});
	
	function findAnchor( range ) {
		range = range || Aloha.getSelection().getRangeAt( 0 );
		range = new GENTICS.Utils.RangeObject( range );
		return range.findMarkup(function () {
			return this.nodeName.toLowerCase() == 'a';
		});
	}
	
	// TODO: figure out how to load this properly (in ui-plugin.js)
	/*
	 * jQuery UI Autocomplete HTML Extension
	 *
	 * Copyright 2010, Scott González (http://scottgonzalez.com)
	 * Dual licensed under the MIT or GPL Version 2 licenses.
	 *
	 * http://github.com/scottgonzalez/jquery-ui-extensions
	 */
	(function( $ ) {

	var proto = $.ui.autocomplete.prototype,
		initSource = proto._initSource;

	function filter( array, term ) {
		var matcher = new RegExp( $.ui.autocomplete.escapeRegex(term), "i" );
		return $.grep( array, function(value) {
			return matcher.test( $( "<div>" ).html( value.label || value.value || value ).text() );
		});
	}

	$.extend( proto, {
		_initSource: function() {
			if ( this.options.html && $.isArray(this.options.source) ) {
				this.source = function( request, response ) {
					response( filter( this.options.source, request.term ) );
				};
			} else {
				initSource.call( this );
			}
		},

		_renderItem: function( ul, item) {
			return $( "<li></li>" )
				.data( "item.autocomplete", item )
				.append( $( "<a></a>" )[ this.options.html ? "html" : "text" ]( item.label ) )
				.appendTo( ul );
		}
	});

	})( jQuery );
});
