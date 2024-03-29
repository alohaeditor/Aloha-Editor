define([
	'ui/button'
], function (
	Button
) {
	'use strict';

	var CLASS_ACTIVE = 'active';

	/**
	 * ToggleButton control. Extends the Button component type to provide an
	 * easy way to create buttons that can transition between "active" and
	 * "inactive" states.
	 *
	 * @class
	 * @name ToggleButton
	 * @extends {Button}
	 */
	var ToggleButton = Button.extend({
		type: 'toggle-button',

		/** @type {boolean} If this button is currently active. */
		active: false,

		/** @type {boolean} When clicked, if it should *not* toggle it's `active` state. */
		pure: false,

		init: function() {
			this._super();

			this._$buttonElement.addClass('toggle-button');

			this._handleActiveState();
		},

		/**
		 * Sets the state of the toggleButton and updates its visual display
		 * accordingly.
		 *
		 * @param {boolean} toggled Whether the button is to be set to the
		 *                          "toggled/checked" state.
		 * @deprecated use `setValue` instead.
		 */
		setState: function (toggled) {
			console.debug('[Deprecation] Call to ToggleButton.setState: Use "ToggleButton.setActive()" instead.');
			this.setValue(toggled);
		},

		/** @deprecated use `getValue` instead. */
		getState: function () {
			console.debug('[Deprecation] Call to ToggleButton.getState: Use "ToggleButton.active" instead.');
			return this.active;
		},

		_onClick: function () {
			this.touch();
			var switched = !this.active;
			if (!this.pure) {
				this.toggleActivation();
			}
			this.triggerChangeNotification();
			this.click();
			this.onToggle(switched);
		},
		_handleActiveState: function() {
			if (this.active) {
				this._$buttonElement.addClass(CLASS_ACTIVE);
			} else {
				this._$buttonElement.removeClass(CLASS_ACTIVE);
			}
		},

		onToggle: function (isActive) { },
		
		setActive: function(active) {
			this.active = active;
			this._handleActiveState();
		},
		setPure: function(pure) {
			this.pure = pure;
		},
		toggleActivation: function () {
			this.setActive(!this.active);
		},
        activate: function () {
			this.setActive(true);
        },
        deactivate: function () {
            this.setActive(false);
        },

		setValue: function(value) {
			this.setActive(value);		
		},
		getValue: function() {
			return this.active;
		}
	});

	return ToggleButton;
});
