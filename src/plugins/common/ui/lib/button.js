/**
 * NOTES:
 *    - Why do we maintain 2 references to the DOM element for a button
 *    component (this.element = this.buttonElement)?
 */

define([
	'aloha/jquery',
	'ui/component',
	'aloha/jquery-ui'
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
				    label: this.text ? this.text : this.tooltip,
   				    text: !!this.text,
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
					this._onClick();
				}, this ) );
		},

		/**
		 * May be overridden by component subclasses to implement component-specific behaviour.
		 * The default implementation just calls the public click method.
		 *
		 * @protected
		 */
		_onClick: function() {
			this.click();
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
		},

		/**
		 * Shows the button in a greyed-out inactive (unclickable) state.
		 */
		disable: function() {
			// TODO
		},

		/**
		 * Enables the button again after it has previously been disabled.
		 */
		enable: function() {
			// TODO
		}
	});

	return Button;
});
