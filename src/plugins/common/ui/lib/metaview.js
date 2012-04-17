define([
	"i18n!ui/nls/i18n",
	"ui/component",
	"ui/surface",
	"ui/toggleButton"
],
function( i18n, Component, Surface, ToggleButton ) {
	/**
	 * Metaview component
	 * @class
	 * @extends {ToggleButton}
	 */
	Component.define( "metaview", ToggleButton, {
		/**
		 * Localized label
		 * @type {string}
		 */
		label: i18n.t( "button.metaview.label" ),

		/**
		 * Whether or not to show only the icon
		 * @type {boolean}
		 */
		iconOnly: true,

		/**
		 * Which icon to render
		 * @type {string}
		 */
		icon: "aloha-icon aloha-icon-metaview",

		/**
		 * Sets the state of the button
		 * @param {boolean} on
		 * @override
		 */
		setState: function( on ) {
			Surface.active.obj.toggleClass( "aloha-metaview", on );
		},

		/**
		 * Click callback
		 * @override
		 */
		click: function() {
			this.setState( !this.buttonElement.prop( "checked" ) );
		}
	});
});
