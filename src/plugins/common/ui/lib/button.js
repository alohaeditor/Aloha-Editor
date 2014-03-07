/**
 * NOTES:
 *    - Why do we maintain 2 references to the DOM element for a button
 *    component (this.element = this.buttonElement)?
 */

define([
	'jquery',
	'ui/component',
	'ui/utils',
	'jqueryui'
],
function (jQuery, Component, Utils) {
	'use strict';

	/**
	 * Implements a simple button component.  All interactive UI controls (that
	 * is--anything that is not a label) will most probably extend the Button
	 * component.
	 *
	 * An extending class should optionally define the following properties
	 * tooltip - the internationalized tooltip text,
	 * icon    - the icon class,
	 * class   - an additional class to add to the button element,
	 * click   - the click handler for the button.
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
		init: function () {
			this._super();
			this.createButtonElement();
			Utils.makeButton(this.buttonElement, this)
				.button('widget')
				.tooltip({
					tooltipClass: 'aloha aloha-ui-tooltip',
					position: {
						my: 'left top',
						at: 'right bottom'
					}
				})
				.zIndex(0)    // fix for IE7,8 so the icon shown disabled
				.click(jQuery.proxy(function () {

					// Ensure tooltips are always hidden after a button
					// is clicked because sometimes the tooltip doesn't
					// get closed automatically, for example after table
					// cells are merged or split.
					// IE needs the force argument to be true, Chrome doesn't.
					// The event argument can be ignored.
					this.closeTooltip();

					this._onClick();
				}, this));
		},

		closeTooltip: function () {
			// 'close', /*event*/, /*force*/
			this.buttonElement.tooltip('close', null, true);
		},

		/**
		 * May be overridden by component subclasses to implement
		 * component-specific behaviour.  The default implementation just calls
		 * the public click method.
		 *
		 * @protected
		 */
		_onClick: function () {
			this.click();
		},

		/**
		 * Handles mouse clicks on this button's rendered elements.
		 */
		click: function () {},

		/**
		 * Creates the DOM element to be rendered for user interaction.
		 *
		 * @return {jQuery<HTMLElement>}
		 */
		createButtonElement: function () {
			var button = Utils.makeButtonElement();

			if (this['class']) {
				button.addClass(this['class']);
			}
			this.element = this.buttonElement = button;

			var that = this;
			button.bind('mouseleave', function () {
				that.closeTooltip();
			});

			return button;
		},

		/**
		 * Shows the button in a greyed-out inactive (unclickable) state.
		 */
		disable: function () {
			this.element.button('option', 'disabled', false);
		},

		/**
		 * Enables the button again after it has previously been disabled.
		 */
		enable: function (enable_opt) {
			this.element.button('option', 'disabled', enable_opt === false);
		}
	});

	return Button;
});
