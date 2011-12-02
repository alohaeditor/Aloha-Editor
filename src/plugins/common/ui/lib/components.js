define([ 'aloha/core', 'ui/ui', 'i18n!ui/nls/i18n', 'aloha/jquery' ],
function( Aloha, Ui, i18n, jQuery ) {
	
	// The second part of the bold plugin is the bold component.
	// The bold component is a [toggleCommandButton](toggleCommandButton.html) that ties into the bold command.
	// The button will automatically update its state whenever the selection changes
	// and it will apply or remove the bold styling when the button is clicked.
	// This functionality comes from the toggleButton which knows how to hook into
	// the associated command.
	Aloha.jQuery.each(
		[ "bold", "italic", "strikethrough", "subscript", "superscript", "underline" ],
		function( i, command ) {
			Ui.create( command, "toggleCommandButton", {
				command: command,
				label: i18n.t( "button." + command + ".label" ),
				iconOnly: true,
				icon: "aloha-icon aloha-icon-" + command
			});
		});
	

	Aloha.settings.font = [ "Arial", "Courier", "Georgia" ];
	Ui.create( "fontName", "dropdown", {
		options: function( editable ) {
			return editable.settings.font;
		},
		setValue: function( value ) {
			Aloha.execCommand( "fontName", null, value );
		},
		selectionChange: function() {
			var value = Aloha.queryCommandValue( "fontName" );
			this.element.val( value );
		}
	});
	
	
	Ui.create( "link", "toggleButton", {
		command: "createLink",
		click: function() {
			var state = Aloha.queryCommandValue( "createLink" );
			if ( state ) {
				Aloha.execCommand( "unlink" );
			} else {
				Aloha.execCommand( "createLink", false, "http://example.com" );
			}
		},
		selectionChange: function() {
			var value = Aloha.queryCommandValue("createLink");
			this.setState( !(value == '' || value === null ) );
		}

	});

	
	Ui.create( "editLink", "text", {
		selectionChange: function() {
			var value = Aloha.queryCommandValue( "createLink" );
			if ( value ) {
				this.show();
				this.element.val( value );
			} else {
				// this needs to be commented out to actually be able to use
				// the component (see comment in setValue about range management)
				this.hide();
			}
		},
		setValue: function( value ) {
			Aloha.execCommand( "createLink", false, value );
		}
	});
	
	
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
