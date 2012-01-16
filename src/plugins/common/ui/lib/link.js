define([
	"aloha/core",
	"aloha/jquery",
	"i18n!ui/nls/i18n", 
	"browser/browser-plugin",
	"ui/ui",
	"ui/surface",
	"ui/autocomplete",
	"ui/button",
	"ui/toggleButton",
	// TODO: remove (just for testing)
	'ui/../../link/extra/linklist'
],
function( Aloha, jQuery, i18n, Browser, Ui, Surface ) {
	Ui.create( "link", "toggleButton", {
		label: i18n.t( "button.createLink.label" ),
		icon: "aloha-icon aloha-icon-link",
		iconOnly: true,
		
		click: function() {
			var state = Aloha.queryCommandValue( "createLink", Surface.range );
			if ( state ) {
				Aloha.execCommand( "unlink", false, null, Surface.range );
			} else {
				Aloha.execCommand( "createLink", false, "http://example.com", Surface.range );
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
				this.hide();
			}
		},
		
		setValue: function( href, item ) {
			Ui.util.createLink( item || href, Surface.range );
		}
	});
	
	Ui.create( "removeLink", "button", {
		label: i18n.t( "button.removeLink.label" ),
		icon: "aloha-icon aloha-icon-unlink",
		iconOnly: true,
		
		click: function() {
			Aloha.execCommand( "unlink", false, null, Surface.range );
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
					Ui.util.createLink( item, Surface.range );
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
	
	function findAnchor( range ) {
		return Ui.util.findElemFromRange( "a", range );
	}
	
	Ui.util.createLink = function( item, range ) {
		var href,
			anchor = findAnchor( range );
		
		if ( item.url ) {
			href = item.url;
		} else {
			href = item;
			item = null;
		}
		
		Aloha.execCommand( href ? "createLink" : "unlink", false, href, range );
		Aloha.RepositoryManager.markObject( anchor, item );
		jQuery( anchor ).attr( "data-name", item ? item.name : null );
	};
});
