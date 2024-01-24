define([
	'ui/button',
	'jqueryui'
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
			this.setState(!this.active);
			this.triggerChangeNotification();
			this.click();
			this.onToggle(this.active);
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
            this.element.addClass('active');
        },

        deactivate: function () {
            this.active = false;
            this.element.removeClass('active');
        },

		setValue: function(value) {
			// It is very common to set the button state on every
			// selection change even if the state hasn't changed.
			// Profiling showed that this is very inefficient.
			if (this.active === value) {
				return;
			}
			this.active = value;
			if (value) {
				this.element.addClass(CLASS_ACTIVE);
			} else {
				this.element.removeClass(CLASS_ACTIVE);
			}
		},
		getValue: function() {
			return this.active;
		}
	});

	return ToggleButton;
});
