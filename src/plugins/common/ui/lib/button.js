/**
 * NOTES:
 *    - Why do we maintain 2 references to the DOM element for a button
 *    component (this.element = this.buttonElement)?
 */

define([
	'aloha/jquery',
	'ui/component'
],
function( jQuery, Component ) {
	'use strict';

	/**
	 * Implements a simple button component.  All interactive UI controls (that
	 * is--anything that is not a label) will most probably extend the Button
	 * component.
	 *
	 * Buttons have no state, they only respond to click events.
	 *
	 * @class
	 * @name Button
	 * @extends {Component}
	 */
	var Button = Component.extend({

		/**
		 * Initializes this button instance.
		 * The initialization is done when the component is rendered, not when
		 * it is created.  This is necessary to allow multiple renderings of
		 * the same component.  For example, you may want a component to be in
		 * the toolbar and in the sidebar.
		 *
		 * @override
		 */
		init: function() {
			this._super();
			this.createButtonElement()
				.button({
					label: this.label,
					text: !this.iconOnly,
					icons: {
						primary: this.icon
					}
				})
				.button( 'widget' )
					.tooltip({
						position: {
							my: 'left top',
							at: 'right bottom'
						}
					})
					.click( jQuery.proxy(function() {
						this.click();
					}, this ) );
		},

		/**
		 * Handles mouse clicks on this button's rendered elements.
		 */
		click: function() {},

		/**
		 * Creates the DOM element to be rendered for user interaction.
		 *
		 * @return {jQuery<HTMLElement>}
		 */
		createButtonElement: function() {
			this.element = this.buttonElement = jQuery( '<button>' );
			return this.buttonElement;
		}

	});

	return Button;
});
