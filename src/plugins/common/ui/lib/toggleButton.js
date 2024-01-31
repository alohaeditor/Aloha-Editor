define([
	'ui/button'
], function (
	Button
) {
	'use strict';

	var CLASS_ACTIVE = 'aloha-button-active';

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

		active: false,

		init: function() {
			this._super();

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
			console.debug('[Deprecation] Call to ToggleButton.setState: Use "ToggleButton.setValue" instead.');
			this.setValue(toggled);
		},

		/** @deprecated use `getValue` instead. */
		getState: function () {
			console.debug('[Deprecation] Call to ToggleButton.getState: Use "ToggleButton.getValue" instead.');
			return this.active;
		},

		_onClick: function () {
			this.touch();
			this.toggleActivation();
			this.triggerChangeNotification();
			this.click();
			this.onToggle(this.active);
		},
		_handleActiveState: function() {
			if (this.active) {
				this.buttonElement.addClass(CLASS_ACTIVE);
			} else {
				this.buttonElement.removeClass(CLASS_ACTIVE);
			}
		},

		onToggle: function (isActive) { },

        toggleActivation: function () {
            if (!this.active) {
                this.activate();
            } else {
                this.deactivate();
            }
        },

        activate: function () {
            this.active = true;
            this._handleActiveState();
        },

        deactivate: function () {
            this.active = false;
            this._handleActiveState();
        },

		setValue: function(value) {
			this.active = value;
			this._handleActiveState();			
		},
		getValue: function() {
			return this.active;
		}
	});

	return ToggleButton;
});
