define([
	"aloha/core",
	"i18n!ui/nls/i18n",
	"ui/component",
	"ui/surface",
	"ui/button",
	"ui/toggleCommandButton"
],
function( Aloha, i18n, Component, Surface, Button, ToggleCommandButton ) {
	/**
	 * Ordered list component
	 * @class
	 * @extends {ToggleCommandButton}
	 */
	Component.define( "orderedList", ToggleCommandButton, {
		/**
		 * Localized label
		 * @type {string}
		 */
		label: i18n.t( "button.ol.label" ),

		/**
		 * Command to execute
		 * @type {string}
		 */
		command: "insertorderedlist",

		/**
		 * Whether or not to show only the icon
		 * @type {boolean}
		 */
		iconOnly: true,

		/**
		 * Which icon to render
		 * @type {string}
		 */
		icon: "aloha-icon aloha-icon-orderedlist"
	});

	/**
	 * Unordered list component
	 * @class
	 * @extends {ToggleCommandButton}
	 */
	Component.define( "unorderedList", ToggleCommandButton, {
		/**
		 * Localized label
		 * @type {string}
		 */
		label: i18n.t( "button.ul.label" ),

		/**
		 * Command to execute
		 * @type {string}
		 */
		command: "insertunorderedlist",

		/**
		 * Whether or not to show only the icon
		 * @type {boolean}
		 */
		iconOnly: true,

		/**
		 * Which icon to render
		 * @type {string}
		 */
		icon: "aloha-icon aloha-icon-unorderedlist"
	});

	/**
	 * Determines whether the current selection is inside a list
	 * @return {boolean}
	 */
	function inList() {
		return Aloha.queryCommandState( "insertorderedlist" ) ||
			Aloha.queryCommandState( "insertunorderedlist" );
	}

	/**
	 * Indent list component
	 * @class
	 * @extends {Button}
	 */
	Component.define( "indentList", Button, {
		/**
		 * Localized label
		 * @type {string}
		 */
		label: i18n.t( "button.indent.label" ),

		/**
		 * Whether or not to show only the icon
		 * @type {boolean}
		 */
		iconOnly: true,

		/**
		 * Which icon to render
		 * @type {string}
		 */
		icon: "aloha-icon aloha-icon-indent",

		/**
		 * Click callback
		 * @override
		 */
		click: function() {
			Aloha.execCommand( "indent", null, false, Surface.range );
		},

		/**
		 * Selection change callback
		 * @override
		 */
		selectionChange: function() {
			if ( inList() ) {
				this.show();
			} else {
				this.hide();
			}
		}
	});

	/**
	 * Outdent list component
	 * @class
	 * @extends {Button}
	 */
	Component.define( "outdentList", Button, {
		/**
		 * Localized label
		 * @type {string}
		 */
		label: i18n.t( "button.outdent.label" ),

		/**
		 * Whether or not to show only the icon
		 * @type {boolean}
		 */
		iconOnly: true,

		/**
		 * Which icon to render
		 * @type {string}
		 */
		icon: "aloha-icon aloha-icon-outdent",

		/**
		 * Click callback
		 * @override
		 */
		click: function() {
			Aloha.execCommand( "outdent", null, false, Surface.range );
		},

		/**
		 * Selection change callback
		 * @override
		 */
		selectionChange: function() {
			if ( inList() ) {
				this.show();
			} else {
				this.hide();
			}
		}
	});

	Aloha.Markup.addKeyHandler( 9, function( event ) {
		if ( inList() ) {
			Aloha.execCommand( event.shiftKey ? "outdent" : "indent" );
		}
	});
});
