define([
	'jquery',
	'ui/component',
	'ui/utils',
	'jqueryui'
], function (
	$,
	Component,
	Utils
) {
	'use strict';

	/**
	 * Implements a simple button component.  All interactive UI controls (that
	 * is--anything that is not a label) will most probably extend the Button
	 * component.
	 *
	 * An extending class should optionally define the following properties
	 * tooltip - the internationalized tooltip text,
	 * icon    - the icon class,
	 * text	   - the text to display in the button (usually empty)
	 * iconOnly - If it should only render the icon (default: true)
	 * click   - the click handler for the button.
	 *
	 * @class
	 * @name Button
	 * @extends {Component}
	 */
	var Button = Component.extend({
		type: 'button',

		/** @type {string=} Text in the button. */
		text: '',
		/** @type {(string)=} The icon (CSS-Class) to use for this button. */
		icon: '',
		/** @type {string=} The tooltip text/content to display when the button is hovered over. */
		tooltip: '',
		/** @type {boolean} If it should only show the icon. */
		iconOnly: true,

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
			this.createButtonElement();
			this._$buttonElement
				// fix for IE7,8 so the icon shown disabled
				.click($.proxy(function () {

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
		createButtonElement: function () {
			this._$iconElement = $('<i>', {
				class: 'aloha-button-icon material-symbols-outlined',
				text: this.icon,
			});

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
	});

	return Button;
});
