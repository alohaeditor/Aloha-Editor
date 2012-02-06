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
	/**
	 * Link component
	 * @class
	 * @override {ToggleButton}
	 */
	Component.define( "link", ToggleButton, {
		/**
		 * Localized label
		 * @type {string}
		 */
		label: i18n.t( "button.createLink.label" ),

		/**
		 * Whether or not to show only the icon
		 * @type {boolean}
		 */
		iconOnly: true,

		/**
		 * Which icon to render
		 * @type {string}
		 */
		icon: "aloha-icon aloha-icon-link",

		/**
		 * Click callback
		 * @override
		 */
		click: function() {
			var state = Aloha.queryCommandValue( "createLink", Surface.range );
			if ( state ) {
				Aloha.execCommand( "unlink", false, null, Surface.range );
			} else {
				Aloha.execCommand( "createLink", false, "http://example.com", Surface.range );
			}
		},

		/**
		 * Selection change callback
		 * @override
		 */
		selectionChange: function() {
			var value = Aloha.queryCommandValue( "createLink" );
			this.setState( !!value );
		}
	});

	/**
	 * Edit link component
	 * @class
	 * @extends {Autocomplete}
	 */
	Component.define( "editLink", Autocomplete, {
		/**
		 * Template for link items
		 * @type {string}
		 */
		template: "{{name}}<br>{{url}}",

		/**
		 * Selection change callback
		 * @override
		 */
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

		/**
		 * Sets the value of the link
		 * @param {string} href
		 * @param {Aloha.Repository.Object} item
		 */
		setValue: function( href, item ) {
			Ui.util.createLink( item || href, Surface.range );
		}
	});

	/**
	 * Remove link component
	 * @class
	 * @extends {Button}
	 */
	Component.define( "removeLink", Button, {
		/**
		 * Localized label
		 * @type {string}
		 */
		label: i18n.t( "button.removeLink.label" ),

		/**
		 * Whether or not to show only the icon
		 * @type {boolean}
		 */
		iconOnly: true,

		/**
		 * Which icon to render
		 * @type {string}
		 */
		icon: "aloha-icon aloha-icon-unlink",

		/**
		 * Click callback
		 * @override
		 */
		click: function() {
			Aloha.execCommand( "unlink", false, null, Surface.range );
		},

		/**
		 * Selection change callback
		 * @override
		 */
		selectionChange: function() {
			var value = Aloha.queryCommandValue( "createLink" );
			if ( value ) {
				this.show();
			} else {
				this.hide();
			}
		}
	});

	/**
	 * Link browser component
	 * @class
	 * @extends {Button}
	 */
	Component.define( "linkBrowser", Button, {
		/**
		 * Localized label
		 * @type {string}
		 */
		label: "...",

		/**
		 * Initializes the link browser
		 * @override
		 */
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

		/**
		 * Click callback
		 * @override
		 */
		click: function(){
			this.browser.show();
		},

		/**
		 * Selection change callback
		 * @override
		 */
		selectionChange: function() {
			var value = Aloha.queryCommandValue( "createLink" );
			if ( value ) {
				this.show();
			} else {
				this.hide();
			}
		}
	});

	/**
	 * Link panel component
	 * @class
	 * @extends {Component}
	 */
	Component.define( "linkPanel", Component, {
		/**
		 * Initializes the link panel
		 * @override
		 */
		init: function() {
			this.element = jQuery( "<div></div>" );
			this.createTargetFieldset();
			this.createTitleFieldset();
		},

		/**
		 * Selection change callback
		 * @override
		 */
		selectionChange: function() {
			var target, foundTarget,
				anchor = findAnchor();

			if ( !anchor ) {
				this.hide();
				return;
			}

			this.show();
			target = anchor.target || "_self";
			foundTarget = this.targetFieldset
				.find( "[type=radio]" )
				.filter(function() {
					return this.value === target;
				})
				.prop( "checked", true )
				.length;
			if ( !foundTarget ) {
				this.targetFieldset.find( "[type=radio][value=framename]" )
					.prop( "checked", true );
				this.frameName
					.slideDown()
					.find( "input" )
						.val( anchor.target );
			} else {
				this.frameName.slideUp();
			}

			this.titleFieldset.find( "input" ).val( anchor.title || "" );
		},

		/**
		 * Creates the fieldset for the link target
		 */
		createTargetFieldset: function() {
			var that = this;

			this.targetFieldset = jQuery(
				"<fieldset><legend>Target</legend></fieldset>"
			)
			.appendTo( this.element )
			.delegate( "[type=radio]", "change", function( event ) {
				if ( this.value === "framename" ) {
					that.frameName.slideDown();
				} else {
					that.frameName
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
			this.frameName = jQuery( "<div><input></div>" )
				.appendTo( this.targetFieldset )
				.hide()
				.bind( "keyup", function() {
					findAnchor( Surface.range ).target = event.target.value;
				});
		},

		/**
		 * Creates a link target option
		 * @param {string} value
		 * @param {string} label
		 * @returns {jQuery}
		 */
		createTarget: function( value, label ) {
			return jQuery(
				"<div>" +
					"<input type='radio' name='targetGroup' value='" + value + "'>" +
					"<span>" + label + "</span>" +
				"</div>"
			).appendTo( this.targetFieldset );
		},

		/**
		 * Creates the fieldset for the title
		 */
		createTitleFieldset: function() {
			this.titleFieldset = jQuery(
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

	/**
	 * Finds an anchor from a range
	 * @param {Aloha.Selection} range
	 * @return {(DOMElement|null)}
	 */
	function findAnchor( range ) {
		return Ui.util.findElemFromRange( "a", range );
	}

	/**
	 * Creates an anchor in a range
	 * @param {(string|object)} item URL or repository item
	 * @param {Aloha.Selection} range
	 */
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
