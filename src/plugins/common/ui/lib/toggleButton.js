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

		active: false,

		init: function() {
			this._super();
			this.type = 'toggle-button';
		},

		/**
		 * Sets the state of the toggleButton and updates its visual display
		 * accordingly.
		 *
		 * @param {boolean} toggled Whether the button is to be set to the
		 *                          "toggled/checked" state.
		 */
		setState: function (toggled) {
			// It is very common to set the button state on every
			// selection change even if the state hasn't changed.
			// Profiling showed that this is very inefficient.
			if (this.active === toggled) {
				return;
			}
			this.active = toggled;
			if (toggled) {
				this.element.addClass(CLASS_ACTIVE);
			} else {
				this.element.removeClass(CLASS_ACTIVE);
			}
		},

		getState: function () {
			return this.active;
		},

		_onClick: function () {
			this.touch();
			this.setState(!this.active);
			this.triggerChangeNotification();
			this.click();
		},

		setValue: function(value) {
			this.setState(value);
		},
		getValue: function() {
			return this.active;
		}
	});

	return ToggleButton;
});
