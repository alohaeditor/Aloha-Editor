define([
	"aloha/jquery",
	"ui/component"
],
function( jQuery, Component ) {
	/**
	 * Pipe component
	 * @class
	 * @extends {Component}
	 */
	Component.define( "pipe", Component, {
		/**
		 * Initializes the pipe component
		 * @override
		 */
		init: function() {
			this._super();
			this.element = jQuery( "<span>&nbsp;|&nbsp;</span>" );
		}
	});
});
