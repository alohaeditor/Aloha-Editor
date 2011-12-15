define([
	"aloha/core",
	"ui/ui",
	"i18n!ui/nls/i18n", 
	"aloha/jquery",
	"browser/browser-plugin",
	"ui/autocomplete",
	"ui/button",
	"ui/toggleButton",
	// TODO: remove (just for testing)
	'ui/../../link/extra/linklist'
],
function( Aloha, Ui, i18n, jQuery, Browser ) {
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
		template: "{{name}}<br>{{url}}",
		
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
		
		setValue: setValue
	});
	
	Ui.create( "removeLink", "button", {
		label: i18n.t( "button.removeLink.label" ),
		icon: "aloha-icon aloha-icon-unlink",
		iconOnly: true,
		
		click: function() {
			Aloha.execCommand( "unlink", false, null, Ui.toolbar.range );
		},
		
		selectionChange: function() {
			var value = Aloha.queryCommandValue( "createLink" );
			if ( value ) {
				this.show();
			} else {
				this.hide();
			}
		}
	});
	
	Ui.create( "linkBrowser", "button", {
		label: "...",
		
		init: function() {
			var that = this;
			this.browser = new Browser({
				repositoryManager: Aloha.RepositoryManager,
				rootPath: Aloha.getPluginUrl( "browser" ) + "/",
				onSelect: function( item ) {
					setValue( null, item );
					that.browser.close();
				}
			});
		},
		
		click: function(){
			this.browser.show();
		},
		
		selectionChange: function() {
			var value = Aloha.queryCommandValue( "createLink" );
			if ( value ) {
				this.show();
			} else {
				this.hide();
			}
		}
	});
	
	function setValue( value, item ) {
		var anchor = findAnchor( Ui.toolbar.range ),
			href = item ? item.url : value;
		Aloha.execCommand( "createLink", false, href, Ui.toolbar.range );
		Aloha.RepositoryManager.markObject( anchor, item );
		jQuery( anchor ).attr( "data-name", item ? item.name : null );
	}
	
	function findAnchor( range ) {
		range = range || Aloha.getSelection().getRangeAt( 0 );
		range = new GENTICS.Utils.RangeObject( range );
		return range.findMarkup(function () {
			return this.nodeName.toLowerCase() == 'a';
		});
	}
});
