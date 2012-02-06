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
	"wai-lang/languages"
],
function( Aloha, jQuery, i18n, Browser, Component, Surface, Autocomplete, Button, ToggleButton, Ui ) {
	/**
	 * Language annotation component
	 * @class
	 * @override {ToggleButton}
	 */
	Component.define( "languageAnnotation", ToggleButton, {
		/**
		 * Localized label
		 * @type {string}
		 */
		label: i18n.t( "button.createLanguageAnnotation.label" ),

		/**
		 * Whether or not to show only the icon
		 * @type {boolean}
		 */
		iconOnly: true,

		/**
		 * Which icon to render
		 * @type {string}
		 */
		icon: "aloha-icon aloha-icon-language-annotation",

		/**
		 * Click callback
		 * @override
		 */
		click: function() {
			var state = findLangElement( Surface.range );
			if ( state ) {
				Ui.util.removeLanguageAnnotation( Surface.range );
			} else {
				Ui.util.createLanguageAnnotation( "", Surface.range );
			}
		},

		/**
		 * Selection change callback
		 * @override
		 */
		selectionChange: function() {
			this.setState( !!findLangElement() );
		}
	});

	/**
	 * Edit language annotation component
	 * @class
	 * @extends {Autocomplete}
	 */
	Component.define( "editLanguageAnnotation", Autocomplete, {
		/**
		 * Template for language items
		 * @type {string}
		 */
		template: "<img src='{{url}}'>{{name}}",

		/**
		 * Selection change callback
		 * @override
		 */
		selectionChange: function() {
			var value,
				elem = findLangElement();
			if ( elem ) {
				this.show();
				elem = jQuery( elem );
				value = elem.attr( "data-name" ) || elem.attr( "lang" );
				this.element.val( value );
			} else {
				this.hide();
			}
		},

		/**
		 * Sets the value of the language annotation
		 * @param {string} lang
		 * @param {Aloha.Repository.Object} item
		 */
		setValue: function( lang, item ) {
			Ui.util.createLanguageAnnotation( item || lang, Surface.range );
		}
	});

	/**
	 * Language browser component
	 * @class
	 * @extends {Button}
	 */
	Component.define( "languageBrowser", Button, {
		/**
		 * Localized label
		 * @type {string}
		 */
		label: "...",

		/**
		 * Initializes the language browser
		 * @override
		 */
		init: function() {
			this._super();
			var that = this;
			this.browser = new Browser({
				repositoryManager: Aloha.RepositoryManager,
				rootPath: Aloha.getPluginUrl( "browser" ) + "/",
				objectTypeFilter: [ "language" ],
				onSelect: function( item ) {
					Ui.util.createLanguageAnnotation( item, Surface.range );
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
			var elem = findLangElement();
			if ( elem ) {
				this.show();
			} else {
				this.hide();
			}
		}
	});

	/**
	 * Finds an element with a language attribute from a range
	 * @param {Aloha.Selection} range
	 * @return {(DOMElement|null)}
	 */
	function findLangElement( range ) {
		return Ui.util.findElemFromRange( "[lang]", range );
	}

	/**
	 * Creates a language annotation in a range
	 * @param {(string|object)} item Language code or repository item
	 * @param {Aloha.Selection} range
	 */
	Ui.util.createLanguageAnnotation = function( item, range ) {
		var lang,
			elem = findLangElement( range );

		if ( item.id ) {
			lang = item.id;
		} else {
			lang = item;
			item = null;
		}

		if ( !elem ) {
			range = new GENTICS.Utils.RangeObject( range );
			if ( range.isCollapsed() ) {
				GENTICS.Utils.Dom.extendToWord( range );
			}

			if ( !range.isCollapsed() ) {
				elem = jQuery( "<span>", { lang: lang } );
				GENTICS.Utils.Dom.addMarkup( range, elem, false );
			}
		} else {
			if ( lang ) {
				jQuery( elem ).attr( "lang", lang );
			} else {
				jQuery( elem ).removeAttr( "lang" );
			}
		}
		Aloha.RepositoryManager.markObject( elem, item );
		jQuery( elem ).attr( "data-name", item ? item.name : null );
	};

	Ui.util.removeLanguageAnnotation = function( range ) {
		var elem = findLangElement( range );
		if ( elem ) {
			range = new GENTICS.Utils.RangeObject( range )
			GENTICS.Utils.Dom.removeFromDOM( elem, range, true );
			range.select();
		}
	};
});
