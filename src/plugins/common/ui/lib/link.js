define([
	"aloha/core",
	"aloha/jquery",
	"i18n!ui/nls/i18n", 
	"browser/browser-plugin",
	"ui/component",
	"ui/surface",
	"ui/autocomplete",
	"ui/button",
	"ui/toggleButton",
	"ui/ui",
	// TODO: remove (just for testing)
	'ui/../../link/extra/linklist'
],
function( Aloha, jQuery, i18n, Browser, Component, Surface, Autocomplete, Button, ToggleButton, Ui ) {
	Component.define( "link", ToggleButton, {
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

	Component.define( "editLink", Autocomplete, {
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

	Component.define( "removeLink", Button, {
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

	Component.define( "linkBrowser", Button, {
		label: "...",

		init: function() {
			this._super();
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

	Component.define( "linkPanel", Component, {
		init: function() {
			this.element = jQuery( "<div></div>" );
			this.createTargetFieldset();
			this.createTitleFieldset();
		},

		createTargetFieldset: function() {
			var frameName,
				that = this;

			this.targetFieldset = jQuery(
				"<fieldset><legend>Target</legend></fieldset>"
			)
			.appendTo( this.element )
			.delegate( "[type=radio]", "change", function( event ) {
				if ( this.value === "framename" ) {
					frameName.slideDown();
				} else {
					frameName
						.slideUp()
						.find( "input" )
							.val( "" );
					findAnchor( Surface.range ).target = this.value;
				}
			});

			jQuery.each( [ "Self", "Blank", "Parent", "Top" ], function() {
				that.createTarget( "_" + this.toLowerCase(), this );
			});

			this.createTarget( "framename", "Framename" );
			frameName = jQuery( "<div><input></div>" )
				.appendTo( this.targetFieldset )
				.hide()
				.bind( "keyup", function() {
					findAnchor( Surface.range ).target = event.target.value;
				});
		},

		createTarget: function( value, label ) {
			return jQuery(
				"<div>" +
					"<input type='radio' name='targetGroup' value='" + value + "'>" +
					"<span>" + label + "</span>" +
				"</div>"
			).appendTo( this.targetFieldset );
		},

		createTitleFieldset: function() {
			jQuery(
				"<fieldset>" +
					"<legend>Title</legend>" +
					"<div><input></div>" +
				"</fieldset>"
			)
			.appendTo( this.element )
			.bind( "keyup", function( event ) {
				findAnchor( Surface.range ).title = event.target.value;
			});
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
