define([
	"i18n!ui/nls/i18n",
	"ui/component",
	"ui/surface",
	"ui/button"
],
function( i18n, Component, Surface, Button ) {
	/**
	 * Horizontal rule component
	 * @class
	 * @extends {Button}
	 */
	Component.define( "horizontalRule", Button, {
		/**
		 * Localized label
		 * @type {string}
		 */
		label: i18n.t( "button.horizontalRule.label" ),

		/**
		 * Whether or not to show only the icon
		 * @type {boolean}
		 */
		iconOnly: true,

		/**
		 * Which icon to render
		 * @type {string}
		 */
		icon: "aloha-icon aloha-icon-horizontal-rule",

		/**
		 * Click callback
		 * @override
		 */
		click: function() {
			Aloha.execCommand( "inserthorizontalrule", null, false, Surface.range );
		}
	});
});
