/** @typedef {import('./component').Component} Component */

/**
 * @typedef {object} ButtonProperties
 * @property {'button'} type
 * @property {string=} text Text in the button
 * @property {string=} tooltip The tooltip text/content to display when the button is hovered over
 * @property {string=} icon The icon (CSS-Class) to use for this button.
 * @property {boolean} iconOnly If it should only show the icon.
 * @property {boolean} iconHollow If the icon should be displayed hollow (Fill off, see Material Symbols).
 * 
 * @property {function(): void} click Function to be called when the button is being clicked.
 * 
 * @property {function(string): void} setIcon Updates the `icon` of the instance
 * @property {function(boolean): void} setIconOnly Updates the `iconOnly` of the instance
 * @property {function(boolean): void} setIconHollow Updates the `iconHollow` of the instance
 * @property {function(string): void} setText Updates the `text` of the instance
 * @property {function(string): void} setTooltip Updates the `tooltip` of the instance
 */

/**
 * Implements a simple button component.
 * All interactive UI controls (that is, anything that is not a label),
 * will most probably extend the Button component.
 * @typedef {Component & ButtonProperties} Button
 */

define([
	'jquery',
	'ui/component',
	'jqueryui'
], function (
	$,
	Component
) {
	'use strict';

	/** @type {Button} */
	var Button = Component.extend(/** @type {Button} */ ({
		type: 'button',

		text: '',
		tooltip: '',
		icon: '',
		iconOnly: true,
		iconHollow: false,

		// Internals

		/**
		 * The reference to the button. Usually the same as `element`, but button extensions might
		 * wrap the button in an additional container.
		 */
		_$buttonElement: null,

		/** The reference to the icon element. */
		_$iconElement: null,

		/** The reference to the text element. */
		_$textElement: null,

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
			this._createButtonElement();
			var instance = this;

			this._$buttonElement
				.click(function () {
					// Ensure tooltips are always hidden after a button
					// is clicked because sometimes the tooltip doesn't
					// get closed automatically, for example after table
					// cells are merged or split.
					// IE needs the force argument to be true, Chrome doesn't.
					// The event argument can be ignored.
					instance.closeTooltip();

					instance._onClick();
				});
		},

		closeTooltip: function () {
			// 'close', /*event*/, /*force*/
			this._$buttonElement.tooltip('close', null, true);
		},

		/**
		 * May be overridden by component subclasses to implement
		 * component-specific behaviour.  The default implementation just calls
		 * the public click method.
		 *
		 * @protected
		 */
		_onClick: function () {
			this.touch();
			this.click();
		},

		/**
		 * Handles mouse clicks on this button's rendered elements.
		 */
		click: function () {},

		/**
		 * Creates the DOM element to be rendered for user interaction.
		 *
		 * @return {$<HTMLElement>}
		 */
		_createButtonElement: function () {
			this._$iconElement = $('<i>', {
				class: 'aloha-button-icon material-symbols-outlined',
				text: this.icon,
			});
			if (this.iconHollow) {
				this._$iconElement.addClass('hollow');
			}

			this._$textElement = $('<span>', {
				class: 'aloha-button-text',
				text: this.text,
			});

			var button = $('<button>', {
				class: 'aloha-button ui-widget',
				attr: {
					type: 'button',
					role: 'button',
				},
			})
				.append(this._$iconElement, this._$textElement)
				.tooltip({
					tooltipClass: 'aloha aloha-ui-tooltip',
					position: {
						my: 'left top',
						at: 'right bottom'
					}
				});

			if (!this.icon) {
				this._$iconElement.hide();
			}
			if (this.iconOnly) {
				button.addClass('icon-only');
			}

			this.element = this._$buttonElement = button;

			var that = this;
			button.on('mouseleave', function () {
				that.closeTooltip();
			});

			return button;
		},

		setIcon: function(icon) {
			this.icon = icon;

			this._$iconElement.text(icon);
			if (this.icon) {
				this._$iconElement.show();
			} else {
				this._$iconElement.hide();
			}
		},

		setIconOnly: function(iconOnly) {
			this.iconOnly = iconOnly;

			if (iconOnly) {
				this._$buttonElement.addClass('icon-only');
			} else {
				this._$buttonElement.removeClass('icon-only');
			}
		},
		setIconHollow: function(hollow) {
			this.iconHollow = hollow;

			if (hollow) {
				this._$iconElement.addClass('hollow');
			} else {
				this._$iconElement.removeClass('hollow');
			}
		},

		setText: function(text) {
			this.text = text;

			this._$textElement.text(text);
		},

		setTooltip: function(tooltip) {
			this.tooltip = tooltip;

			// Update the icon in the create button instance
			if (this._$buttonElement) {
				this._$buttonElement.tooltip('option', 'content', tooltip);
			}
		},

		/**
		 * Shows the button in a greyed-out inactive (unclickable) state.
		 */
		disable: function () {
			this._super();
			this._$buttonElement.attr('disabled', 'disabled');
		},

		/**
		 * Enables the button again after it has previously been disabled.
		 */
		enable: function () {
			this._super();
			this._$buttonElement.removeAttr('disabled');
		}
	}));

	return Button;
});
